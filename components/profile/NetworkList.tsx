'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { NetworkPerson } from '@/lib/profile/network';

/**
 * Who is on Mentable.
 *
 * Search filters in the browser because the whole roster is ten people and
 * will be a few dozen after Cohort 001. A server round trip per keystroke
 * for a list that fits in memory is engineering for a scale that does not
 * exist, and this pass is explicit about not doing that.
 *
 * Each card answers the three questions the brief asks a profile to answer
 * before you click it: who is this, why might I want to know them, what
 * could we help each other with.
 */
export default function NetworkList({
  people,
  viewerRole,
}: {
  people: NetworkPerson[];
  viewerRole: 'mentor' | 'mentee';
}) {
  const [q, setQ] = useState('');

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return people;
    return people.filter((p) =>
      [p.fullName, p.roleLine, p.company, p.university, p.location, ...p.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [people, q]);

  if (people.length === 0) {
    /*
      The honest state, and the only correct one today: there are twenty-five
      mentor rows in the database and none of them is a real person. Showing
      them would be fabricated liquidity.
    */
    return (
      <div className="rounded-2xl border border-dashed border-halo-rule px-6 py-8">
        <p className="font-display text-[1.25rem] text-halo-ink">No one here yet.</p>
        <p className="text-[14.5px] text-halo-heather leading-relaxed mt-2 max-w-md">
          Mentable is onboarding its first ten mentors. As they join, this is where
          you&rsquo;ll find them: what they do, what they can help with, and whether
          it&rsquo;s worth a conversation.
        </p>
        {viewerRole === 'mentee' && (
          <Link
            href="/mentorships"
            className="inline-block mt-5 text-[13.5px] font-medium text-halo-brand-text underline underline-offset-2 hover:text-halo-ink transition-colors"
          >
            See your relationships
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-6">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-halo-mist-strong"
          aria-hidden="true"
        />
        <label htmlFor="network-search" className="sr-only">Search people</label>
        <input
          id="network-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, company, school or expertise"
          className="w-full rounded-xl border border-halo-rule bg-white pl-10 pr-3.5 py-2.5 text-[15px] text-halo-ink placeholder:text-halo-mist-strong focus:outline-none focus:ring-2 focus:ring-halo-purple"
        />
      </div>

      {shown.length === 0 ? (
        <p className="text-[14.5px] text-halo-heather">
          Nobody matches &ldquo;{q.trim()}&rdquo;.
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((p) => (
            <li key={p.id}>
              <Link
                href={`/network/${p.id}`}
                className="flex items-start gap-4 rounded-2xl border border-halo-rule p-4 hover:bg-halo-veil transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
              >
                <Avatar src={p.avatarUrl} name={p.fullName} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15.5px] font-medium text-halo-ink leading-snug">
                    {p.fullName}
                  </span>
                  {(p.roleLine || p.company) && (
                    <span className="block text-[13.5px] text-halo-heather leading-snug mt-0.5">
                      {p.roleLine}{p.roleLine && p.company ? ' · ' : ''}{p.company}
                    </span>
                  )}
                  {p.university && (
                    <span className="block text-[12.5px] text-halo-mist-body mt-0.5">
                      {p.university}
                      {p.graduationYear ? ` '${String(p.graduationYear).slice(-2)}` : ''}
                    </span>
                  )}
                  {p.tags.length > 0 && (
                    <span className="flex flex-wrap gap-1.5 mt-2.5">
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-halo-veil border border-halo-rule px-2.5 py-1 text-[11.5px] text-halo-heather"
                        >
                          {t}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
