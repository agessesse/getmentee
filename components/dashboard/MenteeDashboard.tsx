'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bookmark, Calendar, Clock, Lightbulb, Search } from 'lucide-react';
import { useProfile } from '@/lib/profile-context';
import Avatar from '@/components/ui/Avatar';
import SinceYouWereHere from '@/components/dashboard/SinceYouWereHere';
import NextActionCard, { NowList } from '@/components/dashboard/NextAction';
import RelationshipCard from '@/components/dashboard/RelationshipCard';
import { loadDashboard, type DashboardData } from '@/lib/mentorship/dashboard-data';
import { menteeNow, menteeNextAction } from '@/lib/mentorship/next-action';

/**
 * The student's home.
 *
 * WHAT IT REPLACED. Four counters (pending requests, active mentorships,
 * sessions, goals), an upcoming-sessions list, a recent-messages list, and a
 * coaching card. Everything on it was a link to somewhere else, and nothing on
 * it said what to do. A first-time student landed on their own statistics and
 * had to work out the product from the sidebar.
 *
 * WHAT IT DOES NOW, in this order: what changed since they were here, what
 * needs them now, the one thing to do next, who they are working with, what is
 * coming up, and something worth reading for where they actually are. The
 * counters survive as a quiet strip at the bottom, where a number belongs.
 *
 * Nothing on this page is invented. Every band is empty when its rows are
 * empty, and the page is allowed to be quiet.
 */

const EYEBROW = 'font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body';

function greeting(name: string) {
  const h = new Date().getHours();
  return `Good ${h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'}${name ? `, ${name}` : ''}`;
}

const when = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
  ' · ' +
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** Reading chosen for where this person actually is, not a rotating tip jar. */
function readingFor(d: DashboardData): { title: string; blurb: string; href: string }[] {
  const rels = d.relationships;
  if (rels.length === 0 && d.requests.length === 0) {
    return [
      { title: 'What a coffee chat actually is', blurb: 'Fifteen to thirty minutes, mostly listening. Not an interview, not an ask for a job.', href: '/networking#conversation' },
      { title: 'Who is worth talking to first', blurb: 'The people most likely to reply are closer to you than you think.', href: '/networking#who' },
    ];
  }
  if (rels.length === 0) {
    return [
      { title: 'How to research someone before you talk', blurb: 'Twenty minutes of reading changes what you can ask.', href: '/networking#research' },
      { title: 'If they don’t reply', blurb: 'Silence is usually not a no. There’s a template for the follow-up.', href: '/networking#examples' },
    ];
  }
  const hadFirst = rels.some((r) => r.lastSession);
  if (!hadFirst) {
    return [
      { title: 'Three levels of questions', blurb: 'The difference between a question anyone could ask and one only you could.', href: '/networking#questions' },
      { title: 'Your first conversation', blurb: 'What to expect, and what makes a mentor want a second one.', href: '/guide#mentee' },
    ];
  }
  return [
    { title: 'Closing the loop', blurb: 'Telling someone what came of their advice is the rarest thing you can do.', href: '/networking#follow-up' },
    { title: 'Staying in touch without being annoying', blurb: 'Updates, not check-ins. Here is the difference.', href: '/networking#staying' },
  ];
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

export default function MenteeDashboard() {
  const profile = useProfile();
  const [data, setData] = useState<DashboardData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadDashboard(profile.id, 'mentee').then(setData).catch(() => setFailed(true));
  }, [profile?.id]);

  const state = data && {
    relationships: data.relationships,
    pendingRequests: data.requests.map((r) => ({ id: r.id, mentorName: r.name, createdAt: r.createdAt })),
    savedMentors: data.savedMentors,
    contactableMentors: data.contactableMentors,
  };

  const next = state ? menteeNextAction(state) : null;
  // The next action is usually the most urgent "now" item too. Showing it in
  // both places reads as a stutter, so the band below the big card carries
  // only what the card does not already cover.
  // Drop what the next-action card already says, then cap: three is the most
  // a person reads as "urgent" before the word stops meaning anything.
  const now = (state ? menteeNow(state) : []).filter((i) => i.href !== next?.href).slice(0, 3);
  const upcoming = (data?.relationships ?? [])
    .filter((r) => r.nextSession)
    .map((r) => ({ id: r.nextSession!.id, at: r.nextSession!.at, person: r.person }))
    .sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="font-display font-normal text-[2rem] leading-tight text-halo-ink">
          {greeting(profile?.first_name ?? '')}
        </h1>
        <p className="text-halo-mist-body mt-1 text-sm">
          {!data ? ' ' : now.length > 0 ? 'A few things are waiting for you.' : 'Here’s where things stand.'}
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

          <NowList items={now} />

          <NextActionCard action={next} quiet={next.key === 'steady'} />

          {/* ── Relationships ──────────────────────────────────────────────── */}
          {data.relationships.length > 0 && (
            <section aria-labelledby="rel-heading" className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 id="rel-heading" className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">
                  {data.relationships.length === 1 ? 'Your mentor' : 'Your mentors'}
                </h2>
                <Link href="/mentorships" className="text-sm text-halo-purple-d hover:text-halo-ink font-medium">
                  All mentorships
                </Link>
              </div>
              {data.relationships.map((r) => (
                <RelationshipCard key={r.mentorshipId} r={r} extras={data.extras.get(r.mentorshipId)!} role="mentee" />
              ))}
            </section>
          )}

          {/* Requests they have sent and are waiting on. Stated plainly: a
              pending request is not a relationship, and saying so is kinder
              than implying one. */}
          {data.requests.length > 0 && (
            <section aria-labelledby="waiting-heading">
              <h2 id="waiting-heading" className={`${EYEBROW} mb-2`}>Waiting to hear back</h2>
              <ul className="bg-white rounded-2xl border border-halo-rule divide-y divide-halo-rule overflow-hidden">
                {data.requests.map((req) => (
                  <li key={req.id} className="flex items-center gap-4 px-5 py-4">
                    <Avatar src={req.person?.avatar_url ?? null} name={req.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-halo-ink">{req.name}</p>
                      <p className="text-xs text-halo-mist-body mt-0.5">
                        Asked on {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        {req.goals ? ` · ${req.goals}` : ''}
                      </p>
                    </div>
                    <Link href="/requests" className="text-sm font-medium text-halo-purple-d hover:text-halo-ink flex-shrink-0">
                      See request
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Coming up ──────────────────────────────────────────────────── */}
          {upcoming.length > 0 && (
            <section aria-labelledby="coming-heading">
              <h2 id="coming-heading" className={`${EYEBROW} mb-2`}>Coming up</h2>
              <ul className="bg-white rounded-2xl border border-halo-rule divide-y divide-halo-rule overflow-hidden">
                {upcoming.slice(0, 3).map((s) => (
                  <li key={s.id}>
                    <Link href={`/sessions/${s.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-halo-veil/50 transition-colors">
                      <Calendar className="w-4 h-4 text-halo-purple-d flex-shrink-0" aria-hidden="true" />
                      <span className="flex-1 min-w-0 text-sm text-halo-ink">
                        <span className="font-semibold">{when(s.at)}</span>
                        <span className="text-halo-mist-body"> · with {s.person.firstName}</span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-halo-mist-strong flex-shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── For you ────────────────────────────────────────────────────── */}
          <section aria-labelledby="reading-heading">
            <h2 id="reading-heading" className={`${EYEBROW} mb-2`}>Worth reading where you are</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {readingFor(data).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group bg-white rounded-2xl border border-halo-rule p-5 hover:border-halo-purple transition-colors"
                >
                  <p className="text-sm font-semibold text-halo-ink leading-snug">{item.title}</p>
                  <p className="text-[13px] text-halo-mist-body mt-1.5 leading-relaxed">{item.blurb}</p>
                  <span className="inline-block mt-3 text-sm font-medium text-halo-purple-d group-hover:text-halo-ink transition-colors">
                    Read →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Quieter things ─────────────────────────────────────────────── */}
          <section aria-labelledby="more-heading" className="space-y-3 pt-2">
            <h2 id="more-heading" className={EYEBROW}>More</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/discover" className="group flex items-center gap-3 bg-white rounded-2xl border border-halo-rule px-4 py-3.5 hover:border-halo-purple transition-colors">
                <Search className="w-4 h-4 text-halo-purple-d flex-shrink-0" aria-hidden="true" />
                <span className="text-sm text-halo-ink">Find a mentor</span>
              </Link>
              <Link href="/discover?saved=1" className="group flex items-center gap-3 bg-white rounded-2xl border border-halo-rule px-4 py-3.5 hover:border-halo-purple transition-colors">
                <Bookmark className="w-4 h-4 text-halo-purple-d flex-shrink-0" aria-hidden="true" />
                <span className="text-sm text-halo-ink">
                  Saved mentors
                  {data.savedMentors > 0 && <span className="text-halo-mist-body"> · {data.savedMentors}</span>}
                </span>
              </Link>
              <Link href="/schedule" className="group flex items-center gap-3 bg-white rounded-2xl border border-halo-rule px-4 py-3.5 hover:border-halo-purple transition-colors">
                <Clock className="w-4 h-4 text-halo-purple-d flex-shrink-0" aria-hidden="true" />
                <span className="text-sm text-halo-ink">Your schedule</span>
              </Link>
            </div>

            <Link
              href="/opportunities"
              className="group flex items-start gap-4 bg-white rounded-2xl border border-halo-rule p-5 hover:border-halo-lavender hover:shadow-sm transition-all"
            >
              <span className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-amber-600" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-halo-ink">Opportunity Fund</span>
                  <span className="text-[11px] font-semibold font-ui uppercase tracking-[0.14em] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    Pilot
                  </span>
                </span>
                <span className="block text-xs text-halo-mist-body mt-0.5 leading-relaxed">
                  Professional-development funding for students with demonstrated financial need. Attire, travel, networking, and more.
                </span>
              </span>
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
