'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, differenceInCalendarDays } from 'date-fns';
import { ArrowRight, CalendarCheck, NotebookPen, Send, Compass } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { loadNotebooks, hasPrep, hasReflection } from '@/lib/mentorship/notebook';
import { MENTEE_TIPS, pick } from '@/lib/mentorship/coaching';

/**
 * What would help this mentee most right now, drawn only from their own data.
 *
 *   A conversation in the next week   → prepare for it (and whether they have)
 *   A recent conversation, no notes   → capture what they learned
 *   Finished something, no update     → tell the mentor what happened
 *
 * No streaks, no scores, no "you haven't checked in". If none of these apply
 * it shows a single tip and a link to the guide, and nothing else.
 */

interface Nudge {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  href: string;
  cta: string;
}

export default function MenteeCoachingCard() {
  const [nudges, setNudges] = useState<Nudge[] | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session: auth } } = await supabase.auth.getSession();
      if (!auth) return;
      const uid = auth.user.id;
      const now = Date.now();

      const { data: ms } = await supabase.from('mentorships').select('id, mentor_id').eq('mentee_id', uid).eq('status', 'active');
      const mentorships = ms ?? [];
      if (!mentorships.length) { setNudges([]); return; }
      const msIds = mentorships.map((m) => m.id);

      const [sessionsRes, itemsRes, mentorsRes, myMessages] = await Promise.all([
        supabase.from('sessions').select('id, mentorship_id, mentor_id, scheduled_at, duration_minutes, status').in('mentorship_id', msIds).order('scheduled_at', { ascending: true }),
        supabase.from('action_items').select('id, mentorship_id, title, is_completed, completed_at').in('mentorship_id', msIds).eq('assigned_to', uid).eq('is_completed', true),
        supabase.from('public_profiles').select('id, first_name').in('id', mentorships.map((m) => m.mentor_id)),
        Promise.all(msIds.map((id) => supabase.from('messages').select('created_at').eq('mentorship_id', id).eq('sender_id', uid).order('created_at', { ascending: false }).limit(1).maybeSingle().then(({ data }) => ({ id, at: data?.created_at ?? null })))),
      ]);
      const sessions = sessionsRes.data ?? [];
      const names = new Map((mentorsRes.data ?? []).map((p) => [p.id, p.first_name as string]));
      const nameFor = (mentorId: string) => names.get(mentorId) || 'your mentor';

      const upcoming = sessions.find((s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() > now && new Date(s.scheduled_at).getTime() - now <= 7 * 86400_000);
      const recent = [...sessions].reverse().find((s) => s.status === 'completed' && now - new Date(s.scheduled_at).getTime() <= 14 * 86400_000);
      const notebooks = await loadNotebooks([upcoming?.id, recent?.id].filter(Boolean) as string[], uid);

      const out: Nudge[] = [];
      if (upcoming) {
        const nb = notebooks.get(upcoming.id);
        const started = nb && hasPrep(nb);
        const qCount = nb ? nb.prep.questions.filter((q) => q.trim()).length : 0;
        const days = differenceInCalendarDays(new Date(upcoming.scheduled_at), now);
        const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : format(new Date(upcoming.scheduled_at), 'EEEE');
        out.push({
          key: 'prep',
          icon: CalendarCheck,
          title: `Your conversation with ${nameFor(upcoming.mentor_id)} is ${when}`,
          detail: started
            ? `You’ve started preparing${qCount ? ` and have ${qCount} question${qCount === 1 ? '' : 's'} ready` : ''}. Worth a last look.`
            : 'Know what you want to ask before you walk in.',
          href: `/sessions/${upcoming.id}`,
          cta: started ? 'Review' : 'Prepare',
        });
      }
      if (recent) {
        const nb = notebooks.get(recent.id);
        if (!nb || !hasReflection(nb)) {
          out.push({
            key: 'reflect',
            icon: NotebookPen,
            title: `Capture what you learned from ${nameFor(recent.mentor_id)} on ${format(new Date(recent.scheduled_at), 'MMM d')}`,
            detail: 'Write down the advice, then decide what you’ll actually do with it.',
            href: `/sessions/${recent.id}`,
            cta: 'Add notes',
          });
        }
      }
      for (const m of mentorships) {
        const lastSent = myMessages.find((x) => x.id === m.id)?.at;
        const done = (itemsRes.data ?? [])
          .filter((i) => i.mentorship_id === m.id && i.completed_at && (!lastSent || i.completed_at > lastSent))
          .sort((a, b) => (b.completed_at! > a.completed_at! ? 1 : -1));
        if (done.length) {
          out.push({
            key: `loop-${m.id}`,
            icon: Send,
            title: `You finished “${done[0].title}”. Tell ${nameFor(m.mentor_id)} what happened.`,
            detail: 'Mentors rarely get to see what came of their advice. A two-line update does that.',
            href: `/messages?mentorshipId=${m.id}`,
            cta: 'Write update',
          });
          break;
        }
      }
      setNudges(out);
    })();
  }, []);

  if (nudges === null) return null;

  const tip = pick(MENTEE_TIPS, new Date().toDateString());

  return (
    <section aria-labelledby="coaching-heading" className="bg-white rounded-2xl border border-halo-rule overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 sm:px-6 pt-5 pb-3">
        <h2 id="coaching-heading" className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">
          {nudges.length ? 'Worth doing next' : 'A thought for this week'}
        </h2>
        <Link href="/guide" className="inline-flex items-center gap-1.5 text-sm font-medium text-halo-purple-d hover:text-halo-ink">
          <Compass className="w-4 h-4" /> Mentorship Guide
        </Link>
      </div>
      {nudges.length > 0 && (
        <ul className="divide-y divide-halo-rule border-t border-halo-rule">
          {nudges.map((n) => {
            const Icon = n.icon;
            return (
              <li key={n.key}>
                <Link href={n.href} className="group flex items-start gap-4 px-5 sm:px-6 py-4 hover:bg-halo-veil/50 transition-colors">
                  <span className="w-9 h-9 rounded-xl bg-halo-veil flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-halo-purple-d" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-halo-ink leading-snug">{n.title}</span>
                    <span className="block text-[13px] text-halo-heather mt-0.5">{n.detail}</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 self-center text-sm font-semibold text-halo-purple-d flex-shrink-0">
                    {n.cta}<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="px-5 sm:px-6 py-3.5 border-t border-halo-rule bg-halo-ivory text-[14px] text-halo-heather">{tip}</p>
    </section>
  );
}
