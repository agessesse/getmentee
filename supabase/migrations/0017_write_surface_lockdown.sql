-- ============================================================================
-- Migration 0017: lock the write surface
-- ============================================================================
-- Row-Level Security decides WHICH ROWS a caller may touch. It cannot express
-- WHICH COLUMNS. Every UPDATE policy in this schema binds correctly to
-- auth.uid(), but because none of them can restrict columns, the owner of a row
-- can write every column on it — including columns the application treats as
-- system-owned.
--
-- Column-level GRANTs supply the missing half. The existing policies keep doing
-- the row scoping they already do correctly; these grants remove the ability to
-- write columns the caller should never set.
--
-- Closes: V2 (mentor self-verification), V3 (session tampering),
--         V4 (self-assigned role), F7 (message tampering).
--
-- NOT included: the forged-notification hole. Migration 0013 already
-- replaced WITH CHECK (true) with WITH CHECK (auth.uid() = user_id), and
-- 0014 added definer-function delivery. That one is already closed.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- V2: mentor_profiles — rating, review_count and is_verified are system-owned
-- ----------------------------------------------------------------------------
-- rating and review_count are maintained by update_mentor_rating() (0004).
-- is_verified is a trust badge shown in discovery. All three sit on the row the
-- mentor may update, so today a mentor can award themselves a verified badge
-- and a 5.00 rating with any review count.

REVOKE UPDATE ON public.mentor_profiles FROM authenticated, anon;

GRANT UPDATE (
  bio,
  expertise_tags,
  years_experience,
  weekly_hours,
  timezone,
  session_rate,
  goals,
  is_available,
  company,
  title,
  industry,
  communication_preference,
  languages,
  max_mentees,
  profile_complete
) ON public.mentor_profiles TO authenticated;

-- withheld deliberately: rating, review_count, is_verified


-- ----------------------------------------------------------------------------
-- V3: sessions — identity columns are fixed at creation
-- ----------------------------------------------------------------------------
-- The UPDATE policy (0004) checks only that the caller remains a party, so a
-- mentor could re-point mentee_id at any user. Combined with the reviews INSERT
-- policy — which requires only that the caller be a party to a completed
-- session — that allows a forged review against an arbitrary user.

REVOKE UPDATE ON public.sessions FROM authenticated, anon;

GRANT UPDATE (
  scheduled_at,
  duration_minutes,
  session_type,
  notes,
  video_link,
  status
) ON public.sessions TO authenticated;

-- withheld deliberately: mentorship_id, mentor_id, mentee_id


-- Completion must be one-way, or increment_sessions_count() (0004) can be
-- pumped: it fires on any transition INTO 'completed', so round-tripping
-- completed -> scheduled -> completed increments mentorships.sessions_count
-- every time. A CHECK constraint cannot see OLD, so this needs a trigger.
CREATE OR REPLACE FUNCTION public.enforce_session_completion_is_final()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF OLD.status = 'completed' AND NEW.status <> 'completed' THEN
    RAISE EXCEPTION 'A completed session cannot be reopened.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_session_completion_is_final ON public.sessions;
CREATE TRIGGER enforce_session_completion_is_final
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_session_completion_is_final();


-- ----------------------------------------------------------------------------
-- V4: profiles — role and email are not user-writable
-- ----------------------------------------------------------------------------
-- role is chosen at signup from client-supplied metadata (0001) and, because
-- the UPDATE policy has no column scope, can be changed afterwards. Being able
-- to become a mentor on demand is step 1 of the forged-mentorship chain (V1).
-- email is the login identity and must only change through Supabase Auth.

REVOKE UPDATE ON public.profiles FROM authenticated, anon;

GRANT UPDATE (
  first_name,
  last_name,
  avatar_url,
  headline,
  location,
  linkedin_url,
  university,
  graduation_year
) ON public.profiles TO authenticated;

-- withheld deliberately: id, email, role, created_at, updated_at
-- NOTE: self-service mentor signup still works — role is set by the
-- handle_new_user() trigger, which is SECURITY DEFINER and unaffected by these
-- grants. What is no longer possible is switching role after the fact.


-- ----------------------------------------------------------------------------
-- F7: messages — only the read flag is writable
-- ----------------------------------------------------------------------------
-- The "Recipients can mark messages read" policy (0003) constrains one column's
-- VALUE (is_read = true) while leaving content and attachment_url writable by
-- the recipient, so a recipient can rewrite what the sender said.

REVOKE UPDATE ON public.messages FROM authenticated, anon;

GRANT UPDATE (is_read) ON public.messages TO authenticated;

-- withheld deliberately: content, attachment_url, sender_id, mentorship_id
