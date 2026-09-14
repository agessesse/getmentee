-- ============================================================================
-- R2: verify the recovery. Read-only. Run after each stage and at the end.
-- ============================================================================

-- ── 1. Migration history vs reality ─────────────────────────────────────────
-- Run this FIRST, before anything else. It is the one thing that could not be
-- checked from outside the database, and it determines whether `supabase db
-- push` is safe or whether every file must be applied by hand.
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;


-- ── 2. Tables and the view that should exist ───────────────────────────────
-- Expect 10 rows after stage 1 of the runbook.
SELECT c.relname,
       CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' ELSE c.relkind::text END AS kind
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'sourced_profiles',
    'session_summaries', 'session_transcripts', 'session_voice_notes',
    'user_reports', 'user_blocks',
    'financial_need_profiles', 'opportunity_funds', 'opportunity_interests',
    'public_profiles'
  )
ORDER BY c.relname;


-- ── 3. The profiles privacy pair ───────────────────────────────────────────
-- 0016 opens row reads; 0018 closes the email column. Both must be true at the
-- same time. If the first query returns a permissive policy and the second
-- returns a row for 'email', every address on the platform is exposed.
SELECT policyname, cmd, qual::text AS using_expr
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT';

-- Columns the `authenticated` role may SELECT on profiles.
-- Expect email to be ABSENT and is_admin / is_demo to be ABSENT.
SELECT column_name
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND grantee = 'authenticated'
  AND privilege_type = 'SELECT'
ORDER BY column_name;


-- ── 4. Delete lifecycle (0019) ─────────────────────────────────────────────
-- Expect 0 rows. Any row means 0019 did not fully apply.
SELECT c.relname AS table_name, a.attname AS column_name
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND a.attnotnull
  AND (c.relname, a.attname) IN (
    ('reviews','reviewer_id'), ('reviews','reviewee_id'),
    ('mentorship_goals','created_by'),
    ('action_items','created_by'), ('action_items','assigned_to'),
    ('session_transcripts','created_by'), ('session_summaries','created_by'),
    ('session_voice_notes','created_by')
  );

-- Every FK into profiles should declare an ON DELETE action.
-- confdeltype: 'a' = NO ACTION (bad), 'c' = CASCADE, 'n' = SET NULL.
-- Expect no rows with 'a'.
SELECT con.conname, cl.relname AS from_table, con.confdeltype
FROM pg_constraint con
JOIN pg_class cl  ON cl.oid = con.conrelid
JOIN pg_class ref ON ref.oid = con.confrelid
JOIN pg_namespace n ON n.oid = cl.relnamespace
WHERE n.nspname = 'public'
  AND con.contype = 'f'
  AND ref.relname = 'profiles'
  AND con.confdeltype = 'a'
ORDER BY cl.relname;


-- ── 5. Duplicate policies ──────────────────────────────────────────────────
-- A partial re-run can leave two policies with the same intent on one table.
-- Expect 0 rows.
SELECT tablename, policyname, count(*)
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, policyname
HAVING count(*) > 1;


-- ── 6. Objects present in production but in no migration file ──────────────
-- rls_auto_enable was found in production and exists in no migration. Listing
-- functions here makes any further out-of-band drift visible.
SELECT p.proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname;
