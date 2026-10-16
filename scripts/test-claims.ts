/**
 * THE CLAIM AUDIT, AS A TEST.
 *
 * Every sentence on a public page is a promise, and the cheapest promises
 * to make are the ones a reader cannot check: that a system learns, that
 * something is ready, that a number means what it looks like. This suite
 * exists because those sentences come back. Twice now a claim has been
 * removed by hand and reappeared in the next pass, written slightly
 * differently by someone (me) who had forgotten why it went.
 *
 * A claim gets to live here only when the code behind it is pointed at.
 * When P3 ships and relationship_outcomes has rows the engine reads, the
 * learning assertions below are the thing to come back and change --
 * deliberately, with the evidence in hand.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let pass = 0, fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; return; }
  fail++;
  console.error(`  FAIL ${name}\n    want ${JSON.stringify(want)}\n    got  ${JSON.stringify(got)}`);
};

const read = (p: string) => readFileSync(p, 'utf8');

/*
  Strip comments before asserting anything about rendered copy. This file
  in particular explains at length which claims are forbidden, and a bare
  word match flags the explanation. Fourth time this false positive has
  appeared across the suites.
*/
const codeOnly = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '');

/** Every .tsx under the public surface. */
function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (e !== 'node_modules') walk(p, out); }
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}
const PUBLIC_SURFACE = [
  ...walk('components/marketing'),
  'app/page.tsx',
  ...['app/about', 'app/mentee', 'app/mentor', 'app/organizations']
      .flatMap((d) => { try { return walk(d); } catch { return []; } }),
];
const publicCopy = PUBLIC_SURFACE.map((p) => [p, codeOnly(read(p))] as const);

const nowhereInPublicCopy = (label: string, re: RegExp) => {
  const hits = publicCopy.filter(([, src]) => re.test(src)).map(([p]) => p);
  eq(label, hits, []);
};

// ── 1. There is no introduction object, so nothing may name one ───────────
/*
  The canonical model is recommendation -> mentorship_request -> approved
  request -> mentorship. "Introduction ready" named a fifth thing sitting
  in a queue waiting to be sent. Nothing was ever sent, and a reader who
  went looking for it would have found nothing.
*/
console.log('no phantom introduction object');
nowhereInPublicCopy('nothing says an introduction is "ready"', /introductions?\s+(is\s+)?ready/i);
nowhereInPublicCopy('nothing says an introduction was sent', /introduction\s+(sent|delivered|queued)/i);
eq('the demo makes a judgement instead',
  read('components/marketing/MatchDemo.tsx').includes('Worth an introduction'), true);

// ── 2. Nothing learns yet, so nothing may claim to ────────────────────────
/*
  The weights in lib/matching/engine.ts are hand-set constants and
  relationship_outcomes has no rows. Until a finished conversation
  measurably changes a future recommendation, every one of these is false.
*/
console.log('no unearned learning claims');
nowhereInPublicCopy('nothing claims the system learns', /\b(system|engine|mentable|it)\s+learns\b/i);
nowhereInPublicCopy('nothing claims outcomes feed matching', /outcomes?\s+(inform|improve|train|feed|tune)/i);
nowhereInPublicCopy('nothing claims it gets smarter', /gets?\s+smarter|smarter\s+over\s+time|improves?\s+with\s+(use|every)/i);

eq('the engine says out loud that its weights are hand-set',
  /hand-set/.test(read('lib/matching/engine.ts')), true);
eq('and names the seam where learning would go',
  /relationship_outcomes[\s\S]{0,200}seam to replace/.test(read('lib/matching/engine.ts')), true);

// ── 3. No fabricated precision ────────────────────────────────────────────
/*
  A "94% match" is a number with no referent: nobody can check it, argue
  with it, or learn anything from being wrong about it.
*/
console.log('no fabricated precision');
nowhereInPublicCopy('no compatibility percentage', /\d{1,3}\s*%\s*(match|compatib|fit|confidence)/i);
nowhereInPublicCopy('no match score', /match\s+score|compatibility\s+score/i);

// ── 4. Illustrative things stay labelled ──────────────────────────────────
/*
  The homepage demo runs the REAL engine over invented people. That is
  honest only while it says so. "Do not visually hide that label."
*/
console.log('illustrative content stays labelled');
{
  const demo = read('components/marketing/MatchDemo.tsx');
  eq('the hero demo is labelled illustrative', /Illustrative/.test(demo), true);
  eq('the label is not hidden from sight',
    /Illustrative[\s\S]{0,120}(sr-only|hidden|opacity-0)/.test(demo), false);
  const org = read('components/marketing/OrgPreview.tsx');
  eq('the organization preview is labelled', /Preview|Illustrative/.test(org), true);
}

// ── 5. The six-step lifecycle describes what exists ───────────────────────
console.log('lifecycle steps are all built');
{
  /*
    codeOnly, because the comment directly above STEPS explains why the
    claim was removed and quotes it to do so. Flagging that explanation is
    the same false positive this helper exists for -- and catching it here
    is a small argument for keeping the explanation: the next person to
    read the file learns what was wrong rather than just what it says now.
  */
  const steps = codeOnly(read('components/marketing/HowItWorks.tsx'));
  eq('step six no longer claims a feedback loop',
    /outcome informs the next match/.test(steps), false);
  eq('and says something that is true instead',
    /history stays in one place/.test(steps), true);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
