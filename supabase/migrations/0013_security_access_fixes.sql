-- ============================================================
-- Migration 0013: Security & access fixes
--
-- Changes (all additive / non-destructive to existing data):
--
--   1. public_profiles view — authenticated users can read
--      safe display fields from any profile row without
--      accessing private contact information (email).
--
--   2. notifications INSERT — restrict client inserts to own
--      user_id only. The previous WITH CHECK (true) allowed
--      any authenticated user to create notifications for any
--      other user_id (notification spam / phishing risk).
--
--   3. mentorships INSERT — verify the backing request is
--      approved and genuinely links the inserting mentor to
--      the mentee_id in the new row. Previously only
--      auth.uid() = mentor_id was checked.
--
--   4. sessions UPDATE — trigger to make mentor_id,
--      mentee_id, and mentorship_id immutable after creation.
--      These relationship fields must not change via UPDATE.
--
-- Rollback for each change:
--   1. DROP VIEW public.public_profiles;
--      REVOKE SELECT ON public.public_profiles FROM authenticated;
--   2. DROP POLICY "Users can insert own notifications" ON public.notifications;
--      CREATE POLICY "System can insert notifications" ON public.notifications
--        FOR INSERT TO authenticated WITH CHECK (true);
--   3. DROP POLICY "Mentors can create mentorships from approved requests" ON public.mentorships;
--      CREATE POLICY "System inserts mentorships on approval" ON public.mentorships
--        FOR INSERT TO authenticated WITH CHECK (auth.uid() = mentor_id);
--   4. DROP TRIGGER trg_sessions_immutable ON public.sessions;
--      DROP FUNCTION public.enforce_session_immutable_cols();
-- ============================================================


-- -------------------------------------------------------
-- 1. public_profiles view
--
-- Exposes only fields that are safe to share between any
-- two authenticated users on the platform. The email column
-- from profiles is intentionally excluded.
--
-- The view is owned by the migration executor (postgres),
-- which is a superuser and bypasses RLS on the underlying
-- profiles table. This allows all authenticated users to
-- read display data for any profile row, while the email
-- column is structurally absent from the view.
-- -------------------------------------------------------
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  first_name,
  last_name,
  avatar_url,
  role,
  headline,
  location,
  linkedin_url,
  university,
  graduation_year,
  created_at
FROM public.profiles;

-- Grant read access to authenticated users.
-- The anon role is not granted access — this platform
-- requires authentication to view any profile data.
GRANT SELECT ON public.public_profiles TO authenticated;


-- -------------------------------------------------------
-- 2. notifications INSERT — scope to own user_id
-- -------------------------------------------------------
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- -------------------------------------------------------
-- 3. mentorships INSERT — validate request ownership
--
-- Previous policy only checked auth.uid() = mentor_id,
-- allowing a mentor to create a mentorship row with any
-- mentee_id regardless of whether a real approved request
-- existed. The new policy also verifies:
--   - request_id references a real mentorship_request row
--   - that request has status = 'approved'
--   - that request's mentor_id matches the new row's mentor_id
--   - that request's mentee_id matches the new row's mentee_id
-- -------------------------------------------------------
DROP POLICY IF EXISTS "System inserts mentorships on approval" ON public.mentorships;

CREATE POLICY "Mentors can create mentorships from approved requests"
  ON public.mentorships FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = mentor_id AND
    EXISTS (
      SELECT 1
      FROM public.mentorship_requests r
      WHERE r.id        = request_id
        AND r.status    = 'approved'
        AND r.mentor_id = mentor_id
        AND r.mentee_id = mentee_id
    )
  );


-- -------------------------------------------------------
-- 4. sessions: enforce immutability of relationship fields
--
-- Relationship columns (mentor_id, mentee_id, mentorship_id)
-- identify the parties to a session and must not change after
-- the session row is created. All other session fields
-- (status, scheduled_at, notes, mentor_recap, video_link,
-- duration_minutes, session_type) remain updatable.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_session_immutable_cols()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.mentor_id     IS DISTINCT FROM OLD.mentor_id     OR
     NEW.mentee_id     IS DISTINCT FROM OLD.mentee_id     OR
     NEW.mentorship_id IS DISTINCT FROM OLD.mentorship_id THEN
    RAISE EXCEPTION
      'Session relationship fields (mentor_id, mentee_id, mentorship_id) are immutable after creation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sessions_immutable ON public.sessions;
CREATE TRIGGER trg_sessions_immutable
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_session_immutable_cols();
