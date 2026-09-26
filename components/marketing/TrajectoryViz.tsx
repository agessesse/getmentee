'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/useScrollProgress';

/*
  The trajectory comparison.

  WHAT THIS REPLACED, AND WHY. The previous version was a scrub toy: pointer X
  drove how far the curve bent, the four milestones only revealed their meaning
  on hover, and a line of copy had to explain the gesture ("Move across the
  path to see what changes"). Three things were wrong with that. The argument
  was gated behind a gesture nobody was told about until they had already
  missed it; the milestones sat on a curve that moved while you aimed at them,
  so landing on one was genuinely hard; and a section whose whole job is to be
  understood could be scrolled past without ever resolving.

  It now reads at rest. Two labelled paths, a mentor marked where they enter,
  four effects named on the curve, and every one of those effects spelled out
  in a list beside the chart that is visible without touching anything.
  Hovering or focusing a marker highlights its row and vice versa, which is
  depth rather than the price of admission.

  The curve still draws itself, once, when the section comes into view. That is
  a one-shot entrance, not a scroll scrub: it cannot leave the chart half-drawn
  and it needs nothing from the visitor. Under reduced motion it is simply
  drawn.

  The horizontal capture-zone fix the old version needed is gone because the
  bug it fixed cannot happen any more. Markers no longer move once the curve
  has settled, so nothing can slide out from under the pointer.
*/

const NODES = [
  { t: 0.36, label: 'Guidance',    note: 'Someone who has already done it tells you how it actually works.' },
  { t: 0.56, label: 'Preparation', note: 'You do the work already knowing what the work is.' },
  { t: 0.75, label: 'Opportunity', note: 'You know an opening when you see one, and you are ready for it.' },
  { t: 0.92, label: 'Judgment',    note: 'The next decision is one you can make on your own.' },
];

/** Where the mentor joins the mentored path. */
const MENTOR_T = 0.15;

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
  const prefersReduced = useReducedMotion();
  const [lift, setLift] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [svgW, setSvgW] = useState(700);
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  /*
    Draw once, on first view. An IntersectionObserver rather than a scroll
    position, so the chart is never a function of how far through a pinned
    range someone happens to be, and it always ends up fully drawn.
  */
  useEffect(() => {
    if (prefersReduced) { setLift(1); return; }
    const el = sectionRef.current;
    if (!el) { setLift(1); return; }
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const DURATION = 1100;
        const tick = (now: number) => {
          const t = Math.min((now - start) / DURATION, 1);
          // easeOutCubic: quick to read, settles gently.
          setLift(1 - Math.pow(1 - t, 3));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [prefersReduced]);

  // The viewBox is a fixed 720 units wide, so anything inside it shrinks in
  // proportion to the rendered width. Scaling by 700/width holds glyphs at a
  // near-constant on-screen size from a 342px phone to a 1000px desktop.
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

  const k = Math.min(2.2, Math.max(0.85, 700 / svgW));
  const narrow = svgW < 480;
  const mentorPt = curvePoint(MENTOR_T, lift);
  const endPt = curvePoint(1, lift);

  return (
    <section
      ref={sectionRef}
      className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-deep overflow-hidden"
      aria-labelledby="trajectory-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.15fr] gap-10 lg:gap-14 items-center">

          <div>
            <p className="font-ui text-[11px] font-semibold text-halo-lavender uppercase tracking-[0.14em] mb-5">
              One person, one decision
            </p>
            <h2
              id="trajectory-heading"
              className="font-display text-white leading-[1.05] mb-4"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)', textWrap: 'balance' }}
            >
              What changes when someone ahead of you helps you see further.
            </h2>

            {/* The honest version of the claim, said once, before the chart:
                a mentor cannot hand anyone an outcome. */}
            <p className="text-halo-lavender font-light text-[15px] leading-relaxed mb-7 max-w-sm">
              A mentor can&apos;t decide where you end up. They can tell you what they
              learned the hard way and let you use it. What you do with it is still
              yours.
            </p>

            {/*
              The four effects, in full, at rest.

              This is the change that makes the section work. These sentences
              used to exist only inside a hover state on a moving target, which
              meant the argument was invisible to anyone who did not discover
              the gesture. They are now simply the content. Pointing at a
              marker highlights the matching row, and pointing at a row
              highlights the marker, but neither is required to read any of it.
            */}
            <ol className="border-t border-white/15">
              {NODES.map((node, i) => (
                <li key={node.label}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="w-full text-left flex items-baseline gap-3 py-2.5 border-b border-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-lavender rounded-sm"
                  >
                    <span
                      className="font-ui text-[10.5px] font-semibold tabular-nums transition-colors"
                      style={{ color: active === i ? '#ffffff' : 'rgba(217,207,251,0.6)' }}
                    >
                      0{i + 1}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="font-semibold text-[14.5px] transition-colors"
                        style={{ color: active === i ? '#ffffff' : '#D9CFFB' }}
                      >
                        {node.label}
                      </span>
                      <span className="text-halo-lavender/85 font-light text-[14px] leading-snug">
                        {' — '}{node.note}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <p className="text-[11px] text-halo-lavender font-light mt-6 max-w-xs leading-relaxed">
              Illustrative. Mentorship changes what is reachable. It does not
              guarantee an outcome.
            </p>
          </div>

          <div className="relative">
            <svg
              ref={svgRef}
              viewBox={narrow ? `0 -10 ${W} ${H + 40}` : `0 14 ${W} ${H - 32}`}
              className="w-full h-auto block"
              /*
                role="group", not role="img": an image is a single leaf node to
                assistive tech, so the focusable markers inside would be
                unreachable nested interactives.
              */
              role="group"
              aria-label="A chart comparing two paths from the same starting point. One stays flat and is labelled on your own. The other bends upward after a mentor joins, passing through guidance, preparation, opportunity and judgment."
            >
              <defs>
                <linearGradient id="traj-grad" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#D9CFFB" />
                  <stop offset="100%" stopColor="#FBFAF8" />
                </linearGradient>
              </defs>

              {/* The unmentored baseline. Always fully drawn, so the
                  comparison exists from the first frame rather than arriving
                  with the animation. */}
              <path
                d={`M ${START.x} ${START.y} L ${FLAT_END.x} ${FLAT_END.y}`}
                stroke="#5B2BD6"
                strokeWidth={1.5 * k}
                strokeDasharray="5 6"
                fill="none"
              />
              {/* Renamed from "without mentorship". The two paths are now a
                  matched pair of plain-language labels, which is what makes
                  the comparison legible at a glance. */}
              <text x={FLAT_END.x} y={FLAT_END.y + 22 * k} textAnchor="end" fill="#D9CFFB" fontSize={11.5 * k} fontWeight="600">
                On your own
              </text>

              {/* The mentored curve */}
              <path
                d={curvePath(lift)}
                stroke="url(#traj-grad)"
                strokeWidth={2.5 * k}
                fill="none"
                strokeLinecap="round"
                style={{ opacity: 0.25 + lift * 0.75 }}
              />
              {/* Below the curve, not above it: the last milestone's label
                  ("Judgment") sits above the line at almost the same x, and
                  the two collided. The flat path's label is likewise below
                  its line, so the pair now reads as a matched set. */}
              <text
                x={endPt.x}
                y={endPt.y + 26 * k}
                textAnchor="end"
                fill="#ffffff"
                fontSize={11.5 * k}
                fontWeight="600"
                style={{ opacity: lift }}
              >
                With guidance
              </text>

              {/* Origin — the student */}
              <circle cx={START.x} cy={START.y} r={6 * k} fill="#ffffff" />
              <text x={START.x} y={START.y + 26 * k} textAnchor="middle" fill="#D9CFFB" fontSize={11 * k} fontWeight="600">
                You
              </text>

              {/* Where the mentor joins */}
              <g style={{ opacity: Math.max(0, (lift - 0.18) / 0.5) }}>
                <circle cx={mentorPt.x} cy={mentorPt.y} r={7 * k} fill="#4717CA" stroke="#ffffff" strokeWidth={2 * k} />
                <text x={mentorPt.x} y={mentorPt.y - 16 * k} textAnchor="middle" fill="#ffffff" fontSize={11 * k} fontWeight="600">
                  Mentor
                </text>
              </g>

              {NODES.map((node, i) => {
                const p = curvePoint(node.t, lift);
                const isActive = active === i;
                return (
                  <g key={node.label} style={{ opacity: lift }}>
                    {/* Generous, forgiving hit area. The visible dot is far
                        smaller than a comfortable target, and since the curve
                        no longer moves under the pointer, landing on one is
                        now simply a matter of being near it. */}
                    <circle
                      cx={p.x} cy={p.y} r={26 * k}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      tabIndex={0}
                      role="button"
                      aria-label={`${node.label}: ${node.note}`}
                      onMouseEnter={() => setActive(i)}
                      onMouseLeave={() => setActive(null)}
                      onClick={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                    />
                    <circle
                      cx={p.x} cy={p.y}
                      r={(isActive ? 7.5 : 4.5) * k}
                      fill={isActive ? '#ffffff' : '#D9CFFB'}
                      style={{ transition: 'r 180ms ease, fill 180ms ease', pointerEvents: 'none' }}
                    />
                    {/* Every milestone is labelled on the chart. On a narrow
                        viewport only the first and last fit without colliding,
                        and the list beside the chart carries all four anyway. */}
                    {(!narrow || i === 0 || i === NODES.length - 1) && (
                      <text
                        x={p.x}
                        y={p.y - 16 * k}
                        textAnchor={narrow && i === NODES.length - 1 ? 'end' : 'middle'}
                        fill={isActive ? '#ffffff' : '#D9CFFB'}
                        fontSize={10.5 * k}
                        fontWeight="600"
                        style={{ pointerEvents: 'none', transition: 'fill 180ms ease' }}
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
