/**
 * One loader for both dashboards.
 *
 * Mentor and mentee used to read the same tables in two different files, with
 * two different shapes and two different ideas of what "last session" meant.
 * That is how the two sides drift apart. Everything either dashboard knows now
 * comes from here, normalised into the Relationship shape that
 * lib/mentorship/next-action.ts reasons over.
 *
 * Shape of the work: three round trips, not one per row.
 *   1. the person's own rows (mentorships, requests, and role extras)
 *   2. everything hanging off them, batched by id (people, goals, action
 *      items, sessions, origin requests, newest message per thread)
 *   3. the private notebooks for the sessions that matter
 *
 * Everything is a row this user can already read under RLS. Nothing is
 * invented, defaulted to a plausible-looking value, or attributed to a person
 * who did not do it: a missing profile becomes "Former member" and a missing
 * note stays null.
 */

import { createClient } from '@/lib/supabase/client';
import { loadNotebooks, hasPrep, hasReflection } from '@/lib/mentorship/notebook';
import { displayName, firstName } from '@/lib/display-name';
import type { Relationship, Person, Commitment, Goal } from '@/lib/mentorship/next-action';

export interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  university: string | null;
}

export interface PendingRequestRow {
  id: string;
  personId: string;
  person: ProfileRow | null;
  name: string;
  message: string | null;
  goals: string | null;
  createdAt: string;
}

export interface MentorReadiness {
  isAvailable: boolean;
  maxMentees: number;
  expertise: string[];
  availabilityDays: number[];
  isFoundingMentor: boolean;
}

/** Extra context the relationship card shows but the decision logic ignores. */
export interface RelationshipExtras {
  /** Partner's id, for profile links. */
  partnerId: string;
  subtitle: string | null;
  /** Goals reached, for the "along the way" line. */
  reachedGoals: Goal[];
  /** Everything that happened after the last conversation. */
  since: { key: string; text: string; done: boolean; at: string }[];
  /** The viewer's own private "remember next time" note. Never the other person's. */
  privateNote: string | null;
  totalActions: number;
  doneActions: number;
}

export interface DashboardData {
  role: 'mentor' | 'mentee';
  relationships: Relationship[];
  extras: Map<string, RelationshipExtras>;
  requests: PendingRequestRow[];
  /** Mentor only. */
  readiness: MentorReadiness | null;
  /** Mentee only: how many saved mentors they have. */
  savedMentors: number;
  /**
   * Mentee only: mentors with a real account who are open to requests today.
   * Counted with exactly the roster rule Discover uses, so the dashboard can
   * never promise a reachable mentor that Discover then cannot show.
   */
  contactableMentors: number;
}

interface GoalRow {
  id: string; mentorship_id: string; title: string;
  status: 'active' | 'completed' | 'cancelled';
  target_date: string | null; completed_at: string | null; created_at: string;
}
interface ActionRow {
  id: string; mentorship_id: string; assigned_to: string | null; title: string;
  is_completed: boolean; completed_at: string | null; created_at: string; due_date: string | null;
}
interface SessionRow {
  id: string; mentorship_id: string; scheduled_at: string;
  duration_minutes: number | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

const toPerson = (p: ProfileRow | null): Person => ({
  id: p?.id ?? '',
  firstName: firstName(p),
  fullName: displayName(p),
  avatarUrl: p?.avatar_url ?? null,
  headline: p?.headline ?? null,
});

const toCommitment = (a: ActionRow): Commitment => ({
  id: a.id, title: a.title, dueDate: a.due_date, completedAt: a.completed_at,
});

export async function loadDashboard(uid: string, role: 'mentor' | 'mentee'): Promise<DashboardData> {
  const supabase = createClient();
  const now = Date.now();
  const mine = role === 'mentor' ? 'mentor_id' : 'mentee_id';
  const theirs = role === 'mentor' ? 'mentee_id' : 'mentor_id';
  const empty = { data: [] as never[] };

  // ── 1. The person's own rows ───────────────────────────────────────────────
  const [msRes, reqRes, mpRes, slotsRes, savedRes, rosterRes] = await Promise.all([
    supabase
      .from('mentorships')
      .select('id, mentor_id, mentee_id, request_id, started_at')
      .eq(mine, uid)
      .eq('status', 'active')
      .order('started_at', { ascending: true }),
    supabase
      .from('mentorship_requests')
      .select('id, mentor_id, mentee_id, message, goals, created_at')
      .eq(mine, uid)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    role === 'mentor'
      ? supabase.from('mentor_profiles').select('is_available, max_mentees, expertise_tags, is_founding_mentor').eq('id', uid).maybeSingle()
      : Promise.resolve({ data: null }),
    role === 'mentor'
      ? supabase.from('availability_slots').select('day_of_week').eq('mentor_id', uid)
      : Promise.resolve(empty),
    role === 'mentee'
      ? supabase.from('saved_mentors').select('mentor_id', { count: 'exact', head: true }).eq('user_id', uid)
      : Promise.resolve({ count: 0 }),
    // Discover's roster rule, verbatim: a mentor is reachable only with a real
    // account, the founding-mentor flag that separates real people from the
    // seeded fixtures, and availability switched on.
    role === 'mentee'
      ? supabase
          .from('public_profiles')
          .select('id, mentor_profiles!inner(is_available, is_founding_mentor)', { count: 'exact', head: true })
          .eq('role', 'mentor')
          .eq('mentor_profiles.is_founding_mentor', true)
          .eq('mentor_profiles.is_available', true)
      : Promise.resolve({ count: 0 }),
  ]);

  const mentorships = msRes.data ?? [];
  const pending = reqRes.data ?? [];
  const msIds = mentorships.map((m) => m.id);
  const partnerIds = [
    ...new Set([
      ...mentorships.map((m) => (m as Record<string, string>)[theirs]),
      ...pending.map((r) => (r as Record<string, string>)[theirs]),
    ]),
  ].filter(Boolean);
  const requestIds = mentorships.map((m) => m.request_id).filter(Boolean);

  // ── 2. Everything hanging off them ─────────────────────────────────────────
  const [peopleRes, goalsRes, actionsRes, sessionsRes, originRes, lastMessages] = await Promise.all([
    partnerIds.length
      ? supabase.from('public_profiles').select('id, first_name, last_name, avatar_url, headline, university').in('id', partnerIds)
      : Promise.resolve(empty),
    msIds.length
      ? supabase.from('mentorship_goals').select('id, mentorship_id, title, status, target_date, completed_at, created_at').in('mentorship_id', msIds)
      : Promise.resolve(empty),
    msIds.length
      ? supabase.from('action_items').select('id, mentorship_id, assigned_to, title, is_completed, completed_at, created_at, due_date').in('mentorship_id', msIds)
      : Promise.resolve(empty),
    msIds.length
      ? supabase.from('sessions').select('id, mentorship_id, scheduled_at, duration_minutes, status').in('mentorship_id', msIds).order('scheduled_at', { ascending: true })
      : Promise.resolve(empty),
    requestIds.length
      ? supabase.from('mentorship_requests').select('id, goals').in('id', requestIds)
      : Promise.resolve(empty),
    Promise.all(
      msIds.map((id) =>
        supabase
          .from('messages')
          .select('mentorship_id, sender_id, content, created_at')
          .eq('mentorship_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
          .then(({ data }) => data),
      ),
    ),
  ]);

  const people = new Map<string, ProfileRow>(((peopleRes.data ?? []) as ProfileRow[]).map((p) => [p.id, p]));
  const goals = (goalsRes.data ?? []) as GoalRow[];
  const actions = (actionsRes.data ?? []) as ActionRow[];
  const sessions = (sessionsRes.data ?? []) as SessionRow[];
  const origin = new Map<string, string | null>(
    ((originRes.data ?? []) as { id: string; goals: string | null }[]).map((r) => [r.id, r.goals]),
  );

  const ended = (s: SessionRow) => new Date(s.scheduled_at).getTime() + (s.duration_minutes ?? 60) * 60_000 < now;

  const extras = new Map<string, RelationshipExtras>();
  const relationships: Relationship[] = mentorships.map((m) => {
    const row = m as unknown as Record<string, string>;
    const partnerId = row[theirs];
    const profile = people.get(partnerId) ?? null;
    const name = firstName(profile);
    const mySessions = sessions.filter((s) => s.mentorship_id === m.id);
    const completed = mySessions.filter((s) => s.status === 'completed');
    const lastSession = completed.length ? completed[completed.length - 1] : null;
    const nextSession = mySessions.find((s) => (s.status === 'scheduled' || s.status === 'in_progress') && !ended(s)) ?? null;
    const openPast = [...mySessions].reverse().find((s) => s.status === 'scheduled' && ended(s)) ?? null;
    const msg = lastMessages.find((x) => x?.mentorship_id === m.id) ?? null;
    const myActions = actions.filter((a) => a.mentorship_id === m.id);
    const myGoals = goals.filter((g) => g.mentorship_id === m.id && g.status !== 'cancelled');

    const sinceTs = new Date(lastSession?.scheduled_at ?? m.started_at).getTime();
    const after = (iso: string | null) => !!iso && new Date(iso).getTime() > sinceTs;

    // "Since you last spoke", written from the viewer's side: their partner is
    // named, the viewer is "You". An item with no owner is simply "Done".
    const since: RelationshipExtras['since'] = [];
    for (const a of myActions) {
      if (a.is_completed && after(a.completed_at)) {
        const who = a.assigned_to === partnerId ? name : a.assigned_to === uid ? 'You' : null;
        since.push({
          key: `a-${a.id}`,
          text: who ? `${who} completed: ${a.title}` : `Done: ${a.title}`,
          done: true,
          at: a.completed_at!,
        });
      }
    }
    for (const g of myGoals) {
      if (g.status === 'completed' && after(g.completed_at)) {
        since.push({ key: `gc-${g.id}`, text: `Goal reached: ${g.title}`, done: true, at: g.completed_at! });
      } else if (after(g.created_at)) {
        since.push({ key: `gn-${g.id}`, text: `New goal: ${g.title}`, done: false, at: g.created_at });
      }
    }
    since.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());

    const lastActivity = Math.max(
      msg ? new Date(msg.created_at).getTime() : 0,
      lastSession ? new Date(lastSession.scheduled_at).getTime() : 0,
      new Date(m.started_at).getTime(),
    );

    const myLastMessageAt = msg && msg.sender_id === uid ? new Date(msg.created_at).getTime() : 0;

    extras.set(m.id, {
      partnerId,
      subtitle: profile?.headline || profile?.university || null,
      reachedGoals: myGoals
        .filter((g) => g.status === 'completed')
        .map((g) => ({ id: g.id, title: g.title, status: g.status, targetDate: g.target_date })),
      since,
      privateNote: null,
      totalActions: myActions.length,
      doneActions: myActions.filter((a) => a.is_completed).length,
    });

    return {
      mentorshipId: m.id,
      person: toPerson(profile),
      startedAt: m.started_at,
      reason: origin.get(m.request_id) ?? null,
      goals: myGoals.map((g) => ({ id: g.id, title: g.title, status: g.status, targetDate: g.target_date })),
      openForThem: myActions.filter((a) => !a.is_completed && a.assigned_to === partnerId).map(toCommitment),
      openForMine: myActions.filter((a) => !a.is_completed && a.assigned_to === uid).map(toCommitment),
      finishedSinceLastSession: myActions.filter((a) => a.is_completed && after(a.completed_at)).map(toCommitment),
      // Mine, finished after I last wrote: the thing worth telling them.
      finishedUnshared: myActions
        .filter((a) => a.is_completed && a.assigned_to === uid && a.completed_at && new Date(a.completed_at).getTime() > myLastMessageAt)
        .map(toCommitment),
      lastSession: lastSession ? { id: lastSession.id, at: lastSession.scheduled_at } : null,
      nextSession: nextSession ? { id: nextSession.id, at: nextSession.scheduled_at } : null,
      openPastSession: openPast ? { id: openPast.id, at: openPast.scheduled_at } : null,
      lastMessage: msg ? { fromMe: msg.sender_id === uid, content: msg.content, at: msg.created_at } : null,
      prepared: false,
      reflected: false,
      quietDays: Math.floor((now - lastActivity) / 86_400_000),
      neverMessaged: !msg,
    };
  });

  // ── 3. Private notebooks ───────────────────────────────────────────────────
  const notebookIds = relationships.flatMap((r) =>
    [r.lastSession?.id, r.nextSession?.id].filter(Boolean) as string[],
  );
  if (notebookIds.length) {
    const notebooks = await loadNotebooks(notebookIds, uid);
    for (const r of relationships) {
      const last = r.lastSession ? notebooks.get(r.lastSession.id) : undefined;
      const next = r.nextSession ? notebooks.get(r.nextSession.id) : undefined;
      r.reflected = !!last && hasReflection(last);
      r.prepared = !!next && hasPrep(next);
      const note = last?.reflection.rememberNext.trim();
      if (note) extras.get(r.mentorshipId)!.privateNote = note;
    }
  }

  const requests: PendingRequestRow[] = pending.map((r) => {
    const row = r as unknown as Record<string, string>;
    const profile = people.get(row[theirs]) ?? null;
    return {
      id: r.id,
      personId: row[theirs],
      person: profile,
      name: displayName(profile),
      message: r.message,
      goals: r.goals,
      createdAt: r.created_at,
    };
  });

  return {
    role,
    relationships,
    extras,
    requests,
    readiness: role === 'mentor'
      ? {
          isAvailable: mpRes.data?.is_available ?? false,
          maxMentees: mpRes.data?.max_mentees ?? 3,
          expertise: mpRes.data?.expertise_tags ?? [],
          availabilityDays: [...new Set(((slotsRes.data ?? []) as { day_of_week: number }[]).map((s) => s.day_of_week))].sort(),
          isFoundingMentor: mpRes.data?.is_founding_mentor ?? false,
        }
      : null,
    savedMentors: savedRes.count ?? 0,
    contactableMentors: rosterRes.count ?? 0,
  };
}
