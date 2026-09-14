# Production migration recovery: incident record

**Status: COMPLETE.** Executed 2026-09-14 against project `iqplkvbpyhajpamjepfu`
("Mentable", us-west-2), which is the database production uses.

Written for someone who knows nothing about the incident.

---

## 1. What was wrong

The deployed schema was roughly seven migrations behind the repository, and the
migration history table did not reflect reality. For real users:

- **Nobody could see anyone's name.** Twelve authenticated pages read a
  `public_profiles` view that did not exist. Falling back to `profiles` failed
  too, because its SELECT policy was still own-row-only.
- **Account deletion always failed.** Sixteen foreign keys declared no
  `ON DELETE` action, so the cascade from `auth.users` was rejected.
- **Reporting, blocking, the Opportunity Fund and session intelligence** did not
  exist as tables at all.

## 2. Migration history found

The history table recorded **only 0001 through 0007**, yet objects from 0008,
0014 and 0015 were present.

```
0001 initial_schema .. 0007 saved_notifications   <- recorded
0008, 0014, 0015                                  <- applied, NOT recorded
0009-0013, 0016-0020                              <- not applied
```

## 3. Why history and schema diverged

Migrations were applied **out of band**, by hand, without the CLI, so the
history table was never updated. Two confirmations:

1. 0015's objects (`profiles.is_admin`, `pilot_events`) existed while 0013's
   view did not, which is impossible under ordered application.
2. `rls_auto_enable` and its event trigger existed and appear in no migration.

This is why `supabase db push` was never used: it trusts the history table, and
the history table was wrong. Every file was applied explicitly instead.

Separately, **0019 and 0020 had aborted** on earlier attempts. 0019 line 33 was
an unguarded `ALTER TABLE public.session_transcripts`, a table 0010 never
created; the raise rolled the transaction back, discarding the four nullability
changes above it. 0020 failed the same way at its indexes, where
`IF NOT EXISTS` guards the index and not the table.

## 4. Backup

The Management API reported `pitr_enabled: false` and **`backups: []`**. There
was no restorable Supabase backup, so one was made before any mutation: a full
logical snapshot of all 15 tables plus 43 policies, 1169 column grants and 65
constraints, written to the working scratchpad as `pre-recovery.json`.

The schema changes were additive and data-preserving throughout: no `DROP
TABLE`, `DELETE` or `TRUNCATE` was executed at any point.

## 5. What was executed, in order

| Step | Applied | Result |
|---|---|---|
| 1 | `recovery/R1_make_rerunnable.sql` | no-op, as expected on a clean database |
| 2 | `0009`, `0010`, `0011`, `0012`, `0013` | 9 tables + `public_profiles` created, RLS on all 9 |
| 3 | `recovery/R3_privacy_atomic.sql` | 0016 + 0018 in one transaction |
| 4 | `0017` | write surface locked down |
| 5 | `0019` | failed; fixed; re-applied |
| 6 | `0020` | applied |
| 7 | **`0021_public_profiles_lockdown.sql`** (new) | closed a hole 0013 opened |
| 8 | **`0022_action_item_assignment_allows_null.sql`** (new) | unblocked account deletion |
| 9 | history table backfilled | now records 0001 to 0022 |

Nothing was skipped. 0008, 0014 and 0015 were already applied and were recorded
rather than re-run, since their policies are not idempotent.

## 6. Three defects found during execution

### 6a. 0019 could never have run (fixed in place)

```
42883: operator does not exist: name[] = text[]
```

`__retarget_fk` compared `array_agg(a.attname)` (`name[]`) against
`ARRAY[p_column]` (`text[]`). PostgreSQL 17 has no implicit operator for that,
so the migration aborted every time regardless of the table guards. Fixed by
casting both sides to `text[]`.

### 6b. 0013 opened an anonymous read AND write hole (migration 0021)

Immediately after 0013 was applied, adversarial testing found that an
**anonymous** caller could read every profile and **write to `profiles` through
the view**. Reproduced with the publishable anon key.

Three things combined:

1. Supabase grants `ALL` on new `public` objects to `anon`, `authenticated` and
   `service_role` by default. 0013 added `GRANT SELECT ... TO authenticated` and
   assumed that was the only privilege in play. It was not.
2. The view never set `security_invoker`, which defaults to false. A
   definer-rights view executes as its owner (`postgres`) and bypasses RLS
   entirely. 0016's comment asserts the opposite; that holds only when
   `security_invoker` is on.
3. `public_profiles` is a simple single-table SELECT, so it is auto-updatable.

0021 revokes everything including the defaults, sets `security_invoker = true`,
and grants back only `SELECT` to `authenticated`. Re-tested: anon now gets
`42501 permission denied` on both read and write.

### 6c. 0014 and 0019 collide, blocking deletion (migration 0022)

After 0019, deleting a populated account still failed:

```
P0001: assigned_to (<NULL>) must be a party to mentorship (...)
CONTEXT: validate_action_item_assignment() line 9
SQL: UPDATE ONLY public.action_items SET assigned_to = NULL WHERE $1 = assigned_to
```

0019 correctly retargeted the foreign key to `ON DELETE SET NULL` so an action
item survives its assignee's departure. 0014's validation trigger, applied out
of band and earlier, rejects a NULL assignee. The cascade issues exactly the
UPDATE the trigger forbids.

0022 makes the trigger treat NULL as "unassigned", the state 0019 intends. Every
non-NULL value is validated exactly as before.

## 7. rls_auto_enable

```
function  public.rls_auto_enable()  owner postgres  SECURITY DEFINER
          SET search_path TO 'pg_catalog'  RETURNS event_trigger
trigger   ensure_rls  ON ddl_command_end  enabled ('O')
          tags: CREATE TABLE, CREATE TABLE AS, SELECT INTO
```

It iterates `pg_event_trigger_ddl_commands()` and runs
`alter table ... enable row level security` for new tables in `public`, with an
exception handler that logs failures rather than aborting the DDL.

**Origin:** not from any migration here. Applied by hand. The style (schema
allowlist, `RAISE LOG` on both paths) matches a common Supabase hardening
snippet.

**Assessment:** benign and useful. It worked during this recovery: all nine new
tables came up with RLS enabled. The migrations also enable RLS explicitly, and
enabling twice is a no-op, so there is no conflict.

**Recommendation: capture it in a migration.** It is unversioned infrastructure.
Rebuild this project from migrations alone and it will not exist, and new tables
will silently not get RLS. It was deliberately not deleted.

## 8. Final verification

All from real authenticated sessions, not by reading SQL.

| Check | Result |
|---|---|
| mentee resolves mentor identity | Dana Okonkwo |
| mentor resolves mentee identity | Riley Quinn |
| any authenticated user resolves public identity (Discover) | works |
| mentee / mentor / outsider read another's email | blocked, `42501` |
| email selectable through `public_profiles` | blocked, `42703` (not in view) |
| `is_admin` readable by ordinary users | blocked, `42501` |
| outsider reads messages, mentorships, requests, sessions, goals, action items | blocked |
| outsider unscoped sweep over 8 tables | 0 rows each |
| anon on profiles / public_profiles | `42501` |
| anon on mentor_profiles, messages, mentorships, sessions | 0 rows |
| anon write through `public_profiles` | `42501` |
| populated account deletion | **succeeded, 231 ms**, no manual pre-deletion |
| residual personal data after deletion | none |

`reviews` is readable by any authenticated user. That is **deliberate** (policy
`USING (true)`, from 0004) so mentor profiles can show ratings. Anon is blocked.

**On anonymisation:** 0019's `SET NULL` columns preserve attribution when the
parent row outlives the user. In a two-party mentorship, deleting either party
cascades the mentorship and everything beneath it, which is 0019's stated intent
("CASCADE where the row is meaningless once the referent is gone"). So in the
common case rows are removed rather than anonymised, and no orphaned personal
data remains either way.

## 9. Application smoke test

Both roles, real accounts, every major route: dashboard, discover, requests,
mentorships, goals, messages, schedule, impact, mentor profile. **No
"Name unavailable", "Former member" or "Unknown" anywhere.** Zero console errors.

Admin: the admin account loaded all six `/admin` routes; a non-admin was
redirected to `/dashboard` on all six; anonymous was redirected to `/login` on
all six. `is_admin` is granted to nobody, and `requireAdmin` correctly falls
through to its service-role check.

`mentor/[id]` embeds `mentor_profiles(*)` through the view. **PostgREST resolves
it** through the view's base column, so the query was left unchanged.

## 10. Data integrity

Every table matches the pre-recovery snapshot exactly:

```
profiles 41  mentor_profiles 24  mentee_profiles 16  mentorship_requests 13
mentorships 9  sessions 36  messages 38  reviews 0  notifications 15
mentorship_goals 26  action_items 0  availability_slots 0  saved_mentors 0
pilot_events 9  pilot_feedback 0
```

All four QA accounts and every dependent record were removed. Zero residue.

## 11. Remaining technical debt

- **`rls_auto_enable` is unversioned.** Capture it in a migration.
- **No test suite.** `package.json` declares `test: jest` and
  `test:e2e: playwright test`, but there is no config and no test files.
  `npx jest` reports "No tests found".
- **No PITR and no backups.** `pitr_enabled: false`, `backups: []`. Worth
  enabling before the platform carries real users.
- **A second project exists**, `gmfcxrqwesieyxbybyap` ("mentee-prod", us-east-2,
  INACTIVE). Production does not use it. Decide whether to delete it, because
  the name invites a costly mistake.
- **`user_reports` still has no moderation lifecycle.** `/admin/reports` is
  read-only by design and says so. Adding `status`, `resolved_by`, `resolved_at`
  plus an admin-only UPDATE policy is the next schema change worth making.
