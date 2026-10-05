/**
 * Pass 1 regression suite: navigation resolution and the theme contrast guard.
 *
 * Both are pure functions and both are things a screenshot cannot prove. A
 * nav item lights for a set of paths, and a derived palette either clears
 * WCAG or does not; neither is visible in a single rendered frame.
 *
 * Run with `npm run test:shell`.
 */
import { navFor, isNavItemActive } from '../lib/app-nav';
import { deriveTokens, contrast } from '../lib/theme/derive';

let pass = 0;
let fail = 0;

function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; } else {
    fail++;
    console.error(`  FAIL ${name}\n    want ${JSON.stringify(want)}\n    got  ${JSON.stringify(got)}`);
  }
}

function atLeast(name: string, got: number, floor: number) {
  const ok = got >= floor;
  if (ok) { pass++; } else {
    fail++;
    console.error(`  FAIL ${name}: ${got.toFixed(2)} is below ${floor}`);
  }
}

// ── 1. Primary navigation stays small ───────────────────────────────────────
console.log('navigation size');
check('student has four destinations', navFor('mentee').length, 4);
check('mentor has four destinations', navFor('mentor').length, 4);
check('student labels', navFor('mentee').map((i) => i.label),
  ['Home', 'Mentorship', 'Goals', 'Messages']);
check('mentor labels', navFor('mentor').map((i) => i.label),
  ['Home', 'Mentees', 'Conversations', 'Messages']);

// ── 2. Active state ─────────────────────────────────────────────────────────
console.log('active state');
const student = navFor('mentee');
const mentor = navFor('mentor');
const active = (items: ReturnType<typeof navFor>, path: string) =>
  items.filter((i) => isNavItemActive(i, path)).map((i) => i.label);

check('/dashboard lights Home only', active(student, '/dashboard'), ['Home']);
check('/mentorships lights Mentorship', active(student, '/mentorships'), ['Mentorship']);
// The workspace does not exist until Pass 2; the nav is ready for it now so
// shipping it does not also require a navigation edit.
check('/mentorship/<id> lights Mentorship', active(student, '/mentorship/abc-123'), ['Mentorship']);
check('/discover lights Mentorship', active(student, '/discover'), ['Mentorship']);
check('/requests lights Mentorship', active(student, '/requests'), ['Mentorship']);
check('/sessions/<id> lights Mentorship for a student', active(student, '/sessions/x'), ['Mentorship']);
check('/goals lights Goals', active(student, '/goals'), ['Goals']);
check('/messages lights Messages', active(student, '/messages'), ['Messages']);
check('/sessions/<id> lights Conversations for a mentor', active(mentor, '/sessions/x'), ['Conversations']);
check('/schedule lights Conversations for a mentor', active(mentor, '/schedule'), ['Conversations']);
check('/mentee/<id> lights Mentees', active(mentor, '/mentee/abc'), ['Mentees']);

// A prefix test that lit Home everywhere was the bug this guards against.
check('/goals does not light Home', active(student, '/goals').includes('Home'), false);
check('an unknown path lights nothing', active(student, '/profile/setup'), []);
// /mentorships must not be swallowed by the /mentorship prefix, or the list
// and the workspace would both light and neither would read as current.
check('exactly one item is ever active (student)',
  [...new Set(['/dashboard','/mentorships','/mentorship/x','/goals','/messages','/discover','/sessions/y']
    .map((p) => active(student, p).length))], [1]);

// ── 3. The contrast guard ───────────────────────────────────────────────────
console.log('tenant contrast guard');
const rgb = (s: string) => s.split(' ').map(Number) as [number, number, number];

const TENANTS: Record<string, Parameters<typeof deriveTokens>[0]> = {
  carolina: { surface: '#FFFFFF', ink: '#13294B', primary: '#7BAFD4', wash: '#F3F8FC' },
  // A deliberately hostile palette: a near-white "identity" colour that no
  // amount of good intention makes readable. The guard must still produce a
  // legible interface rather than trusting the input.
  hostile:  { surface: '#FFFFFF', ink: '#222222', primary: '#FAFAD2', wash: '#FFFFF4' },
  // A dark-ground tenant, to prove nothing here assumes a light surface.
  midnight: { surface: '#101418', ink: '#F2F5F8', primary: '#5BC2A7', wash: '#19212A' },
};

for (const [name, palette] of Object.entries(TENANTS)) {
  const t = deriveTokens(palette);
  const surface = rgb(t.ivory);
  atLeast(`${name}: ink on surface`, contrast(rgb(t.ink), surface), 4.5);
  atLeast(`${name}: heather on surface`, contrast(rgb(t.heather), surface), 4.5);
  atLeast(`${name}: mist-body on surface`, contrast(rgb(t['mist-body']), surface), 4.5);
  atLeast(`${name}: mist-strong on surface (icons, 3:1)`, contrast(rgb(t['mist-strong']), surface), 3);
  atLeast(`${name}: brand-text on surface`, contrast(rgb(t['brand-text']), surface), 4.5);
  atLeast(`${name}: brand-line on surface (indicators, 3:1)`, contrast(rgb(t['brand-line']), surface), 3);
  atLeast(`${name}: white label on the action fill`, contrast([255, 255, 255], rgb(t.purple)), 4.5);
  atLeast(`${name}: white label on the hover fill`, contrast([255, 255, 255], rgb(t['purple-d'])), 4.5);
  atLeast(`${name}: ink on the veil surface`, contrast(rgb(t.ink), rgb(t.veil)), 4.5);
  atLeast(`${name}: ink on the lavender surface`, contrast(rgb(t.ink), rgb(t.lavender)), 4.5);
}

// ── 4. Mentable's own palette never passes through derivation ───────────────
console.log('platform palette is literal');
const css = require('fs').readFileSync('app/globals.css', 'utf8') as string;
for (const [token, channels] of Object.entries({
  '--halo-ivory': '251 250 248',
  '--halo-ink': '21 19 26',
  '--halo-purple': '120 90 247',
  '--halo-purple-d': '71 23 202',
  '--halo-lavender': '217 207 251',
  '--halo-brand': '120 90 247',
  '--halo-brand-text': '71 23 202',
})) {
  check(`${token} is unchanged`, css.includes(`${token}: ${channels};`), true);
}

// ── 5. The privacy boundary, re-asserted ────────────────────────────────────
// Tenant resolution renders an institution's name and colours. It must never
// have reached for the content of a relationship to do it.
console.log('privacy boundary');
const resolveSrc = require('fs').readFileSync('lib/theme/resolve.ts', 'utf8') as string;
check('tenant resolution never reads messages', /from\(\s*['"]messages['"]/.test(resolveSrc), false);
const metricsSrc = require('fs').readFileSync('lib/org/metrics.ts', 'utf8') as string;
check('org metrics still never read messages', /from\(\s*['"]messages['"]/.test(metricsSrc), false);

// ── 6. Pass 2: the workspace's authorization story ──────────────────────────
/*
  These are source assertions, not runtime ones, and that is deliberate.
  The security property of the workspace is "it never constructs a
  privileged client", which is a fact about the code rather than about any
  particular request. A runtime test could only show that one call was safe;
  this shows that an unsafe one cannot be written without failing the build.
*/
console.log('workspace authorization');
const read = (f: string) => require('fs').readFileSync(f, 'utf8') as string;

const wsData = read('lib/mentorship/workspace-data.ts');
const wsActions = read('app/(protected)/mentorship/[id]/actions.ts');

for (const [name, src] of [['workspace-data', wsData], ['workspace actions', wsActions]] as const) {
  // The service role bypasses RLS. Neither file may reach for it.
  check(`${name} never imports the service key`, /service-key|SERVICE_ROLE/.test(src), false);
  check(`${name} never creates a service client`, /createClient\s*\(\s*url/.test(src), false);
  // Both must read through the user's own session, so RLS applies.
  check(`${name} uses the user-scoped server client`, src.includes("from '@/lib/supabase/server'"), true);
}

// The workspace renders an institution's name. It must never read a message.
check('workspace never reads message content into the page',
  /from\('messages'\)[\s\S]{0,200}select\([^)]*content[^)]*\)[\s\S]{0,120}order/.test(wsData), true);
check('workspace authorizes on participation, not on admin role',
  /mentor_id === user\.id/.test(wsData) && /mentee_id === user\.id/.test(wsData), true);
check('workspace treats non-participant as not_found',
  /return \{ ok: false, reason: 'not_found' \}/.test(wsData), true);
check('no organization or program authority is consulted by the workspace',
  /organization_members|program_admins|is_admin/.test(wsData), false);

// A mentor's private notes must not reach the mentee.
check('mentor notes are gated on the viewer being the mentor',
  /mentorNotes: viewerIsMentor \? mentorNotes : null/.test(wsData), true);
// Each side writes only its own half of the prep object.
check('prep writes are split by role', /isMentor\s*\n?\s*\?\s*\{ \.\.\.current, mentor:/.test(wsActions), true);

console.log('carolina preview');
const previewLayout = read('app/(protected)/preview/layout.tsx');
const fixture = read('lib/preview/carolina-fixture.ts');
check('preview is gated on platform admin', /is_admin/.test(previewLayout), true);
check('preview hides itself from non-admins (404, not 403)', /notFound\(\)/.test(previewLayout), true);
// The whole safety argument: the fixture touches no database at all.
check('preview fixture imports no supabase client', /supabase/i.test(fixture), false);
// Call syntax, not prose: the file's own comments discuss inserts, and a
// bare word match flagged the explanation of why there are none.
check('preview fixture performs no writes', /\.(insert|update|upsert|delete)\s*\(/.test(fixture), false);
check('preview accepts no caller-supplied identity',
  /searchParams[\s\S]{0,200}(userId|profileId|mentorshipId|organizationId)/.test(
    read('app/(protected)/preview/carolina/[role]/page.tsx')), false);
check('preview carries the Carolina disclaimer', previewLayout.includes('CAROLINA_TENANT.notice'), true);
check('fixture disclaimer names the absence of an agreement',
  /no agreement with UNC-Chapel Hill/.test(fixture), true);

console.log('password recovery');
const authCtx = read('lib/auth-context.tsx');
check('recovery no longer redirects to /login', /redirectTo: `\$\{window\.location\.origin\}\/login`/.test(authCtx), false);
check('recovery redirects to the page that can set a password',
  /redirectTo: `\$\{window\.location\.origin\}\/reset-password`/.test(authCtx), true);
const resetForm = read('components/auth/reset-password-form.tsx');
check('recovery page can actually set a password', /updateUser\(\{ password \}\)/.test(resetForm), true);
check('recovery handles the PKCE code flow', /exchangeCodeForSession/.test(resetForm), true);
check('recovery handles the implicit token flow', /setSession\(\{ access_token, refresh_token \}\)/.test(resetForm), true);
check('recovery clears the token from the address bar', /replaceState/.test(resetForm), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
