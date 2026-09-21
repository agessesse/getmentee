'use client';

import Link from 'next/link';
import { Calendar, CheckCircle2, Circle, Compass, MessageSquare } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { mentorPrompt } from '@/lib/mentorship/coaching';
import type { Relationship } from '@/lib/mentorship/next-action';
import type { RelationshipExtras } from '@/lib/mentorship/dashboard-data';

/**
 * One relationship, shown the same way to both people in it.
 *
 * There used to be a mentor version of this and a thinner mentee version that
 * disagreed about what a goal was and where the next conversation lived. One
 * component now serves both sides, so a goal, a commitment and a shared next
 * step look and behave identically wherever they appear.
 *
 * It leads with the person: their face, their name, and what they are working
 * toward. Counts appear only where they mean something concrete ("2 of 3 goals
 * reached"), never as a score. There is one primary action, decided by where
 * the relationship actually is, and a quiet way to write to them.
 */

const EYEBROW = 'font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body';
const PRIMARY_BTN =
  'inline-flex items-center gap-2 bg-halo-purple text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2';
const SECONDARY_BTN =
  'inline-flex items-center gap-2 border border-halo-rule bg-white text-halo-ink text-sm font-medium px-4 py-2.5 rounded-xl hover:border-halo-purple transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple';

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const monthYear = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

function dayPhrase(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86_400_000);
  if (d.toDateString() === now.toDateString()) return 'today';
  if (d.toDateString() === tomorrow.toDateString()) return 'tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export default function RelationshipCard({
  r,
  extras,
  role,
}: {
  r: Relationship;
  extras: RelationshipExtras;
  role: 'mentor' | 'mentee';
}) {
  const name = r.person.firstName;
  const partnerHref = role === 'mentor' ? `/mentee/${extras.partnerId}` : `/mentor/${extras.partnerId}`;
  const activeGoals = r.goals
    .filter((g) => g.status === 'active')
    .sort((a, b) => (a.targetDate ?? '9999').localeCompare(b.targetDate ?? '9999'));
  const reached = extras.reachedGoals;

  // The headline is why this relationship exists. When a written goal repeats
  // it, it is shown once up top instead of twice.
  const headline = r.reason ?? activeGoals[0]?.title ?? null;
  const sameAsHeadline = (t: string) => !!headline && t.trim().toLowerCase() === headline.trim().toLowerCase();
  const listed = [...reached, ...activeGoals].filter((g) => !sameAsHeadline(g.title));

  const prompt = role === 'mentor'
    ? mentorPrompt({
        seed: r.mentorshipId + new Date().toDateString(),
        isFirst: !r.lastSession,
        menteeName: name,
        openMenteeCommitments: r.openForThem.map((c) => c.title),
        completedSinceLast: r.finishedSinceLastSession.map((c) => c.title),
        upcomingGoal: null,
      })
    : null;

  const primary = r.nextSession
    ? { label: role === 'mentor' ? 'Open your briefing' : 'Open your prep', href: `/sessions/${r.nextSession.id}` }
    : r.neverMessaged
      ? { label: `Message ${name}`, href: `/messages?mentorshipId=${r.mentorshipId}` }
      : { label: 'Find a time to talk', href: `/schedule?mentorshipId=${r.mentorshipId}` };

  return (
    <article className="bg-white rounded-2xl border border-halo-rule overflow-hidden" aria-label={`Mentorship with ${r.person.fullName}`}>
      <div className="flex items-start gap-4 px-5 sm:px-6 pt-5 sm:pt-6">
        <Avatar src={r.person.avatarUrl} name={r.person.fullName} size="lg" />
        <div className="flex-1 min-w-0">
          <Link href={partnerHref} className="text-lg font-semibold text-halo-ink hover:text-halo-purple-d transition-colors">
            {r.person.fullName}
          </Link>
          {extras.subtitle && <p className="text-sm text-halo-mist-body mt-0.5 truncate">{extras.subtitle}</p>}
          <p className="text-xs text-halo-mist-body mt-1">Working together since {monthYear(r.startedAt)}</p>
        </div>
      </div>

      {headline && (
        <div className="px-5 sm:px-6 pt-5">
          <p className={EYEBROW}>Working toward</p>
          <p className="font-display text-[1.375rem] leading-snug text-halo-ink mt-1">{headline}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-5 sm:px-6 py-5">
        <div>
          <p className={EYEBROW}>{headline && listed.length ? 'Along the way' : role === 'mentor' ? 'Their goals' : 'Your goals'}</p>
          {r.goals.length === 0 ? (
            <p className="text-sm text-halo-heather mt-2 leading-relaxed">
              {role === 'mentor'
                ? 'No goals written down yet. Setting one together gives each conversation a direction.'
                : 'No goals written down yet. One clear goal makes every conversation easier to plan.'}
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {(listed.length ? listed : [...reached, ...activeGoals]).slice(0, 4).map((g) => (
                <li key={g.id} className="flex items-start gap-2.5">
                  {g.status === 'completed'
                    ? <CheckCircle2 className="w-4 h-4 text-halo-purple-d flex-shrink-0 mt-0.5" aria-hidden="true" />
                    : <Circle className="w-4 h-4 text-halo-mist-strong flex-shrink-0 mt-0.5" aria-hidden="true" />}
                  <span className="text-sm text-halo-ink leading-snug">
                    {g.title}
                    <span className="text-halo-mist-body">
                      {g.status === 'completed'
                        ? ' · reached'
                        : g.targetDate ? ` · by ${shortDate(`${g.targetDate}T12:00:00`)}` : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(reached.length > 0 || extras.doneActions > 0) && (
            <p className="text-xs text-halo-heather mt-3">
              {[
                reached.length > 0 && `${reached.length} of ${r.goals.length} goals reached`,
                extras.doneActions > 0 && `${extras.doneActions} of ${extras.totalActions} next steps done`,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className={EYEBROW}>
              {r.lastSession ? `Since you last spoke · ${shortDate(r.lastSession.at)}` : 'Since you started'}
            </p>
            {extras.since.length === 0 ? (
              <p className="text-sm text-halo-heather mt-2">Nothing new yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {extras.since.slice(0, 4).map((e) => (
                  <li key={e.key} className="flex items-start gap-2.5 text-sm text-halo-ink leading-snug">
                    {e.done
                      ? <CheckCircle2 className="w-4 h-4 text-halo-purple-d flex-shrink-0 mt-0.5" aria-hidden="true" />
                      : <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-halo-purple" /></span>}
                    {e.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(r.openForThem.length > 0 || r.openForMine.length > 0) && (
            <div>
              <p className={EYEBROW}>Agreed next steps</p>
              <ul className="mt-2 space-y-2">
                {r.openForMine.slice(0, 3).map((c) => (
                  <li key={c.id} className="text-sm text-halo-ink leading-snug">
                    <span className="text-halo-mist-body">You: </span>{c.title}
                    {c.dueDate && <span className="text-halo-mist-body"> · by {shortDate(`${c.dueDate}T12:00:00`)}</span>}
                  </li>
                ))}
                {r.openForThem.slice(0, 3).map((c) => (
                  <li key={c.id} className="text-sm text-halo-ink leading-snug">
                    <span className="text-halo-mist-body">{name}: </span>{c.title}
                    {/* Both sides' dates, or the same commitment reads as
                        undated here and overdue on the Goals page. */}
                    {c.dueDate && <span className="text-halo-mist-body"> · by {shortDate(`${c.dueDate}T12:00:00`)}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {extras.privateNote && r.lastSession && (
            <div>
              <p className={EYEBROW}>Your note from {shortDate(r.lastSession.at)}</p>
              <p className="text-sm text-halo-ink mt-2 leading-relaxed line-clamp-3 whitespace-pre-line">{extras.privateNote}</p>
            </div>
          )}
        </div>
      </div>

      {prompt && (
        <div className="px-5 sm:px-6 pb-5">
          <p className="flex items-start gap-2.5 rounded-xl bg-halo-veil border border-halo-lavender px-4 py-3 text-sm text-halo-ink leading-relaxed">
            <Compass className="w-4 h-4 text-halo-purple-d flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span><span className="font-semibold">Worth asking next time: </span>{prompt}</span>
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-halo-veil/60 border-t border-halo-rule px-5 sm:px-6 py-4">
        <p className="flex items-center gap-3 min-w-0 text-sm text-halo-ink">
          <Calendar className="w-4 h-4 text-halo-purple-d flex-shrink-0" aria-hidden="true" />
          {r.nextSession ? (
            <span>
              <span className="text-halo-mist-body">Next conversation </span>
              <span className="font-semibold">{dayPhrase(r.nextSession.at)} · {timeOf(r.nextSession.at)}</span>
            </span>
          ) : (
            <span className="text-halo-heather">No conversation scheduled yet</span>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={primary.href} className={PRIMARY_BTN}>{primary.label}</Link>
          {!r.neverMessaged && (
            <Link href={`/messages?mentorshipId=${r.mentorshipId}`} className={SECONDARY_BTN}>
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              Message {name}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
