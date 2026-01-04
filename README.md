# JobTracker Pro

A job search intelligence platform that aggregates early-stage job postings, provides personalized job matching, and tracks application progress through a unified dashboard.

**Live Demo:** [https://job-tracker-ten-rouge.vercel.app](https://job-tracker-ten-rouge.vercel.app)

---

## Overview

JobTracker Pro addresses the fragmentation in job searching by consolidating opportunities from multiple sources into a single platform. Unlike traditional job boards, it scrapes non-traditional sources (GitHub job repositories) where positions are often posted earlier and with less competition.

The platform combines automated job discovery with personalized matching algorithms and application tracking, providing users with actionable insights throughout their job search.

---

## Features

### Automated Job Discovery
- Scrapes job postings from curated GitHub repositories targeting new graduate and entry-level positions
- Resolves redirect URLs to extract final application links
- De-duplicates entries across sources
- Runs on a scheduled basis via GitHub Actions

### Personalized Job Matching
- Multi-step onboarding captures career stage, target roles, programming languages, and work preferences
- Scoring algorithm ranks jobs by relevance to user profile (0-100%)
- Match factors include role keywords, experience level, remote/hybrid preferences, and tech stack overlap
- Filterable by minimum match score

### Application Tracking
- Track application status: Saved, Applied, OA, Interview, Final, Offer, Rejected
- Visual pipeline showing conversion rates across stages
- Historical tracking of all applications per user

### Analytics Dashboard
- Application funnel visualization
- Jobs by source distribution
- Interview and offer rate calculations
- Recent applications table with inline status updates

### LeetCode Practice Integration
- Curated problem sets organized by topic
- Personalized topic recommendations based on target roles
- In-browser code editor with Python and JavaScript support
- Real-time code execution via Piston API
- Progress tracking and streak monitoring

### Resume Scoring
- Upload resume (PDF/TXT) and job description
- ATS-style keyword matching analysis
- Breakdown by skills, experience, and formatting

---

## Architecture

```
GitHub Repos          LinkedIn (optional)
      |                      |
      v                      v
  Python Scraper (scheduled via GitHub Actions)
      |
      v
  Supabase (PostgreSQL)
      |
      v
  React Frontend (Vite)
      |
      v
  User Dashboard
```

### Backend
- **Scraper:** Python script that parses Markdown tables and bullet lists from GitHub README files
- **Database:** Supabase (PostgreSQL) with Row Level Security for multi-tenant data isolation
- **Scheduling:** GitHub Actions cron job for periodic scraping

### Frontend
- **Framework:** React with TypeScript
- **Build Tool:** Vite
- **UI Components:** shadcn/ui (Radix primitives + Tailwind CSS)
- **Routing:** React Router v6
- **Charts:** Recharts
- **Code Execution:** Piston API for sandboxed runtime

### Authentication
- Google OAuth via Supabase Auth
- Session management with automatic token refresh

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Python, Supabase |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (Google OAuth) |
| Code Execution | Piston API |
| Deployment | Vercel |
| CI/CD | GitHub Actions |

---

## Data Sources

The scraper currently pulls from:
- SimplifyJobs/New-Grad-Positions
- vanshb03/New-Grad-2026
- speedyapply/2026-SWE-College-Jobs

Additional sources can be added by extending the `SOURCES` configuration in the scraper.

---

## Job Matching Algorithm

Jobs are scored based on multiple weighted factors:

| Factor | Weight |
|--------|--------|
| Role keyword matches | 40% |
| Experience level alignment | 20% |
| Work preference (remote/hybrid/onsite) | 15% |
| Programming language overlap | 15% |
| Source relevance bonus | 10% |

Scores are displayed on each job card with categorical labels (Great Match, Good Match, Fair Match, Low Match).

---

## Project Structure

```
JobTracker/
├── job-radar/
│   ├── scraper.py          # Job scraping logic
│   └── requirements.txt    # Python dependencies
├── web/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and API clients
│   ├── package.json
│   └── vite.config.ts
├── .github/
│   └── workflows/
│       └── scrape.yml      # Scheduled scraper workflow
└── vercel.json             # Deployment configuration
```

---

## Local Development

```bash
# Frontend
cd web
npm install
npm run dev

# Scraper (requires environment variables)
cd job-radar
pip install -r requirements.txt
python scraper.py --dry-run
```

---

## Environment Variables

### Frontend (Vercel)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Scraper (GitHub Actions)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

---

## License

MIT

---

## Author

Skanda Nagaraja

