'use client';

import { useEffect, useState } from 'react';
import { BRAND_PRONUNCIATION } from '@/components/ui/Wordmark';

const TRAITS = ['Teachable.', 'Coachable.', 'Ready to grow.'];

/**
 * Staged definition reveal. Renders fully resolved on the server and for
 * reduced-motion users, so the meaning of the name is never gated on animation.
 */
export default function HeroReveal() {
  const [step, setStep] = useState(0); // 0 = word, 1 = pronunciation, 2..4 = traits

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(5);
      return;
    }
    // ~1.5s to fully resolved — under the 2s comprehension budget.
    const timers = [180, 460, 720, 980, 1240].map((ms, i) =>
      setTimeout(() => setStep(i + 1), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const shown = (n: number) => step >= n;

  return (
    <div className="mb-6 pb-5 border-b border-halo-rule/80 max-w-lg">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
        <span
          className="font-display text-halo-ink text-[26px] sm:text-[30px] leading-none motion-safe:transition-all motion-safe:duration-500"
          style={{ opacity: shown(1) ? 1 : 0, transform: shown(1) ? 'none' : 'translateY(4px)' }}
        >
          Mentable
        </span>
        <span
          className="text-halo-mist-body text-sm font-light motion-safe:transition-opacity motion-safe:duration-500"
          style={{ opacity: shown(2) ? 1 : 0 }}
        >
          {BRAND_PRONUNCIATION}
        </span>
        <span
          className="text-halo-mist-body text-sm italic font-light motion-safe:transition-opacity motion-safe:duration-500"
          style={{ opacity: shown(2) ? 1 : 0 }}
        >
          adjective
        </span>
      </div>

      <p className="text-halo-heather text-[15px] font-light flex flex-wrap gap-x-1.5">
        {TRAITS.map((trait, i) => (
          <span
            key={trait}
            className="motion-safe:transition-all motion-safe:duration-500"
            style={{
              opacity: shown(i + 3) ? 1 : 0,
              transform: shown(i + 3) ? 'none' : 'translateY(5px)',
            }}
          >
            {trait}
          </span>
        ))}
      </p>
    </div>
  );
}
