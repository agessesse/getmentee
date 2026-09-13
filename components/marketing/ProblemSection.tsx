'use client';

import { useState } from 'react';

const SIDES = [
  {
    id: 'student',
    who: 'Student',
    line: 'I don’t know who to ask.',
    detail:
      'Finding the name is easy. Knowing what to ask — and how to turn one reply into a relationship — is not.',
  },
  {
    id: 'professional',
    who: 'Professional',
    line: 'I want to help, but requests go nowhere.',
    detail:
      'Messages arrive with no context and no follow-through, so good intentions quietly decay.',
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
          className="font-serif text-navy-900 leading-[1.06] text-center mb-14 mx-auto max-w-2xl"
          style={{ fontSize: 'clamp(2.1rem, 5vw, 3.4rem)' }}
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
                onClick={() => setOpen(isOpen ? null : side.id)}
                onPointerEnter={() => setOpen(side.id)}
                aria-expanded={isOpen}
                className={`text-left rounded-2xl border p-6 sm:p-7 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 ${
                  isOpen
                    ? 'border-navy-300 bg-navy-50/40 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-[0.2em] mb-3">
                  {side.who}
                </p>
                <p className="font-serif text-navy-900 text-[21px] sm:text-[23px] leading-snug">
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
                    <p className="text-gray-500 font-light text-[13.5px] leading-relaxed">
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
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] py-2.5">
            Luck
          </p>
          <div className="w-px h-8 bg-gradient-to-b from-gray-300 to-navy-900" />
        </div>

        <p className="text-center font-serif text-navy-900 text-[26px] sm:text-[30px] mt-3">
          Mentable
        </p>
        <p className="text-center text-gray-500 font-light text-[14.5px] mt-2.5 max-w-sm mx-auto leading-relaxed">
          Both sides, connected on purpose — with somewhere to go next.
        </p>
      </div>
    </section>
  );
}
