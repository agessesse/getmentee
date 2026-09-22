'use client';

import { useState, useEffect, useRef } from 'react';
import { useScrollProgress, useReducedMotion, useWideViewport } from '@/lib/useScrollProgress';
import InteractionCue from '@/components/marketing/InteractionCue';

/*
  The cycle, told as a human sequence rather than four verbs.

  It used to read Learn, Apply, Grow, Return — accurate, but it described a
  process rather than people, and "Return / Become worth learning from" said
  the same thing as the reciprocity card further down the page. Impact is the
  stage that was missing: the part where what one person learned starts
  reaching people who were never in the room.
*/
const STAGES = [
  { verb: 'Learn',  line: 'Someone takes the time to teach you.' },
  { verb: 'Grow',   line: 'You put it to work, and it starts to show.' },
  { verb: 'Impact', line: 'What you learned changes what you can contribute.' },
  { verb: 'Return', line: 'Then someone asks you for help.' },
] as const;

/*
  Two arrangements of the same story.

  Side by side, the chain reads left to right: the ring, then the people that
  growth reaches, then a second cycle starting further out. On a phone there is
  no room to the right — squeezing it there shrank the ring to a coin and made
  the compounding invisible — so the same three beats stack downward instead.
  Nothing is dropped on small screens; it is re-laid out.
*/
interface Geo {
  vb: string;
  maxW: string;
  C: { x: number; y: number };
  R: number;
  reached: { x: number; y: number; r: number }[];
  bud: { x: number; y: number; r: number };
}

const WIDE: Geo = {
  vb: '0 0 440 300',
  maxW: '440px',
  C: { x: 148, y: 148 },
  R: 80,
  // Kept clear of the ring's own node labels, which sit radially outside it.
  reached: [
    { x: 318, y: 100, r: 3.4 },
    { x: 312, y: 148, r: 4.2 },
    { x: 324, y: 196, r: 3.0 },
    { x: 342, y: 122, r: 2.6 },
    { x: 308, y: 220, r: 2.4 },
    { x: 344, y: 174, r: 2.2 },
  ],
  bud: { x: 396, y: 148, r: 30 },
};

const NARROW: Geo = {
  vb: '0 0 300 440',
  maxW: '320px',
  C: { x: 150, y: 132 },
  R: 84,
  // Clear of the bottom node's "Impact" label, which sits centred at y 254.
  reached: [
    { x: 112, y: 288, r: 3.4 },
    { x: 150, y: 278, r: 4.2 },
    { x: 188, y: 290, r: 3.0 },
    { x: 128, y: 312, r: 2.6 },
    { x: 206, y: 266, r: 2.4 },
    { x: 170, y: 316, r: 2.2 },
  ],
  bud: { x: 150, y: 374, r: 34 },
};

function nodePos(g: Geo, i: number, total: number) {
  // Start at the top, proceed clockwise.
  const a = (i / total) * Math.PI * 2 - Math.PI / 2;
  return { x: g.C.x + g.R * Math.cos(a), y: g.C.y + g.R * Math.sin(a) };
}

/*
  Labels sit radially outside the ring rather than always above or below the
  node. With a fixed above/below rule the two side labels landed on top of the
  ring itself and the progress arc drew straight through the word.
*/
function labelPos(g: Geo, i: number, total: number) {
  const a = (i / total) * Math.PI * 2 - Math.PI / 2;
  const d = g.R + 26;
  const x = g.C.x + d * Math.cos(a);
  const y = g.C.y + d * Math.sin(a);
  const horizontal = Math.abs(Math.cos(a)) > 0.7;
  return {
    x,
    y: horizontal ? y + 4 : y + (Math.sin(a) < 0 ? -2 : 12),
    anchor: horizontal ? (Math.cos(a) > 0 ? 'start' : 'end') : 'middle',
  } as const;
}

function budNode(g: Geo, i: number) {
  const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
  return { x: g.bud.x + g.bud.r * Math.cos(a), y: g.bud.y + g.bud.r * Math.sin(a) };
}

export default function Flywheel() {
  const [active, setActive] = useState(0);
  const [coarse, setCoarse] = useState(false);
  const [engaged, setEngaged] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const sync = () => setCoarse(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const choose = (i: number) => { setActive(i); setEngaged(true); };

  /*
    Scrolling walks the cycle.

    This is the one diagram on the page whose whole point is a sequence, and it
    used to present all four stages at once and wait to be hovered. Pinned, the
    scroll range maps onto the four stages, so Learn, Apply, Grow and Return
    arrive in order and the progress arc fills as you go. It is a pure function
    of scroll position: reverse and it walks backwards.

    Hover and tap still work and still win. `choose` sets the stage directly;
    scroll only writes when the bucket it computes actually changes, so a
    deliberate click is not immediately overwritten by the next scroll frame.
  */
  const pinRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const wide = useWideViewport(768);
  const pinned = wide && !prefersReduced;
  const progress = useScrollProgress(pinRef, pinned);
  const lastBucket = useRef(-1);

  useEffect(() => {
    if (!pinned) return;
    // The first and last stages get a little extra dwell so the cycle does not
    // start mid-stride or snap shut on the final pixel.
    const p = Math.min(Math.max((progress - 0.08) / 0.74, 0), 0.9999);
    const bucket = Math.floor(p * STAGES.length);
    if (bucket === lastBucket.current) return;
    lastBucket.current = bucket;
    setActive(bucket);
  }, [progress, pinned]);

  const g = wide ? WIDE : NARROW;
  // Midpoint of the 01 → 02 arc, with the clockwise tangent at that point.
  const arrow = (() => {
    const a = -Math.PI / 2 + (Math.PI * 2) / STAGES.length / 2;
    return { x: g.C.x + g.R * Math.cos(a), y: g.C.y + g.R * Math.sin(a), deg: (a * 180) / Math.PI + 90 };
  })();

  const stage = STAGES[active];
  const isReturn = active === STAGES.length - 1;
  // The reach appears at Impact and stays: what someone contributed does not
  // stop counting because the wheel turned again.
  const reached = active >= 2;
  // Under reduced motion the compounding still appears — it carries meaning —
  // it simply appears rather than fading in.
  const motion = !prefersReduced;

  return (
    <div ref={pinRef} style={pinned ? { height: '230vh' } : undefined}>
    <section
      className={`py-20 sm:py-24 px-6 lg:px-10 bg-halo-ivory border-t border-halo-rule${
        pinned ? ' sticky top-0 min-h-screen flex items-center' : ''
      }`}
      aria-labelledby="flywheel-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          <div>
            <p className="font-ui text-[11px] font-semibold text-halo-purple-d uppercase tracking-[0.14em] mb-5">
              The compounding effect
            </p>
            <h2
              id="flywheel-heading"
              className="font-display text-halo-ink leading-[1.05] mb-4"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
            >
              One mentor reaches<br />further than one person.
            </h2>

            <p className="text-halo-mist-body font-light text-[15px] leading-relaxed mb-5 max-w-sm">
              Help someone take their next step, and the impact doesn&apos;t stop
              when they take it.
            </p>

            {/* The copy has to describe the interaction that is actually
                available, which depends on whether the section is pinned. */}
            <InteractionCue
              className="mb-5"
              hover={
                pinned
                  ? 'Keep scrolling to follow the cycle, or pick a stage.'
                  : coarse
                    ? 'Tap each stage to follow the cycle.'
                    : 'Hover each stage to follow the cycle.'
              }
            />

            {/* Reserved height keeps the layout still as the label changes */}
            <div className="min-h-[86px] border-l-2 border-halo-rule pl-5">
              <p className="font-display text-halo-ink text-[24px] leading-none mb-1.5">
                {stage.verb}
              </p>
              <p className="text-halo-mist-body font-light text-[15px]">{stage.line}</p>
            </div>

            {/*
              The resting state was opacity 0.35, which left readable text
              sitting permanently at about 1.9:1 for anyone who never reached
              the return stage. A reveal should be hidden or shown, not parked
              half-legible in between.
            */}
            {/* Held back until the cycle closes, because it only means
                anything once you have watched it close. */}
            <p
              className="text-[15px] text-halo-ink font-medium mt-6 max-w-sm leading-relaxed transition-opacity duration-500 motion-reduce:transition-none"
              style={{ opacity: isReturn ? 1 : 0 }}
            >
              A mentor doesn&apos;t just help one person. They help everyone that
              person goes on to help.
            </p>
          </div>

          {/* The wheel */}
          <div className="flex justify-center">
            {/*
              Same trap as TrajectoryViz: role="img" makes the whole subtree a
              single leaf, so the four focusable stage markers inside were
              nested interactives that assistive tech could never reach.
            */}
            <svg
              viewBox={g.vb}
              className="w-full h-auto"
              style={{ maxWidth: g.maxW }}
              role="group"
              aria-label="A four-stage cycle — learn, grow, impact, return — which reaches outward: at the impact stage the people that growth touches appear beyond the ring, and at the return stage a second, smaller cycle begins beside it, belonging to someone the first mentor never met."
            >
              {/*
                Everything from here to the ring is the compounding, and it is
                deliberately quiet: lavender, small, no movement of its own. It
                should read as the wheel casting further than itself, not as a
                second thing competing for attention.
              */}
              <g aria-hidden="true" style={{ pointerEvents: 'none' }}>
                {/* Stage 3 — the people a more capable person reaches. */}
                <g style={{ opacity: reached ? 1 : 0.16, transition: motion ? 'opacity 700ms ease' : undefined }}>
                  {g.reached.map((d, i) => (
                    <circle
                      key={i}
                      cx={d.x} cy={d.y} r={d.r}
                      fill="#785AF7"
                      opacity={0.18 + (d.r / 4.2) * 0.34}
                      style={motion ? { transition: `opacity 600ms ease ${i * 70}ms` } : undefined}
                    />
                  ))}
                </g>

                {/* Stage 4 — the next cycle, beginning without the first mentor. */}
                <g style={{ opacity: isReturn ? 1 : 0.14, transition: motion ? 'opacity 800ms ease 120ms' : undefined }}>
                  <circle cx={g.bud.x} cy={g.bud.y} r={g.bud.r} fill="none" stroke="#E2DDE8" strokeWidth="1.5" />
                  {[0, 1, 2, 3].map((i) => {
                    const n = budNode(g, i);
                    return (
                      <circle
                        key={i}
                        cx={n.x} cy={n.y} r={i === 0 ? 6 : 4.5}
                        fill={i === 0 ? '#785AF7' : '#ffffff'}
                        stroke="#D9CFFB" strokeWidth="1.5"
                      />
                    );
                  })}
                </g>
              </g>

              <circle cx={g.C.x} cy={g.C.y} r={g.R} fill="none" stroke="#E2DDE8" strokeWidth="1.5" />

              {/* Progress arc grows as the user moves through the cycle */}
              <circle
                cx={g.C.x} cy={g.C.y} r={g.R}
                fill="none"
                stroke="#4717CA"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * g.R}
                strokeDashoffset={2 * Math.PI * g.R * (1 - (active + 1) / STAGES.length)}
                transform={`rotate(-90 ${g.C.x} ${g.C.y})`}
                style={{ transition: 'stroke-dashoffset 520ms cubic-bezier(0.16,1,0.3,1)' }}
              />

              {STAGES.map((s, i) => {
                const { x, y } = nodePos(g, i, STAGES.length);
                const lp = labelPos(g, i, STAGES.length);
                const isActive = i === active;
                return (
                  <g
                    key={s.verb}
                    onPointerEnter={() => choose(i)}
                    onClick={() => choose(i)}
                    onFocus={() => choose(i)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Stage ${i + 1}: ${s.verb}. ${s.line}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle cx={x} cy={y} r="26" fill="transparent" />
                    <circle
                      cx={x} cy={y}
                      r={isActive ? 17 : 13}
                      fill={isActive ? '#15131A' : '#ffffff'}
                      stroke={isActive ? '#15131A' : '#D9CFFB'}
                      strokeWidth="1.5"
                      style={{ transition: 'r 240ms cubic-bezier(0.16,1,0.3,1), fill 240ms ease' }}
                    />
                    <text
                      x={x} y={y + 3.5}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill={isActive ? '#ffffff' : '#785AF7'}
                      style={{ pointerEvents: 'none' }}
                    >
                      0{i + 1}
                    </text>
                    <text
                      x={lp.x} y={lp.y}
                      textAnchor={lp.anchor}
                      fontSize="12.5"
                      fontWeight="600"
                      fill={isActive ? '#15131A' : '#785AF7'}
                      style={{ pointerEvents: 'none', transition: 'fill 240ms ease' }}
                    >
                      {s.verb}
                    </text>
                  </g>
                );
              })}

              {/* Where to begin, and which way. Both disappear on first
                  interaction so they never become permanent decoration. */}
              {!engaged && (
                <g aria-hidden="true" style={{ pointerEvents: 'none' }}>
                  {/* Inside the ring: "Start here" above the node collided
                      with its own "Learn" label. */}
                  <text
                    x={nodePos(g, 0, STAGES.length).x} y={nodePos(g, 0, STAGES.length).y + 36}
                    textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#785AF7"
                  >
                    Start here
                  </text>
                  <circle
                    cx={nodePos(g, 0, STAGES.length).x} cy={nodePos(g, 0, STAGES.length).y} r="24"
                    fill="none" stroke="#785AF7" strokeWidth="1.5" opacity="0.5"
                    className="motion-safe:animate-ping-slow"
                  />
                  {/* Arrowhead sits on the ring midway between 01 and 02,
                      rotated to the clockwise tangent. */}
                  <path
                    d="M -5 -4 L 5 0 L -5 4 Z"
                    fill="#785AF7"
                    opacity="0.85"
                    transform={`translate(${arrow.x} ${arrow.y}) rotate(${arrow.deg})`}
                  />
                </g>
              )}

              {/* Loop-closure cue, lit only once Return is reached */}
              <text
                x={g.C.x} y={g.C.y + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#785AF7"
                style={{ opacity: isReturn ? 1 : 0, transition: 'opacity 400ms ease' }}
              >
                ↻ begins again
              </text>
            </svg>
          </div>

        </div>
      </div>
    </section>
    </div>
  );
}
