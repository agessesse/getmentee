'use client';

import { useEffect, useRef, useState } from 'react';
import { useScrollProgress, useReducedMotion, useWideViewport } from '@/lib/useScrollProgress';
import InteractionCue from '@/components/marketing/InteractionCue';

// Nodes sit along the mentored curve as fractions of its length.
// The mentor enters early, at MENTOR_T; the milestones follow. Keeping these
// spaced apart matters — an earlier layout put the mentor marker directly on
// top of a milestone label.
const MENTOR_T = 0.15;

const NODES = [
  { t: 0.36, label: 'Clarity',      note: 'Know what the path actually looks like.' },
  { t: 0.56, label: 'Preparation',  note: 'Show up ready to make the time count.' },
  { t: 0.75, label: 'Introduction', note: 'Someone vouches, because they know your work.' },
  { t: 0.92, label: 'Opportunity',  note: 'A door you could not have found alone.' },
];

const W = 720;
const H = 300;
const START = { x: 60, y: 232 };
const FLAT_END = { x: 664, y: 208 };

// Quadratic curve from START, bending upward. `lift` scales how far it bends.
function curvePoint(t: number, lift: number) {
  const cx = 300, cyBase = 236;
  const cy = cyBase - 210 * lift;
  const ex = 664, eyBase = 208;
  const ey = eyBase - 168 * lift;
  const mt = 1 - t;
  return {
    x: mt * mt * START.x + 2 * mt * t * cx + t * t * ex,
    y: mt * mt * START.y + 2 * mt * t * cy + t * t * ey,
  };
}

function curvePath(lift: number) {
  const cy = 236 - 210 * lift;
  const ey = 208 - 168 * lift;
  return `M ${START.x} ${START.y} Q 300 ${cy} 664 ${ey}`;
}

export default function TrajectoryViz() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [lift, setLift] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [coarse, setCoarse] = useState(false);
  // Rendered width of the SVG, used to keep label size constant across
  // viewports. A fixed breakpoint multiplier over-scaled tablets badly.
  const [svgW, setSvgW] = useState(700);
  const [activeNode, setActiveNode] = useState<number | null>(null);

  // Target lift lives in a ref; a RAF loop eases the rendered value toward it
  // so pointer movement never drives a render at pointer frequency.
  const target = useRef(0);
  const raf = useRef(0);
  // Set once the pointer takes over, so the entry animation yields to it.
  const scrubbed = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cq = window.matchMedia('(pointer: coarse)');
    const onChange = () => { setReduced(mq.matches); setCoarse(cq.matches); };
    onChange();
    mq.addEventListener('change', onChange);
    cq.addEventListener('change', onChange);
    return () => { mq.removeEventListener('change', onChange); cq.removeEventListener('change', onChange); };
  }, []);

  /*
    The curve is drawn by scrolling.

    It used to play a fixed 1100ms ease the first time the section came into
    view, which meant the most literal idea on the page, a trajectory bending
    upward, was disconnected from the one gesture the visitor was already
    making. Now the section pins for a short range and the lift is a pure
    function of how far through that range you are: stop halfway and the curve
    stops halfway, scroll back and it comes back down.

    Pointer scrubbing still wins. Once `scrubbed` is set the mouse owns the
    value, exactly as before, and scroll stops writing to it.
  */
  const pinRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const wide = useWideViewport(768);
  const pinned = wide && !prefersReduced;
  const scrollProgress = useScrollProgress(pinRef, pinned);

  useEffect(() => {
    if (!pinned) { setLift(1); return; }
    if (scrubbed.current) return;
    // Resolve a little before the pin ends so the finished curve is held for a
    // beat rather than completing on the very last pixel.
    setLift(Math.min(scrollProgress / 0.78, 1));
  }, [scrollProgress, pinned]);

  const startLoop = () => {
    if (raf.current) return;
    const tick = () => {
      setLift((prev) => {
        const next = prev + (target.current - prev) * 0.14;
        if (Math.abs(target.current - next) < 0.002) {
          raf.current = 0;
          return target.current;
        }
        raf.current = requestAnimationFrame(tick);
        return next;
      });
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      if (w > 0) setSvgW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || reduced) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    // Floor at 0.25 so the curve never collapses while being scrubbed.
    scrubbed.current = true;
    const t = (e.clientX - left) / width;
    target.current = Math.min(Math.max(t, 0.25), 1);
    startLoop();
  };

  const RESTING_LIFT = 1;

  const handleLeave = () => {
    if (reduced) return;
    // Settle back to fully resolved rather than collapsing to a flat line.
    target.current = RESTING_LIFT;
    startLoop();
  };

  // The viewBox is a fixed 720 units wide, so anything inside it shrinks in
  // proportion to the rendered width. Scaling by 700/width holds glyphs at a
  // near-constant on-screen size from a 342px phone to a 1000px desktop.
  const k = Math.min(2.2, Math.max(0.85, 700 / svgW));
  const narrow = svgW < 480;
  // The hint has served its purpose the moment the user touches the chart.
  const showHint = !reduced && !coarse && lift > 0.9 && !scrubbed.current && activeNode === null;
  const mentorPt = curvePoint(MENTOR_T, lift);
  const active = activeNode !== null ? NODES[activeNode] : null;

  return (
    /*
      The pin range. Roughly one extra screen of scroll, which is a single
      trackpad flick, and every pixel of it is reversible. Below 768px and under
      reduced motion the wrapper is a plain div with no height and the section
      behaves exactly as it did before.
    */
    <div ref={pinRef} style={pinned ? { height: '190vh' } : undefined}>
    <section
      className={`py-20 sm:py-24 px-6 lg:px-10 bg-halo-deep overflow-hidden${
        pinned ? ' sticky top-0 min-h-screen flex items-center' : ''
      }`}
      aria-labelledby="trajectory-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr,1.2fr] gap-10 lg:gap-14 items-center">

          <div>
            <p className="font-ui text-[11px] font-semibold text-halo-lavender uppercase tracking-[0.14em] mb-5">
              The difference
            </p>
            <h2
              id="trajectory-heading"
              className="font-display text-white leading-[1.05] mb-4"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
            >
              What changes when<br />experience is passed forward.
            </h2>

            {/* Reserved height: the hint is replaced in place by the hovered
                node's note, so nothing below it ever shifts. */}
            <div className="relative min-h-[62px]">
              <InteractionCue
                tone="deep"
                icon={coarse ? 'click' : 'browse'}
                retired={!!active}
                durationMs={200}
                hover={coarse ? 'Tap each point to see what changes.' : 'Move across the path to see what changes.'}
              />
              <p
                className="absolute inset-x-0 top-0 text-halo-lavender font-light text-[14px] transition-opacity duration-200"
                style={{ opacity: active ? 1 : 0 }}
              >
                {active?.note ?? ' '}
              </p>
            </div>

            <p className="text-[11px] text-halo-lavender font-light mt-6 max-w-xs leading-relaxed">
              Illustrative. Mentorship changes what is reachable. It does not
              guarantee an outcome.
            </p>
          </div>

        <div
          ref={wrapRef}
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
          className="relative"
        >
          <svg
            ref={svgRef}
            viewBox={narrow ? `0 -10 ${W} ${H + 40}` : `0 14 ${W} ${H - 32}`}
            className="w-full h-auto block"
            /*
              Was role="img". An image is a single leaf node to assistive tech,
              so the four focusable stage markers inside it were unreachable
              nested interactives. role="group" keeps the description and lets
              a screen reader navigate into the markers.
            */
            role="group"
            aria-label="A chart comparing an unmentored path, which stays flat, against a mentored path that bends upward through clarity, preparation, introduction, and opportunity."
          >
            <defs>
              <linearGradient id="traj-grad" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#D9CFFB" />
                <stop offset="100%" stopColor="#FBFAF8" />
              </linearGradient>
            </defs>

            {/* Unmentored baseline — always visible, deliberately inert */}
            <path
              d={`M ${START.x} ${START.y} L ${FLAT_END.x} ${FLAT_END.y}`}
              stroke="#5B2BD6"
              strokeWidth={1.5 * k}
              strokeDasharray="5 6"
              fill="none"
            />
            <text x={FLAT_END.x} y={FLAT_END.y + 22 * k} textAnchor="end" fill="#D9CFFB" fontSize={11 * k} fontWeight="500">
              without mentorship
            </text>

            {/* Mentored curve */}
            <path
              d={curvePath(lift)}
              stroke="url(#traj-grad)"
              strokeWidth={2.5 * k}
              fill="none"
              strokeLinecap="round"
              style={{ opacity: 0.25 + lift * 0.75 }}
            />

            {/* One-shot gesture hint: a dot traces the path the cursor should
                follow. Removed permanently once the user engages. */}
            {showHint && (
              <circle
                r={5 * k}
                fill="#ffffff"
                className="traj-hint"
                style={{ offsetPath: `path("${curvePath(1)}")`, offsetRotate: '0deg' }}
                aria-hidden="true"
              />
            )}

            {/* Origin — the student */}
            <circle cx={START.x} cy={START.y} r={6 * k} fill="#ffffff" />
            <text x={START.x} y={START.y + 26 * k} textAnchor="middle" fill="#D9CFFB" fontSize={11 * k} fontWeight="600">
              You
            </text>

            {/* The mentor enters as the curve lifts */}
            <g style={{ opacity: Math.max(0, (lift - 0.18) / 0.5) }}>
              <circle cx={mentorPt.x} cy={mentorPt.y} r={7 * k} fill="#4717CA" stroke="#ffffff" strokeWidth={2 * k} />
              <text x={mentorPt.x} y={mentorPt.y - 16 * k} textAnchor="middle" fill="#ffffff" fontSize={11 * k} fontWeight="600">
                Mentor
              </text>
            </g>

            {/* Milestones appear in order as the curve resolves */}
            {NODES.map((node, i) => {
              const p = curvePoint(node.t, lift);
              const reveal = Math.max(0, Math.min(1, (lift - node.t * 0.62) / 0.2));
              const isActive = activeNode === i;
              return (
                <g key={node.label} style={{ opacity: reveal }}>
                  {/* Generous transparent hit area: the visible dot is far
                      smaller than a comfortable touch target. r=23 rather than
                      22 because the viewBox-to-CSS scale puts 22 at 42.8px
                      rendered, just under the 44px minimum. */}
                  <circle
                    cx={p.x} cy={p.y} r={23 * k}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${node.label}: ${node.note}`}
                    onPointerEnter={() => setActiveNode(i)}
                    onPointerLeave={() => setActiveNode(null)}
                    onClick={() => setActiveNode(i)}
                    onFocus={() => setActiveNode(i)}
                    onBlur={() => setActiveNode(null)}
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={(isActive ? 7 : 4.5) * k}
                    fill={isActive ? '#ffffff' : '#D9CFFB'}
                    style={{ transition: 'r 180ms ease, fill 180ms ease', pointerEvents: 'none' }}
                  />
                  {(!narrow || i === 0 || i === NODES.length - 1) && (
                    <text
                      x={p.x}
                      y={p.y - 16 * k}
                      textAnchor={narrow && i === NODES.length - 1 ? 'end' : 'middle'}
                      fill={isActive ? '#ffffff' : '#D9CFFB'}
                      fontSize={10.5 * k}
                      fontWeight="600"
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        </div>
      </div>
    </section>
    </div>
  );
}
