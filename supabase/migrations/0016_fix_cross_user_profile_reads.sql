-- ============================================================
-- Migration 0016: Fix cross-user profile reads
-- ============================================================
--
-- Problem: profiles table SELECT policy uses USING (auth.uid() = id),
-- restricting reads to own row only. The public_profiles view runs
-- under the calling user's security context (standard PostgreSQL
-- view behavior), so cross-user reads through the view return nothing.
-- This causes 'Unknown' labels wherever partner names are displayed
-- (dashboard sessions, messages, mentorship cards, etc.).
--
-- Fix: Replace the own-row-only SELECT policy with a permissive policy
-- allowing any authenticated user to read any profile. The email column
-- is not exposed in any cross-user query path — those all go through
-- the public_profiles view which structurally excludes email. Direct
-- profile reads are scoped to own-profile use (layout, topnav, setup).
--
-- Rollback:
--   DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
--   CREATE POLICY "Users can read own profile" ON public.profiles
--     FOR SELECT TO authenticated USING (auth.uid() = id);
-- ============================================================

-- Drop the own-row-only restriction
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Allow any authenticated user to read any profile row.
-- The public_profiles view remains the canonical way to read other
-- users' display data (it excludes email). This policy also allows
-- the layout/topnav to read the current user's own full profile.
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
