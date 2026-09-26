-- ============================================================================
-- Migration 0027: the bridge from approved applicant to member
-- ============================================================================
-- WHY
--
-- Three states existed in our heads and none of them existed in the database:
--
--   applicant           a row in cohort_applications
--   approved applicant  someone we decided to invite
--   member              someone with an account
--
-- Until now the only way to become a member was /signup, open registration
-- that anyone could complete without ever applying. That makes approval
-- meaningless and creates the "registered but not actually accepted" state we
-- do not want. It also orphaned the application: a person who applied and then
-- signed up produced two unconnected records of the same human.
--
-- WHAT THIS ADDS
--
-- A single-use, expiring, email-bound activation token. Approving an
-- application mints one; the link goes to the applicant; /activate exchanges
-- it for an account and writes user_id back onto the application.
--
-- WHY A TOKEN TABLE AND NOT A SUPABASE INVITE
--
-- inviteUserByEmail depends on Supabase's transactional email being configured
-- and on its templates. It is not configured here, and pretending it is would
-- mean approvals that silently go nowhere. A token we mint ourselves works
-- today, and the delivery step stays honest: the admin copies the link and
-- sends it. When email is configured, delivery changes and none of this does.
--
-- SECURITY
--
--   * Only the SHA-256 of the token is stored. A database leak does not hand
--     anyone a working activation link.
--   * The row carries the email the application was submitted with, and
--     /activate refuses to create an account under any other address. One
--     person's link therefore cannot activate another person's application.
--   * Single use: used_at is stamped on success and a used token is refused.
--   * Expiring: 14 days, long enough to survive a slow inbox, short enough
--     that a forwarded link does not stay live for a year.
--   * RLS on, no policies, no grants to anon or authenticated. The only reader
--     and writer is a service-role server route, same as every other table
--     holding applicant data.
--
-- ROLLBACK
--   DROP TABLE IF EXISTS public.activation_tokens;
--   ALTER TABLE public.cohort_applications DROP CONSTRAINT IF EXISTS cohort_applications_status_check;
--   ALTER TABLE public.cohort_applications ADD CONSTRAINT cohort_applications_status_check
--     CHECK (status IN ('submitted','reviewing','accepted','declined','withdrawn'));
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activation_tokens (
  -- SHA-256 hex of the token. The token itself is shown once, at approval, and
  -- never persisted anywhere.
  token_hash     TEXT        PRIMARY KEY CHECK (char_length(token_hash) = 64),

  application_id UUID        NOT NULL
                             REFERENCES public.cohort_applications(id) ON DELETE CASCADE,

  -- Binds the link to one person. Checked against the address the account is
  -- being created under.
  email          TEXT        NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),

  expires_at     TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at        TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activation_tokens_application_idx
  ON public.activation_tokens (application_id, created_at DESC);

ALTER TABLE public.activation_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.activation_tokens FROM anon, authenticated;

COMMENT ON TABLE public.activation_tokens IS
  'Single-use, expiring, email-bound activation links for approved applicants. Stores only the SHA-256 of each token. Service-role only: RLS on, no policies, no grants.';

/*
  'activated' as a terminal state.

  cohort_applications.user_id already says whether an account exists, but the
  admin list reads status, and "accepted" next to someone who has been using
  the product for a month is misleading. The two are written together.
*/
ALTER TABLE public.cohort_applications
  DROP CONSTRAINT IF EXISTS cohort_applications_status_check;

ALTER TABLE public.cohort_applications
  ADD CONSTRAINT cohort_applications_status_check CHECK (
    status IN ('submitted', 'reviewing', 'accepted', 'activated', 'declined', 'withdrawn')
  );
