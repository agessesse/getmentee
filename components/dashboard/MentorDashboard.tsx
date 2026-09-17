'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Calendar, CheckCircle2, Circle, ClipboardList, MessageSquare,
  Award, Eye, CheckCheck, Pencil, NotebookPen, Compass,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/lib/profile-context';
import Avatar from '@/components/ui/Avatar';
import { displayName, firstName } from '@/lib/display-name';
import { loadNotebooks, hasReflection } from '@/lib/mentorship/notebook';
import { mentorPrompt } from '@/lib/mentorship/coaching';

/**
 * The mentor's dashboard.
 *
 * WHAT IT REPLACED. A strip of "Mentees mentored", "Hours invested" and an
 * average rating, a capacity meter that turned red when full, and four stat
 * tiles that read "0" for anyone new. All of it counted what the mentor had
 * given. None of it said who needed them, what had moved, or what came next,
 * and "Hours invested" in particular framed time with a student as a cost.
 *
 * WHAT IT MEASURES NOW. Movement, not minutes. It answers four questions, in
 * this order: who needs me right now, what changed since we last spoke, what
 * happens next, and is this relationship going somewhere. The relationship is
 * the centre of the page; setup and availability sit below it.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. No hours, streaks, scores, ratings,
 * rankings, or congratulation copy. No urgency that the data does not support:
 * when nothing needs the mentor, it says so plainly.
 *
 * Every line is derived from rows the mentor can already read under RLS:
 * mentor_profiles, mentorships, mentorship_requests, public_profiles,
 * mentorship_goals, action_items, sessions, messages, availability_slots.
 * Nothing is invented, and nothing here is demo-only.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface Person {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  university: string | null;
}

interface Goal {
  id: string;
  mentorship_id: string;
  title: string;
  status: 'active' | 'completed' | 'cancelled';
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
}

interface ActionItem {
  id: string;
  mentorship_id: string;
  assigned_to: string | null;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

interface SessionRow {
  id: string;
  mentorship_id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  mentor_recap: string | null;
}

interface Relationship {
  mentorshipId: string;
  mentee: Person | null;
  menteeId: string;
  startedAt: string;
  /** What they came to the mentor for, from the request that started it. */
  reason: string | null;
  goals: Goal[];
  actions: ActionItem[];
  lastSession: SessionRow | null;
  nextSession: SessionRow | null;
  /** A past session still marked scheduled: it needs closing out. */
  openPastSession: SessionRow | null;
  /** Latest message in the thread, if the mentee sent it. */
  awaitingReply: { content: string; created_at: string } | null;
  /** The mentor's private "remember next time" note from the last conversation. */
  lastNote: string | null;
  /** Whether the mentor wrote anything after the last conversation. */
  lastReflected: boolean;
}

interface PendingRequest {
  id: string;
  mentee: Person | null;
  message: string | null;
  goals: string | null;
  created_at: string;
}

interface Readiness {
  isAvailable: boolean;
  maxMentees: number;
  expertise: string[];
  availabilityDays: number[];
  isFoundingMentor: boolean;
}

interface Data {
  relationships: Relationship[];
  requests: PendingRequest[];
  readiness: Readiness;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** "today", "tomorrow", or "Thu, Sep 18". */
function dayPhrase(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (isSameDay(d, now)) return 'today';
  if (isSameDay(d, tomorrow)) return 'tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function monthYear(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function greeting(name: string) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${time}, ${name}`;
}

function excerpt(text: string, max = 140) {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function loadMentorDashboard(uid: string): Promise<Data> {
  const supabase = createClient();
  const now = Date.now();

  const [mpRes, msRes, reqRes, slotsRes] = await Promise.all([
    supabase
      .from('mentor_profiles')
      .select('is_available, max_mentees, expertise_tags, is_founding_mentor')
      .eq('id', uid)
      .maybeSingle(),
    supabase
      .from('mentorships')
      .select('id, mentee_id, request_id, started_at')
      .eq('mentor_id', uid)
      .eq('status', 'active')
      .order('started_at', { ascending: true }),
    supabase
      .from('mentorship_requests')
      .select('id, mentee_id, message, goals, created_at')
      .eq('mentor_id', uid)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('availability_slots')
      .select('day_of_week')
      .eq('mentor_id', uid),
  ]);

  const mentorships = msRes.data ?? [];
  const pending = reqRes.data ?? [];
  const msIds = mentorships.map((m) => m.id);
  const personIds = [...new Set([...mentorships.map((m) => m.mentee_id), ...pending.map((r) => r.mentee_id)])];
  const requestIds = mentorships.map((m) => m.request_id).filter(Boolean);

  const empty = { data: [] as never[] };
  const [peopleRes, goalsRes, actionsRes, sessionsRes, originRes, lastMessages] = await Promise.all([
    personIds.length
      ? supabase.from('public_profiles').select('id, first_name, last_name, avatar_url, headline, university').in('id', personIds)
      : Promise.resolve(empty),
    msIds.length
      ? supabase.from('mentorship_goals').select('id, mentorship_id, title, status, target_date, completed_at, created_at').in('mentorship_id', msIds)
      : Promise.resolve(empty),
    msIds.length
      ? supabase.from('action_items').select('id, mentorship_id, assigned_to, title, is_completed, completed_at, created_at').in('mentorship_id', msIds)
      : Promise.resolve(empty),
    msIds.length
      ? supabase.from('sessions').select('id, mentorship_id, scheduled_at, duration_minutes, status, mentor_recap').in('mentorship_id', msIds).order('scheduled_at', { ascending: true })
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

  const people = new Map<string, Person>(((peopleRes.data ?? []) as Person[]).map((p) => [p.id, p]));
  const goals = (goalsRes.data ?? []) as Goal[];
  const actions = (actionsRes.data ?? []) as ActionItem[];
  const sessions = (sessionsRes.data ?? []) as SessionRow[];
  const origin = new Map<string, string | null>(((originRes.data ?? []) as { id: string; goals: string | null }[]).map((r) => [r.id, r.goals]));

  const ended = (s: SessionRow) => new Date(s.scheduled_at).getTime() + (s.duration_minutes ?? 60) * 60_000 < now;

  const relationships: Relationship[] = mentorships.map((m) => {
    const mine = sessions.filter((s) => s.mentorship_id === m.id);
    const completed = mine.filter((s) => s.status === 'completed');
    const last = lastMessages.find((x) => x?.mentorship_id === m.id) ?? null;
    return {
      mentorshipId: m.id,
      mentee: people.get(m.mentee_id) ?? null,
      menteeId: m.mentee_id,
      startedAt: m.started_at,
      reason: origin.get(m.request_id) ?? null,
      goals: goals.filter((g) => g.mentorship_id === m.id && g.status !== 'cancelled'),
      actions: actions.filter((a) => a.mentorship_id === m.id),
      lastSession: completed.length ? completed[completed.length - 1] : null,
      nextSession: mine.find((s) => (s.status === 'scheduled' || s.status === 'in_progress') && !ended(s)) ?? null,
      openPastSession: [...mine].reverse().find((s) => s.status === 'scheduled' && ended(s)) ?? null,
      awaitingReply: last && last.sender_id !== uid ? { content: last.content, created_at: last.created_at } : null,
      lastNote: null,
      lastReflected: false,
    };
  });

  // The mentor's own private notes from each last conversation. Readable only
  // by the mentor under RLS (see lib/mentorship/notebook.ts).
  const notebooks = await loadNotebooks(relationships.map((r) => r.lastSession?.id).filter(Boolean) as string[], uid);
  for (const r of relationships) {
    const nb = r.lastSession ? notebooks.get(r.lastSession.id) : undefined;
    r.lastNote = nb?.reflection.rememberNext.trim() || null;
    r.lastReflected = !!nb && hasReflection(nb);
  }

  const requests: PendingRequest[] = pending.map((r) => ({
    id: r.id,
    mentee: people.get(r.mentee_id) ?? null,
    message: r.message,
    goals: r.goals,
    created_at: r.created_at,
  }));

  return {
    relationships,
    requests,
    readiness: {
      isAvailable: mpRes.data?.is_available ?? false,
      maxMentees: mpRes.data?.max_mentees ?? 3,
      expertise: mpRes.data?.expertise_tags ?? [],
      availabilityDays: [...new Set((slotsRes.data ?? []).map((s) => s.day_of_week as number))].sort(),
      isFoundingMentor: mpRes.data?.is_founding_mentor ?? false,
    },
  };
}

// ─── Attention ────────────────────────────────────────────────────────────────

interface AttentionItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  person: Person | null;
  title: string;
  detail: string | null;
  cta: string;
  href: string;
}

/**
 * What genuinely needs the mentor, most time-bound first. Each item exists only
 * because a row says so: a conversation in the next two days, a message the
 * mentee sent last, a past session nobody closed out, a request not yet
 * answered. Nothing is manufactured to fill the list.
 */
function attentionFor(data: Data): AttentionItem[] {
  const items: AttentionItem[] = [];
  const soon = Date.now() + 48 * 3600_000;

  for (const r of data.relationships) {
    const name = firstName(r.mentee);
    if (r.nextSession && new Date(r.nextSession.scheduled_at).getTime() <= soon) {
      items.push({
        key: `soon-${r.nextSession.id}`,
        icon: Calendar,
        person: r.mentee,
        title: `Your conversation with ${name} is ${dayPhrase(r.nextSession.scheduled_at)} at ${timeOf(r.nextSession.scheduled_at)}`,
        detail: 'The session brief has their goals and where you left off.',
        cta: 'Open brief',
        href: `/sessions/${r.nextSession.id}`,
      });
    }
  }
  for (const r of data.relationships) {
    if (r.awaitingReply) {
      items.push({
        key: `reply-${r.mentorshipId}`,
        icon: MessageSquare,
        person: r.mentee,
        title: `${firstName(r.mentee)} wrote to you`,
        detail: `“${excerpt(r.awaitingReply.content, 120)}”`,
        cta: 'Reply',
        href: `/messages?mentorshipId=${r.mentorshipId}`,
      });
    }
  }
  for (const r of data.relationships) {
    if (r.openPastSession) {
      items.push({
        key: `close-${r.openPastSession.id}`,
        icon: Pencil,
        person: r.mentee,
        title: `Wrap up your ${shortDate(r.openPastSession.scheduled_at)} conversation with ${firstName(r.mentee)}`,
        detail: 'Mark how it went and note what you each agreed to do next.',
        cta: 'Wrap up',
        href: `/sessions/${r.openPastSession.id}`,
      });
    }
  }
  for (const r of data.relationships) {
    const last = r.lastSession;
    if (last && !r.lastReflected && Date.now() - new Date(last.scheduled_at).getTime() <= 7 * 86400_000) {
      items.push({
        key: `note-${last.id}`,
        icon: NotebookPen,
        person: r.mentee,
        title: `Note what to remember from ${shortDate(last.scheduled_at)} with ${firstName(r.mentee)}`,
        detail: 'Thirty seconds now, and it will be in your briefing next time.',
        cta: 'Add a note',
        href: `/sessions/${last.id}`,
      });
    }
  }
  for (const req of data.requests) {
    items.push({
      key: `req-${req.id}`,
      icon: ClipboardList,
      person: req.mentee,
      title: `${displayName(req.mentee)} asked to work with you`,
      detail: req.goals ? `Hoping to: ${req.goals}` : req.message ? `“${excerpt(req.message, 120)}”` : null,
      cta: 'Review',
      href: '/requests',
    });
  }
  return items;
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

const PRIMARY_BTN =
  'inline-flex items-center gap-2 bg-halo-purple text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2';
const SECONDARY_BTN =
  'inline-flex items-center gap-2 border border-halo-rule bg-white text-halo-ink text-sm font-medium px-4 py-2.5 rounded-xl hover:border-halo-purple transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple';
const EYEBROW = 'font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body';

function AttentionList({ items, requestCount }: { items: AttentionItem[]; requestCount: number }) {
  // Requests can pile up; show the first three and point to the rest.
  const shownRequests = 3;
  let requestsSeen = 0;
  const visible = items.filter((it) => {
    if (!it.key.startsWith('req-')) return true;
    requestsSeen += 1;
    return requestsSeen <= shownRequests;
  });
  const hidden = Math.max(0, requestCount - shownRequests);

  return (
    <section aria-labelledby="needs-you-heading" className="bg-white rounded-2xl border border-halo-rule">
      <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-2">
        <h2 id="needs-you-heading" className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">
          Where you&apos;re needed
        </h2>
      </div>
      <ul className="divide-y divide-halo-rule">
        {visible.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.key}>
              <Link
                href={it.href}
                className="group flex items-start gap-4 px-5 sm:px-6 py-4 hover:bg-halo-veil/50 transition-colors focus-visible:outline-none focus-visible:bg-halo-veil"
              >
                <div className="relative flex-shrink-0">
                  <Avatar src={it.person?.avatar_url} name={displayName(it.person)} size="md" />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-halo-rule flex items-center justify-center">
                    <Icon className="w-3 h-3 text-halo-purple-d" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-halo-ink leading-snug">{it.title}</p>
                  {it.detail && (
                    <p className="text-[13px] text-halo-heather mt-1 leading-relaxed line-clamp-2">{it.detail}</p>
                  )}
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 self-center flex-shrink-0 text-sm font-semibold text-halo-purple-d">
                  {it.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <ArrowRight className="sm:hidden w-4 h-4 self-center flex-shrink-0 text-halo-purple-d" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
      {hidden > 0 && (
        <Link
          href="/requests"
          className="block px-5 sm:px-6 py-3.5 border-t border-halo-rule text-sm font-medium text-halo-purple-d hover:text-halo-ink transition-colors"
        >
          {hidden === 1 ? '1 more request' : `${hidden} more requests`} →
        </Link>
      )}
    </section>
  );
}

function CaughtUp({ hasMentees }: { hasMentees: boolean }) {
  return (
    <section className="flex items-start gap-4 bg-halo-veil border border-halo-lavender rounded-2xl px-5 sm:px-6 py-5">
      <div className="w-10 h-10 rounded-xl bg-white border border-halo-lavender flex items-center justify-center flex-shrink-0">
        <CheckCheck className="w-5 h-5 text-halo-purple-d" />
      </div>
      <div>
        <h2 className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">You&apos;re caught up.</h2>
        <p className="text-sm text-halo-heather mt-1 leading-relaxed">
          {hasMentees
            ? 'Nothing needs a response right now. Here is where each mentorship stands.'
            : 'Nothing needs a response right now.'}
        </p>
      </div>
    </section>
  );
}

/** Everything that happened in the relationship after the last conversation. */
function sinceLastConversation(r: Relationship) {
  const since = new Date(r.lastSession?.scheduled_at ?? r.startedAt).getTime();
  const after = (iso: string | null) => !!iso && new Date(iso).getTime() > since;
  const name = firstName(r.mentee);
  const events: { key: string; text: string; done: boolean; at: string }[] = [];

  for (const a of r.actions) {
    if (a.is_completed && after(a.completed_at)) {
      const who = a.assigned_to === r.menteeId ? name : a.assigned_to ? 'You' : 'Done';
      events.push({ key: `a-${a.id}`, text: who === 'Done' ? `Done: ${a.title}` : `${who} completed: ${a.title}`, done: true, at: a.completed_at! });
    }
  }
  for (const g of r.goals) {
    if (g.status === 'completed' && after(g.completed_at)) {
      events.push({ key: `gc-${g.id}`, text: `${name} reached a goal: ${g.title}`, done: true, at: g.completed_at! });
    } else if (after(g.created_at)) {
      events.push({ key: `gn-${g.id}`, text: `${name} set a goal: ${g.title}`, done: false, at: g.created_at });
    }
  }
  return events.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());
}

function RelationshipCard({ r }: { r: Relationship }) {
  const name = firstName(r.mentee);
  const full = displayName(r.mentee);
  const sub = r.mentee?.headline || r.mentee?.university || null;
  const events = sinceLastConversation(r);
  const openForMentee = r.actions.filter((a) => !a.is_completed && a.assigned_to === r.menteeId);
  const openForMentor = r.actions.filter((a) => !a.is_completed && a.assigned_to && a.assigned_to !== r.menteeId);
  const activeGoals = r.goals.filter((g) => g.status === 'active')
    .sort((a, b) => (a.target_date ?? '9999').localeCompare(b.target_date ?? '9999'));
  const reachedGoals = r.goals.filter((g) => g.status === 'completed');
  // The headline is what they came to the mentor for. When that same line is
  // also a written goal it is shown once, up top, not repeated in the list.
  const headline = r.reason ?? activeGoals[0]?.title ?? null;
  const sameAsHeadline = (g: Goal) => !!headline && g.title.trim().toLowerCase() === headline.trim().toLowerCase();
  const listedGoals = [...reachedGoals, ...activeGoals].filter((g) => !sameAsHeadline(g));
  const finishedItems = r.actions.filter((a) => a.is_completed).length;
  const soonGoal = activeGoals.find((g) => g.target_date && new Date(g.target_date + 'T12:00:00').getTime() - Date.now() <= 30 * 86400_000 && new Date(g.target_date + 'T12:00:00').getTime() >= Date.now());
  const sinceLast = new Date(r.lastSession?.scheduled_at ?? r.startedAt).getTime();
  const prompt = mentorPrompt({
    seed: r.mentorshipId + new Date().toDateString(),
    isFirst: !r.lastSession,
    menteeName: name,
    openMenteeCommitments: openForMentee.map((a) => a.title),
    completedSinceLast: r.actions.filter((a) => a.is_completed && a.assigned_to === r.menteeId && a.completed_at && new Date(a.completed_at).getTime() > sinceLast).map((a) => a.title),
    upcomingGoal: soonGoal ? { title: soonGoal.title, when: `on ${shortDate(soonGoal.target_date + 'T12:00:00')}` } : null,
  });

  return (
    <article className="bg-white rounded-2xl border border-halo-rule overflow-hidden" aria-label={`Mentorship with ${full}`}>
      {/* Who */}
      <div className="flex items-start gap-4 px-5 sm:px-6 pt-5 sm:pt-6">
        <Avatar src={r.mentee?.avatar_url} name={full} size="lg" />
        <div className="flex-1 min-w-0">
          <Link href={`/mentee/${r.menteeId}`} className="text-lg font-semibold text-halo-ink hover:text-halo-purple-d transition-colors">
            {full}
          </Link>
          {sub && <p className="text-sm text-halo-mist-body mt-0.5 truncate">{sub}</p>}
          <p className="text-xs text-halo-mist-body mt-1">Working together since {monthYear(r.startedAt)}</p>
        </div>
      </div>

      {/* Working toward */}
      {headline && (
        <div className="px-5 sm:px-6 pt-5">
          <p className={EYEBROW}>Working toward</p>
          <p className="font-display text-[1.375rem] leading-snug text-halo-ink mt-1">{headline}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-5 sm:px-6 py-5">
        {/* Goals */}
        <div>
          <p className={EYEBROW}>{headline && listedGoals.length ? 'Along the way' : 'Their goals'}</p>
          {r.goals.length === 0 ? (
            <p className="text-sm text-halo-heather mt-2 leading-relaxed">
              No goals written down yet. Setting one together gives each conversation a direction.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {(listedGoals.length ? listedGoals : [...reachedGoals, ...activeGoals]).slice(0, 4).map((g) => (
                <li key={g.id} className="flex items-start gap-2.5">
                  {g.status === 'completed'
                    ? <CheckCircle2 className="w-4 h-4 text-halo-purple-d flex-shrink-0 mt-0.5" />
                    : <Circle className="w-4 h-4 text-halo-mist-strong flex-shrink-0 mt-0.5" />}
                  <span className="text-sm text-halo-ink leading-snug">
                    {g.title}
                    <span className="text-halo-mist-body">
                      {g.status === 'completed'
                        ? ' · reached'
                        : g.target_date ? ` · by ${shortDate(g.target_date + 'T12:00:00')}` : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(reachedGoals.length > 0 || finishedItems > 0) && (
            <p className="text-xs text-halo-heather mt-3">
              {[
                reachedGoals.length > 0 && `${reachedGoals.length} of ${r.goals.length} goals reached`,
                finishedItems > 0 && `${finishedItems} of ${r.actions.length} next steps done`,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Since last conversation + commitments */}
        <div className="space-y-6">
          <div>
            <p className={EYEBROW}>
              {r.lastSession ? `Since you last spoke · ${shortDate(r.lastSession.scheduled_at)}` : 'Since you started'}
            </p>
            {events.length === 0 ? (
              <p className="text-sm text-halo-heather mt-2">Nothing new yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {events.slice(0, 4).map((e) => (
                  <li key={e.key} className="flex items-start gap-2.5 text-sm text-halo-ink leading-snug">
                    {e.done
                      ? <CheckCircle2 className="w-4 h-4 text-halo-purple-d flex-shrink-0 mt-0.5" />
                      : <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-halo-purple" /></span>}
                    {e.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(openForMentee.length > 0 || openForMentor.length > 0) && (
            <div>
              <p className={EYEBROW}>Agreed next steps</p>
              <ul className="mt-2 space-y-2">
                {openForMentee.slice(0, 3).map((a) => (
                  <li key={a.id} className="text-sm text-halo-ink leading-snug">
                    <span className="text-halo-mist-body">{name}: </span>{a.title}
                  </li>
                ))}
                {openForMentor.slice(0, 3).map((a) => (
                  <li key={a.id} className="text-sm text-halo-ink leading-snug">
                    <span className="text-halo-mist-body">You: </span>{a.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {r.lastNote && r.lastSession && (
            <div>
              <p className={EYEBROW}>Your note from {shortDate(r.lastSession.scheduled_at)}</p>
              <p className="text-sm text-halo-ink mt-2 leading-relaxed line-clamp-3 whitespace-pre-line">{r.lastNote}</p>
            </div>
          )}
        </div>
      </div>

      {/* One prompt, chosen from what is true about this relationship right now. */}
      <div className="px-5 sm:px-6 pb-5">
        <p className="flex items-start gap-2.5 rounded-xl bg-halo-veil border border-halo-lavender px-4 py-3 text-sm text-halo-ink leading-relaxed">
          <Compass className="w-4 h-4 text-halo-purple-d flex-shrink-0 mt-0.5" />
          <span><span className="font-semibold">Worth asking next time: </span>{prompt}</span>
        </p>
      </div>

      {/* What happens next */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-halo-veil/60 border-t border-halo-rule px-5 sm:px-6 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <Calendar className="w-4 h-4 text-halo-purple-d flex-shrink-0" />
          <p className="text-sm text-halo-ink">
            {r.nextSession ? (
              <>
                <span className="text-halo-mist-body">Next conversation </span>
                <span className="font-semibold">
                  {dayPhrase(r.nextSession.scheduled_at)} · {timeOf(r.nextSession.scheduled_at)}
                </span>
              </>
            ) : (
              <span className="text-halo-heather">No conversation scheduled yet</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {r.nextSession ? (
            <Link href={`/sessions/${r.nextSession.id}`} className={PRIMARY_BTN}>
              Open session brief
            </Link>
          ) : (
            <Link href={`/schedule?mentorshipId=${r.mentorshipId}`} className={PRIMARY_BTN}>
              Schedule a conversation
            </Link>
          )}
          <Link href={`/messages?mentorshipId=${r.mentorshipId}`} className={SECONDARY_BTN}>
            <MessageSquare className="w-4 h-4" />
            Message {name}
          </Link>
        </div>
      </div>
    </article>
  );
}

function ReadinessPanel({ data, uid, prominent }: { data: Data; uid: string; prominent: boolean }) {
  const { readiness, relationships } = data;
  const room = Math.max(0, readiness.maxMentees - relationships.length);
  const days = readiness.availabilityDays.map((d) => DAY_NAMES[d]).join(', ');

  const cells = [
    {
      label: 'New mentees',
      value: !readiness.isAvailable
        ? 'Not taking requests right now'
        : room === 0
          ? 'Your mentorships are full'
          : relationships.length === 0
            ? `Open to requests · up to ${readiness.maxMentees}`
            : `Open to requests · room for ${room} more`,
      href: '/profile/setup',
      action: 'Change',
    },
    {
      label: 'What you can help with',
      value: readiness.expertise.length ? readiness.expertise.slice(0, 3).join(', ') + (readiness.expertise.length > 3 ? ` +${readiness.expertise.length - 3}` : '') : 'Not added yet',
      href: '/profile/setup',
      action: readiness.expertise.length ? 'Edit' : 'Add',
    },
    {
      label: 'When you’re available',
      value: days || 'No weekly times set',
      href: '/schedule?tab=availability',
      action: days ? 'Edit' : 'Set times',
    },
  ];

  return (
    <section aria-labelledby="readiness-heading">
      <div className="flex items-end justify-between gap-4 mb-3">
        <h2 id="readiness-heading" className={prominent
          ? 'font-display font-normal text-[1.375rem] leading-tight text-halo-ink'
          : EYEBROW}>
          How students find you
        </h2>
        {/* The new-mentor welcome above already leads with this link. */}
        {!prominent && (
          <Link href={`/mentor/${uid}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-halo-purple-d hover:text-halo-ink transition-colors">
            <Eye className="w-4 h-4" />
            Preview your profile
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cells.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group flex flex-col justify-between gap-3 bg-white rounded-2xl border border-halo-rule p-4 hover:border-halo-purple transition-colors"
          >
            <div className="min-w-0">
              <p className={EYEBROW}>{c.label}</p>
              <p className="text-sm text-halo-ink mt-1.5 leading-snug">{c.value}</p>
            </div>
            <span className="text-sm font-medium text-halo-purple-d group-hover:text-halo-ink transition-colors">{c.action} →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function NewMentorWelcome({ uid }: { uid: string }) {
  return (
    <section
      className="relative overflow-hidden bg-halo-deep rounded-2xl p-6 sm:p-8 text-white"
      style={{ backgroundImage: 'radial-gradient(ellipse 70% 90% at 85% 0%, rgba(120,90,247,0.55) 0%, transparent 65%)' }}
    >
      <h2 className="font-display text-[1.75rem] leading-tight mb-2 max-w-xl">
        You&apos;re ready to help when the right person reaches out.
      </h2>
      <p className="text-halo-lavender text-sm font-light leading-relaxed max-w-xl mb-6">
        When a student asks to work with you, their request and what they hope to learn will appear here.
        Until then, it helps to check what they see when they find you.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/mentor/${uid}`}
          className="inline-flex items-center gap-2 bg-halo-ivory text-halo-purple-d px-5 py-3 rounded-xl text-sm font-semibold shadow-sm hover:bg-halo-lavender transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-halo-deep"
        >
          <Eye className="w-4 h-4" />
          Preview your profile
        </Link>
        <Link
          href="/schedule?tab=availability"
          className="inline-flex items-center gap-2 border border-halo-lavender text-halo-ivory px-5 py-3 rounded-xl text-sm font-semibold hover:bg-halo-ivory hover:text-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-halo-deep"
        >
          Set your availability
        </Link>
      </div>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="bg-white rounded-2xl border border-halo-rule p-6 animate-pulse space-y-4">
        <div className="h-5 w-48 bg-halo-bone rounded" />
        {[0, 1].map((i) => <div key={i} className="h-14 bg-halo-veil rounded-xl" />)}
      </div>
      <div className="bg-white rounded-2xl border border-halo-rule p-6 animate-pulse space-y-4">
        <div className="flex gap-4"><div className="w-14 h-14 rounded-full bg-halo-bone" /><div className="space-y-2 flex-1"><div className="h-4 w-40 bg-halo-bone rounded" /><div className="h-3 w-56 bg-halo-veil rounded" /></div></div>
        <div className="h-24 bg-halo-veil rounded-xl" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MentorDashboard() {
  const profile = useProfile();
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadMentorDashboard(profile.id).then(setData).catch(() => setFailed(true));
  }, [profile?.id]);

  const name = profile?.first_name ?? '';
  const attention = data ? attentionFor(data) : [];
  const hasMentees = !!data && data.relationships.length > 0;
  const isNew = !!data && !hasMentees && data.requests.length === 0;

  const subline = !data
    ? ' '
    : isNew
      ? 'Your profile is live.'
      : attention.length > 0
        ? 'Here is where your perspective is useful next.'
        : 'Here is where things stand.';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display font-normal text-[2rem] leading-tight text-halo-ink">{greeting(name)}</h1>
          {data?.readiness.isFoundingMentor && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-halo-purple-d bg-halo-veil border border-halo-lavender px-2.5 py-1 rounded-full">
              <Award className="w-3 h-3" />
              Founding Mentor
            </span>
          )}
        </div>
        <p className="text-halo-mist-body mt-1 text-sm">{subline}</p>
      </header>

      {failed && (
        <p className="text-sm text-halo-heather bg-white border border-halo-rule rounded-2xl px-5 py-4">
          Your dashboard didn&apos;t load. Refresh the page to try again.
        </p>
      )}

      {!data && !failed && <Skeleton />}

      {data && (
        <>
          {isNew ? (
            <NewMentorWelcome uid={profile!.id} />
          ) : attention.length > 0 ? (
            <AttentionList items={attention} requestCount={data.requests.length} />
          ) : (
            <CaughtUp hasMentees={hasMentees} />
          )}

          {hasMentees && (
            <section aria-labelledby="mentees-heading" className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 id="mentees-heading" className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">
                  {data.relationships.length === 1 ? 'Your mentee' : 'Your mentees'}
                </h2>
                <Link href="/mentorships" className="text-sm text-halo-purple-d hover:text-halo-ink font-medium">
                  All mentorships
                </Link>
              </div>
              {data.relationships.map((r) => <RelationshipCard key={r.mentorshipId} r={r} />)}
            </section>
          )}

          <ReadinessPanel data={data} uid={profile!.id} prominent={isNew} />
        </>
      )}
    </div>
  );
}
