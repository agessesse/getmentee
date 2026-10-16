'use client';

import { useState } from 'react';
import Rise from '@/components/marketing/Rise';

/**
 * One engine, any community.
 *
 * The section that says how big the company is, without a wall of text
 * per vertical. Five tabs, one sentence each, and the relationship itself
 * as the headline — because "Student ↔ Alumni" communicates the product
 * faster than a paragraph about higher education.
 *
 * Tabs rather than five stacked sections: the point is that these are the
 * SAME product, and stacking them would say the opposite.
 */

const USES = [
  {
    key: 'universities', tab: 'Universities',
    pair: ['Student', 'Alumni'],
    line: 'Turn an alumni directory into relationships a student can actually use.',
    scale: 'A 300,000-person alumni network is only as useful as the handful a student can find.',
  },
  {
    key: 'companies', tab: 'Companies',
    pair: ['Intern', 'Employee'],
    line: 'Connect new talent with the people who can help them navigate the place.',
    scale: 'The person who would help most usually sits two teams away and never hears about it.',
  },
  {
    key: 'veterans', tab: 'Veteran networks',
    pair: ['Transitioning', 'Experienced veteran'],
    line: 'Match someone leaving service with a person who has already made the move.',
    scale: 'The path out is specific, and so is the person who has walked it.',
  },
  {
    key: 'associations', tab: 'Associations',
    pair: ['Member', 'Member'],
    line: 'Turn a membership directory into a professional network that works both ways.',
    scale: 'Members join for access and are handed a searchable list.',
  },
  {
    key: 'startups', tab: 'Startup ecosystems',
    pair: ['Founder', 'Advisor'],
    line: 'Connect builders with operators who have solved the problem in front of them.',
    scale: 'Every accelerator keeps the real matching in somebody’s head.',
  },
];

export default function OneEngine() {
  const [active, setActive] = useState(0);
  const use = USES[active];

  return (
    <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="engine-heading">
      <div className="max-w-5xl mx-auto">
        <Rise kind="statement">
          <h2
            id="engine-heading"
            className="font-display text-halo-ink leading-[1.05] mb-3 max-w-xl"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)' }}
          >
            One engine. Any community.
          </h2>
          <p className="text-[16px] text-halo-heather leading-relaxed max-w-md mb-8">
            The same system, pointed at whoever an organization already has.
          </p>
        </Rise>

        {/* Horizontal scroll rather than wrap: five tabs on a phone should
            stay one row you can push, not three rows that reflow. */}
        <div
          role="tablist"
          aria-label="Communities"
          className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {USES.map((u, i) => (
            <button
              key={u.key}
              role="tab"
              aria-selected={i === active}
              aria-controls="engine-panel"
              onClick={() => setActive(i)}
              className={`flex-none rounded-xl border px-4 py-2 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple ${
                i === active
                  ? 'border-halo-brand-line bg-halo-veil text-halo-ink font-medium'
                  : 'border-halo-rule text-halo-heather hover:text-halo-ink'
              }`}
            >
              {u.tab}
            </button>
          ))}
        </div>

        <div
          id="engine-panel"
          role="tabpanel"
          className="mt-6 rounded-2xl border border-halo-rule bg-white p-6 sm:p-8"
        >
          <p className="font-display text-halo-ink leading-tight flex flex-wrap items-center gap-x-3 gap-y-1"
             style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
            {use.pair[0]}
            <span className="text-halo-brand-line" aria-hidden="true">↔</span>
            {use.pair[1]}
          </p>
          <p className="text-[16px] text-halo-ink leading-relaxed mt-4 max-w-lg">{use.line}</p>
          <p className="text-[14px] text-halo-heather leading-relaxed mt-2 max-w-lg">{use.scale}</p>
        </div>
      </div>
    </section>
  );
}
