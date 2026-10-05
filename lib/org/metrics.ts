import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Programme engagement, for administrators.
 *
 * THE PRIVACY BOUNDARY, STATED ONCE AND ENFORCED HERE.
 *
 * This file never reads `messages`. Not filtered, not counted, not joined.
 * An administrator can see that a relationship exists, when it last did
 * something, and whether it has gone quiet. They cannot see what was said,
 * and there is no query in this module that could be loosened into showing
 * them. The database agrees: administrators reach these tables only through
 * a service-role route, and `messages` is deliberately absent from every
 * query below.
 *
 * WHAT COUNTS AS ACTIVITY is therefore sessions, goals and action items:
 * the structural record of a relationship rather than its content. A
 * relationship with a session next week is healthy; one with nothing in
 * thirty days needs attention. Both facts are visible without reading a
 * single word two people wrote to each other.
 *
 * NO COMPOSITE SCORES. There is no "engagement score" or "relationship
 * health index" here. Those compress several real facts into one number
 * nobody can act on, and they invite comparing people. The numbers below are
 * counts of things that did or did not happen.
 */

const STALE_DAYS = 30;

export interface ProgramMetrics {
  participants: number;
  mentors: number;
  mentees: number;
  /** Members with no mentorship in this cohort yet. */
  unmatched: number;
  activeMentorships: number;
  sessionsCompleted: number;
  sessionsUpcoming: number;
  goalsCreated: number;
  goalsCompleted: number;
  actionItems: number;
  actionItemsCompleted: number;
  /** Relationships with something logged in the last 30 days. */
  recentlyActive: number;
  /** Active relationships with nothing in 30 days. The list worth acting on. */
  needsAttention: number;
}

export const EMPTY_METRICS: ProgramMetrics = {
  participants: 0, mentors: 0, mentees: 0, unmatched: 0, activeMentorships: 0,
  sessionsCompleted: 0, sessionsUpcoming: 0, goalsCreated: 0, goalsCompleted: 0,
  actionItems: 0, actionItemsCompleted: 0, recentlyActive: 0, needsAttention: 0,
};

/**
 * Metrics for one cohort.
 *
 * Deliberately a handful of scoped queries rather than one view: the cohorts
 * are tens of people, the numbers are read by a human looking at a page, and
 * a readable query that is obviously correct is worth more here than a clever
 * one. If a cohort ever reaches a size where this matters, it becomes a
 * materialised view and the call site does not change.
 */
export async function cohortMetrics(db: SupabaseClient, cohortId: string): Promise<ProgramMetrics> {
  const m = { ...EMPTY_METRICS };
  const since = new Date(Date.now() - STALE_DAYS * 86_400_000).toISOString();

  // ── Membership ────────────────────────────────────────────────────────────
  const { data: members } = await db
    .from('cohort_memberships')
    .select('profile_id, role, state')
    .eq('cohort_id', cohortId)
    .in('state', ['invited', 'active']);

  const active = (members ?? []).filter((x) => x.state === 'active');
  m.participants = (members ?? []).length;
  m.mentors = (members ?? []).filter((x) => x.role === 'mentor').length;
  m.mentees = (members ?? []).filter((x) => x.role === 'mentee').length;

  // ── Relationships scoped to this cohort ───────────────────────────────────
  const { data: rels } = await db
    .from('mentorships')
    .select('id, mentee_id, mentor_id, status, started_at')
    .eq('cohort_id', cohortId);

  const live = (rels ?? []).filter((r) => r.status === 'active');
  m.activeMentorships = live.length;

  const paired = new Set<string>();
  for (const r of rels ?? []) { paired.add(r.mentee_id as string); paired.add(r.mentor_id as string); }
  m.unmatched = active.filter((x) => !paired.has(x.profile_id as string)).length;

  const ids = (rels ?? []).map((r) => r.id as string);
  if (ids.length === 0) return m;

  // ── Structural activity. No message data is read anywhere below. ──────────
  const [sessions, goals, items] = await Promise.all([
    db.from('sessions').select('mentorship_id, status, scheduled_at').in('mentorship_id', ids),
    db.from('mentorship_goals').select('mentorship_id, status, created_at').in('mentorship_id', ids),
    db.from('action_items').select('mentorship_id, is_completed, created_at').in('mentorship_id', ids),
  ]);

  const now = Date.now();
  const sess = sessions.data ?? [];
  m.sessionsCompleted = sess.filter((s) => s.status === 'completed').length;
  m.sessionsUpcoming = sess.filter(
    (s) => s.status === 'scheduled' && new Date(s.scheduled_at as string).getTime() > now,
  ).length;

  const gs = goals.data ?? [];
  m.goalsCreated = gs.length;
  m.goalsCompleted = gs.filter((g) => g.status === 'completed').length;

  const ai = items.data ?? [];
  m.actionItems = ai.length;
  m.actionItemsCompleted = ai.filter((a) => a.is_completed).length;

  // ── Which relationships have moved recently ───────────────────────────────
  const touched = new Set<string>();
  for (const s of sess) if ((s.scheduled_at as string) >= since) touched.add(s.mentorship_id as string);
  for (const g of gs) if ((g.created_at as string) >= since) touched.add(g.mentorship_id as string);
  for (const a of ai) if ((a.created_at as string) >= since) touched.add(a.mentorship_id as string);

  const liveIds = live.map((r) => r.id as string);
  m.recentlyActive = liveIds.filter((id) => touched.has(id)).length;
  m.needsAttention = liveIds.filter((id) => !touched.has(id)).length;

  return m;
}

/** Sum of several cohorts, for an organisation overview. */
export async function sumMetrics(db: SupabaseClient, cohortIds: string[]): Promise<ProgramMetrics> {
  if (cohortIds.length === 0) return { ...EMPTY_METRICS };
  const all = await Promise.all(cohortIds.map((id) => cohortMetrics(db, id)));
  return all.reduce<ProgramMetrics>((acc, x) => {
    (Object.keys(acc) as (keyof ProgramMetrics)[]).forEach((k) => { acc[k] += x[k]; });
    return acc;
  }, { ...EMPTY_METRICS });
}
