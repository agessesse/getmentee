-- ============================================================
-- Migration 0014: Action-item assignment validation +
--                 Secure cross-user notification infrastructure
--
-- Changes:
--   1. BEFORE INSERT OR UPDATE trigger on action_items — validates
--      assigned_to is a party (mentor or mentee) of the referenced
--      mentorship. Blocks assignment to unrelated UUIDs at the
--      database layer regardless of client request.
--
--   2. Expand notifications.type CHECK to include
--      'session_cancelled' and 'action_item_assigned'.
--      Uses a defensive catalog-query pattern to locate and drop
--      the existing CHECK constraint by definition content rather
--      than relying on its auto-generated name.
--
--   3. Seven SECURITY DEFINER trigger functions (one for
--      assignment validation + six for notification delivery)
--      with hardened search_path and schema-qualified references.
--      Covers all seven lifecycle notification events:
--        a. mentorship request received       → mentor notified
--        b. request approved/declined         → mentee notified
--        c. new message                       → recipient notified
--        d. session scheduled                 → mentor notified
--        e. session cancelled                 → partner notified
--        f. action item assigned to partner   → assignee notified
--
--   4. REVOKE EXECUTE from PUBLIC on all seven SECURITY DEFINER
--      trigger functions. Trigger machinery does not check function
--      execute privileges, so revocation only blocks direct client
--      invocation — which has no legitimate use and would run with
--      elevated postgres privileges for SECURITY DEFINER functions.
--
--   5. Idempotent addition of notifications to supabase_realtime.
--
-- Rollback:
--   DROP TRIGGER  trg_validate_action_item_assignment ON public.action_items;
--   DROP FUNCTION public.validate_action_item_assignment();
--   DROP TRIGGER  trg_notify_request_received     ON public.mentorship_requests;
--   DROP TRIGGER  trg_notify_request_decision     ON public.mentorship_requests;
--   DROP TRIGGER  trg_notify_new_message          ON public.messages;
--   DROP TRIGGER  trg_notify_session_scheduled    ON public.sessions;
--   DROP TRIGGER  trg_notify_session_cancelled    ON public.sessions;
--   DROP TRIGGER  trg_notify_action_item_assigned ON public.action_items;
--   DROP FUNCTION public.notify_request_received();
--   DROP FUNCTION public.notify_request_decision();
--   DROP FUNCTION public.notify_new_message();
--   DROP FUNCTION public.notify_session_scheduled();
--   DROP FUNCTION public.notify_session_cancelled();
--   DROP FUNCTION public.notify_action_item_assigned();
--   ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
--   ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
--     CHECK (type IN (
--       'request_received','request_accepted','request_declined',
--       'new_message','session_scheduled','session_reminder',
--       'goal_completed','action_item_due','review_received'
--     ));
--   -- To undo the realtime addition:
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
-- ============================================================


-- -------------------------------------------------------
-- 1. action_items: assigned_to must be a mentorship party
--
-- Fires BEFORE INSERT OR UPDATE OF assigned_to, mentorship_id
-- so that updates narrowed to other columns are not checked.
--
-- Runs SECURITY DEFINER (as postgres) so the mentorships subquery
-- bypasses RLS — appropriate because this is a data-integrity
-- check, not a data-access operation.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_action_item_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.mentorships m
    WHERE m.id = NEW.mentorship_id
      AND (m.mentor_id = NEW.assigned_to OR m.mentee_id = NEW.assigned_to)
  ) THEN
    RAISE EXCEPTION
      'assigned_to (%) must be a party to mentorship (%) — must be the mentor or mentee',
      NEW.assigned_to, NEW.mentorship_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_action_item_assignment() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_validate_action_item_assignment ON public.action_items;
CREATE TRIGGER trg_validate_action_item_assignment
  BEFORE INSERT OR UPDATE OF assigned_to, mentorship_id ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_action_item_assignment();


-- -------------------------------------------------------
-- 2. Expand notifications.type CHECK constraint
--
-- Defensive pattern: query pg_constraint to find the CHECK
-- constraint on public.notifications whose definition references
-- 'request_received' (a known type value from migration 0007).
-- This uniquely identifies the type CHECK constraint without
-- depending on its auto-generated name.
--
-- Safety invariants:
--   - If zero matching constraints exist, skip DROP (idempotent).
--   - If exactly one is found, verify it and drop it by its
--     actual name using a parameterised EXECUTE.
--   - If two or more matching constraints exist, raise an
--     exception (unexpected state; do not proceed blindly).
--   - Unrelated CHECK constraints on notifications are untouched.
-- -------------------------------------------------------
DO $$
DECLARE
  v_constraint_name TEXT;
  v_constraint_def  TEXT;
  v_count           INT;
BEGIN
  SELECT COUNT(*)
    INTO v_count
    FROM pg_constraint c
    JOIN pg_class     t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'notifications'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%request_received%';

  IF v_count = 0 THEN
    RAISE NOTICE
      'Migration 0014: No type CHECK constraint found on public.notifications '
      '(already dropped or never created). Proceeding to add canonical constraint.';

  ELSIF v_count = 1 THEN
    SELECT c.conname, pg_get_constraintdef(c.oid)
      INTO v_constraint_name, v_constraint_def
      FROM pg_constraint c
      JOIN pg_class     t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = 'notifications'
        AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) LIKE '%request_received%';

    RAISE NOTICE
      'Migration 0014: Dropping type CHECK constraint "%" — definition: %',
      v_constraint_name, v_constraint_def;

    EXECUTE format(
      'ALTER TABLE public.notifications DROP CONSTRAINT %I',
      v_constraint_name
    );

  ELSE
    RAISE EXCEPTION
      'Migration 0014: Expected 0 or 1 type CHECK constraints on public.notifications '
      'containing "request_received", found %. Manual review required.',
      v_count;
  END IF;
END;
$$;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'request_received',
    'request_accepted',
    'request_declined',
    'new_message',
    'session_scheduled',
    'session_cancelled',
    'session_reminder',
    'goal_completed',
    'action_item_due',
    'action_item_assigned',
    'review_received'
  ));


-- -------------------------------------------------------
-- 3a. mentorship_requests INSERT → notify mentor
--
-- mentorship_requests status CHECK: ('pending','approved','declined')
-- All client inserts arrive as 'pending' (table default + RLS).
-- Status guard is defensive against future schema changes.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_request_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mentee_name TEXT;
BEGIN
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(CONCAT_WS(' ', first_name, last_name), ''), 'Someone')
    INTO v_mentee_name
    FROM public.profiles
    WHERE id = NEW.mentee_id;

  INSERT INTO public.notifications (user_id, type, title, data)
  VALUES (
    NEW.mentor_id,
    'request_received',
    v_mentee_name || ' sent you a mentorship request',
    jsonb_build_object('request_id', NEW.id, 'mentee_id', NEW.mentee_id)
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_request_received() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_request_received ON public.mentorship_requests;
CREATE TRIGGER trg_notify_request_received
  AFTER INSERT ON public.mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_request_received();


-- -------------------------------------------------------
-- 3b. mentorship_requests UPDATE → notify mentee on decision
--
-- DB status values: 'approved' (not 'accepted'), 'declined'.
-- Notification titles use natural language; DB values are internal.
-- IS NOT DISTINCT FROM provides NULL-safe status comparison.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_request_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mentor_name TEXT;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(CONCAT_WS(' ', first_name, last_name), ''), 'Your mentor')
    INTO v_mentor_name
    FROM public.profiles
    WHERE id = NEW.mentor_id;

  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, type, title, data)
    VALUES (
      NEW.mentee_id,
      'request_accepted',
      v_mentor_name || ' accepted your mentorship request',
      jsonb_build_object('request_id', NEW.id, 'mentor_id', NEW.mentor_id)
    );
  ELSIF NEW.status = 'declined' THEN
    INSERT INTO public.notifications (user_id, type, title, data)
    VALUES (
      NEW.mentee_id,
      'request_declined',
      v_mentor_name || ' is unable to take on new mentees at this time',
      jsonb_build_object('request_id', NEW.id, 'mentor_id', NEW.mentor_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_request_decision() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_request_decision ON public.mentorship_requests;
CREATE TRIGGER trg_notify_request_decision
  AFTER UPDATE OF status ON public.mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_request_decision();


-- -------------------------------------------------------
-- 3c. messages INSERT → notify recipient
--
-- Recipient is the mentorship party who is NOT the sender.
-- No message content is stored in the notification payload.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_recipient_id UUID;
  v_sender_name  TEXT;
BEGIN
  SELECT CASE
           WHEN m.mentor_id = NEW.sender_id THEN m.mentee_id
           ELSE m.mentor_id
         END
    INTO v_recipient_id
    FROM public.mentorships m
    WHERE m.id = NEW.mentorship_id;

  IF v_recipient_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(CONCAT_WS(' ', first_name, last_name), ''), 'Your partner')
    INTO v_sender_name
    FROM public.profiles
    WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, title, data)
  VALUES (
    v_recipient_id,
    'new_message',
    v_sender_name || ' sent you a message',
    jsonb_build_object('mentorship_id', NEW.mentorship_id)
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_new_message() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();


-- -------------------------------------------------------
-- 3d. sessions INSERT → notify mentor
--
-- The existing "Mentees can book sessions" INSERT policy enforces
-- auth.uid() = mentee_id, so the mentor is always the recipient.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_session_scheduled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mentee_name TEXT;
BEGIN
  SELECT COALESCE(NULLIF(CONCAT_WS(' ', first_name, last_name), ''), 'Your mentee')
    INTO v_mentee_name
    FROM public.profiles
    WHERE id = NEW.mentee_id;

  INSERT INTO public.notifications (user_id, type, title, data)
  VALUES (
    NEW.mentor_id,
    'session_scheduled',
    v_mentee_name || ' scheduled a session with you',
    jsonb_build_object(
      'session_id',    NEW.id,
      'scheduled_at',  NEW.scheduled_at,
      'mentorship_id', NEW.mentorship_id
    )
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_session_scheduled() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_session_scheduled ON public.sessions;
CREATE TRIGGER trg_notify_session_scheduled
  AFTER INSERT ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.notify_session_scheduled();


-- -------------------------------------------------------
-- 3e. sessions UPDATE → notify partner when cancelled
--
-- auth.uid() reads from request.jwt.claims GUC — accessible
-- in SECURITY DEFINER functions in Supabase because the GUC
-- is set for the entire connection, not just the invoking frame.
--
-- If auth.uid() returns NULL (system process, migration context,
-- or absent JWT), the notification is silently skipped rather than
-- erroring, so service-role operations on sessions are unblocked.
--
-- IS NOT DISTINCT FROM guards against spurious trigger fires when
-- status did not actually change value.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_session_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor      UUID;
  v_recipient  UUID;
  v_actor_name TEXT;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status <> 'cancelled' THEN
    RETURN NEW;
  END IF;

  v_actor := auth.uid();

  IF v_actor IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_actor = NEW.mentor_id THEN
    v_recipient := NEW.mentee_id;
  ELSIF v_actor = NEW.mentee_id THEN
    v_recipient := NEW.mentor_id;
  ELSE
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(CONCAT_WS(' ', first_name, last_name), ''), 'Your partner')
    INTO v_actor_name
    FROM public.profiles
    WHERE id = v_actor;

  INSERT INTO public.notifications (user_id, type, title, data)
  VALUES (
    v_recipient,
    'session_cancelled',
    v_actor_name || ' cancelled the scheduled session',
    jsonb_build_object(
      'session_id',    NEW.id,
      'scheduled_at',  OLD.scheduled_at,
      'mentorship_id', NEW.mentorship_id
    )
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_session_cancelled() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_session_cancelled ON public.sessions;
CREATE TRIGGER trg_notify_session_cancelled
  AFTER UPDATE OF status ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.notify_session_cancelled();


-- -------------------------------------------------------
-- 3f. action_items INSERT → notify assignee if not creator
--
-- Only the action item title is stored (not description or
-- private mentorship context). Title is capped at 60 characters.
-- Self-assignments do not generate a notification.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_action_item_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_creator_name TEXT;
BEGIN
  IF NEW.assigned_to = NEW.created_by THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(CONCAT_WS(' ', first_name, last_name), ''), 'Your partner')
    INTO v_creator_name
    FROM public.profiles
    WHERE id = NEW.created_by;

  INSERT INTO public.notifications (user_id, type, title, data)
  VALUES (
    NEW.assigned_to,
    'action_item_assigned',
    v_creator_name || ' assigned you: ' || LEFT(NEW.title, 60),
    jsonb_build_object(
      'action_item_id', NEW.id,
      'mentorship_id',  NEW.mentorship_id,
      'session_id',     NEW.session_id
    )
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_action_item_assigned() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_action_item_assigned ON public.action_items;
CREATE TRIGGER trg_notify_action_item_assigned
  AFTER INSERT ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION public.notify_action_item_assigned();


-- -------------------------------------------------------
-- 4. Idempotent realtime subscription for notifications
--
-- Queries pg_publication_tables before altering the publication
-- so the statement does not fail if notifications is already a
-- member of supabase_realtime.
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname    = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;
