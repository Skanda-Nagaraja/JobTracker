-- Full schema for JobTracker (jobs + applications).
-- Run in the Supabase SQL Editor, then run user_profiles.sql.
-- Safe to re-run: everything uses IF NOT EXISTS / DROP ... IF EXISTS.

-- ---------------------------------------------------------------
-- jobs: written by the scraper (service key), readable by everyone
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  company TEXT,
  title TEXT,
  location TEXT,
  url TEXT NOT NULL UNIQUE,
  source TEXT,
  posted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at DESC);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read jobs" ON jobs;
CREATE POLICY "Anyone can read jobs"
  ON jobs FOR SELECT
  USING (true);

GRANT SELECT ON jobs TO anon, authenticated;

-- Views the frontend prefers when present
CREATE OR REPLACE VIEW jobs_public AS
  SELECT id, company, title, location, url, source, created_at FROM jobs;

CREATE OR REPLACE VIEW jobs_public_recent_20 AS
  SELECT id, company, title, location, url, source, created_at
  FROM jobs ORDER BY created_at DESC LIMIT 20;

GRANT SELECT ON jobs_public, jobs_public_recent_20 TO anon, authenticated;

-- ---------------------------------------------------------------
-- applications: per-user tracking, isolated by RLS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
  job_url TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'Saved'
    CHECK (status IN ('Saved', 'Applied', 'OA', 'Interview', 'Final', 'Offer', 'Rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user ON applications (user_id, created_at DESC);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own applications" ON applications;
CREATE POLICY "Users manage own applications"
  ON applications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON applications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE applications_id_seq TO authenticated;
