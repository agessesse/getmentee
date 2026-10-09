-- ============================================================================
-- Migration 0036: make Cohort 001 a measurable experiment
-- ============================================================================
-- AUDIT FIRST. What already exists and is NOT being rebuilt:
--
--   cohort_applications   one shared table for student AND mentor
--                         applications (0024 + 0026). Already asks what a
--                         student is working toward, what they have tried,
--                         and what a mentor can help with. Extended here,
--                         not replaced.
--   cohort_memberships    already has cohort_id, profile_id, role, state.
--                         Currently EMPTY, which means its CHECK can be
--                         widened with no risk to any row.
--   mentorships           already carries cohort_id and origin (0030).
--   sessions              already carries scheduled_at, status, mentor_recap,
--                         prep. A conversation is a session.
--   mentorship_goals,
--   action_items          already the goals and commitments.
--
-- So this migration adds ONE table and some columns. It is deliberately not
-- a parallel "cohort analytics" system.
--
-- EVERY ADDITION TRACES TO ONE OF PETE'S QUESTIONS:
--
--   Q2 who are the mentors, how acquired, what committed to
--        -> cohort_memberships.acquisition_source, referred_by,
--           commitment_accepted_at, commitment_terms, motivation
--   Q3 who are the students / what is "under-resourced"
--        -> cohort_applications.access_signals, selection_notes
--   Q5 what metrics prove the pilot works
--        -> cohorts.expected_cadence_days / expected_sessions /
--           activation_window_days, so the four metrics are computed
--           against a stated expectation rather than a hard-coded guess
--   Q6 did Mentable contribute, or did we pick students who'd succeed anyway
--        -> cohort_measures (baseline and endline, same questions twice)
--   Q7 what would an institution pay for
--        -> nothing. No pricing, no billing, no entitlements.
--   Q8 mentor supply after the founders' networks
--        -> cohort_memberships.would_again, would_refer, referred_by
--
-- Q1 and Q4 are positioning and process questions. They are answered by
-- documentation and by the product's behaviour, not by columns, and nothing
-- is added for them.
--
-- ROLLBACK
--   DROP TABLE IF EXISTS public.cohort_measures;
--   ALTER TABLE public.sessions DROP COLUMN IF EXISTS intervention;
--   ALTER TABLE public.cohort_applications
--     DROP COLUMN IF EXISTS access_signals, DROP COLUMN IF EXISTS selection_notes,
--     DROP COLUMN IF EXISTS acquisition_source, DROP COLUMN IF EXISTS referred_by_email;
--   ALTER TABLE public.cohort_memberships
--     DROP COLUMN IF EXISTS acquisition_source, DROP COLUMN IF EXISTS referred_by,
--     DROP COLUMN IF EXISTS commitment_accepted_at, DROP COLUMN IF EXISTS commitment_terms,
--     DROP COLUMN IF EXISTS motivation, DROP COLUMN IF EXISTS preferred_profile,
--     DROP COLUMN IF EXISTS would_again, DROP COLUMN IF EXISTS would_refer,
--     DROP COLUMN IF EXISTS exit_reason, DROP COLUMN IF EXISTS exit_at;
--   ALTER TABLE public.cohorts
--     DROP COLUMN IF EXISTS expected_cadence_days, DROP COLUMN IF EXISTS expected_sessions,
--     DROP COLUMN IF EXISTS activation_window_days;
-- ============================================================================

-- ── 1. A cohort states its own expectations ─────────────────────────────────
/*
  The commitment is cohort configuration, not a constant in the code. Cohort
  001 is "one student, one semester, a conversation every two to three weeks";
  a different programme will say something else, and the four metrics must
  measure against whatever that programme actually promised rather than
  against Cohort 001's shape forever.
*/
ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS expected_cadence_days INTEGER NOT NULL DEFAULT 21
    CHECK (expected_cadence_days BETWEEN 1 AND 180),
  ADD COLUMN IF NOT EXISTS expected_sessions INTEGER NOT NULL DEFAULT 6
    CHECK (expected_sessions BETWEEN 1 AND 100),
  -- Activation is "did the relationship actually start", and 14 days is the
  -- window Cohort 001 is holding itself to.
  ADD COLUMN IF NOT EXISTS activation_window_days INTEGER NOT NULL DEFAULT 14
    CHECK (activation_window_days BETWEEN 1 AND 120);

COMMENT ON COLUMN public.cohorts.expected_cadence_days IS
  'How often a pair is expected to speak. Drives cadence adherence in the Engagement metric. Configuration, not a hard-coded assumption.';

-- ── 2. The lifecycle, commitment, acquisition and retention ─────────────────
/*
  cohort_memberships already models "this person belongs to this cohort". It
  did not model the difference between an interested mentor and a committed
  one, which is the distinction Pete's second question turns on.

  `state` is widened rather than joined by a second status column. The table
  has ZERO rows, so there is nothing to migrate and no period where two
  columns disagree about the same fact.
*/
ALTER TABLE public.cohort_memberships
  DROP CONSTRAINT IF EXISTS cohort_memberships_state_check;

ALTER TABLE public.cohort_memberships
  ADD CONSTRAINT cohort_memberships_state_check CHECK (state IN (
    'invited',            -- asked
    'interested',         -- said yes in principle
    'commitment_pending', -- shown the terms, not yet accepted
    'committed',          -- accepted the terms
    'matched',            -- paired
    'active',             -- first conversation happened
    'completed',          -- finished the cohort
    'withdrawn'           -- left. Spelled as it already was.
  ));

ALTER TABLE public.cohort_memberships
  -- Q8: where this person came from. The honest answer for Cohort 001 is
  -- mostly 'founder_network', and recording that is the only way to see it
  -- stop being true.
  ADD COLUMN IF NOT EXISTS acquisition_source TEXT
    CHECK (acquisition_source IS NULL OR acquisition_source IN (
      'founder_network','mentor_referral','alumni_network','employer',
      'university','professional_org','former_mentee','inbound','other')),
  -- The edge in the referral graph: who brought them.
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commitment_accepted_at TIMESTAMP WITH TIME ZONE,
  /*
    A SNAPSHOT of the terms as they stood when this person accepted them.
    The cohort's expectations can be edited later; what somebody agreed to
    cannot. Without this, changing a cohort setting silently rewrites
    everybody's past commitment.
  */
  ADD COLUMN IF NOT EXISTS commitment_terms JSONB,
  ADD COLUMN IF NOT EXISTS motivation TEXT CHECK (motivation IS NULL OR char_length(motivation) <= 2000),
  ADD COLUMN IF NOT EXISTS preferred_profile TEXT CHECK (preferred_profile IS NULL OR char_length(preferred_profile) <= 1000),
  -- Q8 retention, asked at completion.
  ADD COLUMN IF NOT EXISTS would_again BOOLEAN,
  ADD COLUMN IF NOT EXISTS would_refer BOOLEAN,
  ADD COLUMN IF NOT EXISTS exit_reason TEXT CHECK (exit_reason IS NULL OR char_length(exit_reason) <= 1000),
  ADD COLUMN IF NOT EXISTS exit_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS cohort_memberships_state_idx
  ON public.cohort_memberships (cohort_id, role, state);
CREATE INDEX IF NOT EXISTS cohort_memberships_referred_by_idx
  ON public.cohort_memberships (referred_by) WHERE referred_by IS NOT NULL;

COMMENT ON COLUMN public.cohort_memberships.commitment_terms IS
  'Snapshot of the terms accepted, so editing a cohort setting never rewrites what somebody already agreed to.';

-- ── 3. Selection signals on the application ─────────────────────────────────
/*
  Q3 asks how "high-achieving and under-resourced" are defined without
  turning selection into prestige filtering.

  access_signals is a SET OF FLAGS the applicant selects about themselves,
  not a score and not a demographic record. There is no income field, no
  race, no household data: the question Mentable needs answered is "would
  access to the right person change this person's position", and the
  signals below speak to that directly. Everything is self-reported and
  optional.
*/
ALTER TABLE public.cohort_applications
  ADD COLUMN IF NOT EXISTS access_signals TEXT[] NOT NULL DEFAULT '{}',
  -- The reviewer's own rubric notes, separate from the existing free `notes`.
  ADD COLUMN IF NOT EXISTS selection_notes JSONB,
  -- Q8 again, at the point of application, before a membership exists.
  ADD COLUMN IF NOT EXISTS acquisition_source TEXT
    CHECK (acquisition_source IS NULL OR acquisition_source IN (
      'founder_network','mentor_referral','alumni_network','employer',
      'university','professional_org','former_mentee','inbound','other')),
  ADD COLUMN IF NOT EXISTS referred_by_email TEXT
    CHECK (referred_by_email IS NULL OR char_length(referred_by_email) <= 320);

COMMENT ON COLUMN public.cohort_applications.access_signals IS
  'Self-reported access gaps, e.g. first_gen_professional, no_family_in_field, no_finance_contacts, limited_recruiting_knowledge, limited_school_pipeline. Flags, never a score, never demographics.';

-- ── 4. What actually changed because of a conversation ──────────────────────
/*
  Q6 cannot be answered from "a meeting happened". It needs to know what the
  mentor actually did.

  An ARRAY of categories on the session that already exists, NOT a new table
  and NOT a form. The narrative already has a home in mentor_recap; this is
  the structured half, and the admin view can count it.
*/
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS intervention TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.sessions.intervention IS
  'What changed because of this conversation: career_clarity, recruiting_strategy, resume, technical_prep, behavioral_prep, interview_prep, introduction, opportunity, decision, accountability, other. Structured half of mentor_recap.';

-- ── 5. Baseline and endline ─────────────────────────────────────────────────
/*
  THE TABLE THAT ANSWERS PETE'S HARDEST QUESTION.

  The same small set of questions, asked before the first conversation and
  again at the end. One row per person per phase. Without a baseline,
  Mentable can only show where a student ended up, which is indistinguishable
  from having selected students who were already going to get there.

  SCORES ARE 1-5 SELF-REPORTS AND ARE NAMED AS SUCH. They are not evidence of
  anything on their own; a movement from 2 to 4 in career clarity is a
  student's own account of their own confidence, and the product must never
  render it as a measurement. The countable facts -- reachable contacts,
  applications, interviews, offers, introductions -- sit beside them because
  those are checkable.

  Service-role only, like every table added since 0024. Baseline answers are
  candid and belong to the participant; they are reachable through a server
  route that has resolved the caller, never through a browser query.
*/
CREATE TABLE IF NOT EXISTS public.cohort_measures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id     UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('mentee','mentor')),
  phase         TEXT NOT NULL CHECK (phase IN ('baseline','endline')),

  -- Self-reported, 1-5, all optional.
  career_clarity        SMALLINT CHECK (career_clarity        IS NULL OR career_clarity        BETWEEN 1 AND 5),
  recruiting_knowledge  SMALLINT CHECK (recruiting_knowledge  IS NULL OR recruiting_knowledge  BETWEEN 1 AND 5),
  preparation           SMALLINT CHECK (preparation           IS NULL OR preparation           BETWEEN 1 AND 5),
  confidence            SMALLINT CHECK (confidence            IS NULL OR confidence            BETWEEN 1 AND 5),

  -- Countable, and therefore the more trustworthy half.
  reachable_contacts    SMALLINT CHECK (reachable_contacts IS NULL OR reachable_contacts BETWEEN 0 AND 500),
  applications_count    SMALLINT CHECK (applications_count IS NULL OR applications_count BETWEEN 0 AND 500),
  interviews_count      SMALLINT CHECK (interviews_count   IS NULL OR interviews_count   BETWEEN 0 AND 500),
  offers_count          SMALLINT CHECK (offers_count       IS NULL OR offers_count       BETWEEN 0 AND 100),
  introductions_count   SMALLINT CHECK (introductions_count IS NULL OR introductions_count BETWEEN 0 AND 500),

  -- Endline only, and the part a case study is actually written from.
  what_changed              TEXT CHECK (what_changed              IS NULL OR char_length(what_changed)              <= 4000),
  mentor_helped_with        TEXT CHECK (mentor_helped_with        IS NULL OR char_length(mentor_helped_with)        <= 4000),
  would_not_have_happened   TEXT CHECK (would_not_have_happened   IS NULL OR char_length(would_not_have_happened)   <= 4000),
  most_valuable             TEXT CHECK (most_valuable             IS NULL OR char_length(most_valuable)             <= 4000),
  should_change             TEXT CHECK (should_change             IS NULL OR char_length(should_change)             <= 4000),

  /*
    A story is only usable if the person said it could be. Default false,
    and nothing in the product may publish an answer without it.
  */
  share_permission BOOLEAN NOT NULL DEFAULT false,

  submitted_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- One baseline and one endline per person per cohort.
  UNIQUE (cohort_id, profile_id, phase)
);

CREATE INDEX IF NOT EXISTS cohort_measures_cohort_phase_idx
  ON public.cohort_measures (cohort_id, phase, role);

ALTER TABLE public.cohort_measures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cohort_measures FROM anon, authenticated;

COMMENT ON TABLE public.cohort_measures IS
  'Baseline and endline, same questions twice. Exists so Mentable can show movement rather than only an endpoint. Self-reported scores are labelled as self-reported everywhere they are rendered. Service-role only.';
