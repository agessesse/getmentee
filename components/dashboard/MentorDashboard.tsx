'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, Eye } from 'lucide-react';
import { useProfile } from '@/lib/profile-context';
import SinceYouWereHere from '@/components/dashboard/SinceYouWereHere';
import NextActionCard, { NowList } from '@/components/dashboard/NextAction';
import RelationshipCard from '@/components/dashboard/RelationshipCard';
import { loadDashboard, type DashboardData } from '@/lib/mentorship/dashboard-data';
import { mentorNow, mentorNextAction } from '@/lib/mentorship/next-action';

/**
 * The mentor's home.
 *
 * WHAT IT REPLACED, TWICE OVER. First a strip of "Mentees mentored", "Hours
 * invested" and an average rating: all of it counted what the mentor had given
 * and none of it said who needed them. Then a good but private structure that
 * shared no code with the student's side, so the two halves of the same
 * relationship described it differently.
 *
 * WHAT IT DOES NOW: the same bands the student sees, in the same order — what
 * changed, what needs you now, the one thing next, who you're working with,
 * what's coming up — built from the same loader and the same relationship card.
 * Only the copy and the mentor-specific setup panel differ, because only those
 * things genuinely differ.
 *
 * WHAT IT STILL DELIBERATELY DOES NOT DO. No hours, streaks, scores, ratings,
 * rankings, or congratulation copy. No urgency the data doesn't support: when
 * nothing needs the mentor, it says so plainly.
 */

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EYEBROW = 'font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body';

function greeting(name: string) {
  const h = new Date().getHours();
  return `Good ${h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'}${name ? `, ${name}` : ''}`;
}

const when = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
  ' · ' +
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** Reading chosen for where this mentor actually is. */
function readingFor(d: DashboardData): { title: string; blurb: string; href: string }[] {
  if (d.relationships.length === 0) {
    return [
      { title: 'What students are trying to learn', blurb: 'Most arrive wanting to understand a path, not to be handed one.', href: '/guide#mentor' },
      { title: 'Safety and boundaries', blurb: 'What to keep to yourself, and what to do if a conversation goes somewhere it shouldn’t.', href: '/guide#safety' },
    ];
  }
  const hadFirst = d.relationships.some((r) => r.lastSession);
  if (!hadFirst) {
    return [
      { title: 'Your first conversation', blurb: 'Twenty minutes of listening beats twenty minutes of advice.', href: '/guide#mentor' },
      { title: 'Questions that open someone up', blurb: 'A few that reliably get past the rehearsed answer.', href: '/guide#mentor' },
    ];
  }
  return [
    { title: 'Between conversations', blurb: 'What to do when a student goes quiet, and when to leave it alone.', href: '/guide#mentor' },
    { title: 'Safety and boundaries', blurb: 'Referrals, recommendations, and where your responsibility ends.', href: '/guide#safety' },
  ];
}

function ReadinessPanel({ data, uid, prominent }: { data: DashboardData; uid: string; prominent: boolean }) {
  const readiness = data.readiness!;
  const room = Math.max(0, readiness.maxMentees - data.relationships.length);
  const days = readiness.availabilityDays.map((d) => DAY_NAMES[d]).join(', ');

  const cells = [
    {
      label: 'New mentees',
      value: !readiness.isAvailable
        ? 'Not taking requests right now'
        : room === 0
          ? 'Your mentorships are full'
          : data.relationships.length === 0
            ? `Open to requests · up to ${readiness.maxMentees}`
            : `Open to requests · room for ${room} more`,
      href: '/profile/setup',
      action: 'Change',
    },
    {
      label: 'What you can help with',
      value: readiness.expertise.length
        ? readiness.expertise.slice(0, 3).join(', ') + (readiness.expertise.length > 3 ? ` +${readiness.expertise.length - 3}` : '')
        : 'Not added yet',
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
        {!prominent && (
          <Link href={`/mentor/${uid}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-halo-purple-d hover:text-halo-ink transition-colors">
            <Eye className="w-4 h-4" aria-hidden="true" />
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
            <span className="min-w-0">
              <span className={`block ${EYEBROW}`}>{c.label}</span>
              <span className="block text-sm text-halo-ink mt-1.5 leading-snug">{c.value}</span>
            </span>
            <span className="text-sm font-medium text-halo-purple-d group-hover:text-halo-ink transition-colors">{c.action} →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="bg-halo-deep/10 rounded-2xl h-40 animate-pulse" />
      <div className="bg-white rounded-2xl border border-halo-rule p-6 animate-pulse space-y-4">
        <div className="flex gap-4"><div className="w-14 h-14 rounded-full bg-halo-bone" /><div className="space-y-2 flex-1"><div className="h-4 w-40 bg-halo-bone rounded" /><div className="h-3 w-56 bg-halo-veil rounded" /></div></div>
        <div className="h-24 bg-halo-veil rounded-xl" />
      </div>
    </div>
  );
}

export default function MentorDashboard() {
  const profile = useProfile();
  const [data, setData] = useState<DashboardData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadDashboard(profile.id, 'mentor').then(setData).catch(() => setFailed(true));
  }, [profile?.id]);

  const state = data && profile?.id ? {
    mentorId: profile.id,
    relationships: data.relationships,
    pendingRequests: data.requests.map((r) => ({ id: r.id, menteeName: r.name, goals: r.goals, createdAt: r.createdAt })),
    hasAvailability: (data.readiness?.availabilityDays.length ?? 0) > 0,
    isNew: data.relationships.length === 0,
  } : null;

  const next = state ? mentorNextAction(state) : null;
  // The next action is usually the most urgent "now" item too. Showing it in
  // both places reads as a stutter, so the band below the big card carries
  // only what the card does not already cover.
  // Drop what the next-action card already says, then cap: three is the most
  // a person reads as "urgent" before the word stops meaning anything.
  const now = (state ? mentorNow(state) : []).filter((i) => i.href !== next?.href).slice(0, 3);
  const hasMentees = !!data && data.relationships.length > 0;
  const isNew = !!data && !hasMentees && data.requests.length === 0;
  // Requests are capped in the "now" list; point to the rest rather than
  // stacking nine of them on the home page. The one the next-action card is
  // already showing counts as handled here, so the number adds up on screen.
  const shownRequests = now.filter((i) => i.kind === 'request').length + (next?.key === 'review-request' ? 1 : 0);
  const hiddenRequests = Math.max(0, (data?.requests.length ?? 0) - shownRequests);

  const upcoming = (data?.relationships ?? [])
    .filter((r) => r.nextSession)
    .map((r) => ({ id: r.nextSession!.id, at: r.nextSession!.at, person: r.person }))
    .sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display font-normal text-[2rem] leading-tight text-halo-ink">
            {greeting(profile?.first_name ?? '')}
          </h1>
          {data?.readiness?.isFoundingMentor && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-halo-purple-d bg-halo-veil border border-halo-lavender px-2.5 py-1 rounded-full">
              <Award className="w-3 h-3" aria-hidden="true" />
              Founding Mentor
            </span>
          )}
        </div>
        <p className="text-halo-mist-body mt-1 text-sm">
          {!data ? ' ' : isNew ? 'Your profile is live.' : now.length > 0 ? 'Here’s where your perspective is useful next.' : 'Here’s where things stand.'}
        </p>
      </header>

      {failed && (
        <p className="text-sm text-halo-heather bg-white border border-halo-rule rounded-2xl px-5 py-4">
          Your dashboard didn&apos;t load. Refresh the page to try again.
        </p>
      )}

      {!data && !failed && <Skeleton />}

      {data && next && (
        <>
          {profile?.id && <SinceYouWereHere userId={profile.id} />}

          <NowList
            items={now}
            overflow={hiddenRequests > 0
              ? { label: hiddenRequests === 1 ? '1 more request' : `${hiddenRequests} more requests`, href: '/requests' }
              : undefined}
          />

          <NextActionCard action={next} quiet={next.key === 'steady'} />

          {hasMentees && (
            <section aria-labelledby="rel-heading" className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 id="rel-heading" className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">
                  {data.relationships.length === 1 ? 'Your mentee' : 'Your mentees'}
                </h2>
                <Link href="/mentorships" className="text-sm text-halo-purple-d hover:text-halo-ink font-medium">
                  All mentorships
                </Link>
              </div>
              {data.relationships.map((r) => (
                <RelationshipCard key={r.mentorshipId} r={r} extras={data.extras.get(r.mentorshipId)!} role="mentor" />
              ))}
            </section>
          )}

          {upcoming.length > 0 && (
            <section aria-labelledby="coming-heading">
              <h2 id="coming-heading" className={`${EYEBROW} mb-2`}>Coming up</h2>
              <ul className="bg-white rounded-2xl border border-halo-rule divide-y divide-halo-rule overflow-hidden">
                {upcoming.slice(0, 3).map((s) => (
                  <li key={s.id}>
                    <Link href={`/sessions/${s.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-halo-veil/50 transition-colors">
                      <span className="flex-1 min-w-0 text-sm text-halo-ink">
                        <span className="font-semibold">{when(s.at)}</span>
                        <span className="text-halo-mist-body"> · with {s.person.firstName}</span>
                      </span>
                      <span className="text-sm font-medium text-halo-purple-d flex-shrink-0">Open briefing →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="reading-heading">
            <h2 id="reading-heading" className={`${EYEBROW} mb-2`}>Worth reading where you are</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {readingFor(data).map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group bg-white rounded-2xl border border-halo-rule p-5 hover:border-halo-purple transition-colors"
                >
                  <p className="text-sm font-semibold text-halo-ink leading-snug">{item.title}</p>
                  <p className="text-[13px] text-halo-mist-body mt-1.5 leading-relaxed">{item.blurb}</p>
                  <span className="inline-block mt-3 text-sm font-medium text-halo-purple-d group-hover:text-halo-ink transition-colors">Read →</span>
                </Link>
              ))}
            </div>
          </section>

          {profile?.id && data.readiness && (
            <ReadinessPanel data={data} uid={profile.id} prominent={isNew} />
          )}
        </>
      )}
    </div>
  );
}
