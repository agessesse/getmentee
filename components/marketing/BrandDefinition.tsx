'use client';

import { useEffect, useRef, useState } from 'react';
import { BRAND_PRONUNCIATION } from '@/components/ui/Wordmark';

const TRAITS = ['Teachable.', 'Coachable.', 'Ready to grow.'];

/**
 * Staged definition reveal. Renders fully resolved for reduced-motion users, so
 * the meaning of the name is never gated on animation.
 *
 * Triggered on scroll rather than on mount. The definition used to open the
 * page, which asked visitors to learn the brand before they knew what the
 * product did. It now sits beside the origin story, where the reveal reads as
 * a realisation rather than a preamble, so it must fire when it is actually
 * seen.
 */
export default function BrandDefinition() {
  const [step, setStep] = useState(0); // 0 = word, 1 = pronunciation, 2..4 = traits
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(5);
      return;
    }

    let timers: ReturnType<typeof setTimeout>[] = [];
    let done = false;

    const start = () => {
      if (done) return;
      done = true;
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      timers = [120, 380, 620, 860, 1100].map((ms, i) =>
        setTimeout(() => setStep(i + 1), ms)
      );
    };

    // IntersectionObserver alone is not enough. It samples on frame
    // boundaries, so a fast flick-scroll can carry the element from below the
    // viewport to above it between two samples: no state change is observed,
    // no callback fires, and the definition stays at opacity 0 for the rest of
    // the session. Verified in a mobile browser before this fallback existed.
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) start();
    };

    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) start(); },
      { threshold: 0.25 }
    );
    io.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // already in view on load

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      timers.forEach(clearTimeout);
    };
  }, []);

  const shown = (n: number) => step >= n;

  return (
    <div ref={ref} className="max-w-lg">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
        <span
          className="font-serif text-navy-900 text-[26px] sm:text-[30px] leading-none motion-safe:transition-all motion-safe:duration-500"
          style={{ opacity: shown(1) ? 1 : 0, transform: shown(1) ? 'none' : 'translateY(4px)' }}
        >
          Mentable
        </span>
        <span
          className="text-gray-500 text-sm font-light motion-safe:transition-opacity motion-safe:duration-500"
          style={{ opacity: shown(2) ? 1 : 0 }}
        >
          {BRAND_PRONUNCIATION}
        </span>
        <span
          className="text-gray-500 text-sm italic font-light motion-safe:transition-opacity motion-safe:duration-500"
          style={{ opacity: shown(2) ? 1 : 0 }}
        >
          adjective
        </span>
      </div>

      <p className="text-navy-700 text-[15px] font-light flex flex-wrap gap-x-1.5">
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
