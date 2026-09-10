-- ============================================================================
-- Migration 0019: make account deletion actually work
-- ============================================================================
-- Closes F3.
--
-- app/api/account/delete/route.ts calls admin.auth.admin.deleteUser() and its
-- comment says data is removed "via ON DELETE CASCADE". profiles.id does
-- cascade from auth.users, but 16 foreign keys in this schema declare no
-- ON DELETE action, which Postgres defaults to NO ACTION. Deleting the
-- auth.users row cascades to profiles, that delete is rejected by the first
-- referencing row, and the whole transaction aborts. Any user who has sent a
-- message, held a mentorship, attended a session or written a review therefore
-- cannot delete their account, and gets a generic 500.
--
-- Re-verified against the current schema (including the tables added in 0014
-- and 0015): still exactly these 16. Three more break the chain one level down —
-- mentorships.request_id, sessions.mentorship_id and reviews.session_id — so
-- fixing the 13 alone would still leave deletion failing.
--
-- The action is chosen per column, deliberately:
--   CASCADE  where the row is meaningless once the referent is gone.
--   SET NULL on attribution columns, so the OTHER party's history survives.
-- Blanket-cascading reviews would erase the remaining party's record along with
-- the departing user's, which is the wrong outcome.
-- ============================================================================


-- SET NULL needs nullable columns. All 16 are currently NOT NULL.
ALTER TABLE public.reviews             ALTER COLUMN reviewer_id  DROP NOT NULL;
ALTER TABLE public.mentorship_goals    ALTER COLUMN created_by   DROP NOT NULL;
ALTER TABLE public.action_items        ALTER COLUMN created_by   DROP NOT NULL;
ALTER TABLE public.action_items        ALTER COLUMN assigned_to  DROP NOT NULL;
ALTER TABLE public.session_transcripts ALTER COLUMN created_by   DROP NOT NULL;
ALTER TABLE public.session_summaries   ALTER COLUMN created_by   DROP NOT NULL;
ALTER TABLE public.session_voice_notes ALTER COLUMN created_by   DROP NOT NULL;


-- Rebuild a foreign key with a delete action, looking the constraint name up
-- rather than assuming the <table>_<column>_fkey default.
CREATE OR REPLACE FUNCTION public.__retarget_fk(
  p_table     TEXT,
  p_column    TEXT,
  p_ref_table TEXT,
  p_action    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_name TEXT;
BEGIN
  SELECT c.conname INTO v_name
  FROM pg_constraint c
  JOIN pg_class     t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = p_table
    AND c.contype = 'f'
    AND (
      SELECT array_agg(a.attname ORDER BY a.attnum)
      FROM pg_attribute a
      WHERE a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    ) = ARRAY[p_column];

  IF v_name IS NULL THEN
    RAISE NOTICE 'no single-column FK found on %.%, skipping', p_table, p_column;
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', p_table, v_name);
  EXECUTE format(
    'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) '
    'REFERENCES public.%I(id) ON DELETE %s',
    p_table, p_table || '_' || p_column || '_fkey', p_column, p_ref_table, p_action
  );
END;
$$;


-- ── CASCADE: the row cannot exist without the referent ──────────────────────
SELECT public.__retarget_fk('mentorships',         'request_id',    'mentorship_requests', 'CASCADE');
SELECT public.__retarget_fk('mentorships',         'mentee_id',     'profiles',            'CASCADE');
SELECT public.__retarget_fk('mentorships',         'mentor_id',     'profiles',            'CASCADE');
SELECT public.__retarget_fk('messages',            'sender_id',     'profiles',            'CASCADE');
SELECT public.__retarget_fk('sessions',            'mentorship_id', 'mentorships',         'CASCADE');
SELECT public.__retarget_fk('sessions',            'mentor_id',     'profiles',            'CASCADE');
SELECT public.__retarget_fk('sessions',            'mentee_id',     'profiles',            'CASCADE');
SELECT public.__retarget_fk('reviews',             'session_id',    'sessions',            'CASCADE');
-- a review is about the reviewee; if they leave, it goes with them
SELECT public.__retarget_fk('reviews',             'reviewee_id',   'profiles',            'CASCADE');

-- ── SET NULL: attribution, where the surviving party keeps the record ───────
-- the reviewer's identity is dropped but the mentor's rating history stands
SELECT public.__retarget_fk('reviews',             'reviewer_id',   'profiles',            'SET NULL');
SELECT public.__retarget_fk('mentorship_goals',    'created_by',    'profiles',            'SET NULL');
SELECT public.__retarget_fk('action_items',        'created_by',    'profiles',            'SET NULL');
SELECT public.__retarget_fk('action_items',        'assigned_to',   'profiles',            'SET NULL');
SELECT public.__retarget_fk('session_transcripts', 'created_by',    'profiles',            'SET NULL');
SELECT public.__retarget_fk('session_summaries',   'created_by',    'profiles',            'SET NULL');
SELECT public.__retarget_fk('session_voice_notes', 'created_by',    'profiles',            'SET NULL');


DROP FUNCTION public.__retarget_fk(TEXT, TEXT, TEXT, TEXT);


-- Verification, run this after applying:
--   SELECT t.relname, a.attname, c.confdeltype
--   FROM pg_constraint c
--   JOIN pg_class t ON t.oid = c.conrelid
--   JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
--   WHERE c.contype = 'f' AND t.relnamespace = 'public'::regnamespace
--     AND c.confdeltype = 'a';
-- 'a' means NO ACTION. The result should be empty.
