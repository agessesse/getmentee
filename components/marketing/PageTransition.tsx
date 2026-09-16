'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BRAND } from '@/components/ui/Wordmark';
import { isMarketingRoute } from '@/components/marketing/marketing-links';
import {
  EASE, LEAD_BG, FOLLOW_BG,
  COVER_PANEL_MS, COVER_FOLLOW_DELAY_MS, WORDMARK_IN_MS, WORDMARK_IN_DELAY_MS,
  REVEAL_PANEL_MS, REVEAL_LEAD_DELAY_MS, WORDMARK_OUT_MS,
  COVER_MS, MIN_HOLD_MS, REVEAL_MS, MAX_WAIT_MS,
  prefersReducedMotion,
} from '@/components/marketing/motion';

/**
 * The branded wipe between the four marketing pages.
 *
 * WHY A CLICK INTERCEPT AND NOT A PATHNAME WATCHER. A watcher cannot cover the
 * page it is leaving: by the time the pathname changes the old page is already
 * gone, so the animation plays over the destination and you see it flash. It
 * also fires on browser back, which should feel instant, and it double-fires if
 * you keep the interceptor too. So this listens for the click, covers first,
 * and pushes the route only once the viewport is protected. There is
 * deliberately no pathname fallback anywhere in this file.
 *
 * WHY CAPTURE PHASE. Next's Link calls preventDefault in its own bubble-phase
 * handler. A bubble listener here would receive an event that is already
 * defaultPrevented and would have no way to tell a real click from Link's own
 * handling, so the listener runs at capture, before Link sees the event.
 *
 * Mounted once in the root layout. On any route that is not one of the four it
 * is inert: the guard below requires both the current page and the destination
 * to be marketing routes, so auth, legal, profile and product navigation is
 * never delayed.
 */

type Phase = 'idle' | 'cover' | 'hold' | 'reveal';

export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('idle');

  // Refs, not state: the click handler is bound once and must read current
  // values without being torn down and rebound on every phase change.
  const phaseRef = useRef<Phase>('idle');
  const pathRef = useRef(pathname);
  const targetRef = useRef<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { pathRef.current = pathname; }, [pathname]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => clearTimers, []);

  const run = useCallback((href: string) => {
    clearTimers();
    targetRef.current = href;
    setPhase('cover');

    // Push only once the panels have the viewport covered.
    later(() => {
      router.push(href);

      // Wait for the destination to actually be the current route, then honour
      // the minimum hold so the brand beat is never a flicker. MAX_WAIT_MS is
      // the ceiling: a slow route reveals anyway rather than hanging.
      const waitStart = Date.now();
      const tick = () => {
        const arrived = pathRef.current === href;
        const waited = Date.now() - waitStart;
        if (arrived || waited >= MAX_WAIT_MS) {
          const remaining = Math.max(0, MIN_HOLD_MS - waited);
          later(() => {
            setPhase('reveal');
            later(() => {
              setPhase('idle');
              targetRef.current = null;
            }, REVEAL_MS);
          }, remaining);
        } else {
          later(tick, 40);
        }
      };
      setPhase('hold');
      tick();
    }, COVER_MS);
  }, [router]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Plain left click only. Anything else is the browser's to handle.
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (prefersReducedMotion()) return;

      const anchor = (e.target as Element | null)?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (anchor.hasAttribute('download')) return;
      const target = anchor.getAttribute('target');
      if (target && target !== '_self') return;

      let url: URL;
      try { url = new URL(href, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      // Both ends must belong to the four-page marketing story.
      if (!isMarketingRoute(window.location.pathname)) return;
      if (!isMarketingRoute(url.pathname)) return;

      // A transition already running swallows further marketing clicks rather
      // than queueing a second wipe or double-navigating.
      if (phaseRef.current !== 'idle') {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      run(url.pathname);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [run]);

  if (phase === 'idle') return null;

  const covered = phase === 'cover' || phase === 'hold';

  // Cover drives both panels from off-left to 0. Reveal drives them to off-right.
  // Only transform and opacity are ever animated.
  const leadStyle: React.CSSProperties =
    phase === 'cover'
      ? { transform: 'translateX(0)', transition: `transform ${COVER_PANEL_MS}ms ${EASE}` }
      : phase === 'hold'
        ? { transform: 'translateX(0)' }
        : { transform: 'translateX(100%)', transition: `transform ${REVEAL_PANEL_MS}ms ${EASE} ${REVEAL_LEAD_DELAY_MS}ms` };

  const followStyle: React.CSSProperties =
    phase === 'cover'
      ? { transform: 'translateX(0)', transition: `transform ${COVER_PANEL_MS}ms ${EASE} ${COVER_FOLLOW_DELAY_MS}ms` }
      : phase === 'hold'
        ? { transform: 'translateX(0)' }
        : { transform: 'translateX(100%)', transition: `transform ${REVEAL_PANEL_MS}ms ${EASE}` };

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] overflow-hidden pointer-events-none"
    >
      <div
        className={`absolute inset-0 ${LEAD_BG}`}
        style={{ transform: 'translateX(-100%)', willChange: 'transform', ...leadStyle }}
      />
      <div
        className={`absolute inset-0 ${FOLLOW_BG} flex items-center justify-center`}
        style={{ transform: 'translateX(-100%)', willChange: 'transform', ...followStyle }}
      >
        {/*
          The existing wordmark treatment, white on the deep purple. Not a new
          mark and not an image: the same bold, tight-tracked brand text the
          header and the entrance use, sized for a full viewport.
        */}
        <span
          className="font-bold tracking-tight text-white select-none"
          style={{
            fontSize: 'clamp(2rem, 7vw, 4.5rem)',
            opacity: covered ? 1 : 0,
            transition: covered
              ? `opacity ${WORDMARK_IN_MS}ms ease-out ${WORDMARK_IN_DELAY_MS}ms`
              : `opacity ${WORDMARK_OUT_MS}ms ease-in`,
          }}
        >
          {BRAND}
        </span>
      </div>
    </div>
  );
}
