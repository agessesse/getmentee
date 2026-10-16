/**
 * The feedback loop, which is the first thing Mentable has that could
 * teach it anything.
 *
 * What is being tested is mostly restraint: that it asks twice and not
 * five times, that it asks once and not after every call, that a "no"
 * gets a real answer rather than a thank-you, and that neither side can
 * reach the other's response. The last one is checked against the source
 * because it is the property most easily lost in a later refactor and the
 * one with the worst consequences.
 */
import { readFileSync } from 'node:fs';
import {
  questionsFor, acknowledgement, shouldAsk,
  type Usefulness, type ContinueIntent,
} from '../lib/mentorship/outcomes';

let pass = 0, fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; return; }
  fail++;
  console.error(`  FAIL ${name}\n    want ${JSON.stringify(want)}\n    got  ${JSON.stringify(got)}`);
};
const read = (p: string) => readFileSync(p, 'utf8');
const codeOnly = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '');

// ── Two questions per side, and no more ───────────────────────────────────
console.log('two questions, three options');
for (const role of ['mentee', 'mentor'] as const) {
  const q = questionsFor(role);
  eq(`${role}: exactly two questions`, Object.keys(q).length, 2);
  eq(`${role}: usefulness has three options`, q.usefulness.choices.length, 3);
  eq(`${role}: continuing has three options`, q.continueIntent.choices.length, 3);
  eq(`${role}: no numeric scale`,
    [...q.usefulness.choices, ...q.continueIntent.choices].some((c) => /\d/.test(c.label)), false);
  eq(`${role}: values are the stored enum`,
    q.usefulness.choices.map((c) => c.value), ['high', 'some', 'low'] as Usefulness[]);
  eq(`${role}: continue values are the stored enum`,
    q.continueIntent.choices.map((c) => c.value), ['yes', 'maybe', 'no'] as ContinueIntent[]);
}

/*
  The wording differs by role on purpose. Asking a volunteer "was this
  useful?" invites them to rate the student, which is neither wanted nor
  something anyone should be asked to put in writing.
*/
console.log('the mentor is asked a different question');
eq('the seeker is asked about usefulness',
  questionsFor('mentee').usefulness.prompt, 'Was this conversation useful?');
eq('the mentor is asked about their time',
  questionsFor('mentor').usefulness.prompt, 'Was this a good use of your time?');
eq('the two prompts are not the same',
  questionsFor('mentee').usefulness.prompt === questionsFor('mentor').usefulness.prompt, false);

// ── A "no" is answered with what happens, not with thanks ─────────────────
console.log('a negative answer gets a real reply');
{
  const no = acknowledgement({ usefulness: 'low', continueIntent: 'no' }, 'mentee');
  eq('declining says what will change', /not suggest this pairing again/.test(no), true);
  eq('and does not merely thank them', /^Thank you/.test(no), false);
  const low = acknowledgement({ usefulness: 'low', continueIntent: 'maybe' }, 'mentee');
  eq('"not really" is welcomed, not smoothed over',
    /more useful to us than a good review/.test(low), true);
  const good = acknowledgement({ usefulness: 'high', continueIntent: 'yes' }, 'mentor');
  eq('a positive answer gets a plain thank-you', /^Thank you/.test(good), true);
  eq('the mentor wording differs when declining',
    acknowledgement({ usefulness: 'low', continueIntent: 'no' }, 'mentor') === no, false);
}

// ── Asked once, about the first conversation that happened ────────────────
console.log('asked once, and only after something happened');
eq('nothing completed, nothing asked',
  shouldAsk({ firstCompletedSessionId: null, alreadyAnswered: false }), false);
eq('completed and unanswered, asked',
  shouldAsk({ firstCompletedSessionId: 's1', alreadyAnswered: false }), true);
eq('already answered, never asked again',
  shouldAsk({ firstCompletedSessionId: 's1', alreadyAnswered: true }), false);

// ── Neither side can reach the other's answer ─────────────────────────────
/*
  The property with the worst failure mode and the one most easily lost in
  a refactor, so it is asserted against the source rather than trusted.
*/
console.log('answers are never visible to the counterpart');
{
  const mig = read('supabase/migrations/0039_atomic_accept_operator_matches_outcomes.sql');
  const block = mig.slice(mig.indexOf('CREATE TABLE IF NOT EXISTS public.relationship_outcomes'));
  eq('the table has RLS on', /ALTER TABLE public\.relationship_outcomes ENABLE ROW LEVEL SECURITY/.test(mig), true);
  eq('and no policy of any kind',
    /CREATE POLICY[^;]*ON public\.relationship_outcomes/.test(mig), false);
  eq('privileges are revoked from both client roles',
    /REVOKE ALL ON public\.relationship_outcomes FROM anon, authenticated/.test(mig), true);
  eq('one answer per person per conversation',
    /UNIQUE \(mentorship_id, respondent_id, session_id\)/.test(block), true);

  const loader = codeOnly(read('lib/mentorship/outcome-data.ts'));
  eq('the loader only ever asks about the viewer',
    /\.eq\('respondent_id', viewerId\)/.test(loader), true);
  eq('and returns whether a row exists, never its content',
    /head: true/.test(loader), true);

  const card = codeOnly(read('components/workspace/ConversationOutcome.tsx'));
  eq('the card promises privacy in the words the person reads',
    /never\s*\n?\s*sees your answers/.test(card.replace(/\s+/g, ' ')) || /never sees your answers/.test(card.replace(/\s+/g, ' ')), true);
}

// ── The write cannot be pointed at somebody else ──────────────────────────
console.log('the write cannot be forged');
{
  const act = codeOnly(read('app/(protected)/mentorship/[id]/outcome-actions.ts'));
  eq('the respondent comes from the session, not an argument',
    /respondent_id: user\.id/.test(act), true);
  /*
    Written as "collect every assignment, assert they are all user.id"
    rather than as one negative-lookahead regex. The first attempt was
    /respondent_id:\s*(?!user\.id)/, where \s* can match zero characters
    so the lookahead landed on the space before "user.id" and reported a
    forgeable write that was not there. A lookahead that steps over
    whitespace is almost always the wrong tool.
  */
  eq('every respondent assignment comes from the session',
    [...act.matchAll(/respondent_id:\s*([\w.]+)/g)].map((m) => m[1]), ['user.id']);
  eq('no caller-supplied respondent parameter exists',
    /respondentId/.test(act), false);
  eq('the role is derived from the mentorship row',
    /m\.mentor_id === user\.id \? 'mentor'/.test(act), true);
  eq('the mentorship is read through the caller\'s own client',
    act.indexOf("supabase\n    .from('mentorships')") < act.indexOf('const db = svc()'), true);
  eq('the session must belong to this relationship',
    /\.eq\('mentorship_id', mentorshipId\)/.test(act), true);
  eq('and must actually be finished',
    /s\.status !== 'completed'/.test(act), true);
  eq('both answers are validated against a fixed set',
    /USEFULNESS\.includes[\s\S]*CONTINUE\.includes/.test(act), true);
  eq('a double submit is not reported as an error',
    /error\.code !== '23505'/.test(act), true);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
