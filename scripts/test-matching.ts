/**
 * The matching engine.
 *
 * What is actually being tested is a promise to users: every reason shown
 * is traceable to something both people wrote. A recommendation engine that
 * invents a plausible-sounding rationale is worse than none, because people
 * will believe it once and then stop believing any of it.
 */
import {
  recommend, reasonsFor, ineligible, emptyReason,
  type Candidate, type Seeker,
} from '../lib/matching/engine';

let pass = 0, fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; return; }
  fail++;
  console.error(`  FAIL ${name}\n    want ${JSON.stringify(want)}\n    got  ${JSON.stringify(got)}`);
};

const mentor = (o: Partial<Candidate> = {}): Candidate => ({
  id: 'm1', firstName: 'Drew', fullName: 'Drew Nations', avatarUrl: null,
  headline: null, title: 'Associate', company: 'JPMorgan', industry: 'Investment Banking',
  location: null, university: null, graduationYear: null,
  expertise: ['Leveraged Finance', 'Recruiting'],
  currentLoad: 0, maxLoad: 3, available: true, yearsExperience: 5, ...o,
});

const student = (o: Partial<Seeker> = {}): Seeker => ({
  id: 's1', firstName: 'Maya', interests: [], industries: [], goals: [],
  major: null, university: null, location: null, ...o,
});

// ── Hard constraints remove, soft signals only reorder ─────────────────────
console.log('eligibility');
eq('yourself is not a recommendation', ineligible(student(), mentor({ id: 's1' }), new Set()), 'self');
eq('an existing connection is excluded', ineligible(student(), mentor(), new Set(['m1'])), 'already connected');
eq('somebody at capacity is excluded', ineligible(student(), mentor({ currentLoad: 3, maxLoad: 3 }), new Set()), 'at capacity');
eq('somebody unavailable is excluded', ineligible(student(), mentor({ available: false }), new Set()), 'not currently available');
eq('an eligible mentor passes', ineligible(student(), mentor(), new Set()), null);
// Capacity is a hard constraint: a perfect match who cannot take anyone
// must not appear at all.
eq('a perfect but full mentor is not recommended',
  recommend(student({ interests: ['Leveraged Finance'] }), [mentor({ currentLoad: 3, maxLoad: 3 })]).length, 0);

// ── Every reason must be traceable ─────────────────────────────────────────
console.log('reasons are evidence-backed');
{
  const r = reasonsFor(student({ interests: ['Recruiting'] }), mentor());
  eq('an overlap produces a reason', r.length > 0, true);
  eq('the reason carries its evidence', r[0].evidence, ['Recruiting']);
  eq('the evidence appears in the sentence', r[0].text.includes('Recruiting'), true);
  // The claim must be checkable: evidence must come from the candidate.
  eq('evidence is a real candidate field',
    r.every((x) => x.evidence.every((e) =>
      [...mentor().expertise, mentor().industry, mentor().title, String(mentor().yearsExperience) + ' years']
        .some((f) => f?.includes(e) || e.includes(String(f))))), true);
}
{
  // No overlap at all must produce NO reasons, and therefore no recommendation.
  const none = reasonsFor(student({ interests: ['Marine Biology'] }), mentor());
  eq('nothing in common produces no reasons', none.length, 0);
  eq('a candidate with no reason is not recommended',
    recommend(student({ interests: ['Marine Biology'] }), [mentor()]).length, 0);
}

// ── Matching is case and plural insensitive, not a stemmer ─────────────────
console.log('term matching');
eq('case does not matter', reasonsFor(student({ interests: ['recruiting'] }), mentor()).length > 0, true);
eq('plurals do not matter', reasonsFor(student({ interests: ['Recruiting'] }), mentor({ expertise: ['Recruiting'] })).length > 0, true);

// ── The goal signal, which is the strongest one available ──────────────────
console.log('goals');
{
  const r = reasonsFor(student({ goals: ['Break into investment banking'] }), mentor());
  const goal = r.find((x) => x.kind === 'goal');
  eq('a goal mentioning the industry is matched', Boolean(goal), true);
  eq('their own words are quoted back', goal!.text.includes('break into investment banking'), true);
  // One goal reason only: three would be a wall of text.
  const many = reasonsFor(student({ goals: ['Break into investment banking', 'Learn leveraged finance', 'Get recruiting advice'] }), mentor());
  eq('at most one goal reason', many.filter((x) => x.kind === 'goal').length, 1);
}

// ── Ranking ────────────────────────────────────────────────────────────────
console.log('ranking');
{
  const strong = mentor({ id: 'strong', fullName: 'A Strong', expertise: ['Recruiting', 'Leveraged Finance'], industry: 'Investment Banking' });
  const weak = mentor({ id: 'weak', fullName: 'B Weak', expertise: ['Recruiting'], industry: 'Retail' });
  const ranked = recommend(student({ interests: ['Recruiting', 'Leveraged Finance'], industries: ['Investment Banking'] }), [weak, strong]);
  eq('more overlap ranks first', ranked[0].candidate.id, 'strong');
  eq('both are still shown', ranked.length, 2);
  // Order must not depend on input order.
  const reversed = recommend(student({ interests: ['Recruiting', 'Leveraged Finance'], industries: ['Investment Banking'] }), [strong, weak]);
  eq('ranking is stable', reversed.map((r) => r.candidate.id), ranked.map((r) => r.candidate.id));
  // Seniority alone must not outrank relevance.
  const senior = mentor({ id: 'senior', fullName: 'C Senior', expertise: ['Recruiting'], industry: 'Retail', yearsExperience: 30 });
  const bySeniority = recommend(student({ interests: ['Recruiting', 'Leveraged Finance'], industries: ['Investment Banking'] }), [senior, strong]);
  eq('relevance beats seniority', bySeniority[0].candidate.id, 'strong');
}

// ── No two reasons may say the same thing ──────────────────────────────────
console.log('no redundant reasons');
{
  // A candidate whose industry is also one of their expertise tags used to
  // earn two sentences off one fact.
  const r = reasonsFor(
    student({ interests: ['Private Equity'], industries: ['Private Equity'] }),
    mentor({ expertise: ['Private Equity'], industry: 'Private Equity' }),
  );
  eq('one fact produces one reason', r.filter((x) => x.kind === 'industry' || x.kind === 'expertise').length, 1);
  // A genuinely separate industry still earns its own reason.
  const sep = reasonsFor(
    student({ interests: ['Recruiting'], industries: ['Investment Banking'] }),
    mentor({ expertise: ['Recruiting'], industry: 'Investment Banking' }),
  );
  eq('a distinct industry still counts', sep.filter((x) => x.kind === 'industry').length, 1);
  // No two reasons may share identical evidence.
  const ev = sep.map((x) => x.evidence.join('|'));
  eq('evidence is never repeated', ev.length, new Set(ev).size);
}

// ── No scores leak to the surface ──────────────────────────────────────────
console.log('no fabricated precision');
{
  const r = recommend(student({ interests: ['Recruiting'] }), [mentor()])[0];
  eq('a recommendation carries reasons', r.reasons.length > 0, true);
  eq('and an opener', typeof r.opener, 'string');
  // The score exists for ordering only; no reason text may contain a %.
  eq('no reason renders a percentage', r.reasons.some((x) => /%|\bscore\b|\bmatch\b\s*\d/i.test(x.text)), false);
}

// ── The outreach draft is addressed to the right person ────────────────────
/*
  A real bug caught in production verification: the opener is advice to the
  SEEKER, and pasting it into a message produced "Hi David — I wanted to ask
  how David would approach it starting from where you are now." Wrong
  person, name twice, wrong tense.
*/
console.log('outreach draft');
{
  const r = recommend(student({ firstName: 'Maya', interests: ['Recruiting'] }), [mentor()])[0];
  const d = r.outreach!;
  eq('addressed to the candidate', d.startsWith('Hi Drew'), true);
  eq('names them once', (d.match(/Drew/g) ?? []).length, 1);
  eq('written in first person', /\bI'm\b|\bI'd\b|\bI\b/.test(d), true);
  // The opener is advice; the draft is a message. They must differ.
  eq('draft is not the opener', d === r.opener, false);
  eq('the opener still addresses the seeker', r.opener!.startsWith('Ask '), true);
  // A goal-driven draft quotes the goal, not the reader-facing phrasing.
  const g = recommend(student({ firstName: 'Maya', goals: ['Break into investment banking'] }), [mentor()])[0];
  eq('a goal draft references the goal', g.outreach!.includes('break into investment banking'), true);
  eq('no draft says "from where you are now"', /where you are now/.test(g.outreach!), false);
}

/*
  ── RELATIONSHIP-INTELLIGENCE INPUTS (migration 0039) ───────────────────────

  The engine's ceiling was never its ranking, it was its inputs: measured in
  production, 25 of 25 mentors had an industry and ZERO had can_help_with.
  These assertions cover the signals that read the richer fields, and two
  properties that matter more than any individual sentence:

    a missing field produces NO reason, never a weaker or guessed one
    one fact produces ONE sentence, however many signals could claim it
*/
console.log('richer inputs');
{
  const kinds = (ss: Partial<Seeker>, mm: Partial<Candidate>) =>
    reasonsFor(student(ss), mentor(mm)).map((r) => r.kind);

  /*
    Every new field, absent, is silent rather than speculative. The
    baseline here is expertise + experience: the fixture mentor is five
    years in, which is a real reason and fires on its own.
  */
  eq('no new fields means no new reasons',
    kinds({ interests: ['Recruiting'] }, {}), ['expertise', 'experience']);

  // 1. Transition: the strongest thing one person can tell another.
  eq('a shared transition is named',
    kinds({ transitionsNavigating: ['Consulting to private equity'] },
          { transitionsMade: ['Consulting to private equity'] }), ['transition']);
  eq('a transition they did not make is silent',
    kinds({ transitionsNavigating: ['Banking to tech'] },
          { transitionsMade: ['Consulting to private equity'] }), []);
  {
    const [r] = reasonsFor(
      student({ transitionsNavigating: ['Consulting to private equity'] }),
      mentor({ transitionsMade: ['Consulting to private equity'] }));
    eq('the transition sentence keeps the tag intact',
      r.text, 'Drew has made the same move you are making: Consulting to private equity.');
  }

  // 2. Situation: what they offered to help with, not what they are tagged with.
  eq('an offered situation outranks subject overlap',
    kinds({ interests: ['Leveraged Finance'],
            intent: { objective: 'get through IB recruiting', lookingFor: ['Investment banking recruiting'] } },
          { canHelpWith: ['Investment banking recruiting'] })[0], 'situation');
  /*
    The pre-0039 path: a subject named inside a situation. This is what
    makes can_help_with worth filling in before member_intent exists.
  */
  eq('a subject named inside a situation counts',
    kinds({ interests: ['Investment Banking'] },
          { expertise: [], industry: null, yearsExperience: null,
            canHelpWith: ['Investment banking recruiting'] }), ['situation']);
  eq('an unrelated situation stays silent',
    kinds({ interests: ['Real Estate'] },
          { expertise: [], industry: null, yearsExperience: null,
            canHelpWith: ['Investment banking recruiting'] }), []);
  eq('usefulTo matched against a community counts as a situation',
    kinds({ communities: ['First-generation students'] },
          { usefulTo: ['First-generation students'] }), ['situation']);

  // 3. Intent: dated, quoted back, and gone when the intent closes.
  {
    const [r] = reasonsFor(
      student({ intent: { objective: 'decide between two offers in Private Equity', byDate: '2026-03-01' } }),
      mentor({ expertise: ['Private Equity'] }));
    eq('intent is quoted in the seeker\'s own words',
      r.text.includes('decide between two offers'), true);
    eq('a bare date is said, not printed', r.text.includes('March 1'), true);
    eq('the ISO form never reaches the reader', r.text.includes('2026-03-01'), false);
  }
  eq('an intent nobody can serve is silent',
    kinds({ intent: { objective: 'learn to sail' } }, {}), []);

  // 4/5. Company and function.
  eq('a target company is named',
    kinds({ targetCompanies: ['Blackstone'] }, { companiesKnown: ['Blackstone'] }), ['company']);
  eq('a shared function is named',
    kinds({ functionsExploring: ['Product management'] }, { functions: ['Product management'] }), ['function']);

  // 6. Enjoyment is a different fact from qualification, and outranks it.
  {
    const plain = reasonsFor(student({ interests: ['Recruiting'] }), mentor({}))[0];
    const keen = reasonsFor(student({ interests: ['Recruiting'] }),
                            mentor({ topicsEnjoyed: ['Recruiting'] }))[0];
    eq('enjoying a subject is said out loud', keen.text.includes('enjoy'), true);
    eq('enjoying a subject ranks higher', keen.weight > plain.weight, true);
  }

  // 9. Affiliation, minus the one the school reason already covers.
  eq('a shared community is named',
    kinds({ communities: ['Marine Corps'] }, { affiliations: ['Marine Corps'] }), ['affiliation']);
  eq('the university is not repeated as an affiliation',
    kinds({ university: 'UNC', communities: ['UNC'] },
          { university: 'UNC', affiliations: ['UNC'] }), ['school']);

  /*
    ONE FACT, ONE SENTENCE. A mentor in Private Equity, tagged Private
    Equity, who lists it as a function, for a student who wants all three,
    used to earn three sentences from one fact -- and have it counted three
    times in the score.
  */
  {
    const rs = reasonsFor(
      student({ interests: ['Private Equity'], industries: ['Private Equity'],
                functionsExploring: ['Private Equity'] }),
      mentor({ expertise: ['Private Equity'], industry: 'Private Equity',
               functions: ['Private Equity'] }));
    eq('one fact is claimed by one signal only',
      rs.map((r) => r.kind), ['expertise', 'experience']);
    eq('neither industry nor function repeats it',
      rs.some((r) => r.kind === 'industry' || r.kind === 'function'), false);
  }

  // Ordering is the thesis: what you are doing beats what you are tagged with.
  {
    const rs = reasonsFor(
      student({ interests: ['Leveraged Finance'], university: 'UNC',
                transitionsNavigating: ['Consulting to private equity'] }),
      mentor({ university: 'UNC', transitionsMade: ['Consulting to private equity'] }));
    eq('a transition outranks a shared school',
      rs.map((r) => r.kind), ['transition', 'expertise', 'school', 'experience']);
  }

  // Every new kind has an opener and a draft; none falls through silently.
  for (const [kind, ss, mm] of [
    ['transition', { transitionsNavigating: ['Consulting to private equity'] }, { transitionsMade: ['Consulting to private equity'] }],
    ['situation', { communities: ['First-generation students'] }, { usefulTo: ['First-generation students'] }],
    ['company', { targetCompanies: ['Blackstone'] }, { companiesKnown: ['Blackstone'] }],
    ['function', { functionsExploring: ['Product management'] }, { functions: ['Product management'] }],
    ['affiliation', { communities: ['Marine Corps'] }, { affiliations: ['Marine Corps'] }],
  ] as [string, Partial<Seeker>, Partial<Candidate>][]) {
    const r = recommend(student({ firstName: 'Maya', ...ss }), [mentor({ expertise: [], industry: null, ...mm })])[0];
    eq(`${kind}: produces a recommendation`, r?.reasons[0]?.kind, kind);
    eq(`${kind}: has a specific opener`, r.opener!.startsWith('Ask '), true);
    eq(`${kind}: the draft is addressed to them`, r.outreach!.startsWith('Hi Drew'), true);
    eq(`${kind}: the draft names them once`, (r.outreach!.match(/Drew/g) ?? []).length, 1);
    eq(`${kind}: the draft is not the opener`, r.outreach === r.opener, false);
  }
}

// ── Empty states tell the truth about WHY ──────────────────────────────────
console.log('empty states');
eq('an empty network says so', emptyReason(student({ interests: ['x'], goals: ['y'] }), 0), 'no_members');
eq('a thin profile says so', emptyReason(student(), 5), 'thin_profile');
eq('no overlap says so', emptyReason(student({ interests: ['a', 'b'], goals: ['c'] }), 5), 'no_overlap');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
