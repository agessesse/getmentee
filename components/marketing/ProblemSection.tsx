'use client';

import { useState } from 'react';

const SIDES = [
  {
    id: 'student',
    who: 'Student',
    line: 'I don’t know who to ask.',
    detail:
      'Finding a name is easy. Knowing what to ask, and how to turn one reply into an ongoing relationship, is not.',
  },
  {
    id: 'professional',
    who: 'Professional',
    line: 'I want to help, but requests go nowhere.',
    detail:
      'Requests arrive with no context and no follow-up, so people who want to help end up doing nothing.',
  },
] as const;

export default function ProblemSection() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section
      className="py-20 sm:py-24 px-6 lg:px-10 bg-white border-t border-gray-100"
      aria-labelledby="problem-heading"
    >
      <div className="max-w-4xl mx-auto">
        <h2
          id="problem-heading"
          className="font-serif text-purple-900 leading-[1.06] text-center mb-14 mx-auto max-w-2xl"
          style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
        >
          Right now, mentorship<br className="hidden sm:block" /> mostly depends on luck.
        </h2>

        {/* Two failing sides, converging */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {SIDES.map((side) => {
            const isOpen = open === side.id;
            return (
              <button
                key={side.id}
                // A tap fires pointerenter and then click. When click toggled,
                // the two cancelled each other and the detail was unreachable
                // on touch. Hover is a mouse affordance; opening is the only
                // thing either gesture should do, and opening one closes the
                // other.
                onClick={() => setOpen(side.id)}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') setOpen(side.id); }}
                aria-expanded={isOpen}
                className={`text-left rounded-2xl border p-6 sm:p-7 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  isOpen
                    ? 'border-purple-300 bg-purple-50/40 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-[0.18em] mb-3">
                  {side.who}
                </p>
                <p className="font-serif text-purple-900 text-[21px] sm:text-[24px] leading-snug">
                  “{side.line}”
                </p>
                {/* Grid-rows trick animates height without measuring anything */}
                <div
                  className="grid transition-all duration-300 ease-out"
                  style={{
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    opacity: isOpen ? 1 : 0,
                    marginTop: isOpen ? 14 : 0,
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="text-gray-500 text-[15px] leading-relaxed">
                      {side.detail}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Convergence */}
        <div className="flex flex-col items-center mt-10" aria-hidden="true">
          <div className="w-px h-8 bg-gradient-to-b from-gray-200 to-gray-300" />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] py-2.5">
            Luck
          </p>
          <div className="w-px h-8 bg-gradient-to-b from-gray-300 to-purple-900" />
        </div>

        <p className="text-center font-serif text-purple-900 text-[26px] sm:text-[30px] mt-3">
          Mentable
        </p>
        <p className="text-center text-gray-500 font-light text-[15px] mt-2.5 max-w-sm mx-auto leading-relaxed">
          Mentable replaces the luck with a process.
        </p>
      </div>
    </section>
  );
}
