-- ============================================================================
-- Migration 0033: SMART goals, native scheduling, calendar connections
-- ============================================================================
-- AUDIT FIRST, as the brief asked. What already exists and is therefore NOT
-- being rebuilt:
--
--   sessions            already holds scheduled_at, duration_minutes, status,
--                       video_link and notes. A "scheduled conversation" IS a
--                       session; there is no second concept here and no
--                       parallel meetings table. video_link becomes the
--                       meeting URL and notes becomes the agenda, because
--                       that is what they already are.
--   mentorship_goals    already holds title, description, target_date and
--                       status. SMART is additive structure on top, not a
--                       replacement.
--   RLS                 every relationship table is already participation-
--                       scoped. Nothing here weakens that.
--
-- THREE THINGS THIS ADDS
--   1. mentorship_goals.smart   the structured SMART components
--   2. scheduling + calendar columns on sessions
--   3. calendar_connections     account-level OAuth tokens, server-side only
--
-- AND ONE THING IT FIXES
--   The INSERT policy on sessions is "Mentees can book sessions", checking
--   auth.uid() = mentee_id. A MENTOR therefore cannot create a session at
--   all, which makes "a mentor and mentee should be able to plan their next
--   conversation" impossible to implement above the database. Replaced with a
--   policy that allows either participant. This widens write access by
--   exactly one person -- the mentor who is already in the relationship -- and
--   nobody else.
--
-- ROLLBACK
--   DROP TABLE IF EXISTS public.calendar_connections;
--   ALTER TABLE public.sessions
--     DROP COLUMN IF EXISTS time_zone, DROP COLUMN IF EXISTS meeting_provider,
--     DROP COLUMN IF EXISTS organizer_id, DROP COLUMN IF EXISTS calendar_provider,
--     DROP COLUMN IF EXISTS external_calendar_id, DROP COLUMN IF EXISTS external_event_id,
--     DROP COLUMN IF EXISTS location, DROP COLUMN IF EXISTS invite_status,
--     DROP COLUMN IF EXISTS sync_status, DROP COLUMN IF EXISTS sync_error;
--   ALTER TABLE public.mentorship_goals DROP COLUMN IF EXISTS smart;
--   DROP POLICY IF EXISTS "Parties can create sessions" ON public.sessions;
--   CREATE POLICY "Mentees can book sessions" ON public.sessions FOR INSERT
--     WITH CHECK ((auth.uid() = mentee_id) AND EXISTS (...));
-- ============================================================================

-- ── 1. SMART goals ──────────────────────────────────────────────────────────
/*
  WHY A COLUMN AND NOT FIVE COLUMNS. The five components are only ever read
  and written together, they are optional as a set, and a goal either has them
  or does not. Five nullable TEXT columns would add five migrations' worth of
  surface for one concept and still not express "this is a SMART goal".

  WHY NOT A TABLE. There is exactly one SMART breakdown per goal. A table
  would be a 1:1 join for data that is never queried independently.

  The existing title, description and target_date are untouched and remain
  the source of truth for display. `smart` is the mentee's working-out, kept
  so it can be revisited and edited later rather than being consolidated into
  a sentence and lost.
*/
ALTER TABLE public.mentorship_goals
  ADD COLUMN IF NOT EXISTS smart JSONB;

ALTER TABLE public.mentorship_goals
  DROP CONSTRAINT IF EXISTS mentorship_goals_smart_shape;

ALTER TABLE public.mentorship_goals
  ADD CONSTRAINT mentorship_goals_smart_shape CHECK (
    smart IS NULL OR (
      jsonb_typeof(smart) = 'object'
      AND (smart - ARRAY['specific','measurable','achievable','relevant','timebound']) = '{}'::jsonb
      AND (NOT smart ? 'specific'   OR jsonb_typeof(smart->'specific')   = 'string')
      AND (NOT smart ? 'measurable' OR jsonb_typeof(smart->'measurable') = 'string')
      AND (NOT smart ? 'achievable' OR jsonb_typeof(smart->'achievable') = 'string')
      AND (NOT smart ? 'relevant'   OR jsonb_typeof(smart->'relevant')   = 'string')
      AND (NOT smart ? 'timebound'  OR jsonb_typeof(smart->'timebound')  = 'string')
    )
  );

COMMENT ON COLUMN public.mentorship_goals.smart IS
  'Optional SMART breakdown: specific, measurable, achievable, relevant, timebound. NULL means an ordinary goal, which is the pre-0033 behaviour and stays valid. title/description remain the display source of truth; this is kept so the mentee can revisit and edit the working-out.';

-- ── 2. Scheduling and calendar fields on sessions ───────────────────────────
/*
  No meetings table. A scheduled conversation is a session, which is what
  makes it appear in "Where have we been" automatically once it has happened:
  the same row simply ages. A parallel table would need syncing back into
  sessions to achieve exactly that, which is a reason not to have one.
*/
ALTER TABLE public.sessions
  -- IANA zone the organiser picked, e.g. America/New_York. Stored because a
  -- timestamptz knows the instant but not the intent, and daylight saving
  -- means "4pm next month" is not the same offset as "4pm today".
  ADD COLUMN IF NOT EXISTS time_zone TEXT,
  -- How they are meeting. Separate from session_type ('video' | 'async'),
  -- which is left alone so no existing row or CHECK changes.
  ADD COLUMN IF NOT EXISTS meeting_provider TEXT
    CHECK (meeting_provider IS NULL OR meeting_provider IN ('google_meet','teams','in_person','other')),
  -- Who created it, which decides whose calendar holds the real event.
  ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS calendar_provider TEXT
    CHECK (calendar_provider IS NULL OR calendar_provider IN ('google','microsoft')),
  ADD COLUMN IF NOT EXISTS external_calendar_id TEXT,
  ADD COLUMN IF NOT EXISTS external_event_id TEXT,
  -- Where, for in-person. The meeting URL reuses video_link, which already
  -- exists and already means exactly that.
  ADD COLUMN IF NOT EXISTS location TEXT,
  /*
    invite_status is about the ATTENDEE, sync_status about the EVENT. They
    separate because "the event exists in my calendar" and "they were
    invited" fail independently, and the UI must never claim the second
    because the first worked.

    'none' is the honest default and the state every conversation scheduled
    without a connected calendar stays in: a real meeting, agreed by two
    people, with no external calendar behind it.
  */
  ADD COLUMN IF NOT EXISTS invite_status TEXT NOT NULL DEFAULT 'none'
    CHECK (invite_status IN ('none','pending','sent','failed','cancelled')),
  ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'none'
    CHECK (sync_status IN ('none','synced','stale','failed','revoked')),
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- One external event per session, per provider. Guards the duplicate-submit
-- case: a second create for the same session cannot silently make a second
-- calendar event.
CREATE UNIQUE INDEX IF NOT EXISTS sessions_external_event_uniq
  ON public.sessions (calendar_provider, external_event_id)
  WHERE external_event_id IS NOT NULL;

COMMENT ON COLUMN public.sessions.sync_status IS
  'Whether the external calendar event matches this row. "none" means there is no external event, which is a valid, complete state: a conversation can be planned in Mentable with no calendar connected.';

-- ── 3. Either participant may plan a conversation ───────────────────────────
/*
  THE FIX. "Mentees can book sessions" required auth.uid() = mentee_id, so a
  mentor proposing a time was impossible at the database level.

  The replacement still requires the caller to BE one of the two people, that
  the row's mentor_id/mentee_id match that mentorship, and that the
  mentorship is active. A participant cannot insert a session into somebody
  else's relationship, and cannot forge the other party.
*/
DROP POLICY IF EXISTS "Mentees can book sessions" ON public.sessions;
DROP POLICY IF EXISTS "Parties can create sessions" ON public.sessions;

CREATE POLICY "Parties can create sessions" ON public.sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = mentee_id OR auth.uid() = mentor_id)
    AND EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = sessions.mentorship_id
        AND m.mentee_id = sessions.mentee_id
        AND m.mentor_id = sessions.mentor_id
        AND (m.mentee_id = auth.uid() OR m.mentor_id = auth.uid())
        AND m.status = 'active'
    )
  );

-- ── 4. Account-level calendar connections ───────────────────────────────────
/*
  ACCOUNT LEVEL, NOT PER MENTORSHIP. A mentor with six mentees connects once.
  The unique key is (profile_id, provider), so there is one Google connection
  and one Microsoft connection per person and reconnecting updates in place.

  SECURITY. Same posture as every table added since 0024 and as
  program_invitations: RLS on, ZERO policies, ZERO grants to anon or
  authenticated. The browser cannot read this table under any session,
  because PostgREST has no privilege on it at all. OAuth refresh tokens are
  long-lived credentials for a user's calendar; the only code that may see
  them is a service-role server route.

  Deliberately NOT adding an application-level encryption key in this pass:
  introducing one means a key-management story (where it lives, how it
  rotates, what happens to rows written under the old key) and getting that
  half-right is worse than the established no-grants pattern plus Supabase's
  encryption at rest. Noted as a real follow-up rather than silently skipped.
*/
CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider       TEXT NOT NULL CHECK (provider IN ('google','microsoft')),
  -- The account actually connected, which is NOT necessarily the Mentable
  -- login address and is the only trustworthy answer to "whose calendar".
  account_email  TEXT,
  -- Which calendar to write to. NULL means the account's primary.
  calendar_id    TEXT,
  access_token   TEXT NOT NULL,
  refresh_token  TEXT,
  expires_at     TIMESTAMP WITH TIME ZONE,
  scope          TEXT,
  /*
    Only consulted when BOTH providers are connected. The brief is explicit
    that an email domain is never authoritative: a university on Google
    Workspace and one on Microsoft 365 both end in .edu.
  */
  is_preferred   BOOLEAN NOT NULL DEFAULT false,
  revoked_at     TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, provider)
);

CREATE INDEX IF NOT EXISTS calendar_connections_profile_idx
  ON public.calendar_connections (profile_id) WHERE revoked_at IS NULL;

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.calendar_connections FROM anon, authenticated;

COMMENT ON TABLE public.calendar_connections IS
  'Account-level OAuth credentials for Google Calendar / Microsoft Graph. RLS on, no policies, no grants: reachable only by service-role server routes. Tokens must never reach the browser.';
