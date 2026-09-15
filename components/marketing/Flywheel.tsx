'use client';

import { useState, useEffect } from 'react';

const STAGES = [
  { verb: 'Learn',  line: 'Ask better questions.' },
  { verb: 'Apply',  line: 'Act on the answer.' },
  { verb: 'Grow',   line: 'Build a track record.' },
  { verb: 'Return', line: 'Become worth learning from.' },
] as const;

const R = 108;
const C = 150;

// Midpoint of the 01 -> 02 arc, with the clockwise tangent at that point.
const ARROW = (() => {
  const angle = -Math.PI / 2 + (Math.PI * 2) / STAGES.length / 2; // halfway to stage 2
  return {
    x: C + R * Math.cos(angle),
    y: C + R * Math.sin(angle),
    deg: (angle * 180) / Math.PI + 90, // tangent, clockwise
  };
})();

function nodePos(i: number) {
  // Start at the top, proceed clockwise.
  const angle = (i / STAGES.length) * Math.PI * 2 - Math.PI / 2;
  return { x: C + R * Math.cos(angle), y: C + R * Math.sin(angle) };
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
  const stage = STAGES[active];
  const isReturn = active === STAGES.length - 1;

  return (
    <section className="py-20 sm:py-24 px-6 lg:px-10 bg-cream-50 border-t border-gray-100" aria-labelledby="flywheel-heading">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          <div>
            <p className="text-[11px] font-semibold text-purple-600 uppercase tracking-[0.22em] mb-5">
              How it compounds
            </p>
            <h2
              id="flywheel-heading"
              className="font-serif text-purple-900 leading-[1.05] mb-5"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
            >
              It doesn&apos;t end<br />with you.
            </h2>

            <p className="text-[14px] text-gray-600 mb-5">
              {coarse ? 'Tap each stage to follow the cycle.' : 'Hover each stage to follow the cycle.'}
            </p>

            {/* Reserved height keeps the layout still as the label changes */}
            <div className="min-h-[76px] border-l-2 border-purple-200 pl-5">
              <p className="font-serif text-purple-900 text-[24px] leading-none mb-1.5">
                {stage.verb}
              </p>
              <p className="text-gray-500 font-light text-[15px]">{stage.line}</p>
            </div>

            <p
              className="text-[14px] text-purple-600 font-medium mt-6 transition-opacity duration-500"
              style={{ opacity: isReturn ? 1 : 0.35 }}
            >
              …and the cycle starts again, one person further along.
            </p>
          </div>

          {/* The wheel */}
          <div className="flex justify-center">
            <svg viewBox="0 0 300 300" className="w-full max-w-[300px] h-auto" role="img" aria-label="A four-stage cycle: Learn, Apply, Grow, Return, which loops back to Learn.">
              <circle cx={C} cy={C} r={R} fill="none" stroke="#e7e3f9" strokeWidth="1.5" />

              {/* Progress arc grows as the user moves through the cycle */}
              <circle
                cx={C} cy={C} r={R}
                fill="none"
                stroke="#3a1d87"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * R}
                strokeDashoffset={2 * Math.PI * R * (1 - (active + 1) / STAGES.length)}
                transform={`rotate(-90 ${C} ${C})`}
                style={{ transition: 'stroke-dashoffset 520ms cubic-bezier(0.16,1,0.3,1)' }}
              />

              {STAGES.map((s, i) => {
                const { x, y } = nodePos(i);
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
                      fill={isActive ? '#24193e' : '#ffffff'}
                      stroke={isActive ? '#24193e' : '#D9CFFB'}
                      strokeWidth="1.5"
                      style={{ transition: 'r 240ms cubic-bezier(0.16,1,0.3,1), fill 240ms ease' }}
                    />
                    <text
                      x={x} y={y + 3.5}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill={isActive ? '#ffffff' : '#5f3ee1'}
                      style={{ pointerEvents: 'none' }}
                    >
                      0{i + 1}
                    </text>
                    <text
                      x={x} y={y + (y < C ? -26 : 34)}
                      textAnchor="middle"
                      fontSize="12.5"
                      fontWeight="600"
                      fill={isActive ? '#24193e' : '#5f3ee1'}
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
                    x={nodePos(0).x} y={nodePos(0).y + 34}
                    textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#5f3ee1"
                  >
                    Start here
                  </text>
                  <circle
                    cx={nodePos(0).x} cy={nodePos(0).y} r="24"
                    fill="none" stroke="#5f3ee1" strokeWidth="1.5" opacity="0.5"
                    className="motion-safe:animate-ping-slow"
                  />
                  {/* Arrowhead sits on the ring midway between 01 and 02,
                      rotated to the clockwise tangent. */}
                  <path
                    d="M -5 -4 L 5 0 L -5 4 Z"
                    fill="#5f3ee1"
                    opacity="0.85"
                    transform={`translate(${ARROW.x} ${ARROW.y}) rotate(${ARROW.deg})`}
                  />
                </g>
              )}

              {/* Loop-closure cue, lit only once Return is reached */}
              <text
                x={C} y={C + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#5f3ee1"
                style={{ opacity: isReturn ? 1 : 0, transition: 'opacity 400ms ease' }}
              >
                ↻ begins again
              </text>
            </svg>
          </div>

        </div>
      </div>
    </section>
  );
}
