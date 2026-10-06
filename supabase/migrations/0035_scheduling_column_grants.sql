-- ============================================================================
-- Migration 0035: UPDATE grants for the scheduling columns
-- ============================================================================
-- THE BUG, found only by running the real provider flow.
--
-- sessions has NO table-level UPDATE grant for authenticated. Migration 0017
-- ("write surface lockdown") replaced it with a per-column allowlist, so a
-- participant may update exactly nine columns:
--
--   duration_minutes, mentor_recap, notes, prep_mentee, prep_mentor,
--   scheduled_at, session_type, status, video_link
--
-- Migration 0033 added ten scheduling columns and did not extend that list.
-- Postgres rejects an UPDATE if ANY targeted column lacks the grant, so
-- every write-back in the scheduling flow failed silently:
--
--   success  calendar_provider, external_calendar_id, external_event_id,
--            invite_status, sync_status  -> rejected, so the external event
--            id and Meet/Teams URL were NEVER STORED. The event would exist
--            in Google, and Mentable would have no record of it: no Join
--            link, no reschedule, no cancel, sync_status stuck at 'none'.
--   failure  sync_status / invite_status / sync_error -> rejected, so a
--            failed invite showed no warning on reload.
--   reschedule / cancel  same.
--
-- This could not be caught by typechecking, by RLS review, or by any test
-- that did not call the provider: the INSERT path is granted table-wide and
-- worked fine, so bookings appeared to succeed right up to the moment the
-- result had to be written back.
--
-- THE GRANT IS THE SEVEN COLUMNS THE FLOW ACTUALLY WRITES, and no more.
--
-- Deliberately NOT granted, because they are set once at INSERT and must
-- never be rewritten by a participant:
--
--   organizer_id      decides whose calendar owns the event, and therefore
--                     who may cancel it with the provider. Writable, it
--                     would let one party claim the other's event.
--   meeting_provider  changing Meet to in-person after the fact would leave
--                     a live video event described as a coffee.
--   location          only meaningful for in-person, set at creation.
--
-- ROLLBACK
--   REVOKE UPDATE (time_zone, calendar_provider, external_calendar_id,
--     external_event_id, invite_status, sync_status, sync_error)
--     ON public.sessions FROM authenticated;
-- ============================================================================

GRANT UPDATE (
  time_zone,
  calendar_provider,
  external_calendar_id,
  external_event_id,
  invite_status,
  sync_status,
  sync_error
) ON public.sessions TO authenticated;

-- RLS is unchanged and still decides WHICH rows: "Parties can update their
-- sessions" (auth.uid() = mentor_id OR mentee_id). This grant only widens
-- WHICH COLUMNS, for rows a participant could already update.
