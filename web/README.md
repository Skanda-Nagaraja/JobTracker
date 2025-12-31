# JobTracker Web

A minimal, modular Next.js app that lists jobs from your scraper's Supabase database.

## Quickstart

1. In the repo root, ensure `.env` includes:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY
```

2. Install and run:

```bash
cd web
npm install
npm run dev
```

3. Open `http://localhost:3000` → Dashboard.

## Pages

- `/` – landing with links
- `/auth` – placeholder for OAuth
- `/dashboard` – job feed (newest first), search and simple filters

## API

- `GET /api/jobs` – server-side query to Supabase (service key on server only). Optional query params:
  - `q` – keyword across `title`/`company`
  - `company` – company substring

## Notes

- Service key is used only on the server; it is never exposed to the browser.
- For a public client-side app, create an open view `jobs_public` with RLS and switch the dashboard to use the anon key.


