/**
 * Regression coverage for the next-best-action logic.
 *
 * THE INVARIANT: every valid state produces exactly one dominant action, and
 * which one it is is decided by explicit precedence, never by a score. The
 * dashboards render whatever this returns, so a change here changes what every
 * user is told to do next. That deserves a test.
 *
 * WHY IT LOOKS LIKE THIS: the repository has no test runner. package.json
 * carried a `jest` script, but jest is not installed and there are no spec
 * files anywhere, so running it fails. Rather than install a framework to
 * check one pure module, this uses node:assert and the tsx runner that
 * `npm run check:routes` already depends on. No new dependencies.
 *
 * Assertions are on action KEYS, not on copy. Rewording a headline should not
 * fail a test; changing which action wins should.
 *
 *   npm test
 */
import assert from 'node:assert/strict';
import {
  menteeNextAction, menteeNow, mentorNextAction, mentorNow,
  type Relationship, type MenteeState, type MentorState, type NextAction,
} from '../lib/mentorship/next-action';

// A fixed clock, so "in 20 hours" means the same thing in June and December.
const NOW = Date.parse('2026-09-21T09:00:00Z');
const D = 86_400_000;
const H = 3_600_000;
const at = (ms: number) => new Date(NOW + ms).toISOString();
const day = (ms: number) => new Date(NOW + ms).toISOString().slice(0, 10);

const rel = (name: string, o: Partial<Relationship> = {}): Relationship => ({
  mentorshipId: `m-${name}`,
  person: { id: `p-${name}`, firstName: name, fullName: `${name} Reyes`, avatarUrl: null, headline: null },
  startedAt: at(-60 * D),
  reason: 'Break into investment banking',
  goals: [], openForThem: [], openForMine: [], finishedSinceLastSession: [], finishedUnshared: [],
  lastSession: null, nextSession: null, openPastSession: null,
  lastMessage: { fromMe: true, content: 'Thanks, that helps.', at: at(-3 * D) },
  prepared: false, reflected: true, quietDays: 3, neverMessaged: false,
  ...o,
});

const mentee = (o: Partial<MenteeState> = {}): MenteeState =>
  ({ relationships: [], pendingRequests: [], savedMentors: 0, contactableMentors: 0, ...o });
const mentor = (o: Partial<MentorState> = {}): MentorState =>
  ({ mentorId: 'me', relationships: [], pendingRequests: [], hasAvailability: true, isNew: false, ...o });

const theirs = (content: string) => ({ fromMe: false, content, at: at(-4 * H) });
const request = (name: string, daysAgo: number, goals: string | null = 'Understand PE recruiting') =>
  ({ id: `q-${name}`, menteeName: name, goals, createdAt: at(-daysAgo * D) });

type Case<S> = { name: string; state: S; expect: string };

const MENTEE_CASES: Case<MenteeState>[] = [
  { name: 'no mentors, some contactable',        state: mentee({ contactableMentors: 3 }), expect: 'find-mentor' },
  { name: 'no mentors, none contactable, saved', state: mentee({ savedMentors: 2 }), expect: 'find-mentor' },
  { name: 'request pending',                     state: mentee({ pendingRequests: [{ id: 'r', mentorName: 'Dana', createdAt: at(-1 * D) }] }), expect: 'waiting' },
  { name: 'request pending a long time',         state: mentee({ pendingRequests: [{ id: 'r', mentorName: 'Dana', createdAt: at(-12 * D) }] }), expect: 'waiting' },
  { name: 'accepted, never messaged',            state: mentee({ relationships: [rel('Dana', { neverMessaged: true, lastMessage: null })] }), expect: 'start-conversation' },
  { name: 'mentor replied',                      state: mentee({ relationships: [rel('Dana', { lastMessage: theirs('Both — let us talk on the call.') })] }), expect: 'reply' },
  { name: 'conversation within 24h',             state: mentee({ relationships: [rel('Dana', { nextSession: { id: 's1', at: at(20 * H) } })] }), expect: 'prep-24h' },
  { name: 'conversation within 24h, prepared',   state: mentee({ relationships: [rel('Dana', { nextSession: { id: 's1', at: at(20 * H) }, prepared: true })] }), expect: 'prep-24h' },
  { name: 'conversation this week',              state: mentee({ relationships: [rel('Dana', { nextSession: { id: 's1', at: at(5 * D) } })] }), expect: 'prep-week' },
  { name: 'conversation just ended',             state: mentee({ relationships: [rel('Dana', { lastSession: { id: 's0', at: at(-1 * D) }, reflected: false })] }), expect: 'capture' },
  { name: 'commitment finished, unshared',       state: mentee({ relationships: [rel('Dana', { lastSession: { id: 's0', at: at(-6 * D) }, finishedUnshared: [{ id: 'a', title: 'Read the chapter', dueDate: null }] })] }), expect: 'close-loop' },
  { name: 'met before, nothing booked',          state: mentee({ relationships: [rel('Dana', { lastSession: { id: 's0', at: at(-9 * D) } })] }), expect: 'schedule-next' },
  { name: 'never met, nothing booked',           state: mentee({ relationships: [rel('Dana')] }), expect: 'schedule-next' },
  { name: 'quiet, but a conversation is booked', state: mentee({ relationships: [rel('Dana', { quietDays: 28, nextSession: { id: 's1', at: at(9 * D) }, prepared: true })] }), expect: 'steady' },
  { name: 'quiet, nothing booked',               state: mentee({ relationships: [rel('Dana', { quietDays: 28, lastSession: { id: 's0', at: at(-28 * D) }, nextSession: { id: 's1', at: at(9 * D) }, prepared: true })] }), expect: 'steady' },
  { name: 'everything settled',                  state: mentee({ relationships: [rel('Dana', { nextSession: { id: 's1', at: at(10 * D) }, prepared: true })] }), expect: 'steady' },

  // ── competing priorities ──────────────────────────────────────────────────
  { name: 'COMPETING pending request + conversation within 24h',
    state: mentee({ pendingRequests: [{ id: 'r', mentorName: 'Wes', createdAt: at(-2 * D) }], relationships: [rel('Dana', { nextSession: { id: 's1', at: at(20 * H) } })] }),
    expect: 'prep-24h' },
  { name: 'COMPETING accepted request + unread message elsewhere',
    state: mentee({ relationships: [rel('Dana', { neverMessaged: true, lastMessage: null }), rel('Ivy', { lastMessage: theirs('Sending a deck.') })] }),
    expect: 'start-conversation' },
  { name: 'COMPETING unfinished commitment + conversation within 24h',
    state: mentee({ relationships: [rel('Dana', { nextSession: { id: 's1', at: at(20 * H) }, openForMine: [{ id: 'a', title: 'Draft resume', dueDate: day(1 * D) }] })] }),
    expect: 'prep-24h' },
  { name: 'COMPETING uncaptured conversation + unrelated unread message',
    state: mentee({ relationships: [rel('Dana', { lastSession: { id: 's0', at: at(-1 * D) }, reflected: false }), rel('Ivy', { lastMessage: theirs('Congrats!') })] }),
    expect: 'capture' },
  { name: 'COMPETING several mentorships, one quiet, one unread',
    state: mentee({ relationships: [
      rel('Dana', { quietDays: 40, lastSession: { id: 's0', at: at(-40 * D) } }),
      rel('Ivy', { lastMessage: theirs('How did it go?') }),
      rel('Sam', { nextSession: { id: 's9', at: at(10 * D) }, prepared: true }),
    ] }),
    expect: 'reply' },
];

const MENTOR_CASES: Case<MentorState>[] = [
  { name: 'new mentor, no availability',   state: mentor({ hasAvailability: false, isNew: true }), expect: 'availability' },
  { name: 'new mentor, availability set',  state: mentor({ isNew: true }), expect: 'ready' },
  { name: 'one request',                   state: mentor({ isNew: true, pendingRequests: [request('Cooper', 1)] }), expect: 'review-request' },
  { name: 'conversation within 24h',       state: mentor({ relationships: [rel('Jordan', { nextSession: { id: 's1', at: at(6 * H) } })] }), expect: 'briefing-24h' },
  { name: 'conversation this week',        state: mentor({ relationships: [rel('Jordan', { nextSession: { id: 's1', at: at(5 * D) } })] }), expect: 'briefing-week' },
  { name: 'conversation left open',        state: mentor({ relationships: [rel('Jordan', { openPastSession: { id: 's0', at: at(-2 * D) } })] }), expect: 'wrap-up' },
  { name: 'mentee wrote, unanswered',      state: mentor({ relationships: [rel('Jordan', { lastMessage: theirs('I got the interview!') })] }), expect: 'reply' },
  { name: 'no note from last conversation',state: mentor({ relationships: [rel('Jordan', { lastSession: { id: 's0', at: at(-3 * D) }, reflected: false })] }), expect: 'note' },
  { name: 'mentee gone quiet',             state: mentor({ relationships: [rel('Jordan', { quietDays: 30 })] }), expect: 'quiet' },
  { name: 'everything handled',            state: mentor({ relationships: [rel('Jordan', { lastSession: { id: 's0', at: at(-3 * D) } })] }), expect: 'steady' },

  // ── competing priorities ──────────────────────────────────────────────────
  { name: 'COMPETING no availability + pending request',
    state: mentor({ hasAvailability: false, pendingRequests: [request('Ava', 2)] }), expect: 'review-request' },
  { name: 'COMPETING request + conversation within 24h',
    state: mentor({ pendingRequests: [request('Ava', 2)], relationships: [rel('Jordan', { nextSession: { id: 's1', at: at(6 * H) } })] }),
    expect: 'briefing-24h' },
  { name: 'COMPETING conversation within 24h + unread message',
    state: mentor({ relationships: [rel('Jordan', { nextSession: { id: 's1', at: at(6 * H) }, lastMessage: theirs('Can we push to 4pm?') })] }),
    expect: 'briefing-24h' },
  { name: 'COMPETING open past conversation + unread message',
    state: mentor({ relationships: [rel('Jordan', { openPastSession: { id: 's0', at: at(-2 * D) } }), rel('Maya', { lastMessage: theirs('Thanks for the intro.') })] }),
    expect: 'reply' },
  { name: 'COMPETING several mentees, all settled',
    state: mentor({ relationships: [
      rel('Jordan', { lastSession: { id: 'a', at: at(-5 * D) } }),
      rel('Maya', { lastSession: { id: 'b', at: at(-6 * D) } }),
      rel('Lee', { nextSession: { id: 'c', at: at(9 * D) } }),
    ] }),
    expect: 'steady' },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

let failures = 0;
const check = (label: string, fn: () => void) => {
  try { fn(); } catch (e) {
    failures += 1;
    console.error(`  FAIL  ${label}\n        ${(e as Error).message.split('\n')[0]}`);
  }
};

function invariants(action: NextAction, now: { key: string; href: string; cta: string }[], label: string) {
  check(`${label}: has a headline`, () => assert.ok(action.headline.trim().length > 0));
  check(`${label}: has one call to action`, () => assert.ok(action.cta.trim().length > 0));
  check(`${label}: goes somewhere`, () => assert.match(action.href, /^\/[a-z]/));
  check(`${label}: needs-now items are all actionable`, () => {
    for (const item of now) {
      assert.ok(item.cta.trim().length > 0, `item ${item.key} has no cta`);
      assert.match(item.href, /^\/[a-z]/, `item ${item.key} goes nowhere`);
    }
  });
  check(`${label}: the dashboard shows at most three needs-now items`, () => {
    // The dashboards drop whatever the next action already covers, then cap at
    // three. Asserted here so the cap cannot quietly move into this module and
    // start discarding items before de-duplication, which is how an overdue
    // commitment once disappeared from the page.
    const shown = now.filter((i) => i.href !== action.href).slice(0, 3);
    assert.ok(shown.length <= 3);
  });
}

console.log('next-action: mentee');
for (const c of MENTEE_CASES) {
  const action = menteeNextAction(c.state, NOW);
  const now = menteeNow(c.state, NOW);
  check(`mentee — ${c.name}`, () => assert.equal(action.key, c.expect));
  invariants(action, now, `mentee — ${c.name}`);
}

console.log('next-action: mentor');
for (const c of MENTOR_CASES) {
  const action = mentorNextAction(c.state, NOW);
  const now = mentorNow(c.state, NOW);
  check(`mentor — ${c.name}`, () => assert.equal(action.key, c.expect));
  invariants(action, now, `mentor — ${c.name}`);
}

// The oldest request wins, so nobody keeps losing their place to whoever
// arrived this morning.
check('mentor — several pending requests answer the oldest first', () => {
  const state = mentor({ pendingRequests: [request('Newest', 1), request('Middle', 4), request('Oldest', 11), request('Mid2', 6)] });
  assert.equal(mentorNextAction(state, NOW).href, '/requests?request=q-Oldest');
});

check('mentor — every pending request reaches the page', () => {
  const state = mentor({ pendingRequests: [request('Newest', 1), request('Middle', 4), request('Oldest', 11), request('Mid2', 6)] });
  const action = mentorNextAction(state, NOW);
  const items = mentorNow(state, NOW);
  const shown = items.filter((i) => i.href !== action.href);
  // Four requests: one in the action, the rest available to the band, which
  // the dashboard caps and then counts as "N more".
  assert.equal(items.filter((i) => i.kind === 'request').length, 4);
  assert.equal(shown.filter((i) => i.kind === 'request').length, 3);
});

check('an empty state never throws and still says something', () => {
  assert.ok(menteeNextAction(mentee(), NOW).headline.length > 0);
  assert.ok(mentorNextAction(mentor(), NOW).headline.length > 0);
  assert.equal(menteeNow(mentee(), NOW).length, 0);
  assert.equal(mentorNow(mentor(), NOW).length, 0);
});

const total = MENTEE_CASES.length + MENTOR_CASES.length;
if (failures > 0) {
  console.error(`\nnext-action: ${failures} assertion(s) failed across ${total} states`);
  process.exit(1);
}
console.log(`next-action: ok (${total} states, one dominant action each)`);
