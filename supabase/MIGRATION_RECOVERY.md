# Production migration recovery

**Status: not applied. Blocked on credentials, not on analysis.**

Every avenue for executing DDL or reading the migration history was tested
directly, not assumed:

| Avenue | Result |
|---|---|
| `supabase projects list` | `LegacyPlatformAuthRequiredError`, no access token |
| `SUPABASE_ACCESS_TOKEN` / `DATABASE_URL` / DB password in env | not set; env holds only URL, anon key, service key |
| Management API `GET /v1/projects` with the service key | `401 JWT could not be decoded` |
| Management API `POST /database/query` (the only DDL route) | `401 JWT could not be decoded` |
| PostgREST `Accept-Profile: supabase_migrations` | `PGRST106`, only `public` is exposed |
| `pg_graphql` `/graphql/v1` | extension not enabled |

The service-role key is a PostgREST JWT. It authenticates to PostgREST as the
`service_role` Postgres role and can read and write rows, but PostgREST issues
no DDL and the Management API does not accept it. **There is no path from this
environment to `CREATE`, `ALTER`, `GRANT` or `DROP`.**

Unblocking requires one of: `supabase login`, a `SUPABASE_ACCESS_TOKEN`, the
database password for a direct `psql` connection, or running the SQL by hand in
the Supabase dashboard.

Everything below was verified read-only against the live project, which
production shares. Where a claim came from testing rather than reading, that is
stated.

---

## 1. Verified production state

Relations exposed through PostgREST (15). The nine tables and one view below are
**absent**:

| Missing object | From |
|---|---|
| `sourced_profiles` | 0009 |
| `session_summaries`, `session_transcripts`, `session_voice_notes` | 0010 |
| `user_reports`, `user_blocks` | 0011 |
| `financial_need_profiles`, `opportunity_funds`, `opportunity_interests` | 0012 |
| `public_profiles` (view) | 0013 |

Present and correct: `profiles`, `mentor_profiles`, `mentee_profiles`,
`mentorship_requests`, `mentorships`, `sessions`, `messages`, `reviews`,
`notifications`, `mentorship_goals`, `action_items`, `availability_slots`,
`saved_mentors`, `pilot_events`, `pilot_feedback`.

### Effective RLS, measured from real authenticated sessions

Two QA accounts (one mentee, one mentor) with a complete relationship between
them: request, mentorship, session, message, goal, action item.

| Query | mentee | mentor | anon |
|---|---|---|---|
| own `profiles` row | 1 | 1 | 0 |
| **the other party's `profiles` row** | **0** | **0** | 0 |
| an unrelated user's `profiles` row | 0 | 0 | 0 |
| `public_profiles` | PGRST205 | PGRST205 | PGRST205 |
| `mentor_profiles` (browse) | 3 | 3 | 0 |
| own mentorship / messages / sessions / goals / action items / request | 1 each | 1 each | 0 |
| unscoped `messages` / `mentorships` (leak test) | own only | own only | 0 |

The relationship-scoped policies are correct and anon is fully closed. The
single defect is `profiles`: the SELECT policy is still the own-row-only
`auth.uid() = id` from before 0016, so **no user can resolve any other user's
name**, even their own mentor.

### Column nullability

Every column 0019 makes nullable is still `NOT NULL`: `reviews.reviewer_id`,
`reviews.reviewee_id`, `mentorship_goals.created_by`, `action_items.created_by`,
`action_items.assigned_to`. 0019 did not partially apply; it applied nothing.

---

## 2. Migration history

**Could not be read**, and this is the hard blocker. `supabase_migrations` is
not in PostgREST's exposed schema list, so the history table is unreachable
without a database connection. Reading it is step 1 of the runbook because it
decides whether `supabase db push` is usable at all, and because 0014 and 0017
cannot be classified without it.

## 2b. rls_auto_enable

Calling it through PostgREST returns:

```
400 {"code":"0A000","message":"cannot display a value of type event_trigger"}
```

That return type identifies it: **it is an event trigger function**, not a
callable routine. PostgREST lists it only because it lives in the `public`
schema. The name and shape match the common pattern of an event trigger on
`ddl_command_end` that runs `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on newly
created tables.

Consistent with that, every table tested is closed to `anon`, including tables
whose migrations enable RLS explicitly, so the two mechanisms agree and nothing
observable contradicts it.

It appears in no migration file (verified by grepping the whole set), so it was
added out of band, most likely through the dashboard or a snippet.

**Do not delete it.** Two implications for the recovery:

1. When 0009 to 0012 create their nine tables, RLS will very likely be enabled
   on them automatically as each `CREATE TABLE` commits. The migrations also
   enable it explicitly, which is harmless: enabling twice is a no-op.
2. It is unversioned infrastructure. If the project is ever rebuilt from
   migrations alone, this function and its event trigger will not exist, and
   newly created tables will not get RLS automatically. That is a migration
   management risk worth closing by adding it to a migration.

What could not be determined without a database connection: its owner, its
exact body, and whether an event trigger is currently attached to it. Query 6 of
`R2_verify.sql` lists public functions; add `select * from pg_event_trigger` to
confirm the trigger itself.

## 3. Why history and schema diverged

Two pieces of evidence:

1. **0015 is applied while 0013 is not.** `profiles.is_admin`, `profiles.is_demo`
   and `pilot_events` all exist; `public_profiles` does not. Migrations were
   applied out of file order.
2. **`rls_auto_enable` exists in production and appears in no migration file.**
   Confirmed by grepping the whole migration set. Something has been applied
   out of band.

So production is not "stalled at migration N". It is a hand-edited database, and
its history table cannot be trusted without reading it.

Separately, 0019 and 0020 **aborted**. 0019 line 33 was an unguarded
`ALTER TABLE public.session_transcripts`, a table 0010 never created. That
raised, rolled the transaction back, and discarded the four nullability changes
on lines 29 to 32 that had already run. Their surviving `NOT NULL` state is the
proof. 0020 failed the same way at line 63, where `IF NOT EXISTS` guards the
index and not the table.

---

## 4. What is broken for users

1. **Nobody can see anyone's name.** Twelve authenticated pages read
   `public_profiles`, which does not exist. Falling back to `profiles` fails too
   because of the own-row policy. Observed directly: a pending request to a live
   test mentor rendered the mentor as a fallback label, with a 404 on
   `public_profiles` in the network log.
2. **Account deletion fails.** Sixteen foreign keys still declare no
   `ON DELETE` action, which Postgres treats as `NO ACTION`, so the cascade from
   `auth.users` to `profiles` is rejected by the first referencing row.
3. **Reporting, blocking, the Opportunity Fund and session intelligence** are
   non-functional (0010 to 0012).

### Correction to the previous report

The previous pass claimed `profiles.email` was readable by any authenticated
user. **That was wrong.** Re-tested precisely: selecting `email` with no filter
returns only the caller's own row. The row policy is what protects email today,
not a column grant.

This matters for sequencing. 0016 makes every profile row readable; 0018 then
revokes table-level SELECT and re-grants a column allowlist that excludes email.
**Applying 0016 without 0018 exposes every address on the platform.** They must
land together.

---

## 5. Corrected SQL in this repo

| File | Purpose |
|---|---|
| `supabase/recovery/R1_make_rerunnable.sql` | Drops the 27 policies and 3 triggers that 0010 to 0013 create without a `DROP ... IF EXISTS`. Every drop is guarded by `to_regclass`, so it is a no-op on the current database. Makes those four files safe to run, and to re-run. |
| `supabase/recovery/R2_verify.sql` | Read-only checks: history, objects, the privacy pair, delete lifecycle, duplicate policies, out-of-band functions. |
| `supabase/recovery/R3_privacy_atomic.sql` | **Replaces 0016 and 0018.** Both inside one transaction, revoke before broaden, with verification. This is the step that must not be split. |
| `0019_delete_lifecycle.sql` | **Patched.** The three `ALTER TABLE session_*` statements are now inside a `DO` block guarded by `to_regclass`. This is the bug that silently discarded the whole migration. |
| `0020_hardening.sql` | **Patched.** The three `CREATE INDEX` statements are guarded the same way, and the two `ADD CONSTRAINT` statements are preceded by `DROP CONSTRAINT IF EXISTS`, since Postgres has no `ADD CONSTRAINT IF NOT EXISTS`. |

`__retarget_fk` already returns early when no matching constraint exists, so the
FK retargeting calls in 0019 needed no change.

---

## 6. Execution sequence

Back up first: Supabase dashboard, Database, Backups.

| # | Action | Check before continuing |
|---|---|---|
| 1 | Run query 1 of `R2_verify.sql` | Records what the history table believes. If it lists 0009 to 0013 as applied while the objects are absent, the history is wrong and every file must be applied by hand rather than with `db push`. |
| 2 | Run `recovery/R1_make_rerunnable.sql` | No-op on a clean database. Safe regardless. |
| 3 | Apply `0009`, `0010`, `0011`, `0012`, `0013` in that order | Query 2 of R2 returns 10 rows. |
| 4 | Apply `0014` if step 1 showed it pending | |
| 5 | **Run `recovery/R3_privacy_atomic.sql`** instead of 0016 and 0018 separately | It wraps both in one transaction, so no session can observe a state where rows are open and email is still granted. Its own verification queries are at the bottom of the file. |
| 6 | Apply `0017` if step 1 showed it pending | |
| 7 | Apply `0019` | Query 4 of R2 returns no rows for both checks. |
| 8 | Apply `0020` | |
| 9 | Run all of `R2_verify.sql` | Queries 4 and 5 return zero rows. |
| 10 | Test deletion with a throwaway account that has a message and a review | Never against a real user. |

Do not run `supabase db push` until step 1 has been read. Given 0015 is applied
while 0013 is not, the history is already inconsistent with file order, and push
would re-run non-idempotent files.

---

## 7. Application code already prepared for this

- `lib/supabase/admin.ts` — the first-pass `is_admin` read through the caller's
  own client now tolerates its own failure. 0018's column allowlist excludes
  `is_admin`, so after step 5 that read errors; treating the error as "not an
  admin" would lock every admin out of `/admin`. It now falls through to the
  service-role check, which was always the real authority.
- `lib/display-name.ts` — the fallback is `Name unavailable`, which states only
  what is known. It should disappear entirely once step 5 lands. If it does not,
  something in the recovery did not take.


---

## 8. Pre-flight checks already done against the recovery SQL

Two things were verified statically so they do not surprise you mid-recovery.

**The view is fully covered by the grant.** `public_profiles` selects 11 columns
and R3 grants those 11 plus `updated_at`, so the view keeps working after the
column grant narrows. Verified by comparing the view body in 0013 against the
grant list. 0013's definition is final; neither 0016 nor 0018 redefines it.

**One query may break, and it is worth knowing which.**
`app/(protected)/mentor/[id]/page.tsx` line 132 does:

```
.from('public_profiles')
.select('id, ..., mentor_profiles(*)')
```

`mentor_profiles(*)` is a PostgREST embedded resource, which needs a detectable
relationship. `public_profiles` is a view and has no foreign keys of its own.
PostgREST 12 can often infer the relationship through the view's base column
(`public_profiles.id` traces to `profiles.id`, and `mentor_profiles.id`
references `profiles.id`), so this may work unchanged. It could not be tested
because the view does not exist yet.

This was deliberately **not** "pre-fixed". Rewriting a query that may be correct
risks breaking something that would have worked. After step 5, open a mentor
profile page. If it errors with *"Could not find a relationship between
'public_profiles' and 'mentor_profiles'"*, split it into two queries: read the
identity fields from `public_profiles`, and `mentor_profiles` separately by id.
Every other `public_profiles` query in the app was checked and requests only
columns the view exposes.

---

## 9. What still cannot be classified

`0014` and `0017` remain **unverified**. Neither creates an object reachable
through PostgREST, so their state cannot be determined from outside the
database. Step 1 of the runbook resolves both. Until then, treat them as
unknown rather than assuming either way.
