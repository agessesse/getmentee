-- ============================================================================
-- Migration 0023: restore the withheld UPDATE grants on sessions prep/recap
-- ============================================================================
-- WHAT IS BROKEN
--
-- Three columns on public.sessions cannot be written by any authenticated
-- caller, in either role:
--
--   sessions.mentor_recap   (added 0008)
--   sessions.prep_mentee    (added 0015)
--   sessions.prep_mentor    (added 0015)
--
-- Reproduced against the live database on 2026-09-21 as both demo accounts.
-- An UPDATE touching any of the three fails with
--
--   42501: permission denied for table sessions
--
-- while the same UPDATE against sessions.notes succeeds. The failure is raised
-- at permission-check time, so it happens even when the WHERE clause matches
-- no rows — the probe therefore confirmed it without modifying any data.
--
-- WHY IT IS BROKEN
--
-- Migration 0017 closed V3 (session identity tampering) by replacing the
-- table-level UPDATE privilege with column-level grants:
--
--   REVOKE UPDATE ON public.sessions FROM authenticated, anon;
--   GRANT UPDATE (scheduled_at, duration_minutes, session_type,
--                 notes, video_link, status) ON public.sessions TO authenticated;
--
-- Withholding mentorship_id, mentor_id and mentee_id was the point of that
-- migration and remains correct. But mentor_recap already existed at the time
-- (0008), and prep_mentee/prep_mentor were added two migrations earlier (0015)
-- complete with an ownership trigger — and none of the three made it into the
-- grant list. Once the table-level privilege is revoked, a column with no
-- explicit grant is unwritable, so 0017 silently disabled three working
-- features while closing an unrelated hole. Nothing between 0018 and 0022
-- restored them.
--
-- WHAT THIS MIGRATION DOES
--
--   1. Grants UPDATE on exactly those three columns, and nothing else.
--   2. Extends the existing prep-ownership trigger from 0015 to cover
--      mentor_recap, so the recap is mentor-owned the way prep_mentor is.
--
-- Step 2 is not optional. The sessions UPDATE policy (0004) admits either
-- party to the row, and RLS cannot scope columns, so granting mentor_recap
-- without an ownership check would let a mentee write the mentor's recap of
-- their own session. 0015 already solved this shape of problem for the prep
-- columns; this reuses that mechanism rather than inventing a second one.
--
-- WHAT IS DELIBERATELY NOT CHANGED
--
--   * mentorship_id, mentor_id, mentee_id stay withheld (0017's V3 fix).
--   * No RLS policy is created, altered or dropped. Row scoping is unchanged.
--   * anon receives nothing.
--   * No other table's grants are touched.
--   * enforce_session_completion_is_final() (0017) is untouched, so completion
--     remains one-way.
--
-- PERMISSION MATRIX AFTER THIS MIGRATION (RLS unchanged throughout)
--
--   column                         anon  authenticated   mentee of    mentor of
--                                                        the session  the session
--   ---------------------------------------------------------------------------
--   scheduled_at                   -     grant/RLS       write        write
--   duration_minutes               -     grant/RLS       write        write
--   session_type                   -     grant/RLS       write        write
--   notes (shared agenda)          -     grant/RLS       write        write
--   video_link                     -     grant/RLS       write        write
--   status (completion one-way)    -     grant/RLS       write        write
--   prep_mentee              NEW   -     grant/RLS       write        trigger denies
--   prep_mentor              NEW   -     grant/RLS       trigger denies  write
--   mentor_recap             NEW   -     grant/RLS       trigger denies  write
--   mentorship_id                  -     no grant        no grant     no grant
--   mentor_id                      -     no grant        no grant     no grant
--   mentee_id                      -     no grant        no grant     no grant
--
--   "grant/RLS" = the column grant exists for the authenticated role, and the
--   existing row policy from 0004 still decides which rows: a caller who is
--   not a party to the session matches no rows and writes nothing.
--   anon holds no UPDATE grant on any column of this table.
--
-- HOW TO WRITE THESE COLUMNS FROM THE APP
--
--   Use .update(), never .upsert(). Column-level grants do not satisfy
--   INSERT ... ON CONFLICT DO UPDATE, which PostgreSQL checks against
--   table-level UPDATE. An upsert against a column-restricted table fails with
--   42501 "permission denied for table ...". This is not theoretical: the
--   profile page used upsert against the column-restricted mentor_profiles and
--   mentee_profiles, and every profile save had been failing silently since
--   0017 until it was changed to insert-or-update.
--
-- POST-MIGRATION VERIFICATION (run after applying, before trusting it)
--
--   1. Grants are exactly the nine expected columns and nothing more:
--        SELECT column_name FROM information_schema.column_privileges
--         WHERE table_name='sessions' AND grantee='authenticated'
--           AND privilege_type='UPDATE' ORDER BY column_name;
--      Expect: duration_minutes, mentor_recap, notes, prep_mentee,
--              prep_mentor, scheduled_at, session_type, status, video_link.
--      mentorship_id / mentor_id / mentee_id must NOT appear.
--
--   2. anon holds nothing:
--        SELECT count(*) FROM information_schema.column_privileges
--         WHERE table_name='sessions' AND grantee='anon'
--           AND privilege_type='UPDATE';   -- expect 0
--
--   3. The trigger fires on all three columns:
--        SELECT string_agg(a.attname, ', ' ORDER BY a.attname)
--          FROM pg_trigger t
--          JOIN unnest(t.tgattr) AS col(attnum) ON true
--          JOIN pg_attribute a ON a.attrelid = t.tgrelid AND a.attnum = col.attnum
--         WHERE t.tgname = 'trg_session_prep_ownership';
--      Expect: mentor_recap, prep_mentee, prep_mentor.
--
--   4. Behaviour, as the two demo accounts against a session they share:
--        mentor: UPDATE sessions SET mentor_recap='probe'  -> succeeds
--        mentor: UPDATE sessions SET prep_mentor='probe'   -> succeeds
--        mentor: UPDATE sessions SET prep_mentee='probe'   -> raises
--                'Only the mentee may update prep_mentee'
--        mentee: UPDATE sessions SET prep_mentee='probe'   -> succeeds
--        mentee: UPDATE sessions SET mentor_recap='probe'  -> raises
--                'Only the mentor may update mentor_recap'
--        either: UPDATE sessions SET mentor_id=<other uuid> -> 42501
--      Then roll the probe values back to NULL.
--
--   5. Nothing else regressed:
--        a completed session cannot return to 'scheduled' (0017 trigger), and
--        mentor_profiles.rating is still unwritable by its owner.
--
-- ROLLBACK
--
--   REVOKE UPDATE (mentor_recap, prep_mentee, prep_mentor)
--     ON public.sessions FROM authenticated;
--   -- and restore the function body from
--   -- 0015_analytics_admin_feedback_prep_demo.sql, plus:
--   DROP TRIGGER IF EXISTS trg_session_prep_ownership ON public.sessions;
--   CREATE TRIGGER trg_session_prep_ownership
--     BEFORE UPDATE OF prep_mentee, prep_mentor ON public.sessions
--     FOR EACH ROW EXECUTE FUNCTION public.enforce_session_prep_ownership();
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Ownership: mentor_recap belongs to the mentor
-- ----------------------------------------------------------------------------
-- Same function as 0015, with one more guarded column. Replacing the function
-- rather than adding a second trigger keeps all three ownership rules in one
-- readable place. SECURITY INVOKER (default) is retained: auth.uid() resolves
-- through the request.jwt.claims GUC either way.

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

  -- mentor_recap is the mentor's account of the conversation
  IF (NEW.mentor_recap IS DISTINCT FROM OLD.mentor_recap)
     AND (v_actor IS DISTINCT FROM OLD.mentor_id)
  THEN
    RAISE EXCEPTION
      'Only the mentor may update mentor_recap (session %, actor %)',
      OLD.id, v_actor;
  END IF;

  RETURN NEW;
END;
$$;

-- The trigger must now also fire on mentor_recap, or the new branch above is
-- unreachable: BEFORE UPDATE OF <columns> only fires for those columns.
DROP TRIGGER IF EXISTS trg_session_prep_ownership ON public.sessions;
CREATE TRIGGER trg_session_prep_ownership
  BEFORE UPDATE OF prep_mentee, prep_mentor, mentor_recap ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_session_prep_ownership();


-- ----------------------------------------------------------------------------
-- 2. The grant 0017 omitted
-- ----------------------------------------------------------------------------
-- Additive only. The six columns 0017 granted keep their grant; this adds three
-- more. No REVOKE is issued, so nothing that works today stops working.

GRANT UPDATE (
  mentor_recap,
  prep_mentee,
  prep_mentor
) ON public.sessions TO authenticated;

-- withheld, unchanged: mentorship_id, mentor_id, mentee_id
-- anon: no grant of any kind
