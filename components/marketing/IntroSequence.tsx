'use client';

import { useEffect, useState } from 'react';
import { BRAND, BRAND_DEFINITION } from '@/components/ui/Wordmark';

// Bump this key when the animation changes substantially — returning users
// will see it fresh once then be skipped for the rest of the session.
//
// This is sessionStorage, not localStorage. It used to be localStorage, which
// meant the intro played exactly once per browser and then never again: anyone
// who had already visited could not see it at all, and neither could we. Per
// session is what the line above always intended — once per visit, not once
// per lifetime.
const SESSION_KEY = 'mentable_intro_v6';

// ─── Streak configuration ─────────────────────────────────────────────────────
// Each streak is a thin luminous line that races from an edge toward center,
// creating the visual impression of kinetic energy converging into the wordmark.
//
// d:     'l' = enters from left edge  |  'r' = enters from right edge
// top:   vertical position as CSS value (percent or px)
// delay: animation-delay
// dur:   animation-duration
// op:    peak opacity (brightness variation adds depth)
// h:     height in px (most are 1px; 2px gives a prominent central beam)

const STREAKS = [
  // Left-incoming
  { d: 'l', top: '17%',  delay: '0ms',   dur: '700ms', op: 0.70, h: 1 },
  { d: 'l', top: '31%',  delay: '95ms',  dur: '660ms', op: 0.50, h: 1 },
  { d: 'l', top: '50%',  delay: '10ms',  dur: '740ms', op: 0.90, h: 2 },
  { d: 'l', top: '64%',  delay: '130ms', dur: '680ms', op: 0.55, h: 1 },
  { d: 'l', top: '80%',  delay: '55ms',  dur: '720ms', op: 0.40, h: 1 },
  { d: 'l', top: '9%',   delay: '175ms', dur: '760ms', op: 0.35, h: 1 },
  // Right-incoming
  { d: 'r', top: '23%',  delay: '45ms',  dur: '690ms', op: 0.65, h: 1 },
  { d: 'r', top: '42%',  delay: '25ms',  dur: '750ms', op: 0.80, h: 2 },
  { d: 'r', top: '57%',  delay: '110ms', dur: '670ms', op: 0.55, h: 1 },
  { d: 'r', top: '71%',  delay: '65ms',  dur: '710ms', op: 0.45, h: 1 },
  { d: 'r', top: '87%',  delay: '155ms', dur: '740ms', op: 0.38, h: 1 },
  { d: 'r', top: '5%',   delay: '200ms', dur: '680ms', op: 0.42, h: 1 },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
// pre     → dark screen, silence
// streaks → energy lines race toward center
// form    → wordmark materialises from blur
// hold    → wordmark fully resolved, brief pause
// wipe    → navy curtain pulls upward, revealing the page
// done    → component unmounted
type Phase = 'pre' | 'streaks' | 'form' | 'hold' | 'wipe' | 'done';

// ─── Component ────────────────────────────────────────────────────────────────
export default function IntroSequence() {
  const [phase, setPhase] = useState<Phase>('pre');

  useEffect(() => {
    // Skip if already seen this session
    if (sessionStorage.getItem(SESSION_KEY)) {
      setPhase('done');
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      // Reduced-motion path: dark screen → wordmark fades in → dissolve, no streaks
      setPhase('form');
      const t1 = setTimeout(() => setPhase('hold'), 650);
      const t2 = setTimeout(() => setPhase('wipe'), 1750);
      const t3 = setTimeout(() => {
        sessionStorage.setItem(SESSION_KEY, '1');
        setPhase('done');
      }, 2300);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }

    // Full animation path
    const t1 = setTimeout(() => setPhase('streaks'), 150);  // streaks enter
    const t2 = setTimeout(() => setPhase('form'),    820);  // wordmark begins forming
    const t3 = setTimeout(() => setPhase('hold'),   1650);  // resolved; definition lands
    const t4 = setTimeout(() => setPhase('wipe'),   2750);  // curtain rises
    const t5 = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      setPhase('done');
    }, 3450);

    return () => { [t1, t2, t3, t4, t5].forEach(clearTimeout); };
  }, []);

  if (phase === 'done') return null;

  const showStreaks = phase === 'streaks' || phase === 'form' || phase === 'hold' || phase === 'wipe';
  const wordFormed  = phase === 'form' || phase === 'hold' || phase === 'wipe';
  // The definition lands only once the name has fully resolved, so the reveal
  // reads as an answer to the name rather than competing with it.
  const definitionShown = phase === 'hold' || phase === 'wipe';

  return (
    // Navy curtain — translateY(-100%) wipes it upward on 'wipe' phase
    <div
      aria-hidden="true"
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: '#1a1f3a', // navy-900 — canonical brand dark
        overflow: 'hidden',
        transform: phase === 'wipe' ? 'translateY(-100%)' : 'translateY(0%)',
        transition: phase === 'wipe'
          ? 'transform 680ms cubic-bezier(0.76, 0, 0.24, 1)'
          : 'none',
      }}
    >
      {/* Subtle ambient depth — very faint radial glow at center */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #242b52 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Streaks — rendered only when needed */}
      {showStreaks && STREAKS.map((s, i) => {
        const isLeft = s.d === 'l';
        return (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: s.top,
              // Left streaks anchor to right edge of left half; right to left edge of right half
              ...(isLeft
                ? { right: '50%', width: '48vw' }
                : { left: '50%',  width: '48vw' }),
              height: `${s.h}px`,
              background: isLeft
                ? 'linear-gradient(to right, transparent 0%, rgba(100,122,196,0.55) 55%, rgba(210,220,255,0.45) 100%)'
                : 'linear-gradient(to left,  transparent 0%, rgba(100,122,196,0.55) 55%, rgba(210,220,255,0.45) 100%)',
              animationName: isLeft ? 'streak-l' : 'streak-r',
              animationDuration: s.dur,
              animationDelay: s.delay,
              animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              animationFillMode: 'both',
              opacity: s.op,
              willChange: 'transform',
            }}
          />
        );
      })}

      {/* Wordmark — materialises from blur as streaks converge, then defines itself */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          padding: '0 24px',
        }}
      >
        <span
          style={{
            fontWeight: 700,
            color: '#ffffff',
            fontSize: 'clamp(2.2rem, 9vw, 5rem)',
            // Wide letter-spacing collapses to tight tracking as the word forms —
            // the motion reads as individual elements magnetising into a single name.
            letterSpacing: wordFormed ? '-0.015em' : '0.18em',
            opacity: wordFormed ? 1 : 0,
            // filter starts blurry and resolves sharp, mimicking energy solidifying
            filter: phase === 'form' ? 'blur(10px)' : 'blur(0px)',
            transition: [
              'opacity 380ms ease',
              'filter 850ms cubic-bezier(0.16, 1, 0.3, 1)',
              'letter-spacing 950ms cubic-bezier(0.16, 1, 0.3, 1)',
            ].join(', '),
            userSelect: 'none',
            textAlign: 'center',
          }}
        >
          {BRAND}
        </span>

        {/* Definition resolves a beat after the name, answering the question it raises */}
        <span
          style={{
            marginTop: 'clamp(12px, 2vw, 20px)',
            color: '#a4b3de',
            fontSize: 'clamp(0.72rem, 2.1vw, 0.95rem)',
            fontWeight: 300,
            letterSpacing: '0.16em',
            textTransform: 'lowercase',
            opacity: definitionShown ? 1 : 0,
            transform: definitionShown ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 520ms ease 120ms, transform 620ms cubic-bezier(0.16, 1, 0.3, 1) 120ms',
            userSelect: 'none',
            textAlign: 'center',
          }}
        >
          {BRAND_DEFINITION}
        </span>
      </div>
    </div>
  );
}
