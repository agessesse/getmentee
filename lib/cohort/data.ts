import 'server-only';
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import { assessHealth, type Health } from '@/lib/cohort/health';
import {
  activation, engagement, execution, progression,
  type Pair, type MeasurePair, type Activation, type Engagement, type Execution, type Progression,
} from '@/lib/cohort/metrics';

/**
 * One cohort, assembled from the tables that already hold it.
 *
 * Service-role, because cohorts, cohort_memberships, cohort_applications and
 * cohort_measures all have RLS on with no policies and no grants: they are
 * operator data, not participant data. Reached only from /admin, which
 * resolves platform admin before this is called.
 *
 * WHAT IT DOES NOT READ: messages. An operator needs to know whether a
 * relationship is alive, not what two people said to each other. Activity
 * recency comes from sessions, goals and commitments, which is the same
 * boundary lib/org/metrics.ts holds, and there is a test asserting it.
 */

export interface PersonRow {
  profileId: string;
  name: string;
  email: string | null;
  state: string;
  acquisitionSource: string | null;
  committedAt: string | null;
  wouldAgain: boolean | null;
  wouldRefer: boolean | null;
  referredBy: string | null;
}

export interface PairRow extends Pair {
  menteeName: string;
  mentorName: string;
  health: Health;
  interventions: string[];
}

export interface CohortView {
  cohort: {
    id: string; name: string; slug: string; term: string | null; status: string;
    targetSize: number | null;
    cadenceDays: number; expectedSessions: number; activationWindowDays: number;
    programName: string | null; organizationName: string | null;
  };
  students: PersonRow[];
  mentors: PersonRow[];
  pairs: PairRow[];
  applications: { role: string; status: string; count: number }[];
  metrics: {
    activation: Activation;
    engagement: Engagement;
    execution: Execution;
    progression: Progression;
  };
  measuresByProfile: MeasurePair[];
  /** True when nothing has happened yet, so the UI can say so plainly. */
  empty: boolean;
}

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Cohorts an operator can look at, newest first. */
export async function listCohorts() {
  const c = db();
  if (!c) return [];
  const { data } = await c
    .from('cohorts')
    .select('id, name, slug, status, term, created_at')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function loadCohort(slugOrId: string): Promise<CohortView | null> {
  const c = db();
  if (!c) return null;

  const byId = /^[0-9a-f-]{36}$/i.test(slugOrId);
  const { data: cohort } = await c
    .from('cohorts')
    .select('id, name, slug, status, term, target_size, expected_cadence_days, expected_sessions, activation_window_days, programs(name, organizations(name, display_name))')
    .eq(byId ? 'id' : 'slug', slugOrId)
    .maybeSingle();
  if (!cohort) return null;

  const program = cohort.programs as unknown as { name: string; organizations: { name: string; display_name: string | null } | null } | null;

  const [{ data: members }, { data: mentorships }, { data: apps }, { data: measures }] = await Promise.all([
    c.from('cohort_memberships')
      .select('profile_id, role, state, acquisition_source, commitment_accepted_at, would_again, would_refer, referred_by')
      .eq('cohort_id', cohort.id),
    c.from('mentorships')
      .select('id, mentee_id, mentor_id, started_at, created_at, status')
      .eq('cohort_id', cohort.id),
    c.from('cohort_applications').select('role, status').eq('cohort_id', cohort.id),
    c.from('cohort_measures')
      .select('profile_id, role, phase, career_clarity, recruiting_knowledge, preparation, confidence, reachable_contacts, applications_count, interviews_count, offers_count, introductions_count')
      .eq('cohort_id', cohort.id),
  ]);

  const memberRows = members ?? [];
  const msRows = mentorships ?? [];
  const profileIds = [
    ...new Set([
      ...memberRows.map((m) => m.profile_id),
      ...msRows.flatMap((m) => [m.mentee_id, m.mentor_id]),
    ]),
  ];

  const { data: people } = profileIds.length
    ? await c.from('profiles').select('id, first_name, last_name, email').in('id', profileIds)
    : { data: [] };
  const nameOf = (id: string) => {
    const p = (people ?? []).find((x) => x.id === id);
    return [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Unnamed';
  };
  const emailOf = (id: string) => (people ?? []).find((x) => x.id === id)?.email ?? null;

  // Per-mentorship detail. Only fetched when there are mentorships at all.
  const msIds = msRows.map((m) => m.id);
  const [{ data: sessions }, { data: goals }, { data: items }] = msIds.length
    ? await Promise.all([
        c.from('sessions').select('id, mentorship_id, scheduled_at, status, intervention').in('mentorship_id', msIds),
        c.from('mentorship_goals').select('id, mentorship_id, status, created_at').in('mentorship_id', msIds),
        c.from('action_items').select('id, mentorship_id, is_completed, due_date, completed_at, created_at').in('mentorship_id', msIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const now = Date.now();
  const pairs: PairRow[] = msRows.map((m) => {
    const mine = (sessions ?? []).filter((s) => s.mentorship_id === m.id);
    const done = mine.filter((s) => s.status === 'completed').map((s) => ({ at: s.scheduled_at }));
    const upcoming = mine
      .filter((s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() > now)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0] ?? null;

    const myGoals = (goals ?? []).filter((g) => g.mentorship_id === m.id);
    const myItems = (items ?? []).filter((i) => i.mentorship_id === m.id);
    const overdue = myItems.filter(
      (i) => !i.is_completed && i.due_date && new Date(i.due_date).getTime() < now,
    ).length;

    /*
      Activity recency, from things both people did together. Deliberately
      NOT messages: an operator should be able to see that a relationship
      has gone quiet without being able to read it.
    */
    const stamps = [
      ...mine.map((s) => s.scheduled_at),
      ...myGoals.map((g) => g.created_at),
      ...myItems.map((i) => i.completed_at ?? i.created_at),
    ].filter(Boolean) as string[];
    const lastActivityAt = stamps.length
      ? new Date(Math.max(...stamps.map((s) => new Date(s).getTime()))).toISOString()
      : null;

    const matchedAt = m.started_at ?? m.created_at;
    const base: Pair = {
      mentorshipId: m.id,
      matchedAt,
      completedSessions: done,
      nextSessionAt: upcoming?.scheduled_at ?? null,
      commitmentsCreated: myItems.length,
      commitmentsCompleted: myItems.filter((i) => i.is_completed).length,
      goalsCreated: myGoals.length,
      goalsReached: myGoals.filter((g) => g.status === 'completed').length,
      completed: m.status === 'completed',
    };

    return {
      ...base,
      menteeName: nameOf(m.mentee_id),
      mentorName: nameOf(m.mentor_id),
      interventions: [...new Set(mine.flatMap((s) => (s.intervention as string[]) ?? []))],
      health: assessHealth({
        matchedAt,
        completedSessions: done,
        nextSessionAt: base.nextSessionAt,
        overdueCommitments: overdue,
        lastActivityAt,
        // No rematch field yet; withdrawal is the signal that exists today.
        rematchRequested: false,
        completed: base.completed,
        cadenceDays: cohort.expected_cadence_days,
        activationWindowDays: cohort.activation_window_days,
        expectedSessions: cohort.expected_sessions,
      }, now),
    };
  });

  const toPerson = (m: typeof memberRows[number]): PersonRow => ({
    profileId: m.profile_id,
    name: nameOf(m.profile_id),
    email: emailOf(m.profile_id),
    state: m.state,
    acquisitionSource: m.acquisition_source,
    committedAt: m.commitment_accepted_at,
    wouldAgain: m.would_again,
    wouldRefer: m.would_refer,
    referredBy: m.referred_by ? nameOf(m.referred_by) : null,
  });

  // Baseline/endline, paired per student.
  const byProfile = new Map<string, MeasurePair>();
  for (const row of measures ?? []) {
    if (row.role !== 'mentee') continue;
    const entry = byProfile.get(row.profile_id) ?? { profileId: row.profile_id, baseline: null, endline: null };
    const m = {
      careerClarity: row.career_clarity, recruitingKnowledge: row.recruiting_knowledge,
      preparation: row.preparation, confidence: row.confidence,
      reachableContacts: row.reachable_contacts, applications: row.applications_count,
      interviews: row.interviews_count, offers: row.offers_count, introductions: row.introductions_count,
    };
    if (row.phase === 'baseline') entry.baseline = m; else entry.endline = m;
    byProfile.set(row.profile_id, entry);
  }
  // Every enrolled student counts in the denominator, including those who
  // never filled anything in. Otherwise "100% measured" means "the one
  // student who replied".
  for (const m of memberRows.filter((x) => x.role === 'mentee')) {
    if (!byProfile.has(m.profile_id)) byProfile.set(m.profile_id, { profileId: m.profile_id, baseline: null, endline: null });
  }
  const measuresByProfile = [...byProfile.values()];

  const appCounts = new Map<string, number>();
  for (const a of apps ?? []) {
    const k = `${a.role}|${a.status}`;
    appCounts.set(k, (appCounts.get(k) ?? 0) + 1);
  }

  return {
    cohort: {
      id: cohort.id, name: cohort.name, slug: cohort.slug, term: cohort.term,
      status: cohort.status, targetSize: cohort.target_size,
      cadenceDays: cohort.expected_cadence_days,
      expectedSessions: cohort.expected_sessions,
      activationWindowDays: cohort.activation_window_days,
      programName: program?.name ?? null,
      organizationName: program?.organizations?.display_name ?? program?.organizations?.name ?? null,
    },
    students: memberRows.filter((m) => m.role === 'mentee').map(toPerson),
    mentors: memberRows.filter((m) => m.role === 'mentor').map(toPerson),
    pairs,
    applications: [...appCounts.entries()].map(([k, count]) => {
      const [role, status] = k.split('|');
      return { role, status, count };
    }),
    metrics: {
      activation: activation(pairs, cohort.activation_window_days, now),
      engagement: engagement(pairs, cohort.expected_cadence_days, cohort.expected_sessions, now),
      execution: execution(pairs),
      progression: progression(measuresByProfile),
    },
    measuresByProfile,
    empty: memberRows.length === 0 && msRows.length === 0 && (apps ?? []).length === 0,
  };
}
