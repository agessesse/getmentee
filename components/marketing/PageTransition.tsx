'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { WORDMARK } from '@/components/marketing/intro-wordmark';
import { isMarketingRoute } from '@/components/marketing/marketing-links';
import { isAppRoute } from '@/lib/portal-routes';
import {
  EASE, LEAD_BG, FOLLOW_BG,
  COVER_PANEL_MS, COVER_FOLLOW_DELAY_MS,
  WORDMARK_DRAW_MS, WORDMARK_DRAW_DELAY_MS, WORDMARK_FILL_MS, WORDMARK_FILL_DELAY_MS,
  WORDMARK_STAGGER_MS,
  REVEAL_PANEL_MS, REVEAL_LEAD_DELAY_MS, WORDMARK_OUT_MS,
  COVER_MS, MIN_HOLD_MS, REVEAL_MS, MAX_WAIT_MS,
  prefersReducedMotion,
} from '@/components/marketing/motion';

/**
 * The branded wipe between the four marketing pages.
 *
 * WHAT IT LOOKS LIKE. A lavender panel slides in from the left, the deep purple
 * follows a beat behind carrying a soft centre glow, and the wordmark writes
 * itself on: outlines draw first, then the solid letterforms arrive behind
 * them. It leaves the way it came, to the right. The wordmark used to simply
 * fade in, which was the dull part. Drawing it is the entrance's own opening
 * beat, compressed from 800ms to 220ms, so the two animations are recognisably
 * the same hand without the wipe getting slower.
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
 * Mounted once in the root layout. It runs within two zones: the four marketing
 * pages, and the signed-in app, so moving between Dashboard, Discover, Goals
 * and the rest carries the same wipe the public site does. It never runs
 * ACROSS the zones or anywhere outside them, so signing in, signing out, auth,
 * legal and public profile navigation are never delayed. Sign-in has its own
 * arrival (SignInTransition), and a wipe stacked on top of it would be two
 * animations for one step.
 */

/** Which wipe zone a path is in, or null when it takes part in neither. */
function zoneOf(pathname: string): 'marketing' | 'app' | null {
  if (isMarketingRoute(pathname)) return 'marketing';
  if (isAppRoute(pathname)) return 'app';
  return null;
}

type Phase = 'idle' | 'cover' | 'hold' | 'reveal';

/**
 * The wordmark's outlines, flattened so each counter is its own stroke and each
 * has a stable index to stagger by. Twelve of them for "Mentable".
 */
const SUBPATHS: string[] = WORDMARK.letters.flatMap((l) =>
  l.d.split(/(?=M)/g).filter((d) => d.trim().length > 1),
);

export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('idle');
  /** Flipped two painted frames after the outlines mount, so the browser has a
   *  start value to animate from. See the effect below. */
  const [drawn, setDrawn] = useState(false);

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
    setDrawn(false);
    setPhase('cover');

    // Push only once the panels have the viewport covered.
    later(() => {
      router.push(href);

      // Wait for the destination to actually be the current route, then honour
      // the minimum hold so the brand beat is never a flicker. MAX_WAIT_MS is
      // the ceiling: a slow route reveals anyway rather than hanging.
      const waitStart = Date.now();
      const tick = () => {
        const arrived = pathRef.current === href.split('?')[0];
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

      // Both ends must sit in the same zone: the marketing story, or the app.
      const from = zoneOf(window.location.pathname);
      if (!from || from !== zoneOf(url.pathname)) return;

      // A transition already running swallows further marketing clicks rather
      // than queueing a second wipe or double-navigating.
      if (phaseRef.current !== 'idle') {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      // Keep the query: app links such as /messages?mentorshipId=… carry state.
      run(url.pathname + url.search);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [run]);

  /*
    Release the outlines one painted frame after they mount.

    Two details matter here and both were wrong on the first attempt. The paths
    declare pathLength="1", which normalises every subpath to a length of one
    regardless of its real geometry, so a dasharray of 1 and an offset of 1 mean
    "completely undrawn" for the stem of the l and the bowl of the b alike. No
    getTotalLength, no measuring, no layout read.

    And the flip is deferred by two frames, not one. A single rAF can still land
    in the same paint as the parked state, in which case the browser never sees
    a start value and the offset snaps to zero instead of animating. That is
    exactly what it did.
  */
  useEffect(() => {
    if (phase !== 'cover') return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setDrawn(true));
    });
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
  }, [phase]);

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
        {/* The entrance's ambient centre glow, so the panel has depth rather
            than reading as a flat rectangle of purple. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(120,90,247,0.55) 0%, transparent 70%)',
          }}
        />
        {/*
          The same outline data the entrance draws, so this is the wordmark
          rather than a picture of it. Outlines write on, the solid fill arrives
          behind them, and on the way out the whole group just fades.
        */}
        <svg
          viewBox={`${WORDMARK.bbox.minX} ${WORDMARK.bbox.minY} ${WORDMARK.bbox.maxX - WORDMARK.bbox.minX} ${WORDMARK.bbox.maxY - WORDMARK.bbox.minY}`}
          style={{
            // The glow behind is absolutely positioned and this svg is a static
            // flex item, so without a position of its own the glow paints on
            // top and tints the ivory letterforms lavender.
            position: 'relative',
            width: 'min(46vw, 620px)',
            height: 'auto',
            opacity: covered ? 1 : 0,
            transition: covered ? 'opacity 1ms' : `opacity ${WORDMARK_OUT_MS}ms ease-in`,
            overflow: 'visible',
          }}
        >
          <g
            fill="none"
            stroke="#FBFAF8"
            strokeWidth={14}
          >
            {SUBPATHS.map((d, i) => (
              <path
                key={i}
                d={d}
                pathLength={1}
                strokeDasharray={1}
                style={{
                  strokeDashoffset: drawn ? 0 : 1,
                  transition: `stroke-dashoffset ${WORDMARK_DRAW_MS}ms ${EASE} ${WORDMARK_DRAW_DELAY_MS + i * WORDMARK_STAGGER_MS}ms`,
                }}
              />
            ))}
          </g>

          <g
            fill="#FBFAF8"
            style={{
              opacity: drawn ? 1 : 0,
              transition: `opacity ${WORDMARK_FILL_MS}ms ease-out ${WORDMARK_FILL_DELAY_MS}ms`,
            }}
          >
            {WORDMARK.letters.map((letter, i) => <path key={i} d={letter.d} />)}
          </g>
        </svg>
      </div>
    </div>
  );
}
