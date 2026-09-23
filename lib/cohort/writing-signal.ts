/**
 * A writing signal for founding cohort applications, for a human reviewer.
 *
 * WHAT THIS IS NOT. It is not an AI detector, and nothing here should be
 * described as one. There is no reliable way to determine whether text was
 * written by a model, and the published tools that claim to do it are wrong
 * often enough that OpenAI withdrew its own. The failure is not evenly
 * distributed either: the writing most often misread as machine-generated is
 * careful, formal, and structurally even, which describes a great deal of
 * writing by people for whom English is a second language. A tool that
 * penalises that would select against exactly the students Mentable exists for.
 *
 * WHAT IT ACTUALLY MEASURES. Specificity, not authorship. The three questions
 * ask what someone is working toward, what they want help thinking through,
 * and what they have already done. Good answers to those are full of
 * particulars: a course, a company, a date, a number, a thing that went wrong.
 * Generic answers are not, whoever or whatever produced them. An applicant who
 * writes three paragraphs of fluent, agreeable, entirely non-specific prose is
 * worth a closer read regardless of how it was produced, and an applicant who
 * writes four plain sentences naming real things is not.
 *
 * So the signal answers "is there anything concrete in here?" — a question
 * that is fair to everyone, checkable by eye, and useful to a reviewer.
 *
 * HOW IT IS ALLOWED TO BE USED. As one line in a reviewer's view, with its
 * reasoning shown, next to the answers themselves. It never sorts, filters,
 * hides, flags, scores or changes an application's status, and nothing
 * automated ever reads it. The original answers are the source of truth and
 * are never modified.
 */

export type SignalLevel = 'low' | 'unclear' | 'elevated';

export interface WritingSignal {
  level: SignalLevel;
  /** One sentence a reviewer can act on, always ending in "read it yourself". */
  summary: string;
  /** The specific observations behind the level, in plain language. */
  notes: string[];
}

/* Markers of a concrete answer: named things, numbers, dates, first-person
   action. Deliberately simple and inspectable. */
const CONCRETE = [
  /\b\d{4}\b/,                                   // a year
  /\b\d+\s*(hours?|weeks?|months?|years?|times?)\b/i,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  /\b(spring|summer|fall|autumn|winter)\b/i,
  /\b(class|course|professor|club|internship|project|job|shift|team|major|lab|competition)\b/i,
  /\bI (built|wrote|read|made|joined|applied|emailed|asked|started|tried|failed|took|ran|called|shadowed)\b/i,
];

/* Phrases that fill space without saying anything. Generic writing is the
   thing being noticed, whoever produced it. */
const FILLER = [
  /\bpassionate about\b/i,
  /\bdelve into\b/i,
  /\bnavigate the complexities\b/i,
  /\bin today'?s (fast[- ]paced|competitive|ever[- ]changing)\b/i,
  /\bvaluable insights?\b/i,
  /\bwealth of (knowledge|experience)\b/i,
  /\bleverage\b/i,
  /\bhone my skills\b/i,
  /\binvaluable\b/i,
  /\bmultifaceted\b/i,
  /\bholistic\b/i,
  /\bI am eager to\b/i,
  /\bfurthermore\b/i,
  /\bmoreover\b/i,
  /\bin conclusion\b/i,
];

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean);

export function writingSignal(answers: (string | null | undefined)[]): WritingSignal {
  const texts = answers.map((a) => (a ?? '').trim()).filter(Boolean);

  if (texts.length === 0) {
    return { level: 'unclear', summary: 'No written answers to look at.', notes: [] };
  }

  const joined = texts.join('\n');
  const notes: string[] = [];

  const concreteHits = CONCRETE.filter((re) => re.test(joined)).length;
  const fillerHits = FILLER.filter((re) => re.test(joined)).map((re) => re.source);
  const totalWords = words(joined).length;

  if (concreteHits >= 3) {
    notes.push('Answers name specific things: courses, people, dates, or actions already taken.');
  } else if (concreteHits === 0) {
    notes.push('Nothing specific is named. No course, club, project, date, or action the applicant took.');
  } else {
    notes.push('Only one or two specific details across all three answers.');
  }

  if (fillerHits.length >= 3) {
    notes.push(`Several stock phrases appear (${fillerHits.length} of a common list).`);
  } else if (fillerHits.length > 0) {
    notes.push('A stock phrase or two, which on its own means very little.');
  }

  if (totalWords < 60) {
    notes.push('Very short overall, so there is not much to judge either way.');
  }

  /*
    Three levels, and the middle one is the honest default. "Elevated" requires
    both an absence of anything concrete and the presence of filler, because
    either alone is weak evidence: plenty of sincere applicants write plainly,
    and plenty of specific writers use a stock phrase.
  */
  let level: SignalLevel = 'unclear';
  if (concreteHits >= 3 && fillerHits.length <= 1) level = 'low';
  else if (concreteHits === 0 && (fillerHits.length >= 2 || totalWords > 180)) level = 'elevated';

  const summary =
    level === 'low'
      ? 'Low signal. The answers contain specific, checkable detail. Read them yourself before drawing any conclusion.'
      : level === 'elevated'
        ? 'Elevated signal. The answers are fluent but name nothing specific, which is worth a closer look. This is not evidence of anything on its own. Read them yourself before drawing any conclusion.'
        : 'Unclear. Nothing stands out in either direction. Read the answers yourself before drawing any conclusion.';

  return { level, summary, notes };
}
