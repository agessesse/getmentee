-- ============================================================
-- Migration 0012: Mentee Opportunity Fund — foundation
--
-- Three additive tables:
--
--   1. financial_need_profiles  — self-attested eligibility signals (mentees only)
--   2. opportunity_funds        — sponsored funding pools (empty at launch; service-role-managed)
--   3. opportunity_interests    — demand-signal submissions (explicitly NOT grant applications)
--
-- Privacy invariants enforced by RLS:
--   * financial_need_profiles is readable ONLY by the owning mentee.
--     Mentors, other mentees, and sponsors cannot access it.
--   * Mentees cannot advance their own verification_status above 'self_reported'.
--     Only the service role may set pending_verification, verified, ineligible, or review_required.
--   * opportunity_funds is readable by all authenticated users.
--     INSERT / UPDATE / DELETE are service-role-only (no client policy created).
--   * opportunity_interests is visible only to the submitting mentee.
--
-- No existing tables, columns, or policies are altered.
-- ============================================================

-- -------------------------------------------------------
-- 1. financial_need_profiles
-- Self-attested financial need information.
-- Strictly private — mentors and other users cannot read it.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_need_profiles (
  id                   UUID        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pell_status          TEXT        NOT NULL DEFAULT 'prefer_not_to_say'
                                   CHECK (pell_status IN ('yes', 'no', 'prefer_not_to_say')),
  first_gen_student    TEXT        NOT NULL DEFAULT 'prefer_not_to_say'
                                   CHECK (first_gen_student IN ('yes', 'no', 'prefer_not_to_say')),
  need_based_aid       TEXT        NOT NULL DEFAULT 'prefer_not_to_say'
                                   CHECK (need_based_aid IN ('yes', 'no', 'prefer_not_to_say')),
  -- Any additional need-based designations (scholarship names, institutional aid, etc.)
  additional_context   TEXT,
  -- Client writes are restricted to 'not_started' and 'self_reported'.
  -- Service role may advance to pending_verification, verified, ineligible, review_required.
  verification_status  TEXT        NOT NULL DEFAULT 'not_started'
                                   CHECK (verification_status IN (
                                     'not_started',
                                     'self_reported',
                                     'pending_verification',
                                     'verified',
                                     'ineligible',
                                     'review_required'
                                   )),
  submitted_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.financial_need_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentee can read own financial need profile"
  ON public.financial_need_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Mentee can create own financial need profile"
  ON public.financial_need_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND
    verification_status IN ('not_started', 'self_reported')
  );

-- Mentee can update content fields but CANNOT self-elevate verification_status above self_reported.
CREATE POLICY "Mentee can update own financial need profile"
  ON public.financial_need_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    verification_status IN ('not_started', 'self_reported')
  );

-- No client DELETE: profile persists until account-deletion cascade.

CREATE TRIGGER set_financial_need_profiles_updated_at
  BEFORE UPDATE ON public.financial_need_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------
-- 2. opportunity_funds
-- Represents a sponsor-created funding pool.
-- No rows at launch — the table is empty.
-- Writable only by the service role (no client INSERT/UPDATE policy).
-- Readable by all authenticated users so the UI can show what programs exist.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.opportunity_funds (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT        NOT NULL,
  description          TEXT,
  sponsor_name         TEXT,
  fund_type            TEXT        NOT NULL DEFAULT 'general'
                                   CHECK (fund_type IN ('general', 'employer', 'university', 'alumni', 'foundation')),
  total_committed      DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_available      DECIMAL(12, 2) NOT NULL DEFAULT 0,
  allowed_categories   TEXT[]      NOT NULL DEFAULT '{}',
  max_request_amount   DECIMAL(10, 2),
  eligibility_notes    TEXT,
  status               TEXT        NOT NULL DEFAULT 'pilot'
                                   CHECK (status IN ('active', 'pilot', 'closed')),
  start_date           DATE,
  end_date             DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunity_funds_status ON public.opportunity_funds(status);

ALTER TABLE public.opportunity_funds ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view fund listings.
CREATE POLICY "Authenticated users can view opportunity funds"
  ON public.opportunity_funds FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT / UPDATE / DELETE policies — service role only.

CREATE TRIGGER set_opportunity_funds_updated_at
  BEFORE UPDATE ON public.opportunity_funds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------
-- 3. opportunity_interests
-- Demand-signal table. Mentees describe professional-development
-- needs that a future funded program might address.
--
-- IMPORTANT: This is NOT a grant application and must never be
-- presented to users as one. It collects pre-funding demand data.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.opportunity_interests (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id            UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category             TEXT        NOT NULL
                                   CHECK (category IN (
                                     'professional_attire',
                                     'networking',
                                     'travel',
                                     'career_development',
                                     'conference_event',
                                     'other'
                                   )),
  -- What specific support would help the mentee
  description          TEXT        NOT NULL,
  -- Optional rough estimate — used for planning, not commitment
  estimated_amount     DECIMAL(8, 2),
  -- Optional links to existing mentorship context
  linked_goal_id       UUID        REFERENCES public.mentorship_goals(id) ON DELETE SET NULL,
  linked_mentorship_id UUID        REFERENCES public.mentorships(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunity_interests_mentee ON public.opportunity_interests(mentee_id);

ALTER TABLE public.opportunity_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentee can read own interests"
  ON public.opportunity_interests FOR SELECT
  TO authenticated
  USING (auth.uid() = mentee_id);

CREATE POLICY "Mentee can submit interests"
  ON public.opportunity_interests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentee can update own interests"
  ON public.opportunity_interests FOR UPDATE
  TO authenticated
  USING (auth.uid() = mentee_id)
  WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentee can delete own interests"
  ON public.opportunity_interests FOR DELETE
  TO authenticated
  USING (auth.uid() = mentee_id);

CREATE TRIGGER set_opportunity_interests_updated_at
  BEFORE UPDATE ON public.opportunity_interests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
