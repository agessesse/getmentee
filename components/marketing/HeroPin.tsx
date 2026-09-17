'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Holds the hero at full viewport height while the rest of the page travels up
 * over it.
 *
 * WHY IT MEASURES INSTEAD OF GUESSING. A fixed 100svh pin is only correct while
 * the hero actually fits inside 100svh, and there is one real viewport where it
 * does not: around 1024x768, the two-column layout switches on but the screen is
 * still short, and the hero comes out 877px tall inside a 768px container. A
 * media query cannot see that, because the deciding factor is the rendered
 * height of the content, not the width of the screen. So this measures the hero
 * once it has laid out and pins only when there is room, re-checking on resize
 * and after web fonts settle.
 *
 * When it does not fit, the wrapper is an ordinary block and the hero scrolls
 * away normally. Nothing is ever clipped and nothing is ever unreachable, which
 * is the whole reason to measure rather than assume.
 *
 * WHY IT PINS UNDER THE HEADER, TOP-ALIGNED. It used to pin at the very top of
 * the window and centre the hero vertically. Centring put the hero's slack above
 * it, so the space under the header grew with screen height (about 95px at
 * 1512x857, 207px at 1920x1080), and pinning at top 0 let the header slide over
 * that space as soon as the page scrolled, so the gap changed under your eye.
 * Pinned beneath the 65px header and aligned to the top, the hero sits the same
 * short distance under the header on every screen, before and after scrolling,
 * and any spare height falls below the buttons where the scroll cue lives.
 *
 * Reduced motion skips the pin entirely.
 */

/** SiteHeader: h-16 plus its 1px bottom rule. The pin sits directly beneath it. */
const HEADER_PX = 65;

export default function HeroPin({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    if (!el) return;

    const check = () => {
      const inner = el.firstElementChild as HTMLElement | null;
      if (!inner) return;
      // scrollHeight, so padding counts and a taller-than-viewport hero is seen
      // as taller even while the container is constraining it.
      setPinned(inner.scrollHeight <= window.innerHeight - HEADER_PX);
    };

    check();
    // Fonts change the hero's height after first paint, so measure again.
    document.fonts?.ready?.then(check).catch(() => {});
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener('resize', check, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', check);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={
        pinned
          ? 'sticky top-[65px] z-0 flex items-start bg-halo-ivory h-[calc(100svh-65px)] overflow-hidden'
          : 'relative z-0 bg-halo-ivory'
      }
    >
      {children}
    </div>
  );
}
