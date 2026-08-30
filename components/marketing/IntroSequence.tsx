'use client';

import { useEffect, useState } from 'react';

const SESSION_KEY = 'mentee_intro_shown';

export default function IntroSequence() {
  const [phase, setPhase] = useState<'hidden' | 'visible' | 'done'>('hidden');

  useEffect(() => {
    // Don't show if already seen this browser session
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) {
      setPhase('done');
      return;
    }

    // Small delay so page behind has a chance to paint
    const showTimer = setTimeout(() => setPhase('visible'), 50);

    // Start fade-out after 1.3s visible
    const hideTimer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      setPhase('done');
    }, 1800);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-navy-900 transition-opacity duration-500 ${
        phase === 'visible' ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
      role="presentation"
    >
      <div
        className="text-center"
        style={{
          animation: phase === 'visible' ? 'intro-fade-in 0.6s ease forwards' : undefined,
        }}
      >
        <span className="text-4xl font-bold tracking-tight text-white">Mentee</span>
        <p className="mt-3 text-navy-400 text-sm font-light tracking-wide">
          The right relationship changes everything.
        </p>
      </div>
    </div>
  );
}
