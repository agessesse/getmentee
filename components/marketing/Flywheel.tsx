'use client';

import { useState } from 'react';

const STAGES = [
  {
    id: 'learn',
    verb: 'Learn',
    line: 'Ask better questions.',
    detail:
      'You find someone who has already made the decisions you are facing, and you come prepared enough to make the conversation worth their time.',
  },
  {
    id: 'apply',
    verb: 'Apply',
    line: 'Act on the answer.',
    detail:
      'Advice becomes valuable the moment you use it. Goals, action items, and follow-ups turn a good conversation into actual movement.',
  },
  {
    id: 'grow',
    verb: 'Grow',
    line: 'Build a track record.',
    detail:
      'Progress compounds. The person you are two years in has context, judgment, and a network that the person you are today does not.',
  },
  {
    id: 'return',
    verb: 'Return',
    line: 'Become worth learning from.',
    detail:
      'Eventually you are the one who has walked the path. The students behind you need exactly what you once needed.',
  },
] as const;

export default function Flywheel() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active];

  return (
    <section
      className="py-20 sm:py-24 px-6 lg:px-10 bg-navy-900"
      aria-labelledby="flywheel-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.1fr] gap-14 lg:gap-20 items-center">

          {/* Left: framing */}
          <div>
            <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-5">
              What mentorship creates
            </p>
            <h2
              id="flywheel-heading"
              className="font-serif text-white leading-[1.05] mb-6"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}
            >
              It doesn&apos;t end<br />with you.
            </h2>
            <p className="text-navy-300 font-light leading-relaxed text-[15px] max-w-md mb-8">
              Mentorship is not a transaction that closes. The student who was
              given time and honesty becomes the professional who gives it.
              That is the whole engine.
            </p>

            {/* Active stage detail */}
            <div className="border-l-2 border-navy-600 pl-5 min-h-[104px]">
              <p className="text-white font-semibold text-sm mb-1.5">
                {stage.verb} — <span className="text-navy-300 font-normal">{stage.line}</span>
              </p>
              <p className="text-navy-400 font-light text-[13.5px] leading-relaxed">
                {stage.detail}
              </p>
            </div>
          </div>

          {/* Right: the cycle */}
          <div>
            <ol className="relative" role="list">
              {STAGES.map((s, i) => {
                const isActive = i === active;
                const isLast = i === STAGES.length - 1;
                return (
                  <li key={s.id} className="relative">
                    {/* Connector — dashed on the final wrap-around to read as a loop */}
                    <div
                      className={`absolute left-[19px] top-10 w-px ${
                        isLast
                          ? 'border-l border-dashed border-navy-700'
                          : 'bg-navy-700'
                      }`}
                      style={{ height: 'calc(100% - 8px)' }}
                      aria-hidden="true"
                    />
                    <button
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onClick={() => setActive(i)}
                      aria-current={isActive ? 'step' : undefined}
                      className="group relative w-full text-left flex items-start gap-5 pb-7 focus-visible:outline-none"
                    >
                      <span
                        className={`relative z-10 w-10 h-10 rounded-full flex-none flex items-center justify-center border transition-colors duration-300 ${
                          isActive
                            ? 'bg-white border-white'
                            : 'bg-navy-900 border-navy-700 group-hover:border-navy-500'
                        }`}
                      >
                        <span
                          className={`text-[11px] font-bold tabular-nums transition-colors duration-300 ${
                            isActive ? 'text-navy-900' : 'text-navy-400'
                          }`}
                        >
                          0{i + 1}
                        </span>
                      </span>
                      <span className="pt-1.5">
                        <span
                          className={`block font-serif leading-none transition-colors duration-300 ${
                            isActive ? 'text-white' : 'text-navy-500 group-hover:text-navy-300'
                          }`}
                          style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.3rem)' }}
                        >
                          {s.verb}
                        </span>
                        <span
                          className={`block text-[12.5px] font-light mt-1.5 transition-colors duration-300 ${
                            isActive ? 'text-navy-300' : 'text-navy-600'
                          }`}
                        >
                          {s.line}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* Loop-closing note */}
            <p className="text-[11px] text-navy-600 font-light pl-[60px] -mt-2">
              …and the cycle starts again, one person further along.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
