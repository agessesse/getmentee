'use client';

import { useState } from 'react';
import { companyFaviconUrl, schoolFaviconUrl } from '@/lib/logos';

// Every entry is an employer or institution that appears on a real mentor or
// student record in data/mentors.ts and data/people.ts. This is not an
// endorsement claim — the heading states what it represents.
// A long list matters: with only a handful, the marquee visibly repeats
// itself within a single viewport and reads as filler.
const AFFILIATIONS = [
  'Wells Fargo',
  'Morgan Stanley',
  'Goldman Sachs',
  'J.P. Morgan',
  'Bank of America',
  'UNC Kenan-Flagler',
  'SMBC',
  'Duke University',
  'Fifth Third Securities',
  'Columbia University',
  'UC Berkeley',
  'Georgetown University',
  'Envoy Capital Advisors',
  'University of Pennsylvania',
  'Bondway.ai',
];

function Affiliation({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const url = companyFaviconUrl(name) ?? schoolFaviconUrl(name);

  return (
    <span className="flex-none flex items-center gap-2.5 px-7">
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          width={20}
          height={20}
          loading="lazy"
          className="h-5 w-5 object-contain opacity-70"
          onError={() => setFailed(true)}
        />
      ) : null}
      <span className="text-[12px] font-medium text-gray-500 tracking-wide whitespace-nowrap">
        {name}
      </span>
    </span>
  );
}

export default function CredibilityRail() {
  return (
    <div className="py-9 border-y border-gray-100 bg-white overflow-hidden">
      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-[0.28em] text-center mb-6 px-6">
        People on Mentable have studied and worked at
      </p>

      {/* Drifts right, against the mentor carousel above it, for visual rhythm */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-white to-transparent" />
        <div
          className="flex items-center animate-rail-right"
          style={{ width: 'max-content' }}
          aria-hidden="true"
        >
          {[...AFFILIATIONS, ...AFFILIATIONS].map((name, i) => (
            <Affiliation key={`${name}-${i}`} name={name} />
          ))}
        </div>
      </div>

      {/* Static, readable equivalent for screen readers and reduced motion */}
      <p className="sr-only">
        Institutions that people on Mentable have studied or worked at:
        {AFFILIATIONS.join(', ')}. Not endorsements of Mentable.
      </p>
    </div>
  );
}
