'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BRAND_DEFINITION } from '@/components/ui/Wordmark';
import { WORDMARK } from '@/components/marketing/intro-wordmark';
import {
  EASE, LEAD_BG, REVEAL_PANEL_MS, REVEAL_LEAD_DELAY_MS,
} from '@/components/marketing/motion';

/**
 * The moment after sign-in, in the homepage entrance's own hand.
 *
 * It used to be light streaks racing in from both edges around a word that
 * un-blurred, a sequence written before the homepage entrance was rebuilt, so
 * the first thing a returning member saw was an animation the public site no
 * longer does. This replays the entrance's first two beats and its exit, and
 * drops the particle travel in the middle so it stays quick:
 *
 *   1. The wordmark writes itself on as outlines, letter by letter.
 *   2. The solid fill wipes across it right to left, and the definition lands.
 *   3. The dark surface lifts out through the top with the lavender panel 80ms
 *      behind, which is exactly how the homepage entrance leaves.
 *
 * Same outline data, same colours, same exit curve and lag as IntroSequence;
 * the timeline is simply compressed from ~3s to ~1.8s, because this plays every
 * time someone signs in and the entrance plays once per session.
 *
 * Any click, key or touch skips straight to the exit. Reduced motion shows the
 * name and definition briefly and removes the overlay without any movement.
 *
 * Portalled to <body>: the dashboard page it is rendered from settles into
 * place with a transform on arrival, and a transformed ancestor would re-anchor
 * this position:fixed overlay to the page instead of the viewport.
 */

const T = {
  drawStart: 40,
  letterDraw: 520,
  letterStaggerMax: 140,
  fillAt: 640,
  fillMs: 440,
  definitionAt: 900,
  sweepAt: 1340,
} as const;
const END_MS = T.sweepAt + REVEAL_PANEL_MS + REVEAL_LEAD_DELAY_MS + 60;
const SKIP_SWEEP_MS = 60;

const INK = '#FBFAF8';      // halo-ivory
const GROUND = '#0A0A0F';   // halo-black, the entrance's surface
const LAVENDER = '#D9CFFB'; // halo-lavender

const BBOX = WORDMARK.bbox;
const VIEWBOX = `${BBOX.minX} ${BBOX.minY} ${BBOX.maxX - BBOX.minX} ${BBOX.maxY - BBOX.minY}`;

/** Every letter's subpaths, each tagged with its letter index for the stagger. */
const SUBPATHS = WORDMARK.letters.flatMap((l, li) =>
  l.d.split(/(?=M)/g)
    .filter((d) => d.trim().length > 1)
    .map((d) => ({ d, li })),
);
const LETTERS = WORDMARK.letters.length;

type Phase = 'pre' | 'draw' | 'fill' | 'define' | 'sweep' | 'done';

interface Props {
  onComplete?: () => void;
}

export default function SignInTransition({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('pre');
  const [reduced, setReduced] = useState(false);
  const [mounted, setMounted] = useState(false);

  /**
   * The parent passes onComplete as an inline arrow, so its identity changes on
   * every dashboard render. Holding it in a ref lets the sequence run exactly
   * once while still calling the latest callback.
   */
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseRef = useRef<Phase>('pre');
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    setMounted(true);
    const at = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
    const finish = () => { setPhase('done'); onCompleteRef.current?.(); };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true);
      setPhase('define');
      at(finish, 700);
      return () => timers.current.forEach(clearTimeout);
    }

    // Two painted frames before the draw is released, so the browser has the
    // parked dash offset as a start value instead of snapping straight to 0.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setPhase('draw'));
    });
    at(() => setPhase('fill'), T.fillAt);
    at(() => setPhase('define'), T.definitionAt);
    at(() => setPhase('sweep'), T.sweepAt);
    at(finish, END_MS);

    // Nobody is held by it: any input goes straight to the exit.
    const skip = () => {
      if (phaseRef.current === 'sweep' || phaseRef.current === 'done') return;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setPhase('sweep');
      at(finish, REVEAL_PANEL_MS + REVEAL_LEAD_DELAY_MS + SKIP_SWEEP_MS);
    };
    const evts = ['pointerdown', 'keydown', 'touchstart'] as const;
    evts.forEach((e) => window.addEventListener(e, skip, { passive: true }));

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      timers.current.forEach(clearTimeout);
      evts.forEach((e) => window.removeEventListener(e, skip));
    };
  }, []);

  if (phase === 'done' || !mounted) return null;

  const drawn = phase !== 'pre';
  const filled = phase === 'fill' || phase === 'define' || phase === 'sweep';
  const defined = phase === 'define' || phase === 'sweep';
  const swept = phase === 'sweep';

  const sweep = (delay: number): React.CSSProperties => ({
    transform: swept ? 'translateY(-100%)' : 'translateY(0%)',
    transition: swept ? `transform ${REVEAL_PANEL_MS}ms ${EASE} ${delay}ms` : 'none',
    willChange: 'transform',
  });

  const markStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    overflow: 'visible',
  };

  return createPortal(
    <>
      {/* Trailing lavender panel, mounted at rest so it has a value to animate
          from. The dark surface lifts first and this follows 80ms behind. */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 ${LEAD_BG}`}
        style={{ zIndex: 199, ...(reduced ? {} : sweep(REVEAL_LEAD_DELAY_MS)) }}
      />

      <div
        aria-hidden="true"
        role="presentation"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          backgroundColor: GROUND,
          overflow: 'hidden',
          ...(reduced ? {} : sweep(0)),
        }}
      >
        {/* The entrance's ambient depth, so the ground is not a flat black. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 50% at 50% 46%, rgba(71,23,202,0.55) 0%, transparent 70%)',
            opacity: drawn ? 1 : 0,
            transition: 'opacity 700ms ease-out',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(22px, 4vw, 40px)',
            padding: '0 24px',
            pointerEvents: 'none',
          }}
        >
          {reduced ? (
            <span
              className="font-bold tracking-tight select-none"
              style={{ color: INK, fontSize: 'clamp(2.2rem, 9vw, 5rem)' }}
            >
              {WORDMARK.text}
            </span>
          ) : (
            <div
              style={{
                position: 'relative',
                width: 'min(78vw, 620px)',
                aspectRatio: `${BBOX.maxX - BBOX.minX} / ${BBOX.maxY - BBOX.minY}`,
              }}
            >
              {/* Outlines, written on per letter. */}
              <svg viewBox={VIEWBOX} style={markStyle}>
                <g fill="none" stroke={INK} strokeWidth={12} strokeLinejoin="round">
                  {SUBPATHS.map(({ d, li }, i) => (
                    <path
                      key={i}
                      d={d}
                      pathLength={1}
                      strokeDasharray={1}
                      style={{
                        strokeDashoffset: drawn ? 0 : 1,
                        transition: `stroke-dashoffset ${T.letterDraw}ms cubic-bezier(.33,0,.2,1) ${
                          T.drawStart + Math.round((li / Math.max(1, LETTERS - 1)) * T.letterStaggerMax)
                        }ms`,
                      }}
                    />
                  ))}
                </g>
              </svg>

              {/* Solid fill, wiped in right to left, on the wipe's own curve. */}
              <svg
                viewBox={VIEWBOX}
                style={{
                  ...markStyle,
                  clipPath: filled ? 'inset(-10% 0 -10% 0)' : 'inset(-10% 0 -10% 100%)',
                  transition: filled ? `clip-path ${T.fillMs}ms ${EASE}` : 'none',
                }}
              >
                <g fill={INK}>
                  {WORDMARK.letters.map((letter, i) => <path key={i} d={letter.d} />)}
                </g>
              </svg>
            </div>
          )}

          <span
            className="font-ui"
            style={{
              color: LAVENDER,
              fontSize: 'clamp(0.72rem, 2.1vw, 0.95rem)',
              fontWeight: 400,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              textAlign: 'center',
              opacity: defined ? 1 : 0,
              transform: defined || reduced ? 'translateY(0)' : 'translateY(8px)',
              transition: reduced ? 'none' : 'opacity 420ms ease, transform 620ms cubic-bezier(0.16, 1, 0.3, 1)',
              userSelect: 'none',
            }}
          >
            {BRAND_DEFINITION}
          </span>
        </div>
      </div>
    </>,
    document.body,
  );
}
