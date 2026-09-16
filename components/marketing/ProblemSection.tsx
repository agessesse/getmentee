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
      className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule"
      aria-labelledby="problem-heading"
    >
      <div className="max-w-4xl mx-auto">
        <h2
          id="problem-heading"
          className="font-display text-halo-ink leading-[1.06] text-center mb-14 mx-auto max-w-2xl"
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
                onClick={() => setOpen(isOpen ? null : side.id)}
                onPointerEnter={() => setOpen(side.id)}
                aria-expanded={isOpen}
                className={`text-left rounded-xl border p-6 sm:p-7 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple ${
                  isOpen
                    ? 'border-halo-purple bg-halo-lav-wash shadow-sm'
                    : 'border-halo-rule bg-white hover:border-halo-purple/40'
                }`}
              >
                <p className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.12em] mb-3">
                  {side.who}
                </p>
                <p className="font-display text-halo-ink text-[21px] sm:text-[24px] leading-snug">
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
                    <p className="text-halo-mist-body text-[15px] leading-relaxed">
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
          <p className="font-ui text-[10px] font-bold text-halo-mist-body uppercase tracking-[0.16em] py-2.5">
            Luck
          </p>
          <div className="w-px h-8 bg-gradient-to-b from-halo-rule to-halo-ink" />
        </div>

        <p className="text-center font-display text-halo-ink text-[26px] sm:text-[30px] mt-3">
          Mentable
        </p>
        <p className="text-center text-halo-mist-body font-light text-[15px] mt-2.5 max-w-sm mx-auto leading-relaxed">
          Mentable replaces the luck with a process.
        </p>
      </div>
    </section>
  );
}
