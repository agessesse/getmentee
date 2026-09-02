'use client';

import { useState } from 'react';

const TABS = [
  {
    id: 'mentees',
    label: 'For mentees',
    eyebrow: 'Mentee discovery',
    heading: 'Find someone who has already walked your path.',
    body: "Mentee surfaces mentors based on your specific goals, industry, and career stage — and tells you exactly why each one is relevant. Your first message isn't cold. It's informed.",
    bullets: [
      'Match on goals, industry, school, and career stage',
      'See a clear explanation of why each mentor fits',
      'Save mentors you want to revisit',
      'Track goals and action items across sessions',
    ],
  },
  {
    id: 'mentors',
    label: 'For mentors',
    eyebrow: 'Mentor experience',
    heading: "Invest your experience in someone's future.",
    body: 'Mentee makes it structured and low-friction to give back. Set your availability, review requests that match your focus areas, and build relationships that are worth your time.',
    bullets: [
      'Review mentee requests with full context on their goals',
      'Schedule and manage sessions in one place',
      'Define what you can help with — and what you can\'t',
      "Build a record of mentees whose trajectories you've shaped",
    ],
  },
  {
    id: 'platform',
    label: 'The platform',
    eyebrow: 'Built for outcomes',
    heading: 'Not a directory. Not a marketplace.',
    body: 'Mentee provides the infrastructure for real mentorship relationships — from the first message through the long term. Every feature is built to deepen the connection, not just initiate it.',
    bullets: [
      'Intelligent matching with explained reasoning',
      'Structured session tools with notes and action items',
      'Scheduling built around mentor availability',
      'An Opportunity Fund for mentees who need it most',
    ],
  },
];

export default function TabsSection() {
  const [active, setActive] = useState('mentees');
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <section className="py-20 px-6 lg:px-10 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">

        {/* Tab nav */}
        <div className="flex border-b border-gray-100 mb-14 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex-none px-6 py-3 text-[13px] font-medium transition-colors relative whitespace-nowrap ${
                active === t.id
                  ? 'text-navy-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
              {active === t.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-navy-900 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-6">
              {tab.eyebrow}
            </p>
            <h2
              className="font-bold text-navy-900 leading-tight mb-6"
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)' }}
            >
              {tab.heading}
            </h2>
            <p className="text-gray-500 font-light leading-relaxed text-[15px]">
              {tab.body}
            </p>
          </div>

          <div className="pt-1">
            <ul className="space-y-5">
              {tab.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-5">
                  <span
                    className="text-[10px] font-bold text-navy-300 flex-none mt-1 tabular-nums select-none"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[15px] text-gray-700 font-light leading-snug">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
