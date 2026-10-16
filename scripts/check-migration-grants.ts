/**
 * A column added without a grant is a column that silently never saves.
 *
 * Migrations 0015 and 0017 replaced table-level UPDATE on profiles,
 * mentor_profiles and mentee_profiles with per-column allowlists, so a
 * user cannot award themselves a rating, a verified badge or an admin
 * flag. That is the right design and it has one sharp edge: a column
 * added later is NOT covered, and PostgreSQL answers a write to it with
 * permission denied rather than anything a reader would notice.
 *
 * 0033 hit this exactly. It added the scheduling columns and not the
 * grant, so the success path would never have stored external_event_id —
 * found only because someone went looking. This check means the next one
 * is found by the build instead.
 *
 * STATIC, on purpose. It reads the migration files rather than the
 * database, so it runs in CI with no credentials and fails the moment the
 * migration is WRITTEN rather than after it has been applied.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'supabase/migrations';
/*
  Candidates. Which of these is actually GUARDED is decided below by
  looking for a REVOKE, not asserted here: 0017 revoked mentor_profiles
  and never touched mentee_profiles, so the second still has table-level
  UPDATE and its columns need no individual grant. Hard-coding both
  produced three false failures.
*/
const CANDIDATES = ['mentor_profiles', 'mentee_profiles', 'profiles', 'sessions'];

let fail = 0;
const sql = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
const all = sql.map((f) => readFileSync(join(DIR, f), 'utf8')).join('\n');

/* Comments routinely contain both ALTER TABLE examples and rollback
   instructions, which is the false positive this strips. */
const code = all.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*--.*$/gm, '');

for (const table of CANDIDATES) {
  // Every column this table has gained across all migrations.
  const added = new Set<string>();
  const alterRe = new RegExp(`ALTER TABLE (?:ONLY )?(?:public\\.)?${table}\\b([\\s\\S]*?);`, 'g');
  for (const m of code.matchAll(alterRe)) {
    for (const c of m[1].matchAll(/ADD COLUMN (?:IF NOT EXISTS )?([a-z_]+)/g)) added.add(c[1]);
  }

  // Every column named in a GRANT UPDATE (...) on that table.
  const granted = new Set<string>();
  /*
    [^;]* rather than [\s\S]*? between the column list and the table.
    The lazy form crossed statement boundaries: a GRANT on `profiles`
    matched forward to the next "ON public.mentor_profiles" in a LATER
    statement, attributing one table's columns to another and consuming
    the real grant on the way. It reported twelve false failures.
  */
  const grantRe = new RegExp(`GRANT UPDATE\\s*\\(([^)]*)\\)[^;]*?ON (?:public\\.)?${table}\\b`, 'g');
  for (const m of code.matchAll(grantRe)) {
    for (const c of m[1].split(',')) granted.add(c.trim());
  }
  /*
    The allowlist is only in force if table-level UPDATE was revoked. A
    later unqualified GRANT would put it back, so the last of the two
    wins — which is what comparing positions does.
  */
  const lastRevoke = Math.max(...[...code.matchAll(
    new RegExp(`REVOKE[^;]*UPDATE[^;]*ON (?:public\\.)?${table}\\b`, 'g'))].map((m) => m.index!), -1);
  const lastWideGrant = Math.max(...[...code.matchAll(
    new RegExp(`GRANT[^(;]*UPDATE[^(;]*ON (?:public\\.)?${table}\\b`, 'g'))].map((m) => m.index!), -1);
  const guarded = lastRevoke > lastWideGrant;

  /*
    DELIBERATELY NOT GRANTED, and the reason this check cannot simply
    demand that every column be writable. These are claims ABOUT a user
    that the user must not be able to make about themselves, which is the
    entire point of 0015 and 0017. Anything added here needs a reason.
  */
  const WITHHELD: Record<string, string[]> = {
    mentor_profiles: [
      'is_verified',        // Mentable verifies a mentor, not the mentor.
      'is_founding_mentor', // Roster membership is an operator decision.
    ],
    mentee_profiles: [],
    profiles: ['is_admin', 'is_demo'],
    sessions: [
      /*
        Written with the service role after an explicit participant check
        in app/(protected)/cohort/actions.ts, which is stronger than a
        column grant: the caller never holds the privilege at all.
      */
      'intervention',
      /*
        Set on INSERT, which is a separate privilege 0017 never revoked.
        Immutable afterwards by design -- re-pointing organizer_id is the
        first step of a forged-session chain.
      */
      'organizer_id', 'meeting_provider', 'location',
    ],
  };

  const missing = [...added]
    .filter((c) => !granted.has(c) && !(WITHHELD[table] ?? []).includes(c))
    .sort();
  if (!guarded) {
    console.log(`${table}: table-level UPDATE in force, no column allowlist to keep in step`);
    continue;
  }
  if (missing.length) {
    fail++;
    console.error(`FAIL ${table}: ${missing.length} column(s) added with no GRANT UPDATE`);
    for (const c of missing) console.error(`       ${c}`);
    console.error(`     A write to these is denied by PostgreSQL and reports nothing useful.`);
  } else {
    console.log(`${table}: ok (${added.size} added, all granted)`);
  }
}

process.exit(fail === 0 ? 0 : 1);
