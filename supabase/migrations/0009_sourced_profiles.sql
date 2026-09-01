-- Migration 0009: sourced_profiles table
--
-- Stores display metadata for people who have been sourced (invited) but have
-- not yet created a Supabase auth account. Intentionally has NO foreign key to
-- auth.users so rows can exist before signup.
--
-- When a sourced person signs up, the application should:
--   1. Match by email → find their sourced_profiles row.
--   2. Copy/merge relevant fields into profiles + mentor_profiles / mentee_profiles.
--   3. Set sourced_profiles.status = 'active' and store the resulting auth UUID.
--
-- This table is READ-ONLY from the client (SELECT policy only).
-- All writes are performed by service-role admin operations.

CREATE TABLE IF NOT EXISTS public.sourced_profiles (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT        NOT NULL UNIQUE,
  first_name    TEXT        NOT NULL,
  last_name     TEXT        NOT NULL,
  email         TEXT,                          -- invite target; nullable until confirmed
  role          TEXT        NOT NULL DEFAULT 'mentor'
                            CHECK (role IN ('mentor', 'near_peer')),
  status        TEXT        NOT NULL DEFAULT 'sourced'
                            CHECK (status IN ('sourced', 'invited', 'active')),
  -- When status becomes 'active', record the resulting auth UUID for easy joins.
  linked_profile_id UUID    REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Display fields (mirrors data/people.ts — kept in sync by admin tooling)
  image_path    TEXT,
  headline      TEXT,
  bio           TEXT,
  location      TEXT,
  linkedin_url  TEXT,
  expertise_tags TEXT[]     DEFAULT '{}',
  interest_tags  TEXT[]     DEFAULT '{}',
  is_founding_mentor BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_sourced_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sourced_profiles_updated_at ON public.sourced_profiles;
CREATE TRIGGER trg_sourced_profiles_updated_at
  BEFORE UPDATE ON public.sourced_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_sourced_profiles_updated_at();

-- RLS: authenticated users can read; no client writes.
ALTER TABLE public.sourced_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sourced_profiles_select" ON public.sourced_profiles;
CREATE POLICY "sourced_profiles_select"
  ON public.sourced_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Index on slug for fast /people/[slug] lookups.
CREATE INDEX IF NOT EXISTS idx_sourced_profiles_slug ON public.sourced_profiles (slug);
-- Index on email for signup-time matching.
CREATE INDEX IF NOT EXISTS idx_sourced_profiles_email ON public.sourced_profiles (email);
