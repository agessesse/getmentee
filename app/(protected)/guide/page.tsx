'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ShieldCheck, BookOpen } from 'lucide-react';
import { useProfile } from '@/lib/profile-context';
import {
  MENTEE_TOPICS, MENTOR_TOPICS, SAFETY_TOPICS, MENTEE_STANDARD, MENTOR_STANDARD, type GuideTopic,
} from '@/data/mentorship-guide';

/**
 * The Mentorship Guide: a short reference both sides can open any time.
 *
 * Most guidance in Mentable appears in context (the session coach, the
 * dashboards). This page is the place to look something up. It opens on the
 * reader's own side, but both sides are visible to everyone, because a mentee
 * who knows what good mentoring looks like, and the reverse, makes for a
 * better relationship. Each topic is collapsed to a title and one line.
 */

type Tab = 'mentee' | 'mentor' | 'safety';

function Topic({ t, open, onToggle }: { t: GuideTopic; open: boolean; onToggle: () => void }) {
  return (
    <li className="border-b border-halo-rule last:border-0">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`topic-${t.id}`}
          className="w-full flex items-start justify-between gap-4 text-left px-5 sm:px-6 py-4 hover:bg-halo-veil/50 transition-colors focus-visible:outline-none focus-visible:bg-halo-veil"
        >
          <span>
            <span className="block text-base font-semibold text-halo-ink">{t.title}</span>
            <span className="block text-[15px] text-halo-heather mt-0.5">{t.summary}</span>
          </span>
          <ChevronDown className={`w-5 h-5 text-halo-mist-strong flex-shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </h3>
      {open && (
        <ul id={`topic-${t.id}`} className="px-5 sm:px-6 pb-5 -mt-1 space-y-2">
          {t.points.map((pt) => (
            <li key={pt} className="flex gap-3 text-[15px] leading-relaxed text-halo-ink">
              <span aria-hidden="true" className="mt-[9px] w-1.5 h-1.5 rounded-full bg-halo-purple flex-shrink-0" />
              <span>{pt}</span>
            </li>
          ))}
          {t.seeAlso && (
            <li className="pt-1">
              <Link href={t.seeAlso.href} className="text-sm font-medium text-halo-purple-d hover:text-halo-ink">
                {t.seeAlso.label} →
              </Link>
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

export default function GuidePage() {
  const profile = useProfile();
  const [tab, setTab] = useState<Tab>('mentee');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'safety' || hash === 'mentor' || hash === 'mentee') setTab(hash);
    else if (profile?.role === 'mentor') setTab('mentor');
  }, [profile?.role]);

  const topics = tab === 'mentee' ? MENTEE_TOPICS : tab === 'mentor' ? MENTOR_TOPICS : SAFETY_TOPICS;
  const standard = tab === 'mentee' ? MENTEE_STANDARD : tab === 'mentor' ? MENTOR_STANDARD : null;
  const tabs: { key: Tab; label: string }[] = [
    { key: 'mentee', label: 'For mentees' },
    { key: 'mentor', label: 'For mentors' },
    { key: 'safety', label: 'Safety & boundaries' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d mb-2">Guide</p>
        <h1 className="font-display font-normal text-[2.25rem] leading-tight text-halo-ink">Mentorship Guide</h1>
        <p className="text-[15px] text-halo-heather mt-2 leading-relaxed">
          Short, practical advice for both sides of the relationship. Each topic takes a minute or two.
        </p>
      </header>

      <div role="tablist" aria-label="Guide sections" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => { setTab(t.key); setOpen(null); history.replaceState(null, '', `#${t.key}`); }}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2 ${
              tab === t.key ? 'bg-halo-purple border-halo-purple text-white' : 'bg-white border-halo-rule text-halo-ink hover:border-halo-purple'
            }`}
          >
            {t.key === 'safety' && <ShieldCheck className="w-4 h-4" />}
            {t.label}
          </button>
        ))}
      </div>

      {standard && (
        <section className="rounded-2xl bg-halo-veil border border-halo-lavender px-5 sm:px-6 py-5">
          <h2 className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">{standard.title}</h2>
          <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {standard.lines.map((l) => <li key={l} className="text-[15px] text-halo-ink">{l}</li>)}
          </ul>
        </section>
      )}
      {tab === 'safety' && (
        <p className="rounded-2xl bg-white border border-halo-rule px-5 sm:px-6 py-4 text-[15px] text-halo-ink leading-relaxed">
          Good mentorship is warm and personal, and it stays professional. If something feels wrong, you can stop the
          conversation, and you can report or block anyone from their profile or your message thread.
        </p>
      )}

      <section role="tabpanel" aria-label={tabs.find((t) => t.key === tab)?.label} className="bg-white rounded-2xl border border-halo-rule overflow-hidden">
        <ul>
          {topics.map((t) => (
            <Topic key={t.id} t={t} open={open === t.id} onToggle={() => setOpen((o) => (o === t.id ? null : t.id))} />
          ))}
        </ul>
      </section>

      {tab === 'mentee' && (
        <Link href="/networking" className="group flex items-center gap-4 bg-white rounded-2xl border border-halo-rule px-5 sm:px-6 py-4 hover:border-halo-purple transition-colors">
          <BookOpen className="w-5 h-5 text-halo-purple-d flex-shrink-0" />
          <span className="flex-1">
            <span className="block text-base font-semibold text-halo-ink">Networking 101</span>
            <span className="block text-[15px] text-halo-heather">Cold emails, scheduling, and running a call with someone you haven’t met yet.</span>
          </span>
          <span className="text-sm font-medium text-halo-purple-d group-hover:text-halo-ink">Open →</span>
        </Link>
      )}
    </div>
  );
}
