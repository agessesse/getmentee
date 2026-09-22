-- ============================================================================
-- Migration 0024: founding cohort applications
-- ============================================================================
-- WHY THIS TABLE EXISTS
--
-- Mentable is about to be shared publicly for the first time. A student who
-- arrives from Instagram cannot usefully be dropped into the product yet:
-- there are no mentors who can receive a request (verified — every mentor row
-- is a seeded fixture, and the founding-mentor gate that separates real people
-- from fixtures is false for all of them). Sending strangers to "create your
-- profile" would hand them an empty marketplace.
--
-- So the public ask becomes an application to a first cohort, and this is
-- where those applications land.
--
-- THE SECURITY MODEL, AND WHY IT IS THIS ONE
--
-- Applications arrive from people who are NOT signed in. The obvious approach
-- — grant `anon` INSERT and write a permissive RLS policy — would give the
-- public API key a write path into the database, readable in any browser's
-- network tab, and an open door for automated junk.
--
-- Instead nothing is granted to `anon` or `authenticated` at all. RLS is
-- enabled with no policies, which denies every client-side request outright,
-- and the only writer is /api/founding-cohort/apply, a server route holding
-- the service-role key. service_role bypasses RLS by design, so the route can
-- insert while the browser cannot — and there is no client-side read path to
-- other people's applications, which is the failure that matters most here
-- because these rows contain names, emails and personal essays.
--
-- Admin review happens through the existing service-role admin surface, the
-- same way pilot feedback is already read.
--
-- WHAT THIS MIGRATION DOES NOT DO
--
--   * It does not touch profiles, mentorships, sessions, or any existing
--     policy or grant. Nothing in the authenticated product reads this table.
--   * It does not record consent for anybody. An application is a person
--     asking to take part; it is not permission to show their name publicly.
--     Any such permission will be a separate, explicit act.
--
-- ROLLBACK
--   DROP TABLE IF EXISTS public.cohort_applications;
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cohort_applications (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who is asking. Email is the only contact field: enough to reply, and
  -- nothing else is needed to decide.
  full_name     TEXT        NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 1 AND 120),
  email         TEXT        NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  school        TEXT        CHECK (school IS NULL OR char_length(school) <= 160),
  year          TEXT        CHECK (year IS NULL OR char_length(year) <= 40),

  -- The application itself. Every answer is optional except the first, because
  -- a form that refuses to submit until seven essays are written selects for
  -- persistence with forms, not for teachability.
  learning      TEXT        NOT NULL CHECK (char_length(trim(learning)) BETWEEN 1 AND 2000),
  why_mentor    TEXT        CHECK (why_mentor IS NULL OR char_length(why_mentor) <= 2000),
  tried         TEXT        CHECK (tried IS NULL OR char_length(tried) <= 2000),
  thirty_min    TEXT        CHECK (thirty_min IS NULL OR char_length(thirty_min) <= 2000),
  good_use      TEXT        CHECK (good_use IS NULL OR char_length(good_use) <= 2000),
  field         TEXT        CHECK (field IS NULL OR char_length(field) <= 2000),
  worth_it      TEXT        CHECK (worth_it IS NULL OR char_length(worth_it) <= 2000),

  -- Review state. 'submitted' until a human looks at it; nothing automated
  -- ever advances this.
  status        TEXT        NOT NULL DEFAULT 'submitted'
                            CHECK (status IN ('submitted', 'reviewing', 'accepted', 'declined', 'withdrawn')),
  notes         TEXT,

  -- If the applicant already has an account, link it. Null is normal: most
  -- applicants will not have signed up.
  user_id       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- One application per email. A second submission should be an update by a
-- human, not a duplicate row for someone to review twice.
CREATE UNIQUE INDEX IF NOT EXISTS cohort_applications_email_key
  ON public.cohort_applications (lower(email));

CREATE INDEX IF NOT EXISTS cohort_applications_status_idx
  ON public.cohort_applications (status, created_at DESC);

-- RLS on, no policies: every request carrying the anon or authenticated key
-- matches nothing and is refused. service_role bypasses RLS, which is how the
-- server route writes.
ALTER TABLE public.cohort_applications ENABLE ROW LEVEL SECURITY;

-- Belt and braces alongside the absent policies: withhold the table-level
-- privileges too, so a future permissive policy cannot accidentally open a
-- client-side path on its own.
REVOKE ALL ON public.cohort_applications FROM anon, authenticated;

COMMENT ON TABLE public.cohort_applications IS
  'Founding cohort applications from the public site. Written only by the service-role route /api/founding-cohort/apply; no client-side read or write path. Contains personal data: name, email, free text.';
