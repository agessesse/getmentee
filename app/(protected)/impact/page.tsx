'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Award, CheckCircle2, MessageSquare, Target, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import { displayName, firstName } from '@/lib/display-name';

/**
 * Your mentoring: what came of the time you gave.
 *
 * WHAT THIS PAGE USED TO BE. "Hours invested" as a headline number, an average
 * star rating out of five with a review count, and ten milestone badges that
 * greyed out until you hit 10 hours, then 50. It read like a performance
 * review of a volunteer. Worse, the rating framed a relationship as a service
 * with a score, and the hour count framed time with a student as a cost.
 *
 * WHAT IT IS NOW. The people, and what moved. Each student the mentor has
 * worked with, what they came for, and what has actually happened since. No
 * hours, no rating, no badges, no quotas, no comparisons, and no replacement
 * vanity number dressed up as insight.
 *
 * The two counts that remain — conversations held, goals reached — are there
 * because each one names something specific you can click into and read. They
 * are never shown as a target, a streak, or a level.
 *
 * Every line comes from a row: mentorships, sessions marked completed, goals
 * marked completed, and the request that started the relationship. Nothing is
 * estimated and nothing is attributed to a student who did not do it.
 *
 * ON CAUSATION. The timeline says what happened and when, in that order, and
 * stops there. "You talked with Jordan" and "Jordan reached a goal" are both
 * rows; "Jordan reached a goal because of you" is not, and the product has no
 * way to know it. Sequence is not evidence, and a page that quietly turned one
 * into the other would be flattering the mentor with something it made up.
 *
 * WHAT WOULD BE NEEDED FOR MORE. The public site draws impact travelling
 * outward: a student helped, who later helps someone else. Nothing in this
 * schema can show that. It would need a student's own later mentorships linked
 * back to the one that preceded them, and a student's explicit say-so that the
 * link may be shown to their former mentor. Neither exists, so this page does
 * not hint at it.
 */

interface Student {
  mentorshipId: string;
  id: string;
  name: string;
  first: string;
  avatarUrl: string | null;
  startedAt: string;
  active: boolean;
  reason: string | null;
  conversations: number;
  lastConversation: string | null;
  goalsReached: { id: string; title: string; at: string }[];
}

interface Moment {
  id: string;
  at: string;
  text: string;
  kind: 'start' | 'conversation' | 'goal';
}

const longDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const monthYear = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export default function ImpactPage() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [isMentor, setIsMentor] = useState(true);
  const [founding, setFounding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const [profileRes, mpRes, msRes, sessRes] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', uid).single(),
        supabase.from('mentor_profiles').select('is_founding_mentor').eq('id', uid).maybeSingle(),
        supabase.from('mentorships').select('id, mentee_id, request_id, status, started_at').eq('mentor_id', uid).order('started_at', { ascending: false }),
        supabase.from('sessions').select('id, mentorship_id, scheduled_at').eq('mentor_id', uid).eq('status', 'completed').order('scheduled_at', { ascending: false }),
      ]);

      if (profileRes.data?.role !== 'mentor') { setIsMentor(false); setLoading(false); return; }
      setFounding(mpRes.data?.is_founding_mentor ?? false);

      const mentorships = msRes.data ?? [];
      const sessions = sessRes.data ?? [];
      const menteeIds = [...new Set(mentorships.map((m) => m.mentee_id))];
      const msIds = mentorships.map((m) => m.id);
      const requestIds = mentorships.map((m) => m.request_id).filter(Boolean);
      const none = { data: [] as never[] };

      const [peopleRes, goalsRes, originRes] = await Promise.all([
        menteeIds.length ? supabase.from('public_profiles').select('id, first_name, last_name, avatar_url').in('id', menteeIds) : Promise.resolve(none),
        msIds.length
          ? supabase.from('mentorship_goals').select('id, mentorship_id, title, completed_at').in('mentorship_id', msIds).eq('status', 'completed').not('completed_at', 'is', null)
          : Promise.resolve(none),
        requestIds.length ? supabase.from('mentorship_requests').select('id, goals').in('id', requestIds) : Promise.resolve(none),
      ]);

      const people = new Map(((peopleRes.data ?? []) as { id: string; first_name: string; last_name: string; avatar_url: string | null }[]).map((p) => [p.id, p]));
      const goals = (goalsRes.data ?? []) as { id: string; mentorship_id: string; title: string; completed_at: string }[];
      const origin = new Map(((originRes.data ?? []) as { id: string; goals: string | null }[]).map((r) => [r.id, r.goals]));

      const built: Student[] = mentorships.map((m) => {
        const p = people.get(m.mentee_id) ?? null;
        const theirs = sessions.filter((s) => s.mentorship_id === m.id);
        return {
          mentorshipId: m.id,
          id: m.mentee_id,
          name: displayName(p),
          first: firstName(p),
          avatarUrl: p?.avatar_url ?? null,
          startedAt: m.started_at,
          active: m.status === 'active',
          reason: origin.get(m.request_id) ?? null,
          conversations: theirs.length,
          lastConversation: theirs[0]?.scheduled_at ?? null,
          goalsReached: goals
            .filter((g) => g.mentorship_id === m.id)
            .map((g) => ({ id: g.id, title: g.title, at: g.completed_at }))
            .sort((a, b) => b.at.localeCompare(a.at)),
        };
      });
      setStudents(built);

      const byMentorship = new Map(built.map((s) => [s.mentorshipId, s]));
      const list: Moment[] = [];
      for (const s of built) {
        list.push({ id: `start-${s.mentorshipId}`, at: s.startedAt, kind: 'start', text: `You started working with ${s.name}` });
      }
      for (const sess of sessions.slice(0, 25)) {
        const s = byMentorship.get(sess.mentorship_id);
        if (s) list.push({ id: `sess-${sess.id}`, at: sess.scheduled_at, kind: 'conversation', text: `You talked with ${s.first}` });
      }
      for (const g of goals) {
        const s = byMentorship.get(g.mentorship_id);
        if (s) list.push({ id: `goal-${g.id}`, at: g.completed_at, kind: 'goal', text: `${s.first} reached a goal: ${g.title}` });
      }
      list.sort((a, b) => b.at.localeCompare(a.at));
      setMoments(list.slice(0, 25));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  if (!isMentor || !students) {
    return (
      <div className="text-center py-24">
        <p className="text-halo-mist-body">This page is for mentors.</p>
        <Link href="/dashboard" className="text-sm text-halo-purple-d hover:underline mt-3 inline-block">Back home</Link>
      </div>
    );
  }

  const conversations = students.reduce((n, s) => n + s.conversations, 0);
  const goalsReached = students.reduce((n, s) => n + s.goalsReached.length, 0);
  const firstStarted = students.length ? students[students.length - 1].startedAt : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-halo-mist-body hover:text-halo-ink transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Home
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display font-normal text-[2.25rem] leading-tight text-halo-ink">Your mentoring</h1>
          {founding && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-halo-purple-d bg-halo-veil border border-halo-lavender px-2.5 py-1 rounded-full">
              <Award className="w-3 h-3" aria-hidden="true" />
              Founding Mentor
            </span>
          )}
        </div>
        {students.length > 0 ? (
          <p className="text-[15px] text-halo-heather mt-2 leading-relaxed">
            {/* Numerals throughout: "2 students, 3 conversations, one goal
                reached" mixed two counting styles in one sentence. */}
            {students.length === 1 ? '1 student' : `${students.length} students`}
            {conversations > 0 && `, ${conversations} ${conversations === 1 ? 'conversation' : 'conversations'}`}
            {goalsReached > 0 && `, ${goalsReached} ${goalsReached === 1 ? 'goal' : 'goals'} reached`}
            {firstStarted && ` since ${monthYear(firstStarted)}`}.
          </p>
        ) : (
          <p className="text-[15px] text-halo-heather mt-2 leading-relaxed">
            Nothing here yet. This page fills in as you work with students.
          </p>
        )}
      </header>

      {students.length === 0 && (
        <section className="bg-white rounded-2xl border border-halo-rule px-5 sm:px-6 py-6">
          <h2 className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">
            This page is a record, not a scoreboard.
          </h2>
          <p className="text-[15px] text-halo-heather mt-2 leading-relaxed">
            When a student starts working with you, you&apos;ll see what they came for, what you talked about, and
            what they went on to do. No hours, no ratings, nothing to keep up.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-halo-purple-d hover:text-halo-ink transition-colors">
            Back home
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </section>
      )}

      {students.length > 0 && (
        <section aria-labelledby="students-heading" className="space-y-3">
          <h2 id="students-heading" className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">
            {students.length === 1 ? 'The student you’ve worked with' : 'The students you’ve worked with'}
          </h2>
          {students.map((s) => (
            <article key={s.mentorshipId} className="bg-white rounded-2xl border border-halo-rule p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <Avatar src={s.avatarUrl} name={s.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/mentee/${s.id}`} className="text-lg font-semibold text-halo-ink hover:text-halo-purple-d transition-colors">
                      {s.name}
                    </Link>
                    {!s.active && (
                      <span className="text-[11px] font-medium text-halo-mist-body bg-halo-veil border border-halo-rule px-2 py-0.5 rounded-full">
                        Past mentorship
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-halo-mist-body mt-0.5">Since {monthYear(s.startedAt)}</p>

                  {s.reason && (
                    <p className="text-[15px] text-halo-ink mt-3 leading-relaxed">
                      <span className="text-halo-mist-body">Came to you for: </span>{s.reason}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-sm text-halo-heather">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-halo-mist-strong" aria-hidden="true" />
                      {s.conversations === 0 ? 'No conversations yet' : s.conversations === 1 ? '1 conversation' : `${s.conversations} conversations`}
                    </span>
                    {s.lastConversation && (
                      <span className="text-halo-mist-body">Last on {longDate(s.lastConversation)}</span>
                    )}
                  </div>

                  {s.goalsReached.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {s.goalsReached.slice(0, 3).map((g) => (
                        <li key={g.id} className="flex items-start gap-2.5 text-sm text-halo-ink leading-snug">
                          <CheckCircle2 className="w-4 h-4 text-halo-purple-d flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{g.title}<span className="text-halo-mist-body"> · reached {longDate(g.at)}</span></span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {s.active && (
                    <Link
                      href={`/messages?mentorshipId=${s.mentorshipId}`}
                      className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-halo-purple-d hover:text-halo-ink transition-colors"
                    >
                      Message {s.first}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {moments.length > 0 && (
        <section aria-labelledby="moments-heading">
          <h2 id="moments-heading" className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">
            What has moved forward
          </h2>
          <p className="text-[13.5px] text-halo-mist-body leading-relaxed mt-1.5 mb-3">
            In order, from your mentorships, the conversations you held, and the goals your
            students marked reached. It records what happened. It doesn&apos;t claim you
            caused it.
          </p>
          <ul className="bg-white rounded-2xl border border-halo-rule divide-y divide-halo-rule overflow-hidden">
            {moments.map((m) => {
              const Icon = m.kind === 'goal' ? Target : m.kind === 'start' ? Users : MessageSquare;
              return (
                <li key={m.id} className="flex items-start gap-3 px-5 py-3.5">
                  <Icon className="w-4 h-4 text-halo-mist-strong flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="flex-1 min-w-0 text-sm text-halo-ink leading-snug">{m.text}</span>
                  <span className="text-xs text-halo-mist-body flex-shrink-0 whitespace-nowrap">{longDate(m.at)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/*
        The one piece of meaning on the page, and it is held back until a
        student has actually reached something, so it is never shown to an
        empty record. It is not a metric and does not become one.

        This used to carry the homepage's line as well ("the return isn't what
        comes back to you"). Said in both places it started to sound like a
        slogan the company repeats rather than something it means, so the full
        line lives on the public page, where it is the argument, and this is
        the quieter half of it: the specific thing, about this mentor.
      */}
      {goalsReached > 0 && (
        <p className="text-[15px] text-halo-ink leading-relaxed border-t border-halo-rule pt-6">
          Something you worked out a while ago is now useful to someone near the start
          of it.
        </p>
      )}
    </div>
  );
}
