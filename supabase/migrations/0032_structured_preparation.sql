-- ============================================================================
-- Migration 0032: structured conversation preparation
-- ============================================================================
-- THE ONLY SCHEMA CHANGE IN PASS 2, and the case for it.
--
-- 1. WHAT USER BEHAVIOUR CANNOT CURRENTLY BE REPRESENTED
--
--    A mentee preparing for a conversation answers three separate things:
--    what they want help with, what has changed since last time, and the
--    specific questions they want to ask. The mentor's view renders those as
--    distinct elements -- "Maya wants help with ..." as a single line, and
--    "Questions Maya added" as a numbered list -- and the What's next card on
--    the workspace shows the focus line on its own.
--
--    Today sessions.prep_mentee is one TEXT blob. Three labelled fields and a
--    list of questions cannot be recovered from it without parsing prose,
--    which would be wrong often and silently.
--
-- 2. WHY THE EXISTING COLUMNS CANNOT DO IT
--
--    prep_mentee and prep_mentor are TEXT and one production row already
--    holds free prose. Reinterpreting that column as JSON would either
--    corrupt that row or require a parser that guesses. A text column also
--    cannot be shape-checked, so anything could be written into it.
--
-- 3. THE SMALLEST ADDITIVE CHANGE
--
--    One nullable JSONB column with a CHECK on its shape. No table is
--    created, nothing is dropped, nothing is backfilled, and prep_mentee /
--    prep_mentor stay exactly as they are and are still read as a fallback,
--    so the one existing prep note keeps displaying. A session with no
--    structured prep is NULL here and behaves as it does today.
--
-- PRIVACY NOTE
--
--    Both parties can SELECT a session row (RLS: "Parties can read their
--    sessions"), so this column is readable by both. The mentee's half is
--    MEANT to be read by the mentor: sharing what you want help with is the
--    entire point of preparing. The mentor's half is not, and the loader in
--    lib/mentorship/workspace-data.ts strips `mentor` before it reaches a
--    mentee, with a test asserting it. That is the same boundary the existing
--    prep_mentee / prep_mentor pair already relies on; this migration does
--    not widen it.
--
-- ROLLBACK
--   ALTER TABLE public.sessions DROP COLUMN IF EXISTS prep;
-- ============================================================================

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS prep JSONB;

/*
  Shape, enforced by the database rather than by whoever writes the next
  route. Two optional halves, each with a fixed set of keys. Operator-only
  because CHECK constraints cannot contain subqueries; subtracting the known
  keys and comparing to '{}' is how "and nothing else" is expressed.
*/
ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_prep_shape;

ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_prep_shape CHECK (
    prep IS NULL OR (
      jsonb_typeof(prep) = 'object'
      AND (prep - ARRAY['mentee','mentor']) = '{}'::jsonb
      AND (
        NOT prep ? 'mentee' OR (
          jsonb_typeof(prep->'mentee') = 'object'
          AND ((prep->'mentee') - ARRAY['focus','changed','questions']) = '{}'::jsonb
          AND (NOT prep->'mentee' ? 'focus'     OR jsonb_typeof(prep->'mentee'->'focus') = 'string')
          AND (NOT prep->'mentee' ? 'changed'   OR jsonb_typeof(prep->'mentee'->'changed') = 'string')
          AND (NOT prep->'mentee' ? 'questions' OR jsonb_typeof(prep->'mentee'->'questions') = 'array')
        )
      )
      AND (
        NOT prep ? 'mentor' OR (
          jsonb_typeof(prep->'mentor') = 'object'
          AND ((prep->'mentor') - ARRAY['notes']) = '{}'::jsonb
          AND (NOT prep->'mentor' ? 'notes' OR jsonb_typeof(prep->'mentor'->'notes') = 'string')
        )
      )
    )
  );

COMMENT ON COLUMN public.sessions.prep IS
  'Structured preparation: {"mentee":{"focus","changed","questions":[]},"mentor":{"notes"}}. Shape fixed by sessions_prep_shape. The mentee half is shared with the mentor by design; the mentor half is stripped for the mentee in lib/mentorship/workspace-data.ts. prep_mentee/prep_mentor remain as a read fallback for rows written before this column existed.';

-- No grant change. sessions already grants SELECT/UPDATE to authenticated and
-- RLS scopes both to the two participants; a new column inherits that. Stated
-- rather than assumed, because adding a column is exactly when a grant
-- quietly widens.
