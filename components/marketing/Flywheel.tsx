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
  /**
   * Cycles that begin because the first one did. The first is the mentee who
   * later helps someone; the second is that person's own. Two is enough to
   * show the direction of travel, and stopping at two keeps it an illustration
   * of how impact can move rather than a claim that it doubles.
   */
  buds: { x: number; y: number; r: number }[];
}

const WIDE: Geo = {
  vb: '0 0 500 300',
  maxW: '480px',
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
  buds: [
    { x: 386, y: 148, r: 28 },
    { x: 456, y: 148, r: 17 },
  ],
};

const NARROW: Geo = {
  vb: '0 0 300 470',
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
  buds: [
    { x: 150, y: 362, r: 30 },
    { x: 150, y: 432, r: 18 },
  ],
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

function budNode(bud: { x: number; y: number; r: number }, i: number) {
  const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
  return { x: bud.x + bud.r * Math.cos(a), y: bud.y + bud.r * Math.sin(a) };
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

  /*
    Where the closing line is allowed to appear.

    Pinned, it is the payoff: you walk the cycle and it lands at Return. But
    unpinned — a phone, or reduced motion — there is no walk, the stages wait
    to be tapped, and the strongest sentence in the section was sitting at
    opacity 0 for the visitors least likely to go looking for it. So it is
    held back only where holding it back buys something.

    Gated on mount rather than on `pinned` alone: useWideViewport starts false,
    so keying straight off it would render the line on a desktop first paint
    and then fade it out on hydration.
  */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const revealed = isReturn || (mounted && !pinned);

  return (
    <div ref={pinRef} style={pinned ? { height: '230vh' } : undefined}>
    <section
      className={`py-20 sm:py-24 px-6 lg:px-10 bg-halo-ivory border-t border-halo-rule${
        pinned ? ' sticky top-0 min-h-screen flex items-center' : ''
      }`}
      aria-labelledby="flywheel-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Not an even split. The text column carries a 48px headline and the
            diagram column was running half-empty at 1024; giving the words the
            larger share fixes the wrap at the narrowest two-column width and
            tightens the whitespace around the ring at the same time. */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-12 lg:gap-16 items-center">

          <div>
            <p className="font-ui text-[11px] font-semibold text-halo-purple-d uppercase tracking-[0.14em] mb-5">
              ROI · Return on Impact
            </p>
            <h2
              id="flywheel-heading"
              className="font-display text-halo-ink leading-[1.05] mb-4"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)', textWrap: 'balance' }}
            >
              {/*
                No hard break, and balance rather than a breakpoint exception —
                the same treatment section 06's headline already uses. The one
                addition is a non-breaking space inside "someone else's": left
                to itself, balance split that phrase and line two read "becomes
                someone", which lands as a different sentence than the one
                being written.
              */}
              Your experience becomes someone&nbsp;else&apos;s starting point.
            </h2>

            <p className="text-halo-mist-body font-light text-[15px] leading-relaxed mb-5 max-w-sm">
              One mentor reaches further than one person. Help someone take their
              next step, and the effect doesn&apos;t stop when they take it.
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
              style={{ opacity: revealed ? 1 : 0 }}
            >
              The return isn&apos;t what comes back to you. It&apos;s what keeps
              moving forward.
            </p>
          </div>

          {/* The wheel */}
          <div className="flex flex-col items-center">
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
              aria-label="An illustration of a four-stage cycle: learn, grow, impact, return. At the impact stage, the people that growth touches appear beyond the ring. At the return stage, two further cycles begin beside it, each smaller than the last, belonging to people the first mentor never met."
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
                  {/* Each generation is smaller and quieter than the one
                      before it, so the eye reads distance rather than decay. */}
                  {g.buds.map((bud, gen) => (
                    <g key={gen} opacity={gen === 0 ? 1 : 0.62}>
                      <circle cx={bud.x} cy={bud.y} r={bud.r} fill="none" stroke="#E2DDE8" strokeWidth="1.5" />
                      {[0, 1, 2, 3].map((i) => {
                        const n = budNode(bud, i);
                        const lead = i === 0;
                        return (
                          <circle
                            key={i}
                            cx={n.x} cy={n.y} r={lead ? (gen === 0 ? 6 : 4) : gen === 0 ? 4.5 : 3}
                            fill={lead ? '#785AF7' : '#ffffff'}
                            stroke="#D9CFFB" strokeWidth="1.5"
                          />
                        );
                      })}
                    </g>
                  ))}
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
                    className="halo-svg-focus"
                    style={{ cursor: 'pointer' }}
                  >
                    <circle cx={x} cy={y} r="26" fill="transparent" />
                    {/* Sits outside the largest marker state (r 17) with a
                        clear gap, so the ring reads as a ring rather than a
                        border, and never changes the marker's own geometry. */}
                    <circle
                      className="halo-svg-focus-ring"
                      cx={x} cy={y} r="23"
                      fill="none"
                      stroke="#4717CA"
                      strokeWidth="2"
                      opacity="0"
                      style={{ pointerEvents: 'none' }}
                    />
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

            {/*
              Two sentences, in the shape section 06 already uses ("Illustrative.
              Mentorship changes what is reachable. It does not guarantee an
              outcome."). The longer version explained why we had not put a
              number here, which is internal reasoning: it told the visitor what
              we were worried about instead of what the drawing means.
            */}
            <p className="text-[12.5px] text-halo-mist-body font-light leading-relaxed mt-5 max-w-sm text-center">
              Illustrative. This shows how impact can travel, not how often it does.
            </p>
          </div>

        </div>
      </div>
    </section>
    </div>
  );
}
