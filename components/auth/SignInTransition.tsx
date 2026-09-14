'use client';

import { useEffect, useRef, useState } from 'react';

// ─── Streak configuration ─────────────────────────────────────────────────────
// Identical to IntroSequence; slightly tighter overall timing (2.7s vs 3.0s)
// so returning users feel momentum rather than ceremony.
const STREAKS = [
  { d: 'l', top: '17%',  delay: '0ms',   dur: '700ms', op: 0.70, h: 1 },
  { d: 'l', top: '31%',  delay: '95ms',  dur: '660ms', op: 0.50, h: 1 },
  { d: 'l', top: '50%',  delay: '10ms',  dur: '740ms', op: 0.90, h: 2 },
  { d: 'l', top: '64%',  delay: '130ms', dur: '680ms', op: 0.55, h: 1 },
  { d: 'l', top: '80%',  delay: '55ms',  dur: '720ms', op: 0.40, h: 1 },
  { d: 'l', top: '9%',   delay: '175ms', dur: '760ms', op: 0.35, h: 1 },
  { d: 'r', top: '23%',  delay: '45ms',  dur: '690ms', op: 0.65, h: 1 },
  { d: 'r', top: '42%',  delay: '25ms',  dur: '750ms', op: 0.80, h: 2 },
  { d: 'r', top: '57%',  delay: '110ms', dur: '670ms', op: 0.55, h: 1 },
  { d: 'r', top: '71%',  delay: '65ms',  dur: '710ms', op: 0.45, h: 1 },
  { d: 'r', top: '87%',  delay: '155ms', dur: '740ms', op: 0.38, h: 1 },
  { d: 'r', top: '5%',   delay: '200ms', dur: '680ms', op: 0.42, h: 1 },
] as const;

type Phase = 'pre' | 'streaks' | 'form' | 'hold' | 'wipe' | 'done';

interface Props {
  onComplete?: () => void;
}

export default function SignInTransition({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('pre');

  /**
   * The parent passes onComplete as an inline arrow, so its identity changes on
   * every dashboard render. With [onComplete] in the dependency array the
   * effect tore down and restarted the whole timer sequence each time the
   * dashboard re-rendered while fetching, so the animation kept resetting and
   * the intro appeared to hang. Holding the callback in a ref lets the sequence
   * run exactly once while still calling the latest callback.
   */
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setPhase('form');
      // Reduced motion: show the mark briefly, then get out of the way.
      const t1 = setTimeout(() => setPhase('hold'), 120);
      const t2 = setTimeout(() => setPhase('wipe'), 300);
      const t3 = setTimeout(() => {
        setPhase('done');
        onCompleteRef.current?.();
      }, 760); // 300 + 460ms wipe
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }

    // Phases overlap rather than queue. The wordmark starts forming while the
    // streaks are still travelling, which is what made the old sequence feel
    // like waiting: each stage politely waited for the previous one to finish.
    const t1 = setTimeout(() => setPhase('streaks'),  60);
    const t2 = setTimeout(() => setPhase('form'),    360);
    const t3 = setTimeout(() => setPhase('hold'),    820);
    const t4 = setTimeout(() => setPhase('wipe'),   1180);
    const t5 = setTimeout(() => {
      setPhase('done');
      onCompleteRef.current?.();
    }, 1640); // 1180 + 460ms wipe

    // Empty deps on purpose: the sequence must survive parent re-renders.
    return () => { [t1, t2, t3, t4, t5].forEach(clearTimeout); };
  }, []);

  if (phase === 'done') return null;

  const showStreaks = phase === 'streaks' || phase === 'form' || phase === 'hold' || phase === 'wipe';
  const wordFormed  = phase === 'form'    || phase === 'hold' || phase === 'wipe';

  return (
    <div
      aria-hidden="true"
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: '#1a1f3a',
        overflow: 'hidden',
        transform: phase === 'wipe' ? 'translateY(-100%)' : 'translateY(0%)',
        transition: phase === 'wipe'
          ? 'transform 460ms cubic-bezier(0.76, 0, 0.24, 1)'
          : 'none',
      }}
    >
      {/* Ambient depth glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #242b52 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {showStreaks && STREAKS.map((s, i) => {
        const isLeft = s.d === 'l';
        return (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: s.top,
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

      {/* Wordmark */}
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
            letterSpacing: wordFormed ? '-0.015em' : '0.18em',
            opacity: wordFormed ? 1 : 0,
            filter: phase === 'form' ? 'blur(10px)' : 'blur(0px)',
            transition: [
              'opacity 380ms ease',
              'filter 850ms cubic-bezier(0.16, 1, 0.3, 1)',
              'letter-spacing 950ms cubic-bezier(0.16, 1, 0.3, 1)',
            ].join(', '),
            userSelect: 'none',
          }}
        >
          Mentable
        </span>
      </div>
    </div>
  );
}
