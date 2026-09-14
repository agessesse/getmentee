-- ============================================================================
-- R3: the 0016 + 0018 privacy pair, applied atomically
-- ============================================================================
-- This replaces running 0016_fix_cross_user_profile_reads.sql and
-- 0018_email_privacy_and_consent.sql as two separate steps.
--
-- WHY THIS FILE EXISTS
--
-- 0016 broadens the profiles SELECT policy from `auth.uid() = id` to `true`, so
-- that any authenticated user can resolve another user's display name. 0018
-- then revokes table-level SELECT and re-grants a column allowlist that
-- deliberately withholds email.
--
-- Between those two operations there is a state in which every authenticated
-- account can run `select email from profiles` and harvest every address on the
-- platform. Applied as two separate statements in a dashboard session, that
-- window is real and externally reachable.
--
-- Wrapping both in one transaction removes the window entirely: DDL in
-- PostgreSQL is transactional, so no other session observes either change until
-- COMMIT, and at COMMIT both are visible together.
--
-- The revoke is also placed BEFORE the policy broadening. Within a transaction
-- the order is not externally observable, but ordering it this way means that
-- even if someone later splits this file by hand, the failure mode is a
-- temporarily over-restricted table rather than a leaked one. Closing before
-- opening is the safe direction.
--
-- Safe to run more than once.
-- ============================================================================

BEGIN;

-- ── 1. Close the column surface first ───────────────────────────────────────
-- RLS is row-level and cannot exclude a column, so column privileges are the
-- only mechanism. Revoking the table-level grant is required: a table-level
-- SELECT grant overrides any narrower column grant.
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;

-- Re-grant only what the product legitimately reads about another person.
-- This list matches the public_profiles view (11 columns) plus updated_at.
--
-- Withheld deliberately:
--   email     private contact information
--   is_admin  administrative flag; see the note below
--   is_demo   internal fixture flag
GRANT SELECT (
  id,
  first_name,
  last_name,
  avatar_url,
  role,
  headline,
  location,
  linkedin_url,
  university,
  graduation_year,
  created_at,
  updated_at
) ON public.profiles TO authenticated;

-- ── 2. Only now broaden row visibility ──────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

COMMIT;


-- ============================================================================
-- Verification. Run immediately after, in the same session.
-- ============================================================================

-- Expect exactly one SELECT policy, with qual = true.
SELECT policyname, cmd, qual::text AS using_expr
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT';

-- Expect 12 rows. email, is_admin and is_demo must NOT appear.
SELECT column_name
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND grantee = 'authenticated'
  AND privilege_type = 'SELECT'
ORDER BY column_name;

-- Expect 0 rows. Any row here means email is still reachable.
SELECT column_name
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND grantee IN ('authenticated', 'anon')
  AND privilege_type = 'SELECT'
  AND column_name IN ('email', 'is_admin', 'is_demo');


-- ============================================================================
-- NOTE ON ADMIN ACCESS
-- ============================================================================
-- is_admin is intentionally not granted to `authenticated`. lib/supabase/admin.ts
-- performs a cheap first-pass is_admin read through the caller's own client, and
-- that read will now return an error rather than a row. It has already been
-- changed to treat that error as inconclusive and fall through to the
-- service-role check, which is and always was the real authority.
--
-- Do not "fix" an admin lockout by granting is_admin to authenticated. That
-- would let any account read who the administrators are.
