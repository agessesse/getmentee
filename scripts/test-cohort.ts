/**
 * The four metrics and the health model.
 *
 * These decide what Abel and Pablo believe about Cohort 001, so the
 * arithmetic is tested rather than eyeballed. Particular attention to the
 * empty cohort, because that is the state production is actually in today
 * and the one most likely to render a confident wrong number.
 */
import { assessHealth, healthRank, type HealthInput } from '../lib/cohort/health';
import { activation, engagement, execution, progression, pct, signed, type Pair, type MeasurePair } from '../lib/cohort/metrics';

let pass = 0, fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; return; }
  fail++;
  console.error(`  FAIL ${name}\n    want ${JSON.stringify(want)}\n    got  ${JSON.stringify(got)}`);
};

const DAY = 86_400_000;
const NOW = Date.parse('2027-03-01T12:00:00Z');
const ago = (d: number) => new Date(NOW - d * DAY).toISOString();
const ahead = (d: number) => new Date(NOW + d * DAY).toISOString();

const pair = (o: Partial<Pair> = {}): Pair => ({
  mentorshipId: 'm1', matchedAt: ago(60), completedSessions: [], nextSessionAt: null,
  commitmentsCreated: 0, commitmentsCompleted: 0, goalsCreated: 0, goalsReached: 0,
  completed: false, ...o,
});

// ── The empty cohort: nothing may read as a confident zero ──────────────────
console.log('empty cohort is unknown, not zero');
{
  const a = activation([], 14, NOW);
  eq('activation has no value', a.withinWindow.value, null);
  eq('activation renders as null, not 0%', pct(a.withinWindow), null);
  eq('nothing is stalled', a.stalled, []);
  const e = engagement([], 21, 6, NOW);
  eq('cadence has no value', e.onCadence.value, null);
  eq('conversations held is a real zero', e.conversationsHeld, 0);
  const x = execution([]);
  eq('follow-through has no value', x.followThrough.value, null);
  const p = progression([]);
  eq('progression has no value', p.clarityShift.value, null);
  eq('measured has no value', p.measured.value, null);
}

// ── Activation ──────────────────────────────────────────────────────────────
console.log('activation');
{
  const pairs = [
    pair({ mentorshipId: 'in', matchedAt: ago(30), completedSessions: [{ at: ago(20) }] }),   // 10 days
    pair({ mentorshipId: 'late', matchedAt: ago(60), completedSessions: [{ at: ago(30) }] }), // 30 days
    pair({ mentorshipId: 'never', matchedAt: ago(40) }),
    pair({ mentorshipId: 'fresh', matchedAt: ago(3) }),                                        // window open
  ];
  const a = activation(pairs, 14, NOW);
  eq('2 of 4 ever met', a.everMet.of, [2, 4]);
  eq('1 of 4 met inside the window', a.withinWindow.of, [1, 4]);
  eq('only the closed window counts as stalled', a.stalled, ['never']);
  eq('percentage rendering', pct(a.withinWindow), '25%');
}

// ── Engagement ──────────────────────────────────────────────────────────────
console.log('engagement');
{
  const pairs = [
    pair({ completedSessions: [{ at: ago(5) }, { at: ago(26) }], nextSessionAt: ahead(7) }),
    pair({ mentorshipId: 'm2', completedSessions: [{ at: ago(40) }] }),
    pair({ mentorshipId: 'm3', completedSessions: [{ at: ago(2) }], completed: true }),
  ];
  const e = engagement(pairs, 21, 6, NOW);
  eq('4 conversations held', e.conversationsHeld, 4);
  eq('expected is pairs x plan', e.conversationsExpected, 18);
  // Completed pairs are excluded from "active", so cadence is 1 of 2.
  eq('1 of 2 active pairs on cadence', e.onCadence.of, [1, 2]);
  eq('1 of 2 active pairs booked ahead', e.scheduledAhead.of, [1, 2]);
  // Order must not change the answer: a loader is free to sort either way.
  const reversed = engagement(
    pairs.map((p) => ({ ...p, completedSessions: [...p.completedSessions].reverse() })), 21, 6, NOW);
  eq('session order does not change cadence', reversed.onCadence.of, e.onCadence.of);
  const aFwd = activation(pairs, 14, NOW);
  const aRev = activation(pairs.map((p) => ({ ...p, completedSessions: [...p.completedSessions].reverse() })), 14, NOW);
  eq('session order does not change activation', aRev.withinWindow.of, aFwd.withinWindow.of);
  eq('1 of 3 finished', e.completedCohort.of, [1, 3]);
}

// ── Execution ───────────────────────────────────────────────────────────────
console.log('execution');
{
  const pairs = [
    pair({ commitmentsCreated: 4, commitmentsCompleted: 3, goalsCreated: 2, goalsReached: 1, completedSessions: [{ at: ago(5) }] }),
    pair({ mentorshipId: 'm2', commitmentsCreated: 0, completedSessions: [{ at: ago(9) }] }),
  ];
  const x = execution(pairs);
  eq('follow-through is completed over created', x.followThrough.of, [3, 4]);
  eq('goals reached', x.goalsReached.of, [1, 2]);
  eq('half the pairs produced action', x.conversationsWithAction.of, [1, 2]);
  // Volume must not be rewarded: a pair with one kept commitment beats a
  // pair with ten ignored ones.
  const few = execution([pair({ commitmentsCreated: 1, commitmentsCompleted: 1, completedSessions: [{ at: ago(1) }] })]);
  const many = execution([pair({ commitmentsCreated: 10, commitmentsCompleted: 1, completedSessions: [{ at: ago(1) }] })]);
  eq('one kept commitment scores higher than ten ignored', (few.followThrough.value ?? 0) > (many.followThrough.value ?? 0), true);
}

// ── Progression ─────────────────────────────────────────────────────────────
console.log('progression');
{
  const m = (o: Partial<MeasurePair['baseline']> = {}) => ({
    careerClarity: null, recruitingKnowledge: null, preparation: null, confidence: null,
    reachableContacts: null, applications: null, interviews: null, offers: null, introductions: null,
    ...o,
  });
  const measures: MeasurePair[] = [
    { profileId: 'a', baseline: m({ careerClarity: 2, reachableContacts: 0 }), endline: m({ careerClarity: 4, reachableContacts: 3 }) },
    { profileId: 'b', baseline: m({ careerClarity: 3, reachableContacts: 1 }), endline: m({ careerClarity: 4, reachableContacts: 2 }) },
    { profileId: 'c', baseline: m({ careerClarity: 3 }), endline: null }, // dropped out of measurement
  ];
  const p = progression(measures);
  eq('2 of 3 have both measures', p.measured.of, [2, 3]);
  eq('mean clarity shift is +1.5', p.clarityShift.value, 1.5);
  eq('shift renders signed', signed(p.clarityShift), '+1.5');
  eq('contacts gained', p.contactsGained.value, 2);
  // A dimension nobody answered must stay unknown rather than become 0.
  eq('unanswered dimension is null', p.confidenceShift.value, null);
  // Movement can be negative and must be shown as such.
  const down = progression([{ profileId: 'd', baseline: m({ confidence: 4 }), endline: m({ confidence: 2 }) }]);
  eq('negative movement is reported', signed(down.confidenceShift), '-2.0');
}

// ── Health ──────────────────────────────────────────────────────────────────
console.log('relationship health');
{
  const h = (o: Partial<HealthInput> = {}) => assessHealth({
    matchedAt: ago(30), completedSessions: [], nextSessionAt: null, overdueCommitments: 0,
    lastActivityAt: ago(1), rematchRequested: false, completed: false,
    cadenceDays: 21, activationWindowDays: 14, expectedSessions: 6, ...o,
  }, NOW);

  eq('matched recently, nothing booked', h({ matchedAt: ago(3) }).status, 'not_started');
  eq('past the activation window with no conversation', h({ matchedAt: ago(30) }).status, 'at_risk');
  eq('on cadence with the next booked', h({ completedSessions: [{ at: ago(5) }], nextSessionAt: ahead(10) }).status, 'on_track');
  eq('due and nothing booked', h({ completedSessions: [{ at: ago(25) }] }).status, 'needs_attention');
  eq('well past cadence', h({ completedSessions: [{ at: ago(40) }] }).status, 'at_risk');
  eq('quiet for over a month', h({ completedSessions: [{ at: ago(10) }], nextSessionAt: ahead(5), lastActivityAt: ago(40) }).status, 'needs_attention');
  eq('two overdue commitments', h({ completedSessions: [{ at: ago(5) }], nextSessionAt: ahead(5), overdueCommitments: 2 }).status, 'needs_attention');
  eq('one overdue commitment is not a problem', h({ completedSessions: [{ at: ago(5) }], nextSessionAt: ahead(5), overdueCommitments: 1 }).status, 'on_track');
  eq('a rematch request outranks everything', h({ completedSessions: [{ at: ago(1) }], nextSessionAt: ahead(3), rematchRequested: true }).status, 'at_risk');
  eq('completed stays completed', h({ completed: true, completedSessions: [{ at: ago(5) }] }).status, 'completed');

  // Every status must explain itself, and anything not on track must say
  // what to do. A status with no reason is a score by another name.
  for (const input of [{}, { matchedAt: ago(3) }, { completedSessions: [{ at: ago(40) }] }, { completed: true }]) {
    const r = h(input as Partial<HealthInput>);
    eq(`"${r.status}" gives at least one reason`, r.reasons.length > 0, true);
  }
  eq('at risk tells you what to do', typeof h({ completedSessions: [{ at: ago(40) }] }).action, 'string');

  // Cadence comes from the cohort, not from this file.
  eq('a 60-day cadence is not overdue at 40 days',
    h({ completedSessions: [{ at: ago(40) }], cadenceDays: 60, nextSessionAt: ahead(5) }).status, 'on_track');

  eq('worst sorts first', healthRank('at_risk') < healthRank('on_track'), true);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
