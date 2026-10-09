/**
 * Is this mentorship relationship actually working?
 *
 * DETERMINISTIC AND EXPLAINABLE. No model, no weights, no proprietary score.
 * Every status comes with the reasons that produced it, and an operator can
 * read those reasons and disagree. A number between 0 and 100 would look more
 * sophisticated and would be less useful: nobody can act on "67".
 *
 * THE RULES ARE ORDERED BY SEVERITY and the first match wins, because a pair
 * that never met and also has an overdue commitment has one problem, not two,
 * and the first one is the only one worth saying.
 *
 * Thresholds come from the cohort, not from this file. A programme that
 * expects monthly conversations should not be told it is overdue at three
 * weeks because Cohort 001 said so.
 */

export type HealthStatus = 'on_track' | 'needs_attention' | 'at_risk' | 'completed' | 'not_started';

export interface HealthInput {
  /** When the pair was matched. */
  matchedAt: string;
  /** Completed conversations, in any order; the latest is found by date. */
  completedSessions: { at: string }[];
  /** The next scheduled conversation, if any. */
  nextSessionAt: string | null;
  /** Open commitments with a due date in the past. */
  overdueCommitments: number;
  /** Most recent activity of any kind: message, session, commitment. */
  lastActivityAt: string | null;
  /** Someone asked to be rematched. */
  rematchRequested: boolean;
  /** The relationship finished the cohort. */
  completed: boolean;
  /** Cohort expectations. */
  cadenceDays: number;
  activationWindowDays: number;
  expectedSessions: number;
}

export interface Health {
  status: HealthStatus;
  /** Why, in the order that decided it. Shown to the operator verbatim. */
  reasons: string[];
  /** The single most useful thing to do about it, or null when nothing. */
  action: string | null;
  sessionsCompleted: number;
  daysSinceLastSession: number | null;
  daysSinceActivity: number | null;
}

const DAY = 86_400_000;
const daysSince = (iso: string | null, now: number): number | null =>
  iso ? Math.floor((now - new Date(iso).getTime()) / DAY) : null;

export function assessHealth(input: HealthInput, now = Date.now()): Health {
  const sessions = input.completedSessions.length;
  // By date, not by array position. See the note in metrics.ts.
  const lastSession = input.completedSessions.length
    ? new Date(Math.max(...input.completedSessions.map((s) => new Date(s.at).getTime()))).toISOString()
    : null;
  const sinceSession = daysSince(lastSession, now);
  const sinceActivity = daysSince(input.lastActivityAt, now);
  const sinceMatch = Math.floor((now - new Date(input.matchedAt).getTime()) / DAY);

  const base = {
    sessionsCompleted: sessions,
    daysSinceLastSession: sinceSession,
    daysSinceActivity: sinceActivity,
  };

  if (input.completed) {
    return { status: 'completed', reasons: [`Completed with ${sessions} conversations.`], action: null, ...base };
  }

  /*
    A rematch request outranks everything. It is the one signal that came
    from a person rather than from arithmetic, and it means the pairing
    itself is the problem.
  */
  if (input.rematchRequested) {
    return {
      status: 'at_risk',
      reasons: ['A rematch was requested.'],
      action: 'Talk to both of them before rematching.',
      ...base,
    };
  }

  // Never started.
  if (sessions === 0) {
    if (sinceMatch > input.activationWindowDays) {
      return {
        status: 'at_risk',
        reasons: [`Matched ${sinceMatch} days ago and they have not spoken yet.`],
        action: input.nextSessionAt
          ? 'A first conversation is booked. Check it actually happens.'
          : 'Introduce them again, or ask what is blocking the first conversation.',
        ...base,
      };
    }
    return {
      status: 'not_started',
      reasons: [
        `Matched ${sinceMatch} day${sinceMatch === 1 ? '' : 's'} ago.`,
        input.nextSessionAt ? 'First conversation is booked.' : 'No first conversation booked yet.',
      ],
      action: input.nextSessionAt ? null : 'Nudge them to book the first conversation.',
      ...base,
    };
  }

  const reasons: string[] = [];
  let status: HealthStatus = 'on_track';
  let action: string | null = null;

  /*
    Overdue against the cohort's own cadence. 1.5x is the point at which a
    gap stops being "life happened" and starts being a pattern; at exactly
    one cadence period a pair is merely due, which is not a problem.
  */
  const overdueBy = sinceSession !== null ? sinceSession - input.cadenceDays : 0;
  if (sinceSession !== null && sinceSession > input.cadenceDays * 1.5) {
    status = 'at_risk';
    reasons.push(`${sinceSession} days since their last conversation, against a ${input.cadenceDays}-day cadence.`);
    action = 'Check in with both of them.';
  } else if (overdueBy > 0 && !input.nextSessionAt) {
    status = 'needs_attention';
    reasons.push(`Due for a conversation and nothing is scheduled.`);
    action = 'Ask them to book the next one.';
  }

  if (sinceActivity !== null && sinceActivity > 30 && status === 'on_track') {
    status = 'needs_attention';
    reasons.push(`No activity of any kind for ${sinceActivity} days.`);
    action = 'Check the relationship is still alive.';
  }

  if (input.overdueCommitments >= 2) {
    if (status === 'on_track') status = 'needs_attention';
    reasons.push(`${input.overdueCommitments} commitments are past their date.`);
    action = action ?? 'Ask whether the commitments are still realistic.';
  }

  if (status === 'on_track') {
    reasons.push(`${sessions} conversation${sessions === 1 ? '' : 's'} so far.`);
    if (input.nextSessionAt) reasons.push('Next one is booked.');
    else if (sinceSession !== null) reasons.push(`Last spoke ${sinceSession} days ago, within cadence.`);
  }

  return { status, reasons, action, ...base };
}

export const HEALTH_LABEL: Record<HealthStatus, string> = {
  on_track: 'On track',
  needs_attention: 'Needs attention',
  at_risk: 'At risk',
  completed: 'Completed',
  not_started: 'Not started',
};

/** Worst first: the list exists to be worked through from the top. */
export const HEALTH_ORDER: HealthStatus[] = ['at_risk', 'needs_attention', 'not_started', 'on_track', 'completed'];

export function healthRank(s: HealthStatus): number {
  return HEALTH_ORDER.indexOf(s);
}
