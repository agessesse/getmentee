'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, X } from 'lucide-react';
import type { LearnRef } from '@/lib/mentorship/next-action';

/**
 * The right sentence at the right moment.
 *
 * Someone who has never asked a professional for their time doesn't need an
 * article; they need two lines exactly where they hesitate. This is that: a
 * quiet note beside the thing they are about to do, with a link to the longer
 * reading for anyone who wants it.
 *
 * What it deliberately is not: not a modal, not a tour, not a thing that takes
 * focus or blocks the task. It is an aside in the reading order, dismissible,
 * and once dismissed it stays dismissed for that moment on that device. It
 * never writes anything for the student.
 */
export default function LearnHint({
  hint,
  id,
  className = '',
  tone = 'quiet',
}: {
  hint: LearnRef;
  /** Dismissal is remembered per moment, e.g. "first-message". */
  id: string;
  className?: string;
  tone?: 'quiet' | 'plain';
}) {
  const key = `mentable.hint.${id}`;
  // Render nothing on the first pass: reading storage during render would
  // differ between server and client markup.
  const [state, setState] = useState<'unknown' | 'show' | 'hidden'>('unknown');

  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(key) === '1'; } catch { /* blocked storage */ }
    setState(dismissed ? 'hidden' : 'show');
  }, [key]);

  if (state !== 'show') return null;

  const dismiss = () => {
    try { localStorage.setItem(key, '1'); } catch { /* blocked storage */ }
    setState('hidden');
  };

  const shell = tone === 'quiet'
    ? 'bg-halo-veil border-halo-lavender'
    : 'bg-white border-halo-rule';

  return (
    <aside
      aria-label="Tip"
      className={`relative flex items-start gap-3 rounded-xl border ${shell} px-4 py-3 pr-9 ${className}`}
    >
      <GraduationCap className="w-4 h-4 text-halo-purple-d flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[13px] text-halo-ink leading-relaxed">
          <span className="font-semibold">{hint.title}. </span>
          {hint.body}
        </p>
        <Link
          href={hint.href}
          className="inline-block mt-1.5 text-[13px] font-medium text-halo-purple-d hover:text-halo-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
        >
          {hint.linkLabel} →
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        className="absolute top-2.5 right-2.5 p-1 rounded-lg text-halo-mist-strong hover:text-halo-ink hover:bg-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </aside>
  );
}
