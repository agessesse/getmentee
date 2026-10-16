/**
 * Who should know whom, and why.
 *
 * THE RULE THIS FILE IS BUILT AROUND: never claim a reason that is not in
 * the data. Every sentence this engine produces can be traced to two fields
 * that two people filled in themselves. If there is nothing to say, it says
 * nothing and the candidate ranks lower; it does not invent a rationale.
 *
 * NO PERCENTAGE. A "94% match" is a number with no referent — nobody can
 * check it, argue with it, or learn anything from being wrong about it. The
 * output is reasons. Reasons can be disagreed with, which is what makes
 * them worth showing.
 *
 * HARD CONSTRAINTS VS SOFT SIGNALS, kept strictly apart. A hard constraint
 * removes a candidate entirely: no capacity, not a real member, already
 * connected, themselves. A soft signal only changes order. Conflating the
 * two is how a matching system quietly recommends someone who cannot
 * actually take a mentee.
 *
 * WHAT IS DELIBERATELY NOT HERE: no model, no embeddings, no learned
 * weights. The weights below are hand-set and visible. When there is
 * outcome data to learn from, this interface is the place to swap the
 * ranking out; until then, pretending to learn would be a lie with a
 * confidence interval attached.
 *
 * Pure and isomorphic: the loader fetches, this ranks, the page renders.
 */

import { lowerFirst } from '@/lib/text';

export interface Candidate {
  id: string;
  firstName: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  title: string | null;
  company: string | null;
  industry: string | null;
  location: string | null;
  university: string | null;
  graduationYear: number | null;
  expertise: string[];
  /** Mentors only: how many relationships they currently hold. */
  currentLoad: number;
  maxLoad: number;
  available: boolean;
  yearsExperience: number | null;

  /*
    RELATIONSHIP-INTELLIGENCE INPUTS (migration 0039).

    All optional and all defaulting to empty, because the engine has to keep
    working for the 25 mentors who filled in a profile before these existed.
    A missing field produces no reason -- never a weaker one, and never a
    guess. That is the same rule as everything else here: if the data does
    not say it, the engine does not say it.
  */

  /** Situations a student can bring them. The single most useful field. */
  canHelpWith?: string[];
  /** Places they have actually worked. */
  companiesKnown?: string[];
  /** What they do, as distinct from the industry they do it in. */
  functions?: string[];
  /** Moves they have personally made ("consulting to private equity"). */
  transitionsMade?: string[];
  /** What they like talking about, which is not the same as qualified for. */
  topicsEnjoyed?: string[];
  /** Who they say they are useful to, in their own words. */
  usefulTo?: string[];
  /** Schools, service, communities. Why a cold message gets answered. */
  affiliations?: string[];
}

export interface Seeker {
  id: string;
  firstName: string;
  /** What they are interested in, from interest_tags and career_interests. */
  interests: string[];
  /** Industries they want to be in. */
  industries: string[];
  /** Free-text ambitions. */
  goals: string[];
  major: string | null;
  university: string | null;
  location: string | null;

  /* Profile side: durable facts about this person (migration 0039). */
  functionsExploring?: string[];
  transitionsNavigating?: string[];
  communities?: string[];
  targetCompanies?: string[];

  /*
    INTENT: why this person needs an introduction NOW.

    Deliberately a separate shape from everything above it. The fields
    above are true in a year; these expire. Keeping them apart is what
    lets a reason say "you are deciding between two offers by March"
    instead of "you are interested in finance", and it is what stops the
    engine recommending the same five people forever.
  */
  intent?: {
    /** The sentence they would say out loud. */
    objective: string;
    /** Things they actually want to ask. These become the opener. */
    questions?: string[];
    /** The kind of person who would be useful right now. */
    lookingFor?: string[];
    /** What makes it urgent, if anything. */
    byDate?: string | null;
  } | null;
}

/** One traceable reason, with the evidence that produced it. */
export interface Reason {
  kind:
    /* Ordered here the way they are weighted below, strongest first. */
    | 'transition'   // they made the move this person is making
    | 'situation'    // they named this exact situation as one they help with
    | 'intent'       // what the seeker is trying to do right now
    | 'goal'         // a standing ambition, in the seeker's own words
    | 'company'      // they have worked somewhere the seeker is aiming at
    | 'expertise'
    | 'function'     // same job, possibly different industry
    | 'industry'
    | 'affiliation'  // a community in common beyond the university
    | 'school'
    | 'experience'
    | 'place';
  /** Rendered to the user, in their own words where possible. */
  text: string;
  /** The overlapping terms, so a reader can check the claim. */
  evidence: string[];
  weight: number;
}

export interface Recommendation {
  candidate: Candidate;
  reasons: Reason[];
  /** Internal ordering only. Never rendered as a percentage. */
  score: number;
  /** One line the two of them could actually open with. */
  opener: string | null;
  /**
   * A first draft of the message, addressed TO the candidate.
   *
   * Separate from `opener` because they are written for different
   * readers and conflating them produced a real bug: the opener is advice
   * to the seeker ("Ask how Drew would approach it"), and pasting it into
   * a message to Drew read "Hi Drew — I wanted to ask how Drew would
   * approach it starting from where you are now." Second person, his
   * name once, addressed to him.
   */
  outreach: string | null;
}

/* Comparison that survives casing, plurals and punctuation without
   pretending to be a stemmer. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/s\b/g, '').trim();
const overlap = (a: string[], b: string[]): string[] => {
  const B = new Map(b.map((x) => [norm(x), x]));
  const out: string[] = [];
  for (const x of a) {
    const hit = B.get(norm(x));
    if (hit && !out.includes(hit)) out.push(hit);
  }
  return out;
};

/** Does any of `terms` appear inside the free text? */
const mentionedIn = (text: string, terms: string[]): string[] => {
  const t = norm(text);
  return terms.filter((term) => norm(term).length > 3 && t.includes(norm(term)));
};

/*
  A date a person would say out loud. `by_date` is a DATE column, so it
  arrives as "2026-03-01", and "You said by 2026-03-01" reads like a
  database leaking into a sentence. Parsed as UTC on purpose: a bare date
  has no time zone, and `new Date('2026-03-01')` is already UTC midnight,
  so formatting it in local time moves it to February 28th west of
  Greenwich.
*/
const sayDate = (iso: string): string | null => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
};

const list = (xs: string[]): string =>
  xs.length === 1 ? xs[0]
  : xs.length === 2 ? `${xs[0]} and ${xs[1]}`
  : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

/**
 * Hard constraints. A candidate failing any of these is not shown at all,
 * with the reason recorded so an operator can see why somebody never
 * appears rather than wondering.
 */
export function ineligible(seeker: Seeker, c: Candidate, alreadyConnected: Set<string>): string | null {
  if (c.id === seeker.id) return 'self';
  if (alreadyConnected.has(c.id)) return 'already connected';
  if (!c.available) return 'not currently available';
  if (c.maxLoad > 0 && c.currentLoad >= c.maxLoad) return 'at capacity';
  return null;
}

/**
 * Why these two should meet.
 *
 * WEIGHTS ARE HAND-SET AND ORDERED BY ONE JUDGEMENT: how much each signal
 * predicts a useful conversation, as far as anyone can tell BEFORE there is
 * outcome data. Stated plainly so it can be argued with.
 *
 *   8  transition   they made the move you are making
 *   7  situation    they named this exact situation as one they help with
 *   7  intent       what you are trying to do right now, with a date on it
 *   6  goal         a standing ambition, in your own words
 *   5  company      they have worked where you want to be
 *   5  expertise    subject overlap (+2 if they also enjoy the subject)
 *   4  function     same job, possibly a different industry
 *   4  industry
 *   3  affiliation  a community in common
 *   2  school
 *   2  experience   close enough ahead to remember
 *   1  place
 *
 * The top four are all things a person SAID about their own situation. The
 * bottom four are attributes. That ordering is the whole thesis: what
 * someone is trying to do beats what they are tagged with, and school and
 * place are real but weak — they make a first conversation easier to have,
 * not more useful to have had.
 *
 * None of these weights are learned. When relationship_outcomes has enough
 * rows to learn from, this function is the seam to replace; until then,
 * pretending to learn would be a lie with a confidence interval attached.
 */
export function reasonsFor(seeker: Seeker, c: Candidate): Reason[] {
  const reasons: Reason[] = [];
  const arr = (x?: string[]) => x ?? [];

  /*
    ONE FACT, ONE SENTENCE.

    Every reason is pushed through here, which drops any reason whose
    evidence has already been used by a stronger one. This started as a
    special case -- a mentor whose industry equalled one of their expertise
    tags earned two sentences saying the same thing in different grammar,
    "David works in Private Equity" then "They are in Private Equity" --
    and with nine signals instead of six that special case would have had
    to be written five more times. Generalising it also fixed the ranking,
    because a duplicated fact was being counted twice in the score.

    Reasons must therefore be pushed STRONGEST FIRST. The order of the
    blocks below is the weighting, made visible.
  */
  const said = new Set<string>();
  const push = (r: Reason) => {
    const fresh = r.evidence.filter((e) => !said.has(norm(e)));
    if (r.evidence.length > 0 && fresh.length === 0) return;
    r.evidence.forEach((e) => said.add(norm(e)));
    reasons.push(r);
  };

  const wants = [...new Set([...seeker.interests, ...seeker.industries])];
  const intent = seeker.intent ?? null;
  /* What this person needs right now, as opposed to what they are
     generally interested in. Empty for anyone who has not set an intent,
     which simply means none of the intent-shaped reasons fire. */
  const needsNow = [...new Set([...arr(intent?.lookingFor), ...arr(seeker.communities)])];

  // ── 1. They made the move this person is making ─────────────────────────
  /*
    The strongest thing one person can tell another in a network, and the
    one no tag list can express: not "knows about private equity" but
    "went from consulting to private equity, the way you are trying to".
  */
  const sameMove = overlap(arr(c.transitionsMade), arr(seeker.transitionsNavigating));
  if (sameMove.length) {
    push({
      kind: 'transition',
      text: `${c.firstName} has made the same move you are making: ${sameMove[0]}.`,
      evidence: sameMove,
      weight: 8,
    });
  }

  // ── 2. They named this exact situation as one they help with ────────────
  /*
    can_help_with is situations, not subjects -- "investment banking
    recruiting", not "finance". Matching against it is the difference
    between a mentor who is qualified and a mentor who has said yes to
    this specific conversation. usefulTo joins it because "I am useful to
    first-generation students" is the same kind of claim about the same
    kind of fit.
  */
  const situations = [
    ...overlap(arr(c.canHelpWith), needsNow),
    ...overlap(arr(c.usefulTo), needsNow),
    ...(intent?.objective ? mentionedIn(intent.objective, arr(c.canHelpWith)) : []),
    /*
      A subject named INSIDE a situation. "Investment banking recruiting"
      is not an exact match for the interest "Investment Banking", so
      overlap() misses it, but the mentor has plainly offered to help with
      the thing the student said they want.

      This also makes can_help_with worth filling in BEFORE the rest of
      0039 lands: the mentor-side column already exists, and without this
      line it would have had nothing on the seeker side to match against
      until member_intent was created — a field that stays useless for one
      more migration is a field that stays empty.
    */
    ...arr(c.canHelpWith).filter((h) => mentionedIn(h, wants).length > 0),
  ];
  const uniqueSituations = [...new Set(situations)];
  if (uniqueSituations.length) {
    push({
      kind: 'situation',
      text: `${c.firstName} specifically offers to help with ${list(uniqueSituations.slice(0, 2))}.`,
      evidence: uniqueSituations,
      weight: 7,
    });
  }

  // ── 3. What they are trying to do right now ─────────────────────────────
  /*
    Quoted back, dated, and gone when the intent closes. This is the
    reason that makes a recommendation feel timely rather than permanent.
  */
  if (intent?.objective) {
    const hits = mentionedIn(intent.objective, [
      ...arr(c.canHelpWith), ...c.expertise, ...arr(c.functions),
      ...arr(c.companiesKnown), c.industry ?? '', c.title ?? '', c.company ?? '',
    ].filter(Boolean));
    if (hits.length) {
      const when = intent.byDate ? sayDate(intent.byDate) : null;
      const urgency = when ? ` You said by ${when}.` : '';
      push({
        kind: 'intent',
        text: `Right now you are trying to ${lowerFirst(intent.objective.replace(/^I(?:'m| am)? (?:trying to|want to) /i, '').replace(/\.$/, ''))}. ${c.firstName} works on ${list(hits.slice(0, 2))}.${urgency}`,
        evidence: hits,
        weight: 7,
      });
    }
  }

  // ── 4. A standing ambition, in their own words ──────────────────────────
  /*
    The seeker wrote a sentence about what they are trying to do and a term
    from the mentor's profile appears in it. Quoting their own words back
    is why the explanation reads as true rather than templated. Ranked
    below intent because a goal has no date on it.
  */
  for (const goal of seeker.goals) {
    const hits = mentionedIn(goal, [
      ...c.expertise, ...arr(c.canHelpWith), ...arr(c.functions),
      c.industry ?? '', c.title ?? '',
    ].filter(Boolean));
    if (hits.length) {
      push({
        kind: 'goal',
        text: `You wrote that you want to ${lowerFirst(goal.replace(/^I want to /i, '').replace(/\.$/, ''))} — ${c.firstName} has done exactly that work.`,
        evidence: hits,
        weight: 6,
      });
      break; // one goal reason is enough; three is a wall of text
    }
  }

  // ── 5. They have worked where this person wants to be ───────────────────
  const sameCompany = overlap(arr(c.companiesKnown), arr(seeker.targetCompanies));
  if (sameCompany.length) {
    push({
      kind: 'company',
      text: `${c.firstName} has worked at ${list(sameCompany.slice(0, 2))}, which you listed as somewhere you want to be.`,
      evidence: sameCompany,
      weight: 5,
    });
  }

  // ── 6. Subject overlap ──────────────────────────────────────────────────
  const onExpertise = overlap(c.expertise, wants);
  if (onExpertise.length) {
    /*
      Said differently when the mentor also listed it as something they
      ENJOY talking about. Qualified and willing are different facts, and
      the second one is what makes a mentor answer the fifth email.
    */
    const enjoyed = overlap(arr(c.topicsEnjoyed), onExpertise);
    push({
      kind: 'expertise',
      text: enjoyed.length
        ? `${c.firstName} works in ${list(onExpertise.slice(0, 3))} and said it is something they enjoy talking about.`
        : `${c.firstName} works in ${list(onExpertise.slice(0, 3))}, which is what you said you want to understand.`,
      evidence: onExpertise,
      weight: 5 * Math.min(onExpertise.length, 3) + (enjoyed.length ? 2 : 0),
    });
  }

  // ── 7. Same job, possibly a different industry ──────────────────────────
  /*
    Worth its own signal because a product manager in banking and a banker
    are not interchangeable, and industry alone cannot tell them apart.
  */
  const sameFunction = overlap(arr(c.functions), arr(seeker.functionsExploring));
  if (sameFunction.length) {
    push({
      kind: 'function',
      text: `They do ${list(sameFunction.slice(0, 2))}, which is the work you said you are exploring.`,
      evidence: sameFunction,
      weight: 4,
    });
  }

  // ── 8. Industry ─────────────────────────────────────────────────────────
  if (c.industry && overlap([c.industry], wants).length) {
    push({
      kind: 'industry',
      text: `They are in ${c.industry}, one of the industries you are aiming at.`,
      evidence: [c.industry],
      weight: 4,
    });
  }

  // ── 9. A community in common, beyond the university ─────────────────────
  /*
    Weak as a predictor of a useful conversation, strong as a predictor of
    whether the conversation happens at all. Ranked accordingly.
  */
  const sameAffiliation = overlap(arr(c.affiliations), arr(seeker.communities))
    .filter((a) => !seeker.university || norm(a) !== norm(seeker.university));
  if (sameAffiliation.length) {
    push({
      kind: 'affiliation',
      text: `You are both part of ${list(sameAffiliation.slice(0, 2))}.`,
      evidence: sameAffiliation,
      weight: 3,
    });
  }

  if (seeker.university && c.university && norm(seeker.university) === norm(c.university)) {
    push({
      kind: 'school',
      text: `You both went to ${c.university}.`,
      evidence: [c.university],
      weight: 2,
    });
  }

  if (seeker.location && c.location && norm(seeker.location) === norm(c.location)) {
    push({
      kind: 'place',
      text: `You are both in ${c.location}.`,
      evidence: [c.location],
      weight: 1,
    });
  }

  /*
    Seniority is a reason only when it is useful, not impressive. Someone
    two to eight years ahead remembers the thing you are doing now; a
    thirty-year veteran is a different kind of conversation and should not
    outrank a relevant one on seniority alone.
  */
  if (c.yearsExperience !== null && c.yearsExperience >= 2 && c.yearsExperience <= 8 && onExpertise.length) {
    push({
      kind: 'experience',
      text: `They are ${c.yearsExperience} years in, so the path you are on is recent for them.`,
      evidence: [`${c.yearsExperience} years`],
      weight: 2,
    });
  }

  return reasons.sort((a, b) => b.weight - a.weight);
}

/**
 * A draft message to the candidate, built from the same evidence.
 *
 * Always editable and never sent automatically. It exists because the
 * empty box is the actual reason introductions do not happen, not because
 * Mentable should write for people.
 */
export function outreachFor(seeker: Seeker, c: Candidate, reasons: Reason[]): string | null {
  const top = reasons[0];
  if (!top) return null;
  const me = seeker.firstName ? `I'm ${seeker.firstName}. ` : '';
  switch (top.kind) {
    case 'transition':
      return `Hi ${c.firstName} — ${me}I'm trying to make the same move you made (${top.evidence[0]}), and I'd value hearing how you thought about it. Would you be open to twenty minutes?`;
    case 'situation':
      return `Hi ${c.firstName} — ${me}I saw you offer to help with ${lowerFirst(top.evidence[0])}, which is exactly where I am right now. Would you have twenty minutes?`;
    case 'intent':
      return `Hi ${c.firstName} — ${me}${seeker.intent?.objective ?? 'I could use some direction'}. You work on ${top.evidence[0]}, so I'd value your read. Would you be open to a short conversation?`;
    case 'company':
      return `Hi ${c.firstName} — ${me}${top.evidence[0]} is somewhere I'm hoping to end up, and I'd value hearing what it's actually like. Would you have twenty minutes?`;
    case 'function':
      return `Hi ${c.firstName} — ${me}I'm exploring ${lowerFirst(top.evidence[0])} and would value hearing how you got into it. Would you be open to a short conversation?`;
    case 'affiliation':
      return `Hi ${c.firstName} — ${me}we're both part of ${top.evidence[0]}, and I'd value hearing how you decided what to do. Would you have twenty minutes?`;
    case 'goal':
      return `Hi ${c.firstName} — ${me}I'm working toward ${(seeker.goals[0] ?? '').replace(/\.$/, '').toLowerCase()}, and it looks like you've done exactly that. Would you be open to a short conversation?`;
    case 'expertise':
      return `Hi ${c.firstName} — ${me}I'm trying to understand ${top.evidence[0]} and saw that's your area. Would you have twenty minutes to talk about what it's actually like?`;
    case 'industry':
      return `Hi ${c.firstName} — ${me}I'm hoping to get into ${top.evidence[0]} and would value hearing how you got there. Would you be open to a short conversation?`;
    case 'school':
      return `Hi ${c.firstName} — ${me}I'm at ${top.evidence[0]} too, and I'd value hearing how you decided what to do after. Would you have twenty minutes?`;
    default:
      return `Hi ${c.firstName} — ${me}I'd value twenty minutes of your time if you can spare it.`;
  }
}

/** Something specific to actually ask, drawn from the strongest reason. */
export function openerFor(c: Candidate, reasons: Reason[]): string | null {
  const top = reasons[0];
  if (!top) return null;
  switch (top.kind) {
    case 'transition':
      return `Ask what they would do differently if they were making that move again today.`;
    case 'situation':
      return `Ask them about ${top.evidence[0]} directly — they listed it as something they help with.`;
    case 'intent':
      return `Ask what they would prioritise first, given the timeline you are working to.`;
    case 'company':
      return `Ask what ${top.evidence[0]} is actually like from the inside, and who else there is worth knowing.`;
    case 'function':
      return `Ask what the day-to-day of ${top.evidence[0]} really involves, and what surprised them.`;
    case 'affiliation':
      return `Ask how ${top.evidence[0]} shaped what they ended up doing.`;
    case 'goal':
      return `Ask how ${c.firstName} would approach it starting from where you are now.`;
    case 'expertise':
      return `Ask what ${top.evidence[0]} actually looks like day to day, and what they wish they had known earlier.`;
    case 'industry':
      return `Ask how people realistically get into ${top.evidence[0]}, and what they would do differently.`;
    case 'school':
      return `Ask what they did after ${top.evidence[0]} and how they decided.`;
    default:
      return `Ask what they would focus on if they were in your position this year.`;
  }
}

/**
 * Rank candidates for one person.
 *
 * Anyone with no reason at all is dropped rather than shown at the bottom.
 * A recommendation Mentable cannot explain is not a recommendation, and
 * padding the list would teach people to ignore it.
 */
export function recommend(
  seeker: Seeker,
  candidates: Candidate[],
  alreadyConnected: Set<string> = new Set(),
  limit = 10,
): Recommendation[] {
  const out: Recommendation[] = [];

  for (const c of candidates) {
    if (ineligible(seeker, c, alreadyConnected)) continue;
    const reasons = reasonsFor(seeker, c);
    if (reasons.length === 0) continue;
    out.push({
      candidate: c,
      reasons,
      score: reasons.reduce((n, r) => n + r.weight, 0),
      opener: openerFor(c, reasons),
      outreach: outreachFor(seeker, c, reasons),
    });
  }

  return out
    // Ties broken by name so the order is stable between page loads.
    .sort((a, b) => b.score - a.score || a.candidate.fullName.localeCompare(b.candidate.fullName))
    .slice(0, limit);
}

/**
 * Why Mentable has nothing to suggest, in terms the person can act on.
 *
 * Distinguishing "we do not know enough about you" from "there is nobody
 * here yet" matters: the first is fixable by the user, the second is not,
 * and telling someone to improve their profile when the network is empty
 * is the kind of small dishonesty that loses trust.
 */
export function emptyReason(seeker: Seeker, candidateCount: number): 'no_members' | 'thin_profile' | 'no_overlap' {
  if (candidateCount === 0) return 'no_members';
  const said = seeker.interests.length + seeker.industries.length + seeker.goals.length;
  if (said < 2) return 'thin_profile';
  return 'no_overlap';
}
