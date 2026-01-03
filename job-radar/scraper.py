import os
import re
import requests
from typing import List, Dict, Optional
from supabase import create_client, Client
from urllib.parse import urlparse
from pathlib import Path
from dotenv import load_dotenv
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import subprocess
import sys
from bs4 import BeautifulSoup


def get_env(name: str, required: bool = True) -> Optional[str]:
    value = os.getenv(name)
    if required and not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


# Load environment variables from .env files before reading them
# 1) Load from current working directory (project root)
load_dotenv(override=False)
# 2) Also try alongside this script (job-radar/.env) without overriding existing ones
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env", override=False)

SUPABASE_URL = get_env("SUPABASE_URL")
SUPABASE_SERVICE_KEY = get_env("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)  # type: ignore

GITHUB_RAW = "https://raw.githubusercontent.com/{repo}/{branch}/{path}"


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text).strip()


def _extract_first_href(html: str) -> Optional[str]:
    m = re.search(r'href="([^"]+)"', html)
    return m.group(1).strip() if m else None


def _extract_anchor_text(html: str) -> Optional[str]:
    strong = re.search(r"<strong>(.*?)</strong>", html)
    if strong:
        return strong.group(1).strip()
    # Fallback to anchor inner text
    inner = re.search(r">([^<]+)</a>", html)
    if inner:
        return inner.group(1).strip()
    # As a last resort, strip tags
    text = _strip_html(html)
    return text or None


def _is_probable_job_link(url: str) -> bool:
    try:
        parsed = urlparse(url)
    except Exception:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = (parsed.netloc or "").lower()
    # Typical job hosts and ATS
    candidates = [
        "greenhouse.io",
        "lever.co",
        "myworkdayjobs.com",
        "jobvite.com",
        "ashbyhq.com",
        "taleo.net",
        "boards.greenhouse.io",
        "smartrecruiters.com",
        "workable.com",
        "icims.com",
        "eightfold.ai",
        "bamboohr.com",
        "jobs.lever.co",
        "boards.eu.greenhouse.io",
    ]
    return any(h in host for h in candidates)


def resolve_final_url(original_url: str, timeout_seconds: int = 10) -> str:
    """
    Follows HTTP redirects and returns the final destination URL.
    Uses HEAD first (fast); falls back to GET if HEAD is not supported.
    """
    try:
        head_resp = requests.head(original_url, allow_redirects=True, timeout=timeout_seconds)
        # Some providers return 405/4xx for HEAD; fall back to GET
        if head_resp.status_code < 400 and head_resp.url:
            return head_resp.url
    except requests.RequestException:
        pass
    try:
        get_resp = requests.get(original_url, allow_redirects=True, timeout=timeout_seconds, stream=True)
        # We don't need the body; just the resolved URL
        return get_resp.url or original_url
    except requests.RequestException:
        return original_url


# -----------------------------
# LinkedIn scraping helpers
# -----------------------------

def linkedin_get_soup(url: str, user_agent: str) -> Optional[BeautifulSoup]:
    headers = {
        "User-Agent": user_agent,
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code != 200:
            print(f"[warn] LinkedIn fetch failed: HTTP {resp.status_code} for {url}")
            return None
        return BeautifulSoup(resp.content, "html.parser")
    except requests.RequestException as exc:
        print(f"[warn] LinkedIn request error for {url}: {exc}")
        return None


def linkedin_parse_cards(soup: BeautifulSoup) -> List[Dict]:
    jobs: List[Dict] = []
    try:
        divs = soup.find_all("div", class_="base-search-card__info")
    except Exception:
        return jobs
    for item in divs:
        try:
            title_el = item.find("h3")
            title = (title_el.text or "").strip() if title_el else ""
            company_el = item.find("a", class_="hidden-nested-link")
            company = (company_el.text or "").strip().replace("\n", " ") if company_el else ""
            location_el = item.find("span", class_="job-search-card__location")
            location = (location_el.text or "").strip() if location_el else ""
            parent_div = item.parent
            entity_urn = parent_div.get("data-entity-urn", "")
            job_posting_id = entity_urn.split(":")[-1] if entity_urn else ""
            job_url = f"https://www.linkedin.com/jobs/view/{job_posting_id}/" if job_posting_id else ""

            date_new = item.find("time", class_="job-search-card__listdate--new")
            date_tag = item.find("time", class_="job-search-card__listdate")
            posted = (
                date_tag.get("datetime") if date_tag else date_new.get("datetime") if date_new else None
            )

            if job_url:
                jobs.append(
                    {
                        "company": company,
                        "title": title or company,
                        "location": location,
                        "url": job_url,
                        "source": "linkedin/search",
                        "posted": posted,
                    }
                )
        except Exception:
            continue
    return jobs


def scrape_linkedin_search(
    keywords: str,
    location: str,
    pages: int = 1,
    timespan: str = "r604800",
    user_agent: str = "",
) -> List[Dict]:
    """
    Scrapes LinkedIn guest search result pages for given keywords/location.
    Returns normalized jobs suitable for insertion.
    """
    all_jobs: List[Dict] = []
    base = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
    k = requests.utils.quote(keywords)
    loc = requests.utils.quote(location)
    for i in range(max(1, pages)):
        start = 25 * i
        url = f"{base}?keywords={k}&location={loc}&f_TPR={timespan}&start={start}"
        soup = linkedin_get_soup(url, user_agent=user_agent)
        if not soup:
            continue
        jobs = linkedin_parse_cards(soup)
        all_jobs.extend(jobs)
    # De-duplicate by URL
    seen: set[str] = set()
    unique: List[Dict] = []
    for j in all_jobs:
        u = j["url"]
        if u not in seen:
            seen.add(u)
            unique.append(j)
    return unique


def _normalize_company(name: str) -> str:
    s = (name or "").lower()
    s = re.sub(r"\(.*?\)", "", s)
    s = re.sub(r"[\.,&']", " ", s)
    s = re.sub(r"\b(inc|incorporated|corp|corporation|llc|ltd|limited)\b", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _company_in_whitelist(company: str, white: List[str]) -> bool:
    if not white:
        return True
    norm_c = _normalize_company(company)
    for w in white:
        norm_w = _normalize_company(w)
        if not norm_w:
            continue
        if norm_w in norm_c or norm_c in norm_w:
            return True
    return False


def _title_matches_rules(
    title: str,
    include_terms: List[str],
    exclude_terms: List[str],
    require_newgrad: bool,
) -> bool:
    t = (title or "").lower()
    if not t:
        return False
    # Exclude first
    for bad in exclude_terms:
        if bad and bad in t:
            return False
    # New-grad gate (role seniority)
    if require_newgrad:
        newgrad_terms = [
            "new grad",
            "new college grad",
            "university grad",
            "graduate",
            "entry level",
            "engineer i",
            "software engineer i",
            "swe i",
            "sde i",
            "junior",
        ]
        if not any(k in t for k in newgrad_terms):
            return False
    # Software-role gate
    default_includes = [
        "software engineer",
        "swe",
        "sde",
        "developer",
        "backend",
        "front end",
        "frontend",
        "full stack",
        "platform engineer",
        "site reliability",
        "sre",
        "devops",
        "data engineer",
        "ml engineer",
        "android engineer",
        "ios engineer",
        "security engineer",
        "firmware engineer",
    ]
    terms = include_terms or default_includes
    return any(k in t for k in terms)
def scrape_markdown(repo: str, path: str = "README.md") -> List[Dict]:
    # Try both common default branches
    branches = ("main", "master")
    text: Optional[str] = None
    last_status: Optional[int] = None
    for branch in branches:
        url = GITHUB_RAW.format(repo=repo, branch=branch, path=path)
        try:
            resp = requests.get(url, timeout=25)
            last_status = resp.status_code
            if resp.status_code == 200 and resp.text:
                text = resp.text
                break
        except requests.RequestException as exc:
            print(f"[warn] Failed to fetch {repo}/{path} ({branch}): {exc}")
            continue

    if text is None:
        status_str = f"HTTP {last_status}" if last_status is not None else "no response"
        print(f"[warn] Failed to fetch {repo}/{path}: {status_str}")
        return []

    jobs: List[Dict] = []
    seen_urls: set[str] = set()

    # 1) Parse Markdown bullet/link list lines like: - [Company](https://...)
    bullet_matches = re.findall(r"- \[(.*?)\]\((https?://.*?)\)", text)
    for company, link in bullet_matches:
        link_clean = link.strip()
        if link_clean in seen_urls:
            continue
        seen_urls.add(link_clean)
        jobs.append(
            {
                "company": company.strip(),
                "title": company.strip(),
                "location": "",
                "url": link_clean,
                "source": f"{repo}/{path}",
                "posted": None,
            }
        )

    # 2) Parse Markdown tables with HTML anchors (e.g., speedyapply NEW_GRAD_USA.md)
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not (line.startswith("|") and "href=" in line):
            continue
        # Split cells and trim; markdown tables start and end with |
        cells = [c.strip() for c in line.split("|")]
        # Expect columns: | Company | Position | Location | Salary? | Posting | Age |
        if len(cells) < 6:
            continue
        # Leading/trailing empty cells due to edge pipes are common
        # Company cell is usually at index 1
        company_cell = cells[1] if len(cells) > 1 else ""
        title_cell = cells[2] if len(cells) > 2 else ""
        location_cell = cells[3] if len(cells) > 3 else ""
        # "Posting" column (apply link) is commonly at index 5
        posting_cell = cells[5] if len(cells) > 5 else ""

        company_name = _extract_anchor_text(company_cell) or _strip_html(company_cell)
        title = _strip_html(title_cell)
        location = _strip_html(location_cell)
        apply_url = _extract_first_href(posting_cell)

        if not apply_url:
            # Sometimes the position or company cell is the posting link
            for fallback_cell in (title_cell, company_cell):
                apply_url = _extract_first_href(fallback_cell) or apply_url
                if apply_url:
                    break

        if not apply_url:
            continue
        if not _is_probable_job_link(apply_url):
            # Keep anyway; some company career sites are direct domains
            pass

        link_clean = apply_url.strip()
        if link_clean in seen_urls:
            continue
        seen_urls.add(link_clean)

        jobs.append(
            {
                "company": (company_name or "").strip(),
                "title": (title or company_name or "").strip(),
                "location": (location or "").strip(),
                "url": link_clean,
                "source": f"{repo}/{path}",
                "posted": None,  # "Age" exists in some tables, but not a date
            }
        )

    return jobs


def job_exists_by_url(url: str) -> bool:
    res = supabase.table("jobs").select("id").eq("url", url).limit(1).execute()
    data = getattr(res, "data", None) or []
    return len(data) > 0


def insert_job(job: Dict) -> Optional[Dict]:
    res = supabase.table("jobs").insert(job, count="exact").execute()
    data = getattr(res, "data", None) or []
    return data[0] if data else None


def notify_telegram(message: str) -> None:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": message, "disable_web_page_preview": True},
            timeout=10,
        )
    except requests.RequestException:
        # Best-effort; don't break scraping if Telegram fails
        pass


def notify_imessage(message: str) -> bool:
    """
    Sends an iMessage using the Messages app on macOS via osascript.
    Requires IMESSAGE_RECIPIENT env (phone number or Apple ID email).
    Returns True on apparent success, False otherwise.
    """
    recipient = os.getenv("IMESSAGE_RECIPIENT")
    if not recipient or sys.platform != "darwin":
        return False
    # Escape quotes in message for AppleScript
    esc_msg = message.replace("\\", "\\\\").replace('"', '\\"')
    esc_recipient = recipient.replace("\\", "\\\\").replace('"', '\\"')
    applescript = f'''
tell application "Messages"
  try
    set targetService to 1st service whose service type = iMessage
    set targetBuddy to buddy "{esc_recipient}" of targetService
    send "{esc_msg}" to targetBuddy
    return "OK"
  on error errMsg
    return "ERR:" & errMsg
  end try
end tell
'''
    try:
        result = subprocess.run(
            ["osascript", "-e", applescript],
            capture_output=True,
            text=True,
            timeout=8,
            check=False,
        )
        stdout = (result.stdout or "").strip()
        return stdout == "OK"
    except Exception:
        return False


def notify(message: str) -> None:
    # Prefer iMessage if configured on macOS; otherwise fallback to Telegram.
    if notify_imessage(message):
        return
    notify_telegram(message)


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape GitHub job repos into Supabase.")
    parser.add_argument("--dry-run", action="store_true", help="Print scraped jobs and exit without DB writes.")
    parser.add_argument(
        "--resolve-links",
        action="store_true",
        help="Follow redirects to resolve final Apply URLs before printing/inserting.",
    )
    parser.add_argument(
        "--resolve-all",
        action="store_true",
        help="Resolve redirects for all links (by default only non-ATS hosts are resolved).",
    )
    parser.add_argument(
        "--resolve-limit",
        type=int,
        default=100,
        help="Max number of links to resolve per run (keeps things fast).",
    )
    parser.add_argument(
        "--resolve-timeout",
        type=int,
        default=6,
        help="Per-request timeout in seconds when resolving links.",
    )
    parser.add_argument(
        "--resolve-workers",
        type=int,
        default=16,
        help="Max concurrent workers for link resolution.",
    )
    args = parser.parse_args()

    # Limit to requested sources for v1
    sources = [
        {"repo": "SimplifyJobs/New-Grad-Positions", "path": "README.md"},
        {"repo": "vanshb03/New-Grad-2026", "path": "README.md"},
        # Uses Markdown tables heavily:
        {"repo": "speedyapply/2026-SWE-College-Jobs", "path": "NEW_GRAD_USA.md"},
    ]

    new_jobs = 0
    for source in sources:
        repo = source["repo"]
        path = source["path"]
        jobs = scrape_markdown(repo, path)
        if args.resolve_links and jobs:
            # Resolve only non-ATS links unless --resolve-all. Cap total resolutions for speed.
            indices_to_resolve: list[int] = []
            for idx, job in enumerate(jobs):
                url = job["url"]
                if args.resolve_all or not _is_probable_job_link(url):
                    indices_to_resolve.append(idx)
                if len(indices_to_resolve) >= max(0, args.resolve_limit):
                    break

            if indices_to_resolve:
                with ThreadPoolExecutor(max_workers=max(1, args.resolve_workers)) as executor:
                    future_to_idx = {
                        executor.submit(resolve_final_url, jobs[idx]["url"], args.resolve_timeout): idx
                        for idx in indices_to_resolve
                    }
                    for future in as_completed(future_to_idx):
                        idx = future_to_idx[future]
                        try:
                            resolved = future.result()
                        except Exception:
                            resolved = jobs[idx]["url"]
                        jobs[idx]["url"] = resolved
        if args.dry_run:
            for job in jobs[:25]:
                # url here is the "Apply" URL for table rows; for bullet lists it's the linked URL
                print(f"{job['company']} | {job['title']} | {job['location']} | {job['url']} | source={job['source']}")
            # Keep scanning all sources but skip DB writes entirely
            continue
        for job in jobs:
            # Only insert if not present; keeps DB clean and enables notifications
            if not job_exists_by_url(job["url"]):
                created = insert_job(job)
                new_jobs += 1
                # Minimal, readable notification
                notify(f'New job: {job["title"]} @ {job["company"]}\n{job["url"]}')

    # Optional: LinkedIn scraping (disabled by default due to ToS considerations)
    linkedin_enable = os.getenv("LINKEDIN_ENABLE", "false").lower() == "true"
    if linkedin_enable:
        queries_env = os.getenv("LINKEDIN_QUERIES", "")
        # LINKEDIN_QUERIES is a semicolon-separated list of "keywords|location"
        # e.g. "Software Engineer New Grad|United States;Software Engineer I|United States"
        if queries_env.strip():
            pairs = [p.strip() for p in queries_env.split(";") if p.strip()]
            queries = []
            for p in pairs:
                if "|" in p:
                    k, loc = p.split("|", 1)
                    queries.append({"keywords": k.strip(), "location": loc.strip()})
        else:
            queries = [
                {"keywords": "Software Engineer New Grad", "location": "United States"},
                {"keywords": "Software Engineer I", "location": "United States"},
            ]

        pages = int(os.getenv("LINKEDIN_PAGES", "1"))
        timespan = os.getenv("LINKEDIN_TIMESPAN", "r604800")  # last 7 days
        user_agent = os.getenv(
            "LINKEDIN_USER_AGENT",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        )

        linkedin_jobs: List[Dict] = []
        for q in queries:
            linkedin_jobs.extend(
                scrape_linkedin_search(
                    keywords=q["keywords"],
                    location=q["location"],
                    pages=pages,
                    timespan=timespan,
                    user_agent=user_agent,
                )
            )
        # Company whitelist (semicolon-separated) or built-in top companies when enabled
        whitelist_env = os.getenv("LINKEDIN_COMPANY_WHITELIST", "")
        use_top_companies = os.getenv("LINKEDIN_USE_TOP_COMPANIES", "false").lower() == "true"
        whitelist = [c.strip() for c in whitelist_env.split(";") if c.strip()]
        if not whitelist and use_top_companies:
            whitelist = [
                "Google", "Meta", "Amazon", "Microsoft", "Apple", "Uber", "Tesla", "LinkedIn",
                "IBM", "Stripe", "Slack", "Oracle", "Adobe", "Palantir", "VMware", "Airbnb",
                "Salesforce", "Spotify", "DeepMind", "Bloomberg", "Snap", "Square", "Dropbox",
                "PayPal", "Lyft", "Twilio", "Splunk", "Atlassian", "Fitbit", "Workday", "MongoDB",
                "NetApp", "ServiceNow", "GitHub", "Zendesk", "Snowflake", "SAP", "Intuit",
                "Red Hat", "Coinbase", "Shopify", "Asana", "Flexport", "Tripadvisor", "Samsara",
                "Instacart", "Autodesk", "Yelp", "Cloudera"
            ]
        if whitelist:
            before = len(linkedin_jobs)
            linkedin_jobs = [j for j in linkedin_jobs if _company_in_whitelist(j.get("company", ""), whitelist)]
            after = len(linkedin_jobs)
            if args.dry_run:
                print(f"[info] LinkedIn whitelist applied: kept {after}/{before}")

        # Title filters (configurable)
        include_env = os.getenv("LINKEDIN_TITLE_INCLUDE", "")
        exclude_env = os.getenv("LINKEDIN_TITLE_EXCLUDE", "")
        include_terms = [s.strip().lower() for s in include_env.split(";") if s.strip()]
        exclude_terms = [s.strip().lower() for s in exclude_env.split(";") if s.strip()]
        require_newgrad = os.getenv("LINKEDIN_REQUIRE_NEWGRAD", "true").lower() == "true"

        before_titles = len(linkedin_jobs)
        linkedin_jobs = [
            j
            for j in linkedin_jobs
            if _title_matches_rules(j.get("title", ""), include_terms, exclude_terms, require_newgrad)
        ]
        if args.dry_run:
            print(f"[info] LinkedIn title filter applied: kept {len(linkedin_jobs)}/{before_titles}")
        if args.dry_run:
            for job in linkedin_jobs[:25]:
                print(f"{job['company']} | {job['title']} | {job['location']} | {job['url']} | source={job['source']}")
        else:
            for job in linkedin_jobs:
                if not job_exists_by_url(job["url"]):
                    created = insert_job(job)
                    new_jobs += 1
                    notify(f'New job: {job["title"]} @ {job["company"]}\n{job["url"]}')

    msg = (
        "[info] Dry run complete. No database changes were made."
        if args.dry_run
        else f"[info] Completed. New jobs added: {new_jobs}"
    )
    print(msg)


if __name__ == "__main__":
    main()


def _normalize_company(name: str) -> str:
    s = (name or "").lower()
    # Drop common suffixes and punctuation for loose matching
    s = re.sub(r"\(.*?\)", "", s)  # remove parenthetical
    s = re.sub(r"[\.,&']", " ", s)
    s = re.sub(r"\b(inc|incorporated|corp|corporation|llc|ltd|limited)\b", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _company_in_whitelist(company: str, white: List[str]) -> bool:
    if not white:
        return True
    norm_c = _normalize_company(company)
    for w in white:
        norm_w = _normalize_company(w)
        if not norm_w:
            continue
        # Allow substring either way to handle variants (e.g., Google vs Alphabet Google)
        if norm_w in norm_c or norm_c in norm_w:
            return True
    return False



