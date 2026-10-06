/**
 * Every column the scheduling flow writes must actually be writable.
 *
 * WHY THIS EXISTS. sessions has no table-level UPDATE grant; migration 0017
 * replaced it with a per-column allowlist. Migration 0033 then added ten
 * scheduling columns without extending it, and Postgres rejects an UPDATE
 * if ANY targeted column lacks the grant. The result was invisible to
 * typechecking, to RLS review, and to every test that did not call a real
 * provider: bookings inserted fine and then failed to write back the
 * external event id, so a successfully created Google event left no trace
 * in Mentable.
 *
 * This reads the columns out of the source and checks each one against
 * information_schema. It fails loudly the next time somebody adds a column
 * and forgets the grant.
 *
 * Run: npm run check:grants
 */
import { readFileSync } from 'fs';

const env: Record<string, string> = {};
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}


/** Column names appearing inside .update({ ... }) on `sessions`. */
function writtenColumns(file: string): Set<string> {
  /*
    Comments stripped first. These files explain at length WHY certain
    writes happen, and prose like "leave the session: unchanged" was being
    read as a column name. Same false positive the other suites hit; the
    fix is always to test code rather than commentary.
  */
  const src = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    // String and template literals too: an error message reading
    // "could not delete the session: ..." parsed as a column called
    // `session`. Only real code should be inspected.
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""');
  const found = new Set<string>();
  // Match .update({ ... }) blocks and pull their top-level keys.
  for (const m of src.matchAll(/\.update\(\s*\{([\s\S]*?)\}\s*\)/g)) {
    for (const k of m[1].matchAll(/(?:^|[\s,{])([a-z_][a-z0-9_]*)\s*:/g)) {
      found.add(k[1]);
    }
  }
  return found;
}

const files = [
  'app/(protected)/mentorship/[id]/schedule-actions.ts',
  'app/(protected)/mentorship/[id]/actions.ts',
];

const written = new Set<string>();
for (const f of files) for (const c of writtenColumns(f)) written.add(c);

/*
  information_schema is not exposed through PostgREST, so the live grant
  check goes through the Management API. Without a token the script reports
  what it would have checked and exits clean, so it never blocks a build in
  an environment that cannot reach the catalog.
*/
async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = (env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\./) ?? [])[1];

  if (!token || !projectRef) {
    console.log('check:grants — SUPABASE_ACCESS_TOKEN not set, skipping the live grant check.');
    console.log('  columns this flow writes to sessions:', [...written].sort().join(', '));
    return;
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `select column_name from information_schema.column_privileges
              where table_schema='public' and table_name='sessions'
                and grantee='authenticated' and privilege_type='UPDATE'`,
    }),
  });

  if (!res.ok) {
    console.error('check:grants — could not read grants:', res.status);
    process.exitCode = 1; return;
  }

  const granted = new Set(((await res.json()) as { column_name: string }[]).map((r) => r.column_name));

  // Columns that exist on other tables, or are not sessions columns at all.
  const NOT_SESSIONS = new Set([
    'title', 'description', 'status', 'smart', 'target_date', 'is_completed',
    'completed_at', 'prep', 'mentorship_id', 'created_by', 'assigned_to',
    'due_date', 'revoked_at', 'updated_at', 'access_token', 'refresh_token',
    'expires_at', 'is_preferred', 'account_email',
  ]);

  const missing = [...written].filter((c) => !NOT_SESSIONS.has(c) && !granted.has(c)).sort();

  console.log('columns written to sessions:', [...written].filter((c) => !NOT_SESSIONS.has(c)).sort().join(', '));
  if (missing.length) {
    console.error('\ncheck:grants FAILED — no UPDATE grant for authenticated on:');
    for (const c of missing) console.error('  ' + c);
    console.error('\nAdd a GRANT UPDATE (<cols>) ON public.sessions TO authenticated migration.');
    process.exitCode = 1; return;
  }
  console.log('check:grants: ok (every written column is grantable)');
}

void main();
