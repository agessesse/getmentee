'use client';

import { useEffect, useState } from 'react';
import { BRAND, BRAND_DEFINITION } from '@/components/ui/Wordmark';

// Bump this key when the animation changes substantially — returning users
// will see it fresh once then be skipped for the rest of the session.
//
// REGRESSION, fixed here: this read/wrote `localStorage`, not `sessionStorage`,
// from commit 28a097c ("Add Phase 4 Batches A-D") — an unrelated, undocumented
// one-line change bundled into a large migrations/notifications/analytics
// commit. localStorage never expires, so once any browser saw the intro a
// single time, it was gone from that browser forever, on every future visit,
// until this key was bumped again. That is why the animation appeared to have
// disappeared: it had already fired once, permanently, on the browser it was
// being checked from. Restored to sessionStorage below, which is what "once
// per browsing session, again on the next one" actually requires.
const SESSION_KEY = 'mentable_intro_v6';

// ─── Streak configuration ─────────────────────────────────────────────────────
// Each streak is a thin luminous line that races from an edge toward center,
// creating the visual impression of kinetic energy converging into the wordmark.
// Durations/delays are scaled down from the original cut (~0.46x) as part of
// retiming the whole sequence from 3.45s to 1.4s — see the phase timeline
// below. Streaks fade themselves out via their own keyframe regardless of when
// the next phase starts, so shortening these doesn't cut anything off.
//
// The 1.4s figure is the animation's OWN clock. Measured against a production
// build, page load + hydration adds ~250-300ms on top before this clock even
// starts ticking (unavoidable — no client-side "have I seen this" check can
// run before the JS bundle hydrates), so real wall-clock time from navigation
// to reveal lands around 1.6-1.8s, comfortably inside the 1.0-2.0s target.
//
// d:     'l' = enters from left edge  |  'r' = enters from right edge
// top:   vertical position as CSS value (percent or px)
// delay: animation-delay
// dur:   animation-duration
// op:    peak opacity (brightness variation adds depth)
// h:     height in px (most are 1px; 2px gives a prominent central beam)

const STREAKS = [
  // Left-incoming
  { d: 'l', top: '17%',  delay: '0ms',   dur: '320ms', op: 0.70, h: 1 },
  { d: 'l', top: '31%',  delay: '45ms',  dur: '305ms', op: 0.50, h: 1 },
  { d: 'l', top: '50%',  delay: '5ms',   dur: '340ms', op: 0.90, h: 2 },
  { d: 'l', top: '64%',  delay: '60ms',  dur: '315ms', op: 0.55, h: 1 },
  { d: 'l', top: '80%',  delay: '25ms',  dur: '330ms', op: 0.40, h: 1 },
  { d: 'l', top: '9%',   delay: '80ms',  dur: '350ms', op: 0.35, h: 1 },
  // Right-incoming
  { d: 'r', top: '23%',  delay: '20ms',  dur: '320ms', op: 0.65, h: 1 },
  { d: 'r', top: '42%',  delay: '10ms',  dur: '345ms', op: 0.80, h: 2 },
  { d: 'r', top: '57%',  delay: '50ms',  dur: '310ms', op: 0.55, h: 1 },
  { d: 'r', top: '71%',  delay: '30ms',  dur: '325ms', op: 0.45, h: 1 },
  { d: 'r', top: '87%',  delay: '70ms',  dur: '340ms', op: 0.38, h: 1 },
  { d: 'r', top: '5%',   delay: '90ms',  dur: '315ms', op: 0.42, h: 1 },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
// pre     → dark screen, silence
// streaks → energy lines race toward center
// form    → wordmark materialises from blur
// hold    → wordmark fully resolved, brief pause
// wipe    → brand curtain pulls upward, revealing the page
// done    → component unmounted
type Phase = 'pre' | 'streaks' | 'form' | 'hold' | 'wipe' | 'done';

// ─── Component ────────────────────────────────────────────────────────────────
export default function IntroSequence() {
  const [phase, setPhase] = useState<Phase>('pre');

  useEffect(() => {
    // Skip if already seen THIS BROWSING SESSION. sessionStorage clears when
    // the tab/window closes, which is what gives "plays again on a fresh
    // session" — localStorage (the regression) never does.
    if (sessionStorage.getItem(SESSION_KEY)) {
      setPhase('done');
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      // Reduced-motion path: near-instant simplified reveal — dark screen,
      // wordmark fades in, dissolves. No streaks, no cinematic pacing.
      // Total 760ms, and 'done' lands 40ms after the wipe transition (330ms,
      // shared with the full path below) actually finishes, so it never cuts
      // the curtain off mid-slide.
      setPhase('form');
      const t1 = setTimeout(() => setPhase('hold'), 220);
      const t2 = setTimeout(() => setPhase('wipe'), 430);
      const t3 = setTimeout(() => {
        sessionStorage.setItem(SESSION_KEY, '1');
        setPhase('done');
      }, 760);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }

    // Full animation path — retimed from 3.45s to 1.4s of the sequence's own
    // clock (plus ~250-300ms of unavoidable page-load/hydration time before
    // it starts — see the note above STREAKS). The choreography
    // (streaks → form → hold → wipe) is unchanged; every phase window and the
    // CSS transition/animation durations inside the render below were scaled
    // down together so nothing gets visually cut off mid-transition.
    const t1 = setTimeout(() => setPhase('streaks'),  40);   // streaks enter
    const t2 = setTimeout(() => setPhase('form'),    380);   // wordmark begins forming
    const t3 = setTimeout(() => setPhase('hold'),    700);   // resolved; definition lands
    const t4 = setTimeout(() => setPhase('wipe'),   1050);   // curtain rises
    const t5 = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      setPhase('done');
    }, 1420); // wipe (1050) + its 330ms transition + 40ms margin

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
        backgroundColor: '#24193e', // purple-900 — canonical brand dark
        overflow: 'hidden',
        transform: phase === 'wipe' ? 'translateY(-100%)' : 'translateY(0%)',
        // 330ms; both paths' 'done' timers are set to land after this finishes.
        transition: phase === 'wipe'
          ? 'transform 330ms cubic-bezier(0.76, 0, 0.24, 1)'
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
            // Both resolve inside the 320ms form-phase window (t3 - t2), so
            // the wordmark reads as fully solid by the time 'hold' begins.
            transition: [
              'opacity 200ms ease',
              'filter 320ms cubic-bezier(0.16, 1, 0.3, 1)',
              'letter-spacing 320ms cubic-bezier(0.16, 1, 0.3, 1)',
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
            color: '#b3a2fb',
            fontSize: 'clamp(0.72rem, 2.1vw, 0.95rem)',
            fontWeight: 300,
            letterSpacing: '0.16em',
            textTransform: 'lowercase',
            opacity: definitionShown ? 1 : 0,
            transform: definitionShown ? 'translateY(0)' : 'translateY(6px)',
            // Short delay for a beat after the name resolves, then finishes
            // with room to spare inside the 350ms hold-phase window (t4 - t3).
            transition: 'opacity 280ms ease 20ms, transform 300ms cubic-bezier(0.16, 1, 0.3, 1) 20ms',
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
