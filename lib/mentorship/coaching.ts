/**
 * Mentable's mentorship standard, as the product uses it.
 *
 * None of this is shown as a checklist. It is the source for the short,
 * contextual prompts that appear at the moment they are useful: before a
 * conversation, during it, and after it. Copy rule: write like an experienced
 * person giving someone useful advice. Short, specific, human.
 */

// ─── Session timing ───────────────────────────────────────────────────────────

export type SessionPhase = 'before' | 'during' | 'after' | 'cancelled';

export function sessionPhase(s: { scheduled_at: string; duration_minutes: number | null; status: string }, now = Date.now()): SessionPhase {
  if (s.status === 'cancelled') return 'cancelled';
  if (s.status === 'completed') return 'after';
  const start = new Date(s.scheduled_at).getTime();
  const end = start + (s.duration_minutes ?? 60) * 60_000;
  if (now < start - 10 * 60_000) return 'before';
  if (now <= end + 15 * 60_000) return 'during';
  return 'after';
}

/** A stable pick from a list, so a prompt doesn't change on every render. */
export function pick<T>(list: readonly T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
}

// ─── Mentor ───────────────────────────────────────────────────────────────────

export const MENTOR_DEFAULT_PROMPTS = [
  'Ask for their thinking before giving yours.',
  'Ask what has changed since you last spoke.',
  'Leave them with one clear next step.',
  'Understand what they’re trying to do before you suggest how.',
  'Your experience is one data point. Help them weigh it against others.',
  'If they’re leaning somewhere you wouldn’t go, ask what they’re optimizing for first.',
  'Specific feedback gives someone something they can actually improve.',
  'Challenge the thinking without diminishing the person.',
] as const;

export interface MentorPromptContext {
  seed: string;
  isFirst: boolean;
  menteeName: string;
  openMenteeCommitments: string[];
  completedSinceLast: string[];
  upcomingGoal: { title: string; when: string } | null;
}

/** One prompt, chosen by what is actually true about this relationship right now. */
export function mentorPrompt(c: MentorPromptContext): string {
  if (c.isFirst) return `Ask what would make this relationship useful to ${c.menteeName} before you say what you can offer.`;
  if (c.completedSinceLast.length) return `${c.menteeName} finished “${c.completedSinceLast[0]}”. Ask what they learned doing it.`;
  if (c.openMenteeCommitments.length) return `Before anything new, ask how “${c.openMenteeCommitments[0]}” went.`;
  if (c.upcomingGoal) return `“${c.upcomingGoal.title}” is due ${c.upcomingGoal.when}. Ask where it stands and what’s in the way.`;
  return pick(MENTOR_DEFAULT_PROMPTS, c.seed);
}

/** Questions that build judgment rather than hand over answers. */
export const DEVELOPMENTAL_QUESTIONS = [
  'What are you trying to accomplish?',
  'What have you tried so far?',
  'What are you optimizing for?',
  'What would change your mind?',
  'What would you tell a friend in your position?',
] as const;

// ─── Mentee ───────────────────────────────────────────────────────────────────

export const MENTEE_LISTEN_FOR = [
  'What are they emphasizing?',
  'What mistake are they trying to help you avoid?',
  'What should you ask next?',
] as const;

export const MENTEE_TIPS = [
  'Do the research before asking the question.',
  'Follow-through builds trust faster than another introduction.',
  'Your next update should tell them what happened after their advice.',
  'Come with a point of view. Your mentor can help you sharpen it.',
  'Write down the advice. Then decide what you’ll actually do with it.',
  'If you said you’d do it, come back having done it.',
] as const;

export const MENTOR_TIPS = [
  'Ask before assuming.',
  'Advice lands better once you understand the context.',
  'Remember what mattered to them last time.',
  'Challenge the thinking without diminishing the person.',
  'Your experience is one data point. Help them build their own judgment.',
  'Specific feedback gives someone something they can actually improve.',
] as const;

/** Mentee research checklist. Optional, private, never required. */
export const RESEARCH_CHECKS = [
  { key: 'background', label: 'Looked at their background and career path' },
  { key: 'topic', label: 'Read up on what you want to talk about' },
  { key: 'lastTime', label: 'Reread your notes from last time' },
  { key: 'commitments', label: 'Finished what you said you’d do' },
] as const;

// ─── First conversation ───────────────────────────────────────────────────────

export const FIRST_MEETING_TOPICS = [
  { q: 'Why are we meeting?', detail: 'What the mentee wants to develop, and what the mentor can realistically help with.' },
  { q: 'What are we working toward?', detail: 'One or two goals worth writing down together.' },
  { q: 'How will we work together?', detail: 'How often to meet, how to reach each other between conversations, and what preparation looks like.' },
  { q: 'What stays between us?', detail: 'Agree on confidentiality, and on any topics that are off the table.' },
] as const;
