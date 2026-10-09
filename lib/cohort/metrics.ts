/**
 * The four metrics Cohort 001 is judged on.
 *
 * FOUR, NOT TWENTY. Activation, Engagement, Execution, Progression. Each
 * answers one question, and anything that does not help answer one of them
 * is not here.
 *
 *   Activation    did the relationship actually start?
 *   Engagement    did it continue?
 *   Execution     did conversations produce action?
 *   Progression   did the student's position materially improve?
 *
 * TWO RULES THAT SHAPE ALL OF IT.
 *
 * 1. Every figure is a count of something that happened, or a ratio of two
 *    such counts. There is no composite index, no weighting, no score out of
 *    100. A number nobody can take apart is a number nobody should act on.
 *
 * 2. Nothing is computed from an empty denominator. With no matched pairs,
 *    activation is not 0% -- it is unknown, and the product says so. Cohort
 *    001 has not started, so almost everything here will legitimately read
 *    "no data yet" for a while, and that is the honest state rather than a
 *    failure state.
 *
 * Pure functions. The loader fetches, this computes, the page renders.
 */

export interface Pair {
  mentorshipId: string;
  matchedAt: string;
  /*
    Completed conversations, in any order. The first and last are computed
    by date rather than by array position: depending on the caller to sort
    correctly is a silent-wrong-number bug waiting for the day a loader
    changes its ORDER BY, and the test suite caught exactly that.
  */
  completedSessions: { at: string }[];
  nextSessionAt: string | null;
  commitmentsCreated: number;
  commitmentsCompleted: number;
  goalsCreated: number;
  goalsReached: number;
  completed: boolean;
}

export interface MeasurePair {
  profileId: string;
  baseline: Measures | null;
  endline: Measures | null;
}

export interface Measures {
  careerClarity: number | null;
  recruitingKnowledge: number | null;
  preparation: number | null;
  confidence: number | null;
  reachableContacts: number | null;
  applications: number | null;
  interviews: number | null;
  offers: number | null;
  introductions: number | null;
}

/** A figure that may legitimately have no value yet. */
export interface Figure {
  value: number | null;
  /** The numerator and denominator, so the reader can check the arithmetic. */
  of: [number, number] | null;
  label: string;
}

const DAY = 86_400_000;
const ratio = (n: number, d: number, label: string): Figure =>
  d === 0 ? { value: null, of: null, label } : { value: n / d, of: [n, d], label };

const times = (s: { at: string }[]) => s.map((x) => new Date(x.at).getTime());
const firstAt = (s: { at: string }[]) => (s.length ? Math.min(...times(s)) : null);
const lastAt = (s: { at: string }[]) => (s.length ? Math.max(...times(s)) : null);

// ── 1. Activation ───────────────────────────────────────────────────────────
export interface Activation {
  /** Pairs whose first conversation happened inside the cohort's window. */
  withinWindow: Figure;
  /** Pairs that have spoken at all. */
  everMet: Figure;
  /** Still waiting, past the window. The list to act on. */
  stalled: string[];
  windowDays: number;
}

export function activation(pairs: Pair[], windowDays: number, now = Date.now()): Activation {
  const started = pairs.filter((p) => p.completedSessions.length > 0);
  const inWindow = started.filter(
    (p) => firstAt(p.completedSessions)! - new Date(p.matchedAt).getTime() <= windowDays * DAY,
  );
  /*
    Only pairs whose window has actually closed can be stalled. A pair
    matched yesterday is not failing activation; counting it as such would
    make the metric worst on the day a cohort launches.
  */
  const stalled = pairs.filter(
    (p) => p.completedSessions.length === 0 && now - new Date(p.matchedAt).getTime() > windowDays * DAY,
  );

  return {
    withinWindow: ratio(inWindow.length, pairs.length, `First conversation within ${windowDays} days`),
    everMet: ratio(started.length, pairs.length, 'Pairs that have spoken at all'),
    stalled: stalled.map((p) => p.mentorshipId),
    windowDays,
  };
}

// ── 2. Engagement ───────────────────────────────────────────────────────────
export interface Engagement {
  conversationsHeld: number;
  conversationsExpected: number;
  /** Held against expected, across the cohort. */
  againstPlan: Figure;
  /** Pairs currently inside their cadence. */
  onCadence: Figure;
  /** Pairs with a next conversation booked. */
  scheduledAhead: Figure;
  completedCohort: Figure;
}

export function engagement(pairs: Pair[], cadenceDays: number, expectedSessions: number, now = Date.now()): Engagement {
  const held = pairs.reduce((n, p) => n + p.completedSessions.length, 0);
  const expected = pairs.length * expectedSessions;

  const active = pairs.filter((p) => !p.completed);
  const onCadence = active.filter((p) => {
    const last = lastAt(p.completedSessions);
    return last !== null && now - last <= cadenceDays * DAY;
  });

  return {
    conversationsHeld: held,
    conversationsExpected: expected,
    againstPlan: ratio(held, expected, 'Conversations held against the cohort plan'),
    onCadence: ratio(onCadence.length, active.length, `Pairs inside a ${cadenceDays}-day cadence`),
    scheduledAhead: ratio(active.filter((p) => p.nextSessionAt).length, active.length, 'Pairs with the next one booked'),
    completedCohort: ratio(pairs.filter((p) => p.completed).length, pairs.length, 'Pairs that finished the cohort'),
  };
}

// ── 3. Execution ────────────────────────────────────────────────────────────
export interface Execution {
  commitmentsCreated: number;
  commitmentsCompleted: number;
  followThrough: Figure;
  goalsReached: Figure;
  /** Conversations that produced at least one commitment. */
  conversationsWithAction: Figure;
}

export function execution(pairs: Pair[]): Execution {
  const created = pairs.reduce((n, p) => n + p.commitmentsCreated, 0);
  const done = pairs.reduce((n, p) => n + p.commitmentsCompleted, 0);
  const goals = pairs.reduce((n, p) => n + p.goalsCreated, 0);
  const reached = pairs.reduce((n, p) => n + p.goalsReached, 0);
  const sessions = pairs.reduce((n, p) => n + p.completedSessions.length, 0);
  /*
    Deliberately NOT "commitments per conversation". Rewarding volume would
    make the honest answer -- one real commitment -- look worse than five
    invented ones. What matters is whether conversations lead anywhere at
    all, and then whether people do what they said.
  */
  const pairsWithAction = pairs.filter((p) => p.commitmentsCreated > 0).length;

  return {
    commitmentsCreated: created,
    commitmentsCompleted: done,
    followThrough: ratio(done, created, 'Commitments completed'),
    goalsReached: ratio(reached, goals, 'Goals reached'),
    conversationsWithAction: sessions === 0
      ? { value: null, of: null, label: 'Pairs whose conversations produced commitments' }
      : ratio(pairsWithAction, pairs.length, 'Pairs whose conversations produced commitments'),
  };
}

// ── 4. Progression ──────────────────────────────────────────────────────────
export interface Progression {
  /** Students with both a baseline and an endline. Everything else is null. */
  measured: Figure;
  /** Mean movement, self-reported, 1-5 scales. */
  clarityShift: Figure;
  knowledgeShift: Figure;
  preparationShift: Figure;
  confidenceShift: Figure;
  /** Countable, and therefore the part worth leading with. */
  contactsGained: Figure;
  interviewsGained: Figure;
  offersGained: Figure;
  introductionsMade: Figure;
}

export function progression(measures: MeasurePair[]): Progression {
  const paired = measures.filter((m) => m.baseline && m.endline);

  const shift = (pick: (m: Measures) => number | null, label: string): Figure => {
    const deltas = paired
      .map((m) => {
        const b = pick(m.baseline!);
        const e = pick(m.endline!);
        return b === null || e === null ? null : e - b;
      })
      .filter((d): d is number => d !== null);
    if (deltas.length === 0) return { value: null, of: null, label };
    return {
      value: deltas.reduce((a, b) => a + b, 0) / deltas.length,
      of: [deltas.length, paired.length],
      label,
    };
  };

  return {
    measured: ratio(paired.length, measures.length, 'Students with both a baseline and an endline'),
    clarityShift: shift((m) => m.careerClarity, 'Career clarity, self-reported'),
    knowledgeShift: shift((m) => m.recruitingKnowledge, 'Recruiting knowledge, self-reported'),
    preparationShift: shift((m) => m.preparation, 'Preparation, self-reported'),
    confidenceShift: shift((m) => m.confidence, 'Confidence, self-reported'),
    contactsGained: shift((m) => m.reachableContacts, 'People they could ask for advice'),
    interviewsGained: shift((m) => m.interviews, 'Interviews'),
    offersGained: shift((m) => m.offers, 'Offers'),
    introductionsMade: shift((m) => m.introductions, 'Introductions received'),
  };
}

/** For rendering: a ratio as a percentage, or null when there is no data. */
export function pct(f: Figure): string | null {
  return f.value === null ? null : `${Math.round(f.value * 100)}%`;
}

/** For rendering a mean shift: always signed, so direction is unmissable. */
export function signed(f: Figure, digits = 1): string | null {
  if (f.value === null) return null;
  const v = f.value;
  return `${v > 0 ? '+' : ''}${v.toFixed(digits)}`;
}
