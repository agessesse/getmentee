'use client';

import { useEffect, useRef, useState } from 'react';
import { DEMO_MATCHES } from '@/lib/marketing/demo-match';

/**
 * The homepage's centrepiece: a community resolving into a recommendation.
 *
 * WHAT IT IS SHOWING, in four beats:
 *   1. a community of people
 *   2. the signals Mentable actually reads lighting up
 *   3. two of them resolving together
 *   4. the reason, in a sentence
 *
 * THE REASON IS REAL. Every explanation here comes out of
 * lib/matching/engine.ts via lib/marketing/demo-match.ts — the same
 * function Discover runs. The people are invented and labelled as such;
 * the reasoning is the product. A hand-written demo would keep looking
 * good long after the engine stopped being able to produce sentences like
 * these, which is exactly the lie this avoids.
 *
 * MOTION BUDGET. CSS transforms and opacity only: no canvas, no particle
 * library, no WebGL, no layout thrash. Four timers and a state index. The
 * whole thing is inert under prefers-reduced-motion, where it renders the
 * final frame of the first scene — which is the frame that matters, so
 * nothing is lost by never animating.
 */

type Beat = 'pool' | 'signals' | 'resolve' | 'reason';

const BEATS: { beat: Beat; ms: number }[] = [
  { beat: 'pool', ms: 1100 },
  { beat: 'signals', ms: 1400 },
  { beat: 'resolve', ms: 1200 },
  { beat: 'reason', ms: 4200 },
];

export default function MatchDemo() {
  const [scene, setScene] = useState(0);
  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const { ms } = BEATS[step];
    timer.current = setTimeout(() => {
      if (step < BEATS.length - 1) setStep(step + 1);
      else { setStep(0); setScene((s) => (s + 1) % DEMO_MATCHES.length); }
    }, ms);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [step, scene, reduced]);

  const m = DEMO_MATCHES[scene];
  // Under reduced motion the final beat is the resting state.
  const beat: Beat = reduced ? 'reason' : BEATS[step].beat;
  const on = (b: Beat) => BEATS.findIndex((x) => x.beat === beat) >= BEATS.findIndex((x) => x.beat === b);

  return (
    <div
      className="relative rounded-2xl border border-halo-rule bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(21,19,26,0.04)]"
      /* The whole thing is decorative narration of the copy beside it. */
      role="img"
      aria-label={`Product demonstration. ${m.seeker.name} and ${m.candidate.name} are recommended to meet. ${m.reasons.join(' ')}`}
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
          {m.community}
        </p>
        {/* Says plainly that the people are made up. */}
        <p className="font-ui text-[9.5px] font-semibold uppercase tracking-[0.12em] text-halo-mist border border-halo-rule rounded-full px-2 py-0.5">
          Illustrative
        </p>
      </div>

      {/* ── The two people ─────────────────────────────────────────── */}
      {/*
        STACKED ON A PHONE, SIDE BY SIDE FROM sm.

        Two cards across 390px left roughly 150px each, which truncated
        "Michael Ross" to "Michael ..." and "Student · Class of 2027" to
        "Student · Cl...". A recommendation card that cannot show a name
        is not making its case. Stacked, both read in full and the
        relationship line rotates to sit between them.
      */}
      <div className="relative flex flex-col sm:flex-row items-stretch gap-3">
        <Person
          initials={m.seeker.initials}
          name={m.seeker.name}
          label={m.seeker.label}
          signals={m.seeker.signals}
          showSignals={on('signals')}
          pulled={on('resolve')}
          side="left"
        />
        <Person
          initials={m.candidate.initials}
          name={m.candidate.name}
          label={m.candidate.label}
          signals={m.candidate.signals}
          showSignals={on('signals')}
          pulled={on('resolve')}
          side="right"
        />

        {/*
          The relationship line. Grows between the two cards once they
          resolve; it is the one piece of pure decoration here and it is
          two divs.
        */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-halo-brand-line transition-all duration-700 ease-[cubic-bezier(.65,0,.35,1)] ${
            on('resolve')
              ? 'h-7 w-[2px] sm:h-[2px] sm:w-7 opacity-100'
              : 'h-0 w-[2px] sm:h-[2px] sm:w-0 opacity-0'
          }`}
        />
      </div>

      {/* ── The reason ─────────────────────────────────────────────── */}
      <div
        className={`mt-5 transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
          on('reason') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.14em] text-halo-brand-text mb-2">
          Why they should meet
        </p>
        <ul className="space-y-1.5 min-h-[3.5rem]">
          {m.reasons.map((r, i) => (
            <li key={i} className="text-[13.5px] sm:text-[14px] text-halo-ink leading-relaxed">
              {r}
            </li>
          ))}
        </ul>
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-halo-veil border border-halo-rule px-3 py-1.5 text-[12.5px] font-medium text-halo-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-halo-brand-line" aria-hidden="true" />
          Introduction ready
        </p>
      </div>

      {/* Which of the three is showing. Not a control: a position marker. */}
      <div className="mt-5 flex gap-1.5" aria-hidden="true">
        {DEMO_MATCHES.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === scene ? 'w-6 bg-halo-brand-line' : 'w-1.5 bg-halo-rule'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Person({
  initials, name, label, signals, showSignals, pulled, side,
}: {
  initials: string; name: string; label: string; signals: string[];
  showSignals: boolean; pulled: boolean; side: 'left' | 'right';
}) {
  return (
    <div
      className={`flex-1 min-w-0 rounded-xl border p-3.5 transition-all duration-700 ease-[cubic-bezier(.65,0,.35,1)] translate-y-[var(--pull)] sm:translate-y-0 sm:translate-x-[var(--pull)] data-[pulled=false]:!translate-x-0 data-[pulled=false]:!translate-y-0 ${
        pulled ? 'border-halo-brand-line bg-halo-veil' : 'border-halo-rule bg-white'
      }`}
      /*
        Translate only: no width or margin animation, so nothing reflows.
        The axis follows the layout — vertical while stacked, horizontal
        once the cards sit side by side.
      */
      style={{ ['--pull' as string]: side === 'left' ? '5px' : '-5px' }}
      data-pulled={pulled ? 'true' : 'false'}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-halo-deep text-[11px] font-semibold text-white">
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block text-[14px] font-medium text-halo-ink leading-tight truncate">{name}</span>
          <span className="block text-[11.5px] text-halo-mist-body leading-tight truncate">{label}</span>
        </span>
      </div>

      {/* The signals the engine actually reads, lighting up in order. */}
      <ul className="mt-3 flex flex-wrap gap-1.5 sm:min-h-[3.25rem] content-start">
        {signals.map((s, i) => (
          <li
            key={s}
            className={`rounded-full border px-2 py-0.5 text-[10.5px] transition-all duration-500 ${
              showSignals
                ? 'border-halo-brand-line/40 bg-white text-halo-brand-text opacity-100 translate-y-0'
                : 'border-halo-rule bg-white text-halo-mist-body opacity-40 translate-y-1'
            }`}
            style={{ transitionDelay: showSignals ? `${i * 90}ms` : '0ms' }}
          >
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
