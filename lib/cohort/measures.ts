/**
 * The baseline and endline questions.
 *
 * SHORT ON PURPOSE. Six questions before the first conversation, the same
 * six at the end plus five open ones. A long survey gets abandoned, and an
 * abandoned baseline is worse than no baseline because it makes the cohort
 * look measured when it is not.
 *
 * THE SCALES ARE SELF-REPORTS AND ARE LABELLED AS SUCH EVERYWHERE. A student
 * moving from 2 to 4 on career clarity is that student's own account of
 * their own confidence. It is worth knowing and it is not evidence on its
 * own, which is why the countable questions sit beside it: how many people
 * could you actually call, how many interviews did you have. Those are
 * checkable, and they are what a sceptical reader should look at first.
 */

export interface ScaleQuestion {
  key: 'career_clarity' | 'recruiting_knowledge' | 'preparation' | 'confidence';
  label: string;
  prompt: string;
  /** What 1 and 5 actually mean, so the numbers mean something consistent. */
  low: string;
  high: string;
}

export const SCALES: ScaleQuestion[] = [
  {
    key: 'career_clarity', label: 'Career clarity',
    prompt: 'How clear are you on which path you want and why?',
    low: 'No idea which path', high: 'Clear on the path and the reasons',
  },
  {
    key: 'recruiting_knowledge', label: 'Recruiting knowledge',
    prompt: 'How well do you understand the timelines and what is expected?',
    low: 'Don’t know how it works', high: 'Know the timeline and the steps',
  },
  {
    key: 'preparation', label: 'Preparation',
    prompt: 'Resume, behavioural and technical preparation taken together.',
    low: 'Not started', high: 'Ready to interview',
  },
  {
    key: 'confidence', label: 'Confidence',
    prompt: 'How capable do you feel of navigating this process?',
    low: 'Out of my depth', high: 'I know what to do next',
  },
];

export interface CountQuestion {
  key: 'reachable_contacts' | 'applications_count' | 'interviews_count' | 'offers_count' | 'introductions_count';
  label: string;
  prompt: string;
  /** Asked at the endline only. */
  endlineOnly?: boolean;
}

export const COUNTS: CountQuestion[] = [
  {
    key: 'reachable_contacts', label: 'People you could ask',
    prompt: 'How many people in this field could you realistically contact today for honest advice?',
  },
  { key: 'applications_count', label: 'Applications', prompt: 'Applications submitted so far.' },
  { key: 'interviews_count', label: 'Interviews', prompt: 'Interviews you have had.' },
  { key: 'offers_count', label: 'Offers', prompt: 'Offers received.' },
  {
    key: 'introductions_count', label: 'Introductions',
    prompt: 'Introductions someone made for you.', endlineOnly: true,
  },
];

export interface OpenQuestion {
  key: 'what_changed' | 'mentor_helped_with' | 'would_not_have_happened' | 'most_valuable' | 'should_change';
  prompt: string;
  /** For the mentor's version of the endline. */
  mentorPrompt?: string;
}

/*
  The endline's open questions, and the third one is the important one.
  "What would likely not have happened without this relationship" is the
  closest an honest product can get to contribution without claiming
  causality, and it is the sentence a case study gets written from.
*/
export const OPEN: OpenQuestion[] = [
  { key: 'what_changed', prompt: 'What changed over the semester?', mentorPrompt: 'What changed in the student?' },
  { key: 'mentor_helped_with', prompt: 'What did your mentor specifically help you do?', mentorPrompt: 'Where did they execute well?' },
  { key: 'would_not_have_happened', prompt: 'What would likely not have happened without this relationship?', mentorPrompt: 'Where did the relationship struggle?' },
  { key: 'most_valuable', prompt: 'What was most valuable?', mentorPrompt: 'What would make Mentable easier to use?' },
  { key: 'should_change', prompt: 'What should change?', mentorPrompt: 'Anything else we should know?' },
];
