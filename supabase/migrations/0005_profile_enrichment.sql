-- ============================================================
-- Migration 0005: Profile enrichment columns
-- ============================================================

-- -------------------------------------------------------
-- profiles: shared fields for all users
-- -------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS university TEXT,
  ADD COLUMN IF NOT EXISTS graduation_year INT;

-- -------------------------------------------------------
-- mentor_profiles: professional detail
-- -------------------------------------------------------
ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS max_mentees INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS communication_preference TEXT CHECK (communication_preference IN ('video', 'chat', 'async', 'any')) DEFAULT 'any',
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{}';

-- -------------------------------------------------------
-- mentee_profiles: academic / career detail
-- -------------------------------------------------------
ALTER TABLE public.mentee_profiles
  ADD COLUMN IF NOT EXISTS major TEXT,
  ADD COLUMN IF NOT EXISTS career_interests TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS industries_of_interest TEXT[] NOT NULL DEFAULT '{}';
