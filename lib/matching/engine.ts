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
}

/** One traceable reason, with the evidence that produced it. */
export interface Reason {
  kind: 'expertise' | 'industry' | 'goal' | 'school' | 'place' | 'experience';
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
 * Weights are ordered by how much each signal actually predicts a useful
 * conversation, as far as anyone can tell before there is outcome data:
 * what someone knows beats what industry they are in, which beats where
 * they went to school. School and place are real but weak — they make a
 * first conversation easier, not more useful.
 */
export function reasonsFor(seeker: Seeker, c: Candidate): Reason[] {
  const reasons: Reason[] = [];

  const wants = [...new Set([...seeker.interests, ...seeker.industries])];

  const onExpertise = overlap(c.expertise, wants);
  if (onExpertise.length) {
    reasons.push({
      kind: 'expertise',
      text: `${c.firstName} works in ${list(onExpertise.slice(0, 3))}, which is what you said you want to understand.`,
      evidence: onExpertise,
      weight: 5 * Math.min(onExpertise.length, 3),
    });
  }

  /*
    Only when the industry is not ALREADY the evidence for the expertise
    reason. Otherwise a candidate whose industry equals one of their
    expertise tags earns two sentences that say the same thing with
    different grammar -- "David works in Private Equity" followed by "They
    are in Private Equity" -- which reads as padding and makes the whole
    explanation less believable.
  */
  const industryAlreadySaid = c.industry
    ? onExpertise.some((e) => norm(e) === norm(c.industry!))
    : false;
  if (c.industry && !industryAlreadySaid && overlap([c.industry], wants).length) {
    reasons.push({
      kind: 'industry',
      text: `They are in ${c.industry}, one of the industries you are aiming at.`,
      evidence: [c.industry],
      weight: 4,
    });
  }

  /*
    The strongest signal available, and the one a generic matcher misses:
    the student wrote a sentence about what they are trying to do, and a
    term from the mentor's expertise appears in it. Quoting their own words
    back is also why the explanation reads as true rather than templated.
  */
  for (const goal of seeker.goals) {
    const hits = mentionedIn(goal, [...c.expertise, c.industry ?? '', c.title ?? ''].filter(Boolean));
    if (hits.length) {
      reasons.push({
        kind: 'goal',
        text: `You wrote that you want to ${goal.replace(/^I want to /i, '').replace(/\.$/, '').toLowerCase()} — ${c.firstName} has done exactly that work.`,
        evidence: hits,
        weight: 6,
      });
      break; // one goal reason is enough; three is a wall of text
    }
  }

  if (seeker.university && c.university && norm(seeker.university) === norm(c.university)) {
    reasons.push({
      kind: 'school',
      text: `You both went to ${c.university}.`,
      evidence: [c.university],
      weight: 2,
    });
  }

  if (seeker.location && c.location && norm(seeker.location) === norm(c.location)) {
    reasons.push({
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
    reasons.push({
      kind: 'experience',
      text: `They are ${c.yearsExperience} years in, so the path you are on is recent for them.`,
      evidence: [`${c.yearsExperience} years`],
      weight: 2,
    });
  }

  return reasons.sort((a, b) => b.weight - a.weight);
}

/** Something specific to actually ask, drawn from the strongest reason. */
export function openerFor(c: Candidate, reasons: Reason[]): string | null {
  const top = reasons[0];
  if (!top) return null;
  switch (top.kind) {
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
