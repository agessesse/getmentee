'use client';

import { useEffect, useRef, useState } from 'react';

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

  // Every device resolves the curve once on scroll-in, so the section is never
  // blank; mouse users can then scrub it with the pointer.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (reduced) { setLift(1); io.disconnect(); return; }
        const started = performance.now();
        const tick = (now: number) => {
          if (scrubbed.current) return;
          const p = Math.min((now - started) / 1100, 1);
          setLift(1 - Math.pow(1 - p, 3));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.45 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

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
    <section
      className="py-20 sm:py-24 px-6 lg:px-10 bg-navy-900 overflow-hidden"
      aria-labelledby="trajectory-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr,1.2fr] gap-10 lg:gap-14 items-center">

          <div>
            <p className="text-[11px] font-semibold text-navy-400 uppercase tracking-[0.22em] mb-5">
              The difference
            </p>
            <h2
              id="trajectory-heading"
              className="font-serif text-white leading-[1.05] mb-4"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
            >
              What changes when<br />someone has done it before.
            </h2>

            {/* Reserved height: the hint is replaced in place by the hovered
                node's note, so nothing below it ever shifts. */}
            <div className="min-h-[62px]">
              <p
                className="text-navy-400 font-light text-[14px] transition-opacity duration-200"
                style={{ opacity: active ? 0 : 1 }}
              >
                {coarse
                  ? 'Tap each point to see what changes.'
                  : 'Move across the path to see what changes.'}
              </p>
              <p
                className="text-navy-200 font-light text-[14px] -mt-[21px] transition-opacity duration-200"
                style={{ opacity: active ? 1 : 0 }}
              >
                {active?.note ?? ' '}
              </p>
            </div>

            <p className="text-[11px] text-navy-300 font-light mt-6 max-w-xs leading-relaxed">
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
            role="img"
            aria-label="A chart comparing an unmentored path, which stays flat, against a mentored path that bends upward through clarity, preparation, introduction, and opportunity."
          >
            <defs>
              <linearGradient id="traj-grad" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#5265b0" />
                <stop offset="100%" stopColor="#dde3f5" />
              </linearGradient>
            </defs>

            {/* Unmentored baseline — always visible, deliberately inert */}
            <path
              d={`M ${START.x} ${START.y} L ${FLAT_END.x} ${FLAT_END.y}`}
              stroke="#2d3668"
              strokeWidth={1.5 * k}
              strokeDasharray="5 6"
              fill="none"
            />
            <text x={FLAT_END.x} y={FLAT_END.y + 22 * k} textAnchor="end" fill="#879bd3" fontSize={11 * k} fontWeight="500">
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
            <text x={START.x} y={START.y + 26 * k} textAnchor="middle" fill="#879bd3" fontSize={11 * k} fontWeight="600">
              You
            </text>

            {/* The mentor enters as the curve lifts */}
            <g style={{ opacity: Math.max(0, (lift - 0.18) / 0.5) }}>
              <circle cx={mentorPt.x} cy={mentorPt.y} r={7 * k} fill="#1a1f3a" stroke="#ffffff" strokeWidth={2 * k} />
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
                      smaller than a comfortable touch target. */}
                  <circle
                    cx={p.x} cy={p.y} r={22 * k}
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
                    fill={isActive ? '#ffffff' : '#a4b3de'}
                    style={{ transition: 'r 180ms ease, fill 180ms ease', pointerEvents: 'none' }}
                  />
                  {(!narrow || i === 0 || i === NODES.length - 1) && (
                    <text
                      x={p.x}
                      y={p.y - 16 * k}
                      textAnchor={narrow && i === NODES.length - 1 ? 'end' : 'middle'}
                      fill={isActive ? '#ffffff' : '#879bd3'}
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
  );
}
