'use client';

import { useEffect, useState } from 'react';

// Bump this key when the animation changes substantially — returning users
// will see it fresh once then be skipped for the rest of the session.
const SESSION_KEY = 'mentee_intro_v3';

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
      const t1 = setTimeout(() => setPhase('hold'), 700);
      const t2 = setTimeout(() => setPhase('wipe'), 1400);
      const t3 = setTimeout(() => {
        sessionStorage.setItem(SESSION_KEY, '1');
        setPhase('done');
      }, 1950);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }

    // Full animation path
    const t1 = setTimeout(() => setPhase('streaks'), 150);  // streaks enter
    const t2 = setTimeout(() => setPhase('form'),    820);  // wordmark begins forming
    const t3 = setTimeout(() => setPhase('hold'),   1700);  // fully resolved
    const t4 = setTimeout(() => setPhase('wipe'),   2350);  // curtain rises
    const t5 = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      setPhase('done');
    }, 3050);

    return () => { [t1, t2, t3, t4, t5].forEach(clearTimeout); };
  }, []);

  if (phase === 'done') return null;

  const showStreaks = phase === 'streaks' || phase === 'form' || phase === 'hold' || phase === 'wipe';
  const wordFormed  = phase === 'form' || phase === 'hold' || phase === 'wipe';

  return (
    // Navy curtain — translateY(-100%) wipes it upward on 'wipe' phase
    <div
      aria-hidden="true"
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: '#1a1f3a', // navy-900 — canonical Mentee dark
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

      {/* Wordmark — materialises from blur as streaks converge */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontWeight: 700,
            color: '#ffffff',
            fontSize: 'clamp(2.5rem, 10vw, 5rem)',
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
          }}
        >
          Mentee
        </span>
      </div>
    </div>
  );
}
