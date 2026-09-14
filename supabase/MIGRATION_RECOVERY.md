# Production migration recovery plan

**Status: not applied by this pass.** No production DDL access was available
(`supabase projects list` returns `LegacyPlatformAuthRequiredError`, there is no
database connection string in the environment, and PostgREST cannot execute
DDL). Everything below was verified read-only against the live project, which
production shares.

---

## Summary

The deployed schema is at roughly **0008 plus 0015**. Ten migrations are
unapplied, not the four previously reported. The consequence is not cosmetic:
**the authenticated product cannot resolve who anyone is**, every user's email
is readable by every other user, and account deletion fails.

| Migration | State | How it was verified |
|---|---|---|
| 0009 sourced_profiles | NOT APPLIED | table returns PGRST205 |
| 0010 session_intelligence | NOT APPLIED | all 3 tables return PGRST205 |
| 0011 reports_blocks | NOT APPLIED | `user_reports`, `user_blocks` return PGRST205 |
| 0012 opportunity_fund | NOT APPLIED | all 3 tables return PGRST205 |
| **0013 security_access_fixes** | **NOT APPLIED** | `public_profiles` view returns PGRST205 |
| 0014 action_item_validation | unverified | no distinctive object probe found |
| 0015 analytics_admin_feedback | APPLIED | `profiles.is_admin` and `pilot_events` both exist |
| **0016 cross_user_profile_reads** | **NOT APPLIED** | signed in as a real test mentee, selecting the mentor's row from `profiles` returned 0 rows |
| 0017 write_surface_lockdown | unverified | column-level grants are not probeable through PostgREST |
| **0018 email_privacy** | **NOT APPLIED** | signed in as a real test mentee, `profiles.email` was readable |
| 0019 delete_lifecycle | NOT APPLIED | `reviews.reviewer_id`, `mentorship_goals.created_by`, `action_items.created_by`, `action_items.assigned_to` are all still NOT NULL; 0019 makes them nullable at lines 29 to 32 |
| 0020 hardening | almost certainly NOT APPLIED | line 63 runs `CREATE INDEX ... ON public.session_transcripts`; `IF NOT EXISTS` guards the index, not the table, so a missing table aborts |

0015 being applied while 0013 is not means migrations were run out of order at
some point, most likely 0015 by hand during the analytics work.

---

## What is broken for real users right now

### 1. Nobody has a name (worst defect)

`public_profiles` does not exist, and **twelve authenticated pages query it**:
dashboard, discover, requests, mentorships, messages, schedule, goals,
sessions/[id], mentor/[id], mentee/[id], impact, opportunities.

Falling back to `profiles` does not help either: without 0016 the SELECT policy
is still the restrictive `auth.uid() = id`, so one user cannot read another
user's row at all. Verified with a real signed-in test account.

Observed by walking the app as a test mentee with a pending request to a live
test mentor: the request card rendered the mentor as **"Former member"**. The
mentor exists and is active.

### 2. Every email address is readable by every authenticated user

0018 revokes column-level SELECT on `profiles.email`. It is not applied, so any
signed-in user can read every other user's email. Verified directly.

### 3. Account deletion fails

0019's own header states it:

> Any user who has sent a message, held a mentorship, attended a session or
> written a review therefore cannot delete their account, and gets a generic 500.

Sixteen foreign keys still declare no ON DELETE action, which Postgres treats as
NO ACTION, so the cascade from `auth.users` to `profiles` is rejected by the
first referencing row.

### 4. Reporting, blocking, Opportunity Fund, session intelligence

All non-functional (0010, 0011, 0012). `ReportUserModal` fails with "Failed to
submit report. Please try again.", which will never succeed.

### Why 0019 and 0020 aborted

0019 line 33 is `ALTER TABLE public.session_transcripts ALTER COLUMN created_by
DROP NOT NULL`. That table comes from 0010, which never ran. The statement is
unguarded, so the transaction aborted and rolled back, including the four
nullability changes at lines 29 to 32 that precede it. Their surviving NOT NULL
state is the proof. 0020 fails the same way at line 63.

---

## Safety analysis

0009 to 0012 are purely additive: `CREATE TABLE IF NOT EXISTS` plus `ALTER
TABLE` and policies against only their own new tables. Nothing drops or rewrites
an existing object, so applying them cannot destroy existing data.

Two hazards:

1. **Policies are not idempotent.** 0010 has 11 `CREATE POLICY` with no
   `DROP POLICY IF EXISTS`; 0011 has 6; 0012 has 8. Each must be applied exactly
   once. A partial apply followed by a re-run errors on the first duplicate.
2. **Do not run `supabase db push` blind.** Push applies whatever the remote
   `supabase_migrations.schema_migrations` history reports as pending. That
   table is not readable through PostgREST, so its contents could not be
   verified here. Given 0015 is applied while 0013 is not, the history is
   already inconsistent with file order and must be inspected first.

---

## Recommended sequence

Run in the Supabase SQL editor, one file at a time, verifying between each.

1. **Back up first.** Supabase dashboard, Database, Backups.
2. **Read the real history**, which determines everything else:
   ```sql
   select version, name from supabase_migrations.schema_migrations order by version;
   ```
3. Apply in file order, each as its own batch:
   `0009`, `0010`, `0011`, `0012`, `0013`.
4. Verify the tables and the view now answer:
   ```sql
   select table_name from information_schema.tables
   where table_schema = 'public'
     and table_name in ('sourced_profiles','session_summaries','session_transcripts',
       'session_voice_notes','user_reports','user_blocks','financial_need_profiles',
       'opportunity_funds','opportunity_interests','public_profiles');
   ```
   Expect 10 rows.
5. Apply `0014` (if step 2 shows it pending), then `0016`, `0017`, `0018`.
   **0016 and 0018 are the ones that restore name resolution and close the email
   exposure**, so verify immediately after: sign in as a test user and confirm
   you can read another user's name but not their email.
6. Apply `0019`. It is now unblocked and is the file that repairs account
   deletion. Re-running it is safe: every statement is either `DROP NOT NULL`
   (idempotent) or goes through `__retarget_fk`, which looks the constraint up
   by name and rebuilds it.
7. Apply `0020`. If its two `ADD CONSTRAINT` statements report the constraint
   already exists, drop those two and run the rest.
8. Verify deletion with a throwaway account that has a message and a review.
   Never test this against a real user.

---

## After applying

- Re-walk the authenticated product. Names should resolve everywhere; the
  "Name unavailable" fallback should disappear entirely.
- `/admin/reports` already detects the unreadable table and says so. Once 0011
  lands it shows the real queue, and the separate moderation-status gap
  described on that page becomes the next thing worth fixing.
- Re-run the email check as a signed-in non-admin. It must be blocked.

---

## Correction to the previous pass

The previous audit stated that the profiles SELECT policy is `USING (true)` and
concluded that a missing partner row therefore meant a deleted account. That
conclusion was drawn from reading the migration file, not from querying the
database. 0016 is not applied, so the permissive policy is not in force. The
`FORMER_MEMBER` fallback introduced on that basis was asserting something false
about live users, and has been reworded to `Name unavailable` in
`lib/display-name.ts`.
