-- ============================================================================
-- Migration 0026: one application table, two roles
-- ============================================================================
-- WHY
--
-- cohort_applications was built for students only: school and year on the row,
-- three written answers, and a unique index on email. Mentor outreach is now
-- starting, and a mentor has no school, no year, and different questions. The
-- two options were a second table or a role column; a role column wins because
-- every downstream concern is identical — the same admin reader, the same
-- service-role-only access, the same notification, the same duplicate handling.
-- A second table would duplicate all of it to hold ten different columns.
--
-- WHAT CHANGES
--
--   role            'mentee' (default, so existing rows stay correct) or
--                   'mentor'. Every existing row is a student application.
--   learning        loses NOT NULL. It is the student's "what are you working
--                   toward", which a mentor is never asked.
--   mentor columns  title, organization, location, linkedin_url, expertise,
--                   who_help, why_mentoring, good_relationship, involvement.
--   mentee columns  timely, good_mentee — the two questions added alongside
--                   the three that already existed.
--
-- The unique index moves from (email) to (email, role). Someone who wants to
-- mentor and also be mentored is a real person, not a duplicate, and the two
-- applications answer different questions.
--
-- A CHECK enforces the per-role shape at the database, not only in the route,
-- so a row that is missing its role's required answers cannot be written by
-- any path at all.
--
-- WHAT DOES NOT CHANGE
--
-- The security model. RLS stays on with no policies, anon and authenticated
-- keep zero privileges, and /api/apply with the service-role key remains the
-- only writer. No new grants.
--
-- ROLLBACK
--   DROP INDEX IF EXISTS public.cohort_applications_email_role_key;
--   CREATE UNIQUE INDEX cohort_applications_email_key
--     ON public.cohort_applications (lower(email));
--   ALTER TABLE public.cohort_applications
--     DROP CONSTRAINT IF EXISTS cohort_applications_role_shape,
--     DROP COLUMN IF EXISTS role, DROP COLUMN IF EXISTS title,
--     DROP COLUMN IF EXISTS organization, DROP COLUMN IF EXISTS location,
--     DROP COLUMN IF EXISTS linkedin_url, DROP COLUMN IF EXISTS expertise,
--     DROP COLUMN IF EXISTS who_help, DROP COLUMN IF EXISTS why_mentoring,
--     DROP COLUMN IF EXISTS good_relationship, DROP COLUMN IF EXISTS involvement,
--     DROP COLUMN IF EXISTS timely, DROP COLUMN IF EXISTS good_mentee;
--   -- learning's NOT NULL is not restored automatically: any mentor rows
--   -- written in the meantime would have to be removed first.
-- ============================================================================

ALTER TABLE public.cohort_applications
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'mentee'
                             CHECK (role IN ('mentee', 'mentor')),

  -- Mentor identity. Bounded like every other free-text column.
  ADD COLUMN IF NOT EXISTS title         TEXT CHECK (title IS NULL OR char_length(title) <= 160),
  ADD COLUMN IF NOT EXISTS organization  TEXT CHECK (organization IS NULL OR char_length(organization) <= 160),
  ADD COLUMN IF NOT EXISTS location      TEXT CHECK (location IS NULL OR char_length(location) <= 160),
  ADD COLUMN IF NOT EXISTS linkedin_url  TEXT CHECK (linkedin_url IS NULL OR char_length(linkedin_url) <= 400),
  ADD COLUMN IF NOT EXISTS expertise     TEXT CHECK (expertise IS NULL OR char_length(expertise) <= 600),

  -- Mentor answers.
  ADD COLUMN IF NOT EXISTS who_help          TEXT CHECK (who_help IS NULL OR char_length(who_help) <= 2000),
  ADD COLUMN IF NOT EXISTS why_mentoring     TEXT CHECK (why_mentoring IS NULL OR char_length(why_mentoring) <= 2000),
  ADD COLUMN IF NOT EXISTS good_relationship TEXT CHECK (good_relationship IS NULL OR char_length(good_relationship) <= 2000),
  -- A cadence chosen from a fixed list, never a number of hours.
  ADD COLUMN IF NOT EXISTS involvement       TEXT CHECK (involvement IS NULL OR char_length(involvement) <= 120),

  -- Mentee answers added in this pass.
  ADD COLUMN IF NOT EXISTS timely      TEXT CHECK (timely IS NULL OR char_length(timely) <= 2000),
  ADD COLUMN IF NOT EXISTS good_mentee TEXT CHECK (good_mentee IS NULL OR char_length(good_mentee) <= 2000);

-- A mentor is never asked what they are working toward.
ALTER TABLE public.cohort_applications
  ALTER COLUMN learning DROP NOT NULL;

/*
  The per-role shape, enforced at the table.

  Deliberately checks presence, never length or quality: the route owns the
  minimums, and a database constraint that encoded "at least 80 characters"
  would have to be migrated every time the form was edited.
*/
ALTER TABLE public.cohort_applications
  DROP CONSTRAINT IF EXISTS cohort_applications_role_shape;

ALTER TABLE public.cohort_applications
  ADD CONSTRAINT cohort_applications_role_shape CHECK (
    (role = 'mentee' AND learning IS NOT NULL AND why_mentor IS NOT NULL AND tried IS NOT NULL)
    OR
    (role = 'mentor' AND title IS NOT NULL AND expertise IS NOT NULL
      AND who_help IS NOT NULL AND why_mentoring IS NOT NULL
      AND good_relationship IS NOT NULL AND involvement IS NOT NULL)
  );

-- One application per role, not one per person.
DROP INDEX IF EXISTS public.cohort_applications_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS cohort_applications_email_role_key
  ON public.cohort_applications (lower(email), role);

CREATE INDEX IF NOT EXISTS cohort_applications_role_time_idx
  ON public.cohort_applications (role, created_at DESC);

COMMENT ON COLUMN public.cohort_applications.role IS
  'mentee or mentor. Existing rows predate mentor applications and default to mentee.';
COMMENT ON COLUMN public.cohort_applications.involvement IS
  'A cadence chosen from a fixed list (occasional questions, a monthly conversation, a few conversations around one goal, open to ongoing). Never a quantity of hours.';
