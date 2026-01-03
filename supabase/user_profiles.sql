-- User Profiles Table for Onboarding & Personalization
-- Run this in your Supabase SQL Editor

-- Create the user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Career Info
  career_stage TEXT CHECK (career_stage IN ('student', 'new_grad', 'early', 'mid', 'senior')),
  target_roles TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  
  -- Skill Levels (stored as JSON for flexibility)
  -- Keys: algorithms, systems, databases, ml, frontend, cloud
  -- Values: 0 (beginner) to 3 (expert)
  skill_levels JSONB DEFAULT '{"algorithms": 1, "systems": 1, "databases": 1, "ml": 0, "frontend": 1, "cloud": 0}',
  
  -- Work Preferences
  preferences JSONB DEFAULT '{"remote": true, "hybrid": true, "onsite": false, "relocate": false, "company_size": []}',
  
  -- Onboarding Status
  onboarding_complete BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do anything (for backend operations)
CREATE POLICY "Service role full access"
  ON user_profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on changes
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_profiles_id_seq TO authenticated;

