-- ============================================================================
-- Migration 0034: let a failed booking undo itself
-- ============================================================================
-- THE BUG THIS FIXES, found by end-to-end verification against the real
-- Google Calendar API.
--
-- planConversation creates the sessions row first, then asks the provider
-- for the event. When a Google Meet or Teams booking fails, the join link is
-- the entire point of the meeting, so the code deletes the row rather than
-- leaving a conversation nobody can join:
--
--     await supabase.from('sessions').delete().eq('id', created.id);
--
-- sessions had INSERT, SELECT and UPDATE policies and NO DELETE policy. RLS
-- therefore matched zero rows, the delete reported no error, and the orphan
-- survived: a google_meet conversation with no URL, no external event, and
-- sync_status 'none', which then appeared as "What's next". Exactly the
-- state the design says must never exist.
--
-- A delete that matches nothing is not an error in PostgREST, which is why
-- this was invisible until a real provider rejected a real request.
--
-- THE POLICY IS AS NARROW AS THE JOB
--
--   the caller must be the organiser        not merely a participant
--   the session must still be 'scheduled'   a held conversation is history
--   it must have no external_event_id       if an event exists, cancelling
--                                           it through the provider is the
--                                           correct path, not deleting the
--                                           local row and orphaning theirs
--
-- So this permits undoing a booking that never completed, and nothing else.
-- It cannot erase a past conversation, cannot be used by the other party,
-- and cannot silently drop a session whose invitation is live in somebody's
-- calendar.
--
-- ROLLBACK
--   DROP POLICY IF EXISTS "Organizer can remove a failed booking" ON public.sessions;
-- ============================================================================

DROP POLICY IF EXISTS "Organizer can remove a failed booking" ON public.sessions;

CREATE POLICY "Organizer can remove a failed booking" ON public.sessions
  FOR DELETE TO authenticated
  USING (
    auth.uid() = organizer_id
    AND status = 'scheduled'
    AND external_event_id IS NULL
  );

COMMENT ON POLICY "Organizer can remove a failed booking" ON public.sessions IS
  'Narrow undo for a booking whose calendar event could not be created. Organizer only, scheduled only, and only while no external event exists.';
