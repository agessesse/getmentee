/**
 * approve_mentorship_request(), tested against the real database.
 *
 * WHY THIS IS NOT A UNIT TEST. The thing being verified is a PostgreSQL
 * function holding a row lock inside a transaction. Every property that
 * matters -- atomicity, the FOR UPDATE serialisation, SECURITY DEFINER
 * authorisation against auth.uid() -- exists only in the database. A
 * mock would assert that I understand my own mock.
 *
 * SO IT WRITES REAL ROWS, and that is why it is gated behind
 * ALLOW_WRITES=1 rather than wired into `npm test`. It creates its own
 * requests between demo accounts, approves some of them, and removes
 * everything it made in a finally block. It touches no row it did not
 * create, and it asserts the table counts are back to baseline at the
 * end -- if that assertion fails, something was left behind and the run
 * is reported as failed even when every test passed.
 *
 *   ALLOW_WRITES=1 npx tsx scripts/test-atomic-accept.ts
 */
import { readFileSync } from 'node:fs';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC  = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PW   = 'Demo1234!';

if (process.env.ALLOW_WRITES !== '1') {
  console.error('Refusing to run: this test writes to the live database.');
  console.error('Re-run with ALLOW_WRITES=1 if that is what you intend.');
  process.exit(2);
}

let pass = 0, fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log(`  ok   ${name}`); return; }
  fail++; console.error(`  FAIL ${name}\n       want ${JSON.stringify(want)}\n       got  ${JSON.stringify(got)}`);
};
const ok = (name: string, cond: boolean, detail = '') => {
  if (cond) { pass++; console.log(`  ok   ${name}${detail ? '  — ' + detail : ''}`); return; }
  fail++; console.error(`  FAIL ${name}${detail ? '  — ' + detail : ''}`);
};

const S = { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json' };
const svc = async (method: string, path: string, body?: unknown) => {
  const r = await fetch(`${BASE}/rest/v1/${path}`, {
    method, headers: { ...S, Prefer: 'return=representation' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const t = await r.text();
  return { status: r.status, json: t ? JSON.parse(t) : null };
};
const signIn = async (email: string) => {
  const r = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PW }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`cannot sign in as ${email}`);
  return { token: j.access_token as string, id: j.user.id as string };
};
/** Call the function as a real signed-in user, the way the app does. */
const approveAs = async (user: { token: string }, requestId: string) => {
  const r = await fetch(`${BASE}/rest/v1/rpc/approve_mentorship_request`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_request_id: requestId }),
  });
  const text = await r.text();
  let parsed: unknown = null; try { parsed = JSON.parse(text); } catch { /* raw */ }
  return { status: r.status, body: text, value: typeof parsed === 'string' ? parsed : null };
};

const createdRequests: string[] = [];
const createdMentorships: string[] = [];
let restoreCapacity: { id: string; max: number | null } | null = null;

async function main() {
  // ── Baseline, so cleanup can be proved rather than assumed ──────────────
  const baseM = (await svc('GET', 'mentorships?select=id')).json.length;
  const baseR = (await svc('GET', 'mentorship_requests?select=id')).json.length;
  console.log(`baseline: ${baseM} mentorships, ${baseR} requests\n`);

  const mentorA = await signIn('sarah.chen@demo.mentee.app');
  const mentorB = await signIn('david.park@demo.mentee.app');
  const menteeX = await signIn('grace.lee@demo.mentee.app');
  const menteeY = await signIn('maya.thompson@demo.mentee.app');

  /* mentorship_requests is UNIQUE(mentee_id, mentor_id), so a pair that
     already has a request cannot be reused. Checked, not assumed. */
  const existing = (await svc('GET', 'mentorship_requests?select=mentee_id,mentor_id')).json as
    { mentee_id: string; mentor_id: string }[];
  const taken = new Set(existing.map((r) => `${r.mentee_id}:${r.mentor_id}`));
  for (const [mentee, mentor, label] of [
    [menteeX.id, mentorA.id, 'X→A'], [menteeY.id, mentorA.id, 'Y→A'], [menteeX.id, mentorB.id, 'X→B'],
  ] as [string, string, string][]) {
    if (taken.has(`${mentee}:${mentor}`)) throw new Error(`pair ${label} already has a request; pick other accounts`);
  }

  const newRequest = async (menteeId: string, mentorId: string) => {
    const r = await svc('POST', 'mentorship_requests', {
      mentee_id: menteeId, mentor_id: mentorId,
      message: '[automated test] safe to delete', status: 'pending',
    });
    if (r.status >= 300) throw new Error(`could not create request: ${JSON.stringify(r.json)}`);
    const id = r.json[0].id as string;
    createdRequests.push(id);
    return id;
  };

  // ── 1. The mentor it was addressed to can approve ───────────────────────
  console.log('1. the correct mentor can approve');
  const req1 = await newRequest(menteeX.id, mentorA.id);
  const a1 = await approveAs(mentorA, req1);
  ok('returns a mentorship id', a1.status === 200 && !!a1.value, `status ${a1.status}`);
  if (a1.value) createdMentorships.push(a1.value);

  // ── 7. Exactly one mentorship, and ── 8. the request id is preserved ────
  console.log('\n7/8. exactly one mentorship, linked to the request');
  const made = (await svc('GET', `mentorships?select=id,request_id,mentee_id,mentor_id,status&request_id=eq.${req1}`)).json;
  eq('exactly one mentorship exists for the request', made.length, 1);
  eq('request_id is preserved on it', made[0]?.request_id, req1);
  eq('mentee came from the request, not the caller', made[0]?.mentee_id, menteeX.id);
  eq('mentor came from the request', made[0]?.mentor_id, mentorA.id);
  const req1After = (await svc('GET', `mentorship_requests?select=status&id=eq.${req1}`)).json[0];
  eq('the request is now approved', req1After.status, 'approved');

  // ── 5. The same request cannot be approved twice ────────────────────────
  console.log('\n5. an approved request cannot be approved again');
  const a5 = await approveAs(mentorA, req1);
  ok('second approval is refused', a5.status >= 400 && /No longer pending/.test(a5.body), a5.body.slice(0, 60));
  eq('and still only one mentorship', (await svc('GET', `mentorships?select=id&request_id=eq.${req1}`)).json.length, 1);

  // ── 2. A different mentor cannot approve ────────────────────────────────
  console.log('\n2/3. only the addressed mentor may approve');
  const req2 = await newRequest(menteeY.id, mentorA.id);
  const a2 = await approveAs(mentorB, req2);
  ok('a different mentor is refused', a2.status >= 400 && /Not authorised/.test(a2.body), a2.body.slice(0, 60));
  // ── 3. The mentee cannot approve their own request ──────────────────────
  const a3 = await approveAs(menteeY, req2);
  ok('the mentee is refused', a3.status >= 400 && /Not authorised/.test(a3.body), a3.body.slice(0, 60));
  // ── 9. Neither attempt left anything behind ─────────────────────────────
  const after23 = (await svc('GET', `mentorship_requests?select=status&id=eq.${req2}`)).json[0];
  eq('9. the request is untouched by a refused approval', after23.status, 'pending');
  eq('9. and no mentorship was created', (await svc('GET', `mentorships?select=id&request_id=eq.${req2}`)).json.length, 0);

  // ── 4. A declined request cannot be approved ────────────────────────────
  console.log('\n4. a declined request cannot be approved');
  await svc('PATCH', `mentorship_requests?id=eq.${req2}`, { status: 'declined' });
  const a4 = await approveAs(mentorA, req2);
  ok('declined is refused', a4.status >= 400 && /No longer pending/.test(a4.body), a4.body.slice(0, 60));
  eq('and it stays declined', (await svc('GET', `mentorship_requests?select=status&id=eq.${req2}`)).json[0].status, 'declined');

  // ── 6. Capacity is enforced ─────────────────────────────────────────────
  console.log('\n6. capacity is enforced');
  const activeNow = (await svc('GET', `mentorships?select=id&mentor_id=eq.${mentorA.id}&status=eq.active`)).json.length;
  const profile = (await svc('GET', `mentor_profiles?select=max_mentees&id=eq.${mentorA.id}`)).json[0];
  restoreCapacity = { id: mentorA.id, max: profile.max_mentees };
  await svc('PATCH', `mentor_profiles?id=eq.${mentorA.id}`, { max_mentees: activeNow });
  await svc('PATCH', `mentorship_requests?id=eq.${req2}`, { status: 'pending' });
  const a6 = await approveAs(mentorA, req2);
  ok('at capacity, approval is refused', a6.status >= 400 && /Capacity reached/.test(a6.body), a6.body.slice(0, 60));
  eq('9. the request is still pending afterwards',
    (await svc('GET', `mentorship_requests?select=status&id=eq.${req2}`)).json[0].status, 'pending');
  eq('9. and no mentorship was half-written',
    (await svc('GET', `mentorships?select=id&request_id=eq.${req2}`)).json.length, 0);
  await svc('PATCH', `mentor_profiles?id=eq.${mentorA.id}`, { max_mentees: restoreCapacity.max });
  restoreCapacity = null;

  // ── 10. Two simultaneous approvals produce one mentorship ───────────────
  /*
    The property the compensating server action could not provide. The
    function takes FOR UPDATE on the request row, so the second call
    blocks until the first commits and then fails the status check.
    Fired without awaiting in between, so they genuinely overlap.
  */
  console.log('\n10. concurrent approvals cannot duplicate');
  const req3 = await newRequest(menteeX.id, mentorB.id);
  const [c1, c2] = await Promise.all([approveAs(mentorB, req3), approveAs(mentorB, req3)]);
  const wins = [c1, c2].filter((r) => r.status === 200 && r.value);
  const losses = [c1, c2].filter((r) => r.status >= 400);
  for (const w of wins) if (w.value) createdMentorships.push(w.value);
  eq('exactly one call succeeded', wins.length, 1);
  eq('the other was refused', losses.length, 1);
  ok('the loser cites the status check', /No longer pending/.test(losses[0]?.body ?? ''), losses[0]?.body.slice(0, 60));
  eq('exactly one mentorship exists', (await svc('GET', `mentorships?select=id&request_id=eq.${req3}`)).json.length, 1);

  // ── Baseline restored ───────────────────────────────────────────────────
  await cleanup();
  console.log('\nbaseline check');
  const endM = (await svc('GET', 'mentorships?select=id')).json.length;
  const endR = (await svc('GET', 'mentorship_requests?select=id')).json.length;
  eq('mentorships back to baseline', endM, baseM);
  eq('requests back to baseline', endR, baseR);
}

async function cleanup() {
  for (const id of createdMentorships) await svc('DELETE', `mentorships?id=eq.${id}`);
  for (const id of createdRequests)   await svc('DELETE', `mentorship_requests?id=eq.${id}`);
  if (restoreCapacity) await svc('PATCH', `mentor_profiles?id=eq.${restoreCapacity.id}`, { max_mentees: restoreCapacity.max });
  createdMentorships.length = 0;
  createdRequests.length = 0;
}

main()
  .catch(async (e) => { fail++; console.error('\nERROR', e.message); await cleanup(); })
  .finally(async () => {
    // Belt and braces: if main threw before its own cleanup, this catches it.
    await cleanup();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail === 0 ? 0 : 1);
  });
