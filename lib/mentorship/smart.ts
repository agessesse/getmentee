/**
 * The SMART framework, as a helper rather than a worksheet.
 *
 * WHAT THIS DELIBERATELY IS NOT: a scoring function, a completeness meter, or
 * a validator that refuses to save a goal because the mentee left "Achievable"
 * blank. Every field is optional. The framework is a thinking aid, and an aid
 * that blocks you is an obstacle.
 *
 * CONSOLIDATION IS DETERMINISTIC, NOT GENERATED. The brief asks Mentable to
 * turn five answers into one concise statement the mentee can edit. A
 * language model would do that more fluently and would also occasionally
 * invent a commitment the mentee never made, in their own goal, under their
 * own name. A template cannot. The mentee edits the result either way, so the
 * fluency is worth less than the guarantee.
 */

export interface SmartFields {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  /** ISO date (yyyy-mm-dd). Maps to the existing mentorship_goals.target_date. */
  timebound: string;
}

export const EMPTY_SMART: SmartFields = {
  specific: '', measurable: '', achievable: '', relevant: '', timebound: '',
};

export const SMART_PROMPTS: {
  key: keyof SmartFields;
  label: string;
  prompt: string;
  placeholder: string;
  kind: 'text' | 'date';
}[] = [
  {
    key: 'specific', label: 'Specific',
    prompt: 'What exactly do you want to accomplish?',
    placeholder: 'Understand how Markets recruiting actually works',
    kind: 'text',
  },
  {
    key: 'measurable', label: 'Measurable',
    prompt: 'How will you know you’ve accomplished it?',
    // Kept to two lines at 390px. The longer version ran to three and was
    // clipped mid-word by the two-row textarea.
    placeholder: 'I can explain the difference between Sales, Trading and Strategy',
    kind: 'text',
  },
  {
    key: 'achievable', label: 'Achievable',
    prompt: 'What makes this realistic?',
    placeholder: 'My mentor can introduce me to two people',
    kind: 'text',
  },
  {
    key: 'relevant', label: 'Relevant',
    prompt: 'Why does this matter?',
    placeholder: 'I have to choose a track before applications open',
    kind: 'text',
  },
  {
    key: 'timebound', label: 'Time-bound',
    prompt: 'When will you complete it?',
    placeholder: '',
    kind: 'date',
  },
];

export function isSmartStarted(s: SmartFields): boolean {
  return Object.values(s).some((v) => v.trim() !== '');
}

/** Strip a trailing full stop so templates don't produce "x.. ". */
const clean = (v: string) => v.trim().replace(/\s*\.\s*$/, '');

/**
 * Five answers, one sentence each for title and description.
 *
 * The title is the Specific answer, because that is already the thing the
 * person is trying to say and the workspace card shows the title. The
 * description assembles the rest into prose in the order a person would
 * explain it: why it matters, how you'll know, why it's realistic.
 */
export function consolidate(s: SmartFields): { title: string; description: string } {
  const title = clean(s.specific);

  const parts: string[] = [];
  if (clean(s.relevant)) parts.push(`${clean(s.relevant)}.`);
  if (clean(s.measurable)) parts.push(`You’ll know it’s done when ${lowerFirst(clean(s.measurable))}.`);
  if (clean(s.achievable)) parts.push(`It’s realistic because ${lowerFirst(clean(s.achievable))}.`);

  return { title, description: parts.join(' ') };
}

/*
  Lower-casing the first letter lets an answer written as a standalone
  sentence read correctly after a lead-in ("You'll know it's done when ...").

  THREE THINGS ARE LEFT ALONE, and the first was a real bug caught by the
  test suite:

    "I"        the pronoun. "when i can explain the difference" is wrong
               English, and this is the single most likely way a Measurable
               answer begins.
    acronyms   "UNC recruiting" must not become "uNC recruiting"
    proper nouns, by the same test: a capital in the second position means
               the word is not an ordinary sentence opener.
*/
function lowerFirst(v: string): string {
  if (!v) return v;
  // The pronoun I, alone or contracted (I'm, I've, I'll).
  if (/^I(\s|’|'|$)/.test(v)) return v;
  if (v.length > 1 && /[A-Z]/.test(v[1])) return v;
  return v[0].toLowerCase() + v.slice(1);
}

/** Only persist fields that were actually filled in. */
export function toStored(s: SmartFields): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(s)) if (v.trim()) out[k] = v.trim();
  return Object.keys(out).length ? out : null;
}

export function fromStored(raw: unknown): SmartFields {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_SMART };
  const r = raw as Record<string, unknown>;
  const pick = (k: keyof SmartFields) => (typeof r[k] === 'string' ? (r[k] as string) : '');
  return {
    specific: pick('specific'), measurable: pick('measurable'),
    achievable: pick('achievable'), relevant: pick('relevant'), timebound: pick('timebound'),
  };
}
