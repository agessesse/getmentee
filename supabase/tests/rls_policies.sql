-- ============================================================================
-- RLS / privilege regression suite
-- ============================================================================
-- Every finding this suite covers is a claim about what the database permits.
-- Nothing in the repo tested a single policy before, which is how a schema this
-- carefully written still grew five column-scope holes.
--
-- HOW TO RUN
--   Apply migrations 0001..0020 first, then, as the service role / postgres:
--     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_policies.sql
--
--   The whole script runs inside one transaction and ROLLBACKs at the end, so
--   it leaves no data behind. Any failed assertion aborts with the test name.
--
-- WHAT "PASS" MEANS
--   Each test asserts BOTH directions: the call that must be refused, and the
--   call that must still work. A suite that only checks the refusals would pass
--   against a database where everything is refused.
--
-- EXPECTED BEHAVIOUR BEFORE THE FIXES
--   Run this against a database at 0016 (i.e. before 0017-0020) and these
--   should fail: EMAIL, V2, V3a, V3b, V4, F7, V1a, V1b, V1c, F3.
-- ============================================================================

BEGIN;

SET client_min_messages = WARNING;

-- ── helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION pg_temp.act_as(p_uid UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', p_uid::text, 'role', 'authenticated')::text,
    true
  );
END; $$;

CREATE OR REPLACE FUNCTION pg_temp.act_as_admin()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', NULL, true);
END; $$;

-- Assert that a statement is refused. Passes only if it raises.
CREATE OR REPLACE FUNCTION pg_temp.must_fail(p_test TEXT, p_sql TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS  %  (refused: %)', p_test, SQLERRM;
    RETURN;
  END;
  RAISE EXCEPTION 'FAIL  %  — statement was PERMITTED but must be refused: %',
    p_test, p_sql;
END; $$;

-- Assert that a statement is allowed.
CREATE OR REPLACE FUNCTION pg_temp.must_pass(p_test TEXT, p_sql TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RAISE NOTICE 'PASS  %', p_test;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'FAIL  %  — statement was REFUSED but must be allowed: % (%)',
    p_test, p_sql, SQLERRM;
END; $$;

CREATE OR REPLACE FUNCTION pg_temp.must_equal(p_test TEXT, p_actual ANYELEMENT, p_expected ANYELEMENT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF p_actual IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION 'FAIL  %  — expected %, got %', p_test, p_expected, p_actual;
  END IF;
  RAISE NOTICE 'PASS  %', p_test;
END; $$;


-- ── fixtures ────────────────────────────────────────────────────────────────
-- Four accounts: a mentor, their mentee, an unrelated mentee, and an attacker
-- who signs up as a mentor.

SELECT pg_temp.act_as_admin();

CREATE TEMP TABLE t_ids (label TEXT PRIMARY KEY, id UUID);
INSERT INTO t_ids VALUES
  ('mentor',   '11111111-1111-1111-1111-111111111111'),
  ('mentee',   '22222222-2222-2222-2222-222222222222'),
  ('stranger', '33333333-3333-3333-3333-333333333333'),
  ('attacker', '44444444-4444-4444-4444-444444444444');

-- auth.users rows so the profiles FK and the delete test are realistic.
INSERT INTO auth.users (id, email, raw_user_meta_data)
SELECT id, label || '@test.invalid', '{}'::jsonb FROM t_ids
ON CONFLICT (id) DO NOTHING;

-- handle_new_user() populates profiles from the trigger; align the roles.
UPDATE public.profiles SET role = 'mentor'
  WHERE id IN (SELECT id FROM t_ids WHERE label IN ('mentor', 'attacker'));
UPDATE public.profiles SET role = 'mentee'
  WHERE id IN (SELECT id FROM t_ids WHERE label IN ('mentee', 'stranger'));

INSERT INTO public.mentor_profiles (id, profile_complete, max_mentees)
SELECT id, true, 5 FROM t_ids WHERE label IN ('mentor', 'attacker')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.mentee_profiles (id, bio, profile_complete)
SELECT id, 'private bio for ' || label, true
FROM t_ids WHERE label IN ('mentee', 'stranger')
ON CONFLICT (id) DO NOTHING;

-- An approved request and the mentorship it produced.
CREATE TEMP TABLE t_req AS
INSERT INTO public.mentorship_requests (mentee_id, mentor_id, status, message)
SELECT (SELECT id FROM t_ids WHERE label='mentee'),
       (SELECT id FROM t_ids WHERE label='mentor'),
       'approved', 'please mentor me'
RETURNING id;

CREATE TEMP TABLE t_mship AS
INSERT INTO public.mentorships (request_id, mentee_id, mentor_id)
SELECT (SELECT id FROM t_req),
       (SELECT id FROM t_ids WHERE label='mentee'),
       (SELECT id FROM t_ids WHERE label='mentor')
RETURNING id;

CREATE TEMP TABLE t_msg AS
INSERT INTO public.messages (mentorship_id, sender_id, content)
SELECT (SELECT id FROM t_mship),
       (SELECT id FROM t_ids WHERE label='mentor'),
       'I cannot make Tuesday'
RETURNING id;

CREATE TEMP TABLE t_session AS
INSERT INTO public.sessions (mentorship_id, mentor_id, mentee_id, scheduled_at, status)
SELECT (SELECT id FROM t_mship),
       (SELECT id FROM t_ids WHERE label='mentor'),
       (SELECT id FROM t_ids WHERE label='mentee'),
       NOW() - INTERVAL '1 day', 'completed'
RETURNING id;

INSERT INTO public.reviews (session_id, reviewer_id, reviewee_id, rating, feedback)
SELECT (SELECT id FROM t_session),
       (SELECT id FROM t_ids WHERE label='mentee'),
       (SELECT id FROM t_ids WHERE label='mentor'),
       5, 'candid feedback';

-- A pending request from the stranger, for the applicant-read test.
CREATE TEMP TABLE t_pending AS
INSERT INTO public.mentorship_requests (mentee_id, mentor_id, status, message)
SELECT (SELECT id FROM t_ids WHERE label='stranger'),
       (SELECT id FROM t_ids WHERE label='mentor'),
       'pending', 'hoping to connect'
RETURNING id;


-- ════════════════════════════════════════════════════════════════════════════
-- V2 — a mentor may not write their own trust signals
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_mentor UUID := (SELECT id FROM t_ids WHERE label='mentor');
BEGIN
  PERFORM pg_temp.act_as(v_mentor);

  PERFORM pg_temp.must_fail('V2  mentor cannot self-verify',
    format('UPDATE public.mentor_profiles SET is_verified = true WHERE id = %L', v_mentor));
  PERFORM pg_temp.must_fail('V2  mentor cannot set own rating',
    format('UPDATE public.mentor_profiles SET rating = 5.00 WHERE id = %L', v_mentor));
  PERFORM pg_temp.must_fail('V2  mentor cannot set own review_count',
    format('UPDATE public.mentor_profiles SET review_count = 250 WHERE id = %L', v_mentor));
  PERFORM pg_temp.must_pass('V2  mentor CAN still edit their bio',
    format('UPDATE public.mentor_profiles SET bio = %L WHERE id = %L', 'new bio', v_mentor));
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- V3 — session identity is fixed, and completion is one-way
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_mentor   UUID := (SELECT id FROM t_ids WHERE label='mentor');
  v_stranger UUID := (SELECT id FROM t_ids WHERE label='stranger');
  v_session  UUID := (SELECT id FROM t_session);
BEGIN
  PERFORM pg_temp.act_as(v_mentor);

  PERFORM pg_temp.must_fail('V3a session mentee cannot be re-pointed',
    format('UPDATE public.sessions SET mentee_id = %L WHERE id = %L', v_stranger, v_session));
  PERFORM pg_temp.must_fail('V3b completed session cannot be reopened',
    format('UPDATE public.sessions SET status = %L WHERE id = %L', 'scheduled', v_session));
  PERFORM pg_temp.must_pass('V3  notes CAN still be edited',
    format('UPDATE public.sessions SET notes = %L WHERE id = %L', 'good chat', v_session));
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- V4 — role and email are not user-writable
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_mentee UUID := (SELECT id FROM t_ids WHERE label='mentee');
BEGIN
  PERFORM pg_temp.act_as(v_mentee);

  PERFORM pg_temp.must_fail('V4  cannot promote self to mentor',
    format('UPDATE public.profiles SET role = %L WHERE id = %L', 'mentor', v_mentee));
  PERFORM pg_temp.must_fail('V4  cannot change own email',
    format('UPDATE public.profiles SET email = %L WHERE id = %L', 'x@y.invalid', v_mentee));
  PERFORM pg_temp.must_pass('V4  CAN still edit own headline',
    format('UPDATE public.profiles SET headline = %L WHERE id = %L', 'Student', v_mentee));
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- F7 — a recipient may flip is_read and nothing else
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_mentee UUID := (SELECT id FROM t_ids WHERE label='mentee');
  v_msg    UUID := (SELECT id FROM t_msg);
BEGIN
  PERFORM pg_temp.act_as(v_mentee);

  PERFORM pg_temp.must_fail('F7  recipient cannot rewrite message content',
    format('UPDATE public.messages SET content = %L, is_read = true WHERE id = %L',
           'I promise you a job offer', v_msg));
  PERFORM pg_temp.must_pass('F7  recipient CAN mark it read',
    format('UPDATE public.messages SET is_read = true WHERE id = %L', v_msg));
END $$;

-- and the content is intact
SELECT pg_temp.act_as_admin();
DO $$
BEGIN
  PERFORM pg_temp.must_equal('F7  content unchanged',
    (SELECT content FROM public.messages WHERE id = (SELECT id FROM t_msg)),
    'I cannot make Tuesday'::text);
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- F8 — notifications are written by the database, not by clients
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_attacker UUID := (SELECT id FROM t_ids WHERE label='attacker');
  v_mentee   UUID := (SELECT id FROM t_ids WHERE label='mentee');
BEGIN
  PERFORM pg_temp.act_as(v_attacker);
  PERFORM pg_temp.must_fail('F8  cannot plant a notification on another user',
    format($q$INSERT INTO public.notifications (user_id, type, title, body)
             VALUES (%L, 'request_accepted', 'Congratulations', 'Click here')$q$, v_mentee));
END $$;

-- Notification DELIVERY is migration 0013/0014's design (definer functions),
-- not this migration's, so its shape is not asserted here.
SELECT pg_temp.act_as_admin();


-- ════════════════════════════════════════════════════════════════════════════
-- V1 — a mentorship may only come from an approved request
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_attacker UUID := (SELECT id FROM t_ids WHERE label='attacker');
  v_stranger UUID := (SELECT id FROM t_ids WHERE label='stranger');
  v_pending  UUID := (SELECT id FROM t_pending);
  v_own_req  UUID;
BEGIN
  PERFORM pg_temp.act_as(v_attacker);

  -- The original chain: create a request naming yourself as the mentee, then
  -- reuse its id in a mentorship that names a victim.
  INSERT INTO public.mentorship_requests (mentee_id, mentor_id, status, message)
  VALUES (v_attacker, v_attacker, 'pending', 'self')
  RETURNING id INTO v_own_req;

  PERFORM pg_temp.must_fail('V1a direct mentorship insert is refused',
    format($q$INSERT INTO public.mentorships (request_id, mentee_id, mentor_id)
             VALUES (%L, %L, %L)$q$, v_own_req, v_stranger, v_attacker));

  PERFORM pg_temp.must_fail('V1b cannot approve a request addressed to someone else',
    format('SELECT public.approve_mentorship_request(%L)', v_pending));

  PERFORM pg_temp.must_fail('V1c cannot rewrite the mentee on a request',
    format('UPDATE public.mentorship_requests SET mentee_id = %L WHERE id = %L',
           v_stranger, v_own_req));
END $$;

-- the legitimate path works, exactly once
DO $$
DECLARE
  v_mentor  UUID := (SELECT id FROM t_ids WHERE label='mentor');
  v_pending UUID := (SELECT id FROM t_pending);
BEGIN
  PERFORM pg_temp.act_as(v_mentor);
  PERFORM pg_temp.must_pass('V1d mentor CAN approve their own pending request',
    format('SELECT public.approve_mentorship_request(%L)', v_pending));
  PERFORM pg_temp.must_fail('V1e approving twice is refused',
    format('SELECT public.approve_mentorship_request(%L)', v_pending));
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- F1 — discovery works, email stays private, mentees stay private
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_mentee   UUID := (SELECT id FROM t_ids WHERE label='mentee');
  v_stranger UUID := (SELECT id FROM t_ids WHERE label='stranger');
BEGIN
  PERFORM pg_temp.act_as(v_mentee);

  PERFORM pg_temp.must_equal('F1a mentee can see both mentors via the view',
    (SELECT COUNT(*)::int FROM public.public_profiles WHERE role = 'mentor'),
    2);

  PERFORM pg_temp.must_fail('F1b the view exposes no email column',
    'SELECT email FROM public.public_profiles LIMIT 1');

  -- 0016 deliberately made profiles readable cross-user so the invoker-rights
  -- view works. What must stay unreadable is the email column.
  PERFORM pg_temp.must_fail('EMAIL cannot read profiles.email at all',
    'SELECT email FROM public.profiles LIMIT 1');

  PERFORM pg_temp.must_pass('EMAIL non-email columns still readable',
    'SELECT first_name FROM public.profiles LIMIT 1');
END $$;

-- a mentor can read a pending applicant's profile
DO $$
DECLARE v_mentor UUID := (SELECT id FROM t_ids WHERE label='mentor');
BEGIN
  PERFORM pg_temp.act_as(v_mentor);
  PERFORM pg_temp.must_equal('F1e mentor can read their applicants'' profiles',
    (SELECT COUNT(*)::int FROM public.mentee_profiles),
    2);  -- the active mentee and the (now approved) applicant
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- F3 — a user with real history can be deleted
-- ════════════════════════════════════════════════════════════════════════════
SELECT pg_temp.act_as_admin();
DO $$
DECLARE v_mentee UUID := (SELECT id FROM t_ids WHERE label='mentee');
BEGIN
  -- This mentee has a message, a mentorship, a session and a review.
  PERFORM pg_temp.must_pass('F3  deleting a user with history succeeds',
    format('DELETE FROM auth.users WHERE id = %L', v_mentee));

  PERFORM pg_temp.must_equal('F3  their profile is gone',
    (SELECT COUNT(*)::int FROM public.profiles WHERE id = v_mentee), 0);

  PERFORM pg_temp.must_equal('F3  their mentorship cascaded',
    (SELECT COUNT(*)::int FROM public.mentorships WHERE mentee_id = v_mentee), 0);

  -- and the mentor's review history survives, anonymised
  PERFORM pg_temp.must_equal('F3  reviewer_id was nulled, not the row deleted',
    (SELECT COUNT(*)::int FROM public.reviews WHERE reviewer_id IS NULL), 1);
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- No foreign key should be left on NO ACTION
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE c.contype = 'f'
    AND t.relnamespace = 'public'::regnamespace
    AND c.confdeltype = 'a';
  PERFORM pg_temp.must_equal('F3  no FK left on NO ACTION', v_count, 0);
END $$;


ROLLBACK;

-- Nothing above is persisted. Re-runnable as many times as you like.
