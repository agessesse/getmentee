'use client';

import { useState } from 'react';

const STAGES = [
  { verb: 'Learn',  line: 'Ask better questions.' },
  { verb: 'Apply',  line: 'Act on the answer.' },
  { verb: 'Grow',   line: 'Build a track record.' },
  { verb: 'Return', line: 'Become worth learning from.' },
] as const;

const R = 108;
const C = 150;

function nodePos(i: number) {
  // Start at the top, proceed clockwise.
  const angle = (i / STAGES.length) * Math.PI * 2 - Math.PI / 2;
  return { x: C + R * Math.cos(angle), y: C + R * Math.sin(angle) };
}

export default function Flywheel() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active];
  const isReturn = active === STAGES.length - 1;

  return (
    <section className="py-20 sm:py-24 px-6 lg:px-10 bg-cream-50 border-t border-gray-100" aria-labelledby="flywheel-heading">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          <div>
            <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-5">
              How it compounds
            </p>
            <h2
              id="flywheel-heading"
              className="font-serif text-navy-900 leading-[1.05] mb-5"
              style={{ fontSize: 'clamp(2.1rem, 4.8vw, 3.3rem)' }}
            >
              It doesn&apos;t end<br />with you.
            </h2>

            {/* Reserved height keeps the layout still as the label changes */}
            <div className="min-h-[76px] border-l-2 border-navy-200 pl-5">
              <p className="font-serif text-navy-900 text-[26px] leading-none mb-1.5">
                {stage.verb}
              </p>
              <p className="text-gray-500 font-light text-[14.5px]">{stage.line}</p>
            </div>

            <p
              className="text-[13px] text-navy-600 font-medium mt-6 transition-opacity duration-500"
              style={{ opacity: isReturn ? 1 : 0.35 }}
            >
              …and the cycle starts again, one person further along.
            </p>
          </div>

          {/* The wheel */}
          <div className="flex justify-center">
            <svg viewBox="0 0 300 300" className="w-full max-w-[300px] h-auto" role="img" aria-label="A four-stage cycle: Learn, Apply, Grow, Return — which loops back to Learn.">
              <circle cx={C} cy={C} r={R} fill="none" stroke="#dde3f5" strokeWidth="1.5" />

              {/* Progress arc grows as the user moves through the cycle */}
              <circle
                cx={C} cy={C} r={R}
                fill="none"
                stroke="#2d3668"
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
                    onPointerEnter={() => setActive(i)}
                    onClick={() => setActive(i)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle cx={x} cy={y} r="26" fill="transparent" />
                    <circle
                      cx={x} cy={y}
                      r={isActive ? 17 : 13}
                      fill={isActive ? '#1a1f3a' : '#ffffff'}
                      stroke={isActive ? '#1a1f3a' : '#c0cbe9'}
                      strokeWidth="1.5"
                      style={{ transition: 'r 240ms cubic-bezier(0.16,1,0.3,1), fill 240ms ease' }}
                    />
                    <text
                      x={x} y={y + 3.5}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill={isActive ? '#ffffff' : '#879bd3'}
                      style={{ pointerEvents: 'none' }}
                    >
                      0{i + 1}
                    </text>
                    <text
                      x={x} y={y + (y < C ? -26 : 34)}
                      textAnchor="middle"
                      fontSize="12.5"
                      fontWeight="600"
                      fill={isActive ? '#1a1f3a' : '#879bd3'}
                      style={{ pointerEvents: 'none', transition: 'fill 240ms ease' }}
                    >
                      {s.verb}
                    </text>
                  </g>
                );
              })}

              {/* Loop-closure cue, lit only once Return is reached */}
              <text
                x={C} y={C + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#5265b0"
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
