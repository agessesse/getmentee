-- ============================================================================
-- Migration 0021: close the public_profiles hole opened by 0013
-- ============================================================================
-- Found by adversarial testing immediately after 0013 was applied: an
-- anonymous caller could both read every profile and WRITE to profiles through
-- the view. Reproduced with the publishable anon key.
--
-- Three things combined to cause it:
--
--   1. Supabase grants ALL on new objects in `public` to anon, authenticated
--      and service_role by default. 0013 added
--      `GRANT SELECT ... TO authenticated` and assumed that was the only
--      privilege in play. It was not: anon silently received SELECT, INSERT,
--      UPDATE and DELETE.
--
--   2. The view is owned by postgres and never set `security_invoker`, which
--      defaults to false. A definer-rights view executes as its owner, so it
--      bypasses row level security on profiles entirely. 0016's comment
--      asserts the opposite ("runs under the calling user's security
--      context"); that is only true when security_invoker is on.
--
--   3. `public_profiles` is a simple single-table SELECT, which makes it
--      auto-updatable. Definer rights plus a write grant meant anon could
--      UPDATE profiles through it.
--
-- Fix: strip every default privilege, make the view respect the caller's RLS,
-- then grant back only SELECT to authenticated.
--
-- With security_invoker on, the view is correct for both roles:
--   authenticated  profiles SELECT policy is USING (true) (0016), and the
--                  column grant from 0018 covers all 11 view columns, so
--                  cross-user identity resolution keeps working.
--   anon           has no SELECT policy on profiles, so the view returns
--                  nothing even before the missing grant is considered.
--
-- Rollback:
--   ALTER VIEW public.public_profiles SET (security_invoker = false);
--   GRANT SELECT ON public.public_profiles TO anon;
-- (Do not actually roll this back. It is the fix.)
-- ============================================================================

-- 1. Remove everything, including the Supabase defaults.
REVOKE ALL ON public.public_profiles FROM PUBLIC;
REVOKE ALL ON public.public_profiles FROM anon;
REVOKE ALL ON public.public_profiles FROM authenticated;

-- 2. Make the view honour the caller's row level security rather than the
--    owner's. This is the structural fix; the grants above are defence in depth.
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- 3. Grant back only what the application needs.
GRANT SELECT ON public.public_profiles TO authenticated;

-- Nothing is granted to anon. The marketing site reads no profile data; the
-- public /people pages are prerendered from static files in data/.
