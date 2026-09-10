-- ============================================================================
-- Migration 0018: close the email leak, and require consent for a mentorship
-- ============================================================================
-- Two unrelated problems, in one migration because both touch how a mentorship
-- and its parties may be read and written.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. profiles.email is no longer readable through the API
-- ----------------------------------------------------------------------------
-- Migration 0016 replaced the own-row SELECT policy on profiles with
-- USING (true), because the public_profiles view runs with invoker rights and
-- so was re-filtered by the old policy and returned nothing cross-user. That
-- fixed the 'Unknown' labels, and it also made every column of every profile
-- row readable by every authenticated account — including email.
--
-- 0016's reasoning was that "the email column is not exposed in any cross-user
-- query path", which is true of the application's own queries and irrelevant to
-- what the publishable anon key permits. Any account could run
--   select email from profiles
-- and harvest every user's address.
--
-- RLS is row-level and cannot exclude a column, so the fix is a column-level
-- grant. The permissive row policy from 0016 stays exactly as it is, so
-- public_profiles and every cross-user read keep working.
--
-- The application no longer needs profiles.email at all: the only reader was
-- app/(protected)/layout.tsx, and it now takes the address from
-- session.user.email, which is the authoritative source in auth.users.

REVOKE SELECT ON public.profiles FROM authenticated, anon;

GRANT SELECT (
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
  created_at,
  updated_at
) ON public.profiles TO authenticated;

-- withheld deliberately: email
--
-- NOTE: public_profiles is defined with invoker rights, so it reads profiles as
-- the calling user and is bound by this grant too. It does not select email, so
-- it is unaffected.


-- ----------------------------------------------------------------------------
-- 2. A mentorship may only exist because a request was approved
-- ----------------------------------------------------------------------------
-- mentorships INSERT is WITH CHECK (auth.uid() = mentor_id) and nothing else.
-- It does not require an approved request, does not require the mentee to have
-- consented, and does not check that the supplied request_id has anything to do
-- with the supplied mentee_id. request_id is NOT NULL, but an attacker
-- satisfies that by first inserting a request naming THEMSELVES as the mentee,
-- which the request policy permits, then reusing its id.
--
-- The consequence is not a bogus row. Two other policies grant access on the
-- mere existence of a mentorship: the mentee_profiles cross-read (0002) and
-- messages INSERT (0003). So a forged mentorship reads a student's private
-- profile and opens a DM channel to them. Role is self-selected at signup, so
-- there is no barrier to becoming a mentor first.
--
-- Fix: take the insert away from clients and derive the mentee from the request
-- instead of accepting it as an argument.

DROP POLICY IF EXISTS "System inserts mentorships on approval" ON public.mentorships;

REVOKE INSERT ON public.mentorships FROM authenticated, anon;

-- One mentorship per request, so a double-tap on Approve cannot produce two.
-- If this is applied to a database that already holds duplicate request_id
-- values, de-duplicate first or it will fail.
ALTER TABLE public.mentorships
  ADD CONSTRAINT mentorships_request_id_key UNIQUE (request_id);


-- The request itself is not freely editable either. "Mentors can update request
-- status" (0002) is bound to the mentor but has no column scope, so a mentor
-- could rewrite mentee_id on a request they own and then approve it, reaching
-- the same outcome by another route. They could also rewrite the mentee's own
-- message and goals text.
REVOKE UPDATE ON public.mentorship_requests FROM authenticated, anon;

GRANT UPDATE (status) ON public.mentorship_requests TO authenticated;


-- Approval, as a single transaction. This also removes the split-brain state
-- the previous client flow could leave behind: two separate writes where a
-- failed second one left the request marked approved with no mentorship and no
-- way to retry, because it was no longer pending.
CREATE OR REPLACE FUNCTION public.approve_mentorship_request(p_request_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request     public.mentorship_requests;
  v_max_mentees INT;
  v_active      INT;
  v_mentorship  UUID;
BEGIN
  -- Lock the request so two concurrent approvals cannot both pass the checks.
  SELECT * INTO v_request
  FROM public.mentorship_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Request not found.' USING ERRCODE = 'no_data_found';
  END IF;

  -- The caller must be the mentor the request was addressed to. This is the
  -- check that makes the mentee_id below trustworthy.
  IF v_request.mentor_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorised to approve this request.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is no longer pending.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Capacity was advisory: the UI read max_mentees and computed isFull, but the
  -- approve path never enforced it.
  SELECT mp.max_mentees INTO v_max_mentees
  FROM public.mentor_profiles mp WHERE mp.id = v_request.mentor_id;

  SELECT COUNT(*) INTO v_active
  FROM public.mentorships m
  WHERE m.mentor_id = v_request.mentor_id AND m.status = 'active';

  IF v_max_mentees IS NOT NULL AND v_active >= v_max_mentees THEN
    RAISE EXCEPTION 'You have reached your mentee capacity.'
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.mentorship_requests
  SET status = 'approved'
  WHERE id = p_request_id;

  -- mentee_id comes from the request, never from the caller.
  INSERT INTO public.mentorships (request_id, mentee_id, mentor_id)
  VALUES (v_request.id, v_request.mentee_id, v_request.mentor_id)
  RETURNING id INTO v_mentorship;

  RETURN v_mentorship;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_mentorship_request(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.approve_mentorship_request(UUID) TO authenticated;


-- Declining stays a plain status update: it creates no mentorship, the existing
-- row policy already scopes it to the mentor, and the column grant above now
-- limits it to the status column.
