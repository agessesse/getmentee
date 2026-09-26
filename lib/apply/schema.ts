/**
 * The application, defined once.
 *
 * WHY THIS FILE EXISTS. The previous form validated in the component and again
 * in the route, with the two lists of questions written out separately and a
 * comment asking future editors to keep them in step. Two roles and eleven more
 * fields is where that stops being survivable, so the questions, their limits
 * and their database columns are declared here and imported by both sides.
 * Editing a question is now one edit.
 *
 * No 'server-only' guard: this is deliberately isomorphic, and it holds nothing
 * secret. It describes a public form.
 *
 * WHAT IT DOES NOT DO. Score, rank, or weight anything. Every question is
 * required because a half-finished application is not useful to read, not
 * because length is being measured. The minimums exist so "idk" cannot pass;
 * they are one considered sentence, not an essay, and nothing anywhere
 * compares one applicant's answers against another's.
 */

export type Role = 'mentee' | 'mentor';

export const ROLES: Role[] = ['mentee', 'mentor'];

export const isRole = (v: unknown): v is Role =>
  typeof v === 'string' && (ROLES as string[]).includes(v);

/** A short text input. */
export interface Field {
  name: string;
  /** Database column. Equal to `name` unless history forced otherwise. */
  column: string;
  label: string;
  hint?: string;
  type?: 'text' | 'email' | 'url';
  placeholder?: string;
  max: number;
  /** Fixed list of allowed values; renders as a choice rather than an input. */
  options?: readonly string[];
}

/** A written answer. */
export interface Question extends Field {
  rows: number;
  min: number;
}

const MAX_ANSWER = 2000;

/* ── Where someone is, for a student ────────────────────────────────────────
   Context for deciding what kind of mentorship would help, never a ranking.
   A fixed list because the form offers a list: a value outside it means the
   request did not come from the form. */
export const YEARS = [
  'First year',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate student',
  'Recent graduate',
  'Other',
] as const;

/* ── How much a mentor wants to take on ─────────────────────────────────────
   Phrased as shapes of relationship, never as hours. "Two hours a month" turns
   a person into a unit of supply and invites measuring them against it later;
   "a monthly conversation" describes the same commitment as something a human
   would actually say. The first option is deliberately the smallest one, so
   the least available mentor sees something they can honestly pick first. */
export const INVOLVEMENT = [
  'Occasional questions, answered when I can',
  'A conversation about once a month',
  'A few conversations around one specific goal',
  'Open to an ongoing mentorship',
] as const;

export const MENTEE_BASICS: Field[] = [
  { name: 'full_name', column: 'full_name', label: 'Your name', max: 120, placeholder: 'First and last' },
  { name: 'email', column: 'email', label: 'Email', type: 'email', max: 320, placeholder: 'you@university.edu' },
  { name: 'school', column: 'school', label: 'Where you study', max: 160, placeholder: 'Your school or university' },
  { name: 'year', column: 'year', label: 'Where you are right now', max: 40, options: YEARS },
];

export const MENTOR_BASICS: Field[] = [
  { name: 'full_name', column: 'full_name', label: 'Your name', max: 120, placeholder: 'First and last' },
  { name: 'email', column: 'email', label: 'Email', type: 'email', max: 320, placeholder: 'you@company.com' },
  { name: 'title', column: 'title', label: 'Your role', max: 160, placeholder: 'e.g. Director of Engineering' },
  { name: 'organization', column: 'organization', label: 'Where you work', max: 160, placeholder: 'Company or organisation' },
  {
    name: 'location', column: 'location', label: 'Where you are based', max: 160,
    placeholder: 'City, or remote',
    hint: 'Used to suggest sensible times, never to filter you out.',
  },
  {
    name: 'linkedin_url', column: 'linkedin_url', label: 'LinkedIn', type: 'url', max: 400,
    placeholder: 'linkedin.com/in/…',
    hint: 'So we can see your background without asking you to retype it.',
  },
  {
    name: 'expertise', column: 'expertise', label: 'Areas of experience', max: 600,
    placeholder: 'e.g. fixed income, hiring, going from analyst to associate',
    hint: 'A few words each, separated by commas.',
  },
];

/* ── The written questions ──────────────────────────────────────────────────

   MENTEE. Five, and each one is hard to answer generically. Deliberately not
   asked: internships, firms, GPA or achievements, which would select for the
   head start Mentable exists to reduce. `already_done` is the strongest of the
   set, because effort already spent is a fact about the past and someone
   expecting a mentor to do the work has nothing to write there.

   Column names are the originals from migration 0024. Renaming a column to
   match a question's wording is a schema change in exchange for nothing, so
   the mapping lives here instead. */
export const MENTEE_QUESTIONS: Question[] = [
  {
    name: 'working_toward', column: 'learning',
    label: 'What are you working toward right now?',
    hint: 'A goal, a decision you are stuck on, an industry or skill you are trying to understand. It does not have to be a career plan.',
    rows: 4, min: 80, max: MAX_ANSWER,
  },
  {
    name: 'help_with', column: 'why_mentor',
    label: 'What would you want a mentor’s help with?',
    hint: 'The part you cannot work out on your own is the useful answer here.',
    rows: 4, min: 80, max: MAX_ANSWER,
  },
  {
    name: 'timely', column: 'timely',
    label: 'Why is mentorship useful to you right now?',
    hint: 'What makes this the moment. A decision coming up, a deadline, something you have just started.',
    rows: 3, min: 60, max: MAX_ANSWER,
  },
  {
    name: 'already_done', column: 'tried',
    label: 'What have you already done on your own?',
    hint: 'Reading, classes, clubs, side projects, conversations, applications. Small counts, and being honest that it is early counts too.',
    rows: 4, min: 80, max: MAX_ANSWER,
  },
  {
    name: 'good_mentee', column: 'good_mentee',
    label: 'What would make you good to mentor?',
    hint: 'Preparation, following through, taking feedback, asking real questions. Say what is actually true of you.',
    rows: 3, min: 60, max: MAX_ANSWER,
  },
];

/* MENTOR. Four written answers plus a cadence. Kept shorter than the student
   side on purpose: a busy professional filling this in on a phone between
   meetings is the realistic case, and the questions that matter are what they
   can help with and what they expect. */
export const MENTOR_QUESTIONS: Question[] = [
  {
    name: 'help_with', column: 'why_mentor',
    label: 'What could you genuinely help someone with?',
    hint: 'The things you would be glad to be asked about, not your whole CV.',
    rows: 4, min: 80, max: MAX_ANSWER,
  },
  {
    name: 'who_help', column: 'who_help',
    label: 'Who are you most interested in helping?',
    hint: 'For example: students exploring your field, people preparing to enter it, early-career professionals, or someone making a particular transition.',
    rows: 3, min: 60, max: MAX_ANSWER,
  },
  {
    name: 'why_mentoring', column: 'why_mentoring',
    label: 'Why are you interested in mentoring?',
    hint: 'A sentence or two is plenty.',
    rows: 3, min: 50, max: MAX_ANSWER,
  },
  {
    name: 'good_relationship', column: 'good_relationship',
    label: 'What does a useful mentoring relationship look like to you?',
    hint: 'What you would want from the student, and what you would not want to be asked for.',
    rows: 4, min: 80, max: MAX_ANSWER,
  },
];

export const MENTOR_CHOICE: Field = {
  name: 'involvement', column: 'involvement',
  label: 'What level of involvement feels realistic?',
  hint: 'You can change this later, and nothing here is a commitment to a schedule.',
  max: 120, options: INVOLVEMENT,
};

export const basicsFor = (role: Role) => (role === 'mentor' ? MENTOR_BASICS : MENTEE_BASICS);
export const questionsFor = (role: Role) => (role === 'mentor' ? MENTOR_QUESTIONS : MENTEE_QUESTIONS);
export const choicesFor = (role: Role): Field[] => (role === 'mentor' ? [MENTOR_CHOICE] : []);

/** Every field the form collects for a role, in the order it is asked. */
export const allFieldsFor = (role: Role): Field[] => [
  ...basicsFor(role),
  ...questionsFor(role),
  ...choicesFor(role),
];

/**
 * One validator, used by the form and again by the route.
 *
 * Returns the first problem as { field, message } so the caller can put the
 * message next to the input it belongs to and move focus there. A generic
 * "please complete all fields" makes someone hunt.
 */
export function validate(
  role: Role,
  data: Record<string, unknown>,
): { field: string; message: string } | null {
  const get = (n: string) => (typeof data[n] === 'string' ? (data[n] as string).trim() : '');

  for (const f of basicsFor(role)) {
    const v = get(f.name);
    if (!v) return { field: f.name, message: `Please add ${f.label.toLowerCase()}.` };
    if (v.length > f.max) return { field: f.name, message: `${f.label} is too long.` };
    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return { field: f.name, message: 'Please add an email address we can reply to.' };
    }
    // Accepts a bare linkedin.com/in/… as well as a full URL, because that is
    // what people paste.
    if (f.type === 'url' && !/^(https?:\/\/)?([\w-]+\.)*linkedin\.com\/.+/i.test(v)) {
      return { field: f.name, message: 'Please add a LinkedIn profile URL.' };
    }
    if (f.options && !(f.options as readonly string[]).includes(v)) {
      return { field: f.name, message: `Please choose ${f.label.toLowerCase()}.` };
    }
  }

  for (const q of questionsFor(role)) {
    const v = get(q.name);
    if (!v) return { field: q.name, message: `Please answer: ${q.label}` };
    if (v.length < q.min) {
      return { field: q.name, message: `Could you say a little more here? A sentence or two is plenty.` };
    }
    if (v.length > q.max) return { field: q.name, message: 'That answer is longer than we can store.' };
  }

  for (const c of choicesFor(role)) {
    const v = get(c.name);
    if (!v) return { field: c.name, message: `Please choose ${c.label.toLowerCase()}.` };
    if (c.options && !(c.options as readonly string[]).includes(v)) {
      return { field: c.name, message: `Please choose ${c.label.toLowerCase()}.` };
    }
  }

  return null;
}

/** Form field names mapped onto their database columns, for the route. */
export function toColumns(role: Role, data: Record<string, unknown>): Record<string, string> {
  const row: Record<string, string> = { role };
  for (const f of allFieldsFor(role)) {
    const v = typeof data[f.name] === 'string' ? (data[f.name] as string).trim() : '';
    if (v) row[f.column] = f.name === 'email' ? v.toLowerCase() : v;
  }
  return row;
}
