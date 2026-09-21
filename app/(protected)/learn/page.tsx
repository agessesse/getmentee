'use client';

import Link from 'next/link';
import { BookOpen, Compass, ShieldCheck } from 'lucide-react';
import { useProfile } from '@/lib/profile-context';

/**
 * Learn: one door to the two things worth reading.
 *
 * The sidebar used to carry "Networking 101" and "Mentorship Guide" as
 * separate destinations, which read as two products and made the nav longer
 * for no gain. This page is the single entry, and neither guide is buried:
 * both are on screen at once, each with its own sections linked directly, so
 * getting to "how to prepare" is still one click from here.
 *
 * Neither guide's content lives here. /networking and /guide are unchanged,
 * word for word; this page only points at them.
 */

const NETWORKING = [
  { href: '/networking#start', label: 'What networking actually is' },
  { href: '/networking#who', label: 'Who should I talk to?' },
  { href: '/networking#research', label: 'Before you reach out' },
  { href: '/networking#message', label: 'Sending the message' },
  { href: '/networking#preparing', label: 'Preparing' },
  { href: '/networking#conversation', label: 'The conversation' },
  { href: '/networking#questions', label: 'Asking better questions' },
  { href: '/networking#follow-up', label: 'Following up' },
];

const GUIDE_MENTEE = [
  { href: '/guide#mentee', label: 'For mentees' },
  { href: '/guide#mentor', label: 'For mentors' },
  { href: '/guide#safety', label: 'Safety and boundaries' },
];

export default function LearnPage() {
  const isMentor = useProfile()?.role === 'mentor';

  const networkingCard = (
    <section aria-labelledby="n101" className="bg-white rounded-2xl border border-halo-rule p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-halo-veil border border-halo-lavender flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-halo-purple-d" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="n101" className="font-display font-normal text-[1.5rem] leading-tight text-halo-ink">Networking 101</h2>
          <p className="text-[15px] text-halo-heather mt-1 leading-relaxed">
            {isMentor
              ? 'What your mentees are reading: how to find someone, write to them, prepare, and follow up. Worth knowing what they have been told.'
              : 'How to find someone worth talking to, write to them, run the conversation, and follow up afterwards. Start here if you have never done this before.'}
          </p>
        </div>
      </div>
      <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-1">
        {NETWORKING.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="block py-1.5 text-[15px] text-halo-ink hover:text-halo-purple-d transition-colors">
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/networking" className="inline-block mt-3 text-sm font-medium text-halo-purple-d hover:text-halo-ink transition-colors">
        Read all fifteen sections →
      </Link>
    </section>
  );

  const guideCard = (
    <section aria-labelledby="guide" className="bg-white rounded-2xl border border-halo-rule p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-halo-veil border border-halo-lavender flex items-center justify-center flex-shrink-0">
          <Compass className="w-5 h-5 text-halo-purple-d" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="guide" className="font-display font-normal text-[1.5rem] leading-tight text-halo-ink">Mentorship Guide</h2>
          <p className="text-[15px] text-halo-heather mt-1 leading-relaxed">
            {isMentor
              ? 'What makes a mentorship work once it has started: the first conversation, what to do between them, and where your responsibility ends.'
              : 'What happens after a mentor says yes: how to use the time well, what to bring, and what to expect from each other.'}
          </p>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {GUIDE_MENTEE.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="inline-flex items-center gap-2 rounded-full border border-halo-rule bg-white px-4 py-2 text-sm font-medium text-halo-ink hover:border-halo-purple transition-colors"
            >
              {s.label === 'Safety and boundaries' && <ShieldCheck className="w-4 h-4 text-halo-purple-d" aria-hidden="true" />}
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="font-display font-normal text-[2.25rem] leading-tight text-halo-ink">Learn</h1>
        <p className="text-[15px] text-halo-heather mt-2 leading-relaxed">
          Two short guides. Nothing here assumes you have done any of this before.
        </p>
      </header>

      {isMentor ? <>{guideCard}{networkingCard}</> : <>{networkingCard}{guideCard}</>}
    </div>
  );
}
