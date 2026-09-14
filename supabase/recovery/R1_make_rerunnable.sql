-- ============================================================================
-- R1: make 0010 to 0013 safe to run, and safe to run again
-- ============================================================================
-- Run this BEFORE applying 0010, 0011, 0012 and 0013.
--
-- Why it is needed: those four files contain 28 CREATE POLICY and 3 CREATE
-- TRIGGER statements with no DROP ... IF EXISTS in front of them. Postgres has
-- no CREATE POLICY IF NOT EXISTS, so if any of those migrations is ever run a
-- second time, or was previously run partway and aborted, it fails on the first
-- object that already exists and leaves the rest unapplied.
--
-- This script drops exactly those objects if they happen to exist. Every drop is
-- guarded twice: IF EXISTS on the object, and to_regclass() on the table, so it
-- is a no-op on a database where the tables were never created. It is therefore
-- safe to run on the current production database, which has none of them.
--
-- It touches no data and no object that the four migrations do not create.
-- ============================================================================

DO $$
BEGIN

-- ---- 0010_session_intelligence ----
  IF to_regclass('public.session_transcripts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Parties can read their session transcript" ON public.session_transcripts;
  END IF;
  IF to_regclass('public.session_transcripts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Session party can create transcript" ON public.session_transcripts;
  END IF;
  IF to_regclass('public.session_summaries') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Creator can read own summary" ON public.session_summaries;
  END IF;
  IF to_regclass('public.session_summaries') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Parties can read shared summaries" ON public.session_summaries;
  END IF;
  IF to_regclass('public.session_summaries') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Session party can create summary" ON public.session_summaries;
  END IF;
  IF to_regclass('public.session_summaries') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Creator can update own summary" ON public.session_summaries;
  END IF;
  IF to_regclass('public.session_voice_notes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Creator can read own voice notes" ON public.session_voice_notes;
  END IF;
  IF to_regclass('public.session_voice_notes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Parties can read shared voice notes" ON public.session_voice_notes;
  END IF;
  IF to_regclass('public.session_voice_notes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Parties can create voice notes in their mentorship" ON public.session_voice_notes;
  END IF;
  IF to_regclass('public.session_voice_notes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Creator can update own voice notes" ON public.session_voice_notes;
  END IF;
  IF to_regclass('public.session_voice_notes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Creator can delete own voice notes" ON public.session_voice_notes;
  END IF;

-- ---- 0011_reports_blocks ----
  IF to_regclass('public.user_reports') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Reporter can read own reports" ON public.user_reports;
  END IF;
  IF to_regclass('public.user_reports') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authenticated users can submit reports" ON public.user_reports;
  END IF;
  IF to_regclass('public.user_reports') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Reporter can delete own reports" ON public.user_reports;
  END IF;
  IF to_regclass('public.user_blocks') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Blocker can read own blocks" ON public.user_blocks;
  END IF;
  IF to_regclass('public.user_blocks') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authenticated users can block others" ON public.user_blocks;
  END IF;
  IF to_regclass('public.user_blocks') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Blocker can unblock" ON public.user_blocks;
  END IF;

-- ---- 0012_opportunity_fund ----
  IF to_regclass('public.financial_need_profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Mentee can read own financial need profile" ON public.financial_need_profiles;
  END IF;
  IF to_regclass('public.financial_need_profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Mentee can create own financial need profile" ON public.financial_need_profiles;
  END IF;
  IF to_regclass('public.financial_need_profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Mentee can update own financial need profile" ON public.financial_need_profiles;
  END IF;
  IF to_regclass('public.opportunity_funds') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authenticated users can view opportunity funds" ON public.opportunity_funds;
  END IF;
  IF to_regclass('public.opportunity_interests') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Mentee can read own interests" ON public.opportunity_interests;
  END IF;
  IF to_regclass('public.opportunity_interests') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Mentee can submit interests" ON public.opportunity_interests;
  END IF;
  IF to_regclass('public.opportunity_interests') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Mentee can update own interests" ON public.opportunity_interests;
  END IF;
  IF to_regclass('public.opportunity_interests') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Mentee can delete own interests" ON public.opportunity_interests;
  END IF;
  IF to_regclass('public.financial_need_profiles') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS set_financial_need_profiles_updated_at ON public.financial_need_profiles;
  END IF;
  IF to_regclass('public.opportunity_funds') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS set_opportunity_funds_updated_at ON public.opportunity_funds;
  END IF;
  IF to_regclass('public.opportunity_interests') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS set_opportunity_interests_updated_at ON public.opportunity_interests;
  END IF;

-- ---- 0013_security_access_fixes ----
  IF to_regclass('public.notifications') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
  END IF;
  IF to_regclass('public.mentorships') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Mentors can create mentorships from approved requests" ON public.mentorships;
  END IF;
END $$;
