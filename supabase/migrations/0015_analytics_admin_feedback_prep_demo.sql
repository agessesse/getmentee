-- ============================================================
-- Migration 0015: Analytics, admin flag, feedback, session prep,
--                 demo account flag
--
-- Changes:
--   1. pilot_events — append-only first-party analytics table.
--      Clients may INSERT and SELECT own events only.
--      No client UPDATE or DELETE policy. Admin reads are
--      performed server-side via the service-role key in
--      /api/admin/pilot-data — the key never reaches the browser.
--
--   2. profiles.is_admin + profiles.is_demo — column-level
--      privilege revocation from the authenticated and anon roles.
--      Enforcement is at the PostgreSQL privilege layer, independent
--      of RLS. Clients cannot mutate either field in any direction.
--      The postgres superuser (service-role) retains full access:
--        - postgres: superuser, bypasses all privilege checks
--        - service_role: has its own DML grants separate from
--          authenticated; REVOKE from authenticated does not
--          affect service_role column-level access
--        - anon: revoked as belt-and-suspenders (anon has no
--          UPDATE RLS policy on profiles already)
--
--   3. sessions.prep_mentee + sessions.prep_mentor — BEFORE UPDATE
--      trigger enforces prep-field ownership:
--        - Only the mentee may update prep_mentee
--        - Only the mentor may update prep_mentor
--      Both parties may read both fields (existing SELECT policy).
--      System/service-role operations (NULL auth.uid()) are allowed
--      through so migrations and admin tooling are unblocked.
--      Trigger is SECURITY INVOKER — no privilege escalation needed.
--
--   4. pilot_feedback — own-row INSERT/SELECT only.
--      Admin aggregation via /api/admin/pilot-data (service-role).
--
-- Rollback:
--   DROP TABLE public.pilot_feedback;
--   DROP TRIGGER  trg_session_prep_ownership ON public.sessions;
--   DROP FUNCTION public.enforce_session_prep_ownership();
--   ALTER TABLE public.sessions DROP COLUMN IF EXISTS prep_mentee, DROP COLUMN IF EXISTS prep_mentor;
--   GRANT UPDATE ON public.profiles TO authenticated;
--   GRANT UPDATE ON public.profiles TO anon;
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin, DROP COLUMN IF EXISTS is_demo;
--   DROP TABLE public.pilot_events;
-- ============================================================


-- -------------------------------------------------------
-- 1. pilot_events — append-only analytics
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pilot_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT        CHECK (role IN ('mentor', 'mentee')),
  event_name TEXT        NOT NULL,
  entity_id  UUID,
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pilot_events_user    ON public.pilot_events(user_id);
CREATE INDEX IF NOT EXISTS idx_pilot_events_name    ON public.pilot_events(event_name);
CREATE INDEX IF NOT EXISTS idx_pilot_events_created ON public.pilot_events(created_at);

ALTER TABLE public.pilot_events ENABLE ROW LEVEL SECURITY;

-- Users may INSERT their own events
CREATE POLICY "Users can insert own events"
  ON public.pilot_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users may SELECT their own events (admin reads all via service-role API)
CREATE POLICY "Users can read own events"
  ON public.pilot_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- No UPDATE or DELETE client policies — events are immutable from the client.


-- -------------------------------------------------------
-- 2. profiles: is_admin and is_demo columns
--
-- Column-level REVOKE has no effect when the grantee holds a
-- table-level UPDATE grant. Supabase grants table-level UPDATE
-- on public.profiles to authenticated by default, so the correct
-- approach is:
--   1. REVOKE the table-level UPDATE from authenticated and anon.
--   2. GRANT column-level UPDATE on only the explicit set of
--      columns the authenticated client legitimately writes.
--
-- Default-deny is intentional: any future migration that adds a
-- user-editable column to profiles must also add an explicit
-- GRANT UPDATE (new_column) ON public.profiles TO authenticated.
-- Future ADD COLUMNs do NOT automatically receive UPDATE privileges.
--
-- service_role and postgres are unaffected — they hold their own
-- independent grant paths that do not flow through authenticated.
-- -------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_demo  BOOLEAN NOT NULL DEFAULT false;

-- Step 1: Remove table-level UPDATE from authenticated and anon.
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;

-- Step 2: Explicit column-level allowlist for authenticated.
-- Only the columns profile/setup/page.tsx legitimately writes.
-- Excluded: id, email, role (immutable post-signup), avatar_url
-- (no current authenticated write path), created_at, updated_at
-- (system/trigger-managed), is_admin, is_demo (admin-only).
GRANT UPDATE (
  first_name,
  last_name,
  headline,
  location,
  linkedin_url,
  university,
  graduation_year
) ON public.profiles TO authenticated;

-- anon receives no UPDATE grant at all. anon has no UPDATE RLS
-- policy on profiles; this is belt-and-suspenders.


-- -------------------------------------------------------
-- 3. sessions: prep fields with per-party ownership
--
-- prep_mentee: what the mentee wants to cover before the session.
-- prep_mentor: what the mentor wants to cover before the session.
-- Both fields are visible to both parties (existing SELECT policy).
-- Neither party may overwrite the other party's field.
--
-- Trigger is SECURITY INVOKER (default) — auth.uid() is accessible
-- through the request.jwt.claims GUC for the duration of the
-- connection, regardless of SECURITY INVOKER vs DEFINER.
-- -------------------------------------------------------
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS prep_mentee TEXT,
  ADD COLUMN IF NOT EXISTS prep_mentor TEXT;

CREATE OR REPLACE FUNCTION public.enforce_session_prep_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID;
BEGIN
  v_actor := auth.uid();

  -- Allow system/service-role/migration operations where no JWT is present
  IF v_actor IS NULL THEN
    RETURN NEW;
  END IF;

  -- prep_mentor is owned by the mentor
  IF (NEW.prep_mentor IS DISTINCT FROM OLD.prep_mentor)
     AND (v_actor IS DISTINCT FROM OLD.mentor_id)
  THEN
    RAISE EXCEPTION
      'Only the mentor may update prep_mentor (session %, actor %)',
      OLD.id, v_actor;
  END IF;

  -- prep_mentee is owned by the mentee
  IF (NEW.prep_mentee IS DISTINCT FROM OLD.prep_mentee)
     AND (v_actor IS DISTINCT FROM OLD.mentee_id)
  THEN
    RAISE EXCEPTION
      'Only the mentee may update prep_mentee (session %, actor %)',
      OLD.id, v_actor;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_session_prep_ownership ON public.sessions;
CREATE TRIGGER trg_session_prep_ownership
  BEFORE UPDATE OF prep_mentee, prep_mentor ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_session_prep_ownership();


-- -------------------------------------------------------
-- 4. pilot_feedback
--
-- Own-row INSERT and SELECT.
-- Admin aggregate reads via /api/admin/pilot-data (service-role).
-- No client UPDATE or DELETE.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pilot_feedback (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          TEXT        CHECK (role IN ('mentor', 'mentee')),
  category      TEXT        NOT NULL CHECK (category IN (
                              'confusing', 'broken', 'feature_idea', 'liked', 'other'
                            )),
  feedback      TEXT        NOT NULL,
  rating        INT         CHECK (rating BETWEEN 1 AND 5),
  current_route TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pilot_feedback_user    ON public.pilot_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_pilot_feedback_created ON public.pilot_feedback(created_at);

ALTER TABLE public.pilot_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit feedback"
  ON public.pilot_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON public.pilot_feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- No UPDATE or DELETE policies.
-- Admin reads via /api/admin/pilot-data using SUPABASE_SERVICE_KEY.
