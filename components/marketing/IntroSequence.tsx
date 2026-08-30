'use client';

import { useEffect, useState } from 'react';

const SESSION_KEY = 'mentee_intro_v2';
type Phase = 'pre' | 'in' | 'out' | 'done';

// Cinematic intro — warm near-white background, wordmark letter-spacing animation.
// Runs once per browser session. Respects prefers-reduced-motion.
export default function IntroSequence() {
  const [phase, setPhase] = useState<Phase>('pre');

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      setPhase('done');
      return;
    }

    // Check reduced-motion preference — skip animation, show briefly
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      const t = setTimeout(() => {
        sessionStorage.setItem(SESSION_KEY, '1');
        setPhase('done');
      }, 800);
      return () => clearTimeout(t);
    }

    const t1 = setTimeout(() => setPhase('in'),   120);   // wordmark animates in
    const t2 = setTimeout(() => setPhase('out'), 2100);   // overlay fades out
    const t3 = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      setPhase('done');
    }, 2750);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === 'done') return null;

  const overlayVisible = phase !== 'out';
  const wordVisible    = phase === 'in' || phase === 'out';

  return (
    <div
      aria-hidden="true"
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f8f6',
        opacity: overlayVisible ? 1 : 0,
        transition: 'opacity 650ms cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: overlayVisible ? 'auto' : 'none',
      }}
    >
      <span
        style={{
          fontWeight: 700,
          color: '#1a1f3a',
          fontSize: 'clamp(2.25rem, 9vw, 4rem)',
          letterSpacing: wordVisible ? '-0.02em' : '0.28em',
          opacity: wordVisible ? 1 : 0,
          transition: [
            'letter-spacing 1000ms cubic-bezier(0.16, 1, 0.3, 1)',
            'opacity 600ms ease',
          ].join(', '),
          userSelect: 'none',
        }}
      >
        Mentee
      </span>
    </div>
  );
}
