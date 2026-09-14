'use client';

import { useState } from 'react';
import { companyFaviconUrl, schoolFaviconUrl } from '@/lib/logos';

// Ordered strongest-first so the opening frames of the marquee carry the most
// recognisable names. Every entry is traceable to a specific person already in
// data/mentors.ts or data/people.ts; the attribution is recorded here so the
// claim stays auditable.
//
//   Wells Fargo        Christopher Floyd (MD, Co-Head IG Sales & Trading),
//                      Tiffany Lakey (Chief of Staff, CIB), Will Alston
//                      (Head of Corporate Banking), Hugo Canseco (incoming)
//   Bank of America    Eliphaz Getachew
//   J.P. Morgan        Jaden Small (Fixed Income Treasury Sales),
//                      Erick Angwenyi (Global Markets Fellow)
//   Goldman Sachs      Teagan Fitzgerald
//   Morgan Stanley     Christopher Floyd (prior)
//   UNC Kenan-Flagler  Travis Melvin, Frank L. Van Buren (MBA), several students
//   Duke               Jaden Small, Cooper Lipton
//   Columbia           Teagan Fitzgerald
//   UPenn              Christopher Floyd
//   UC Berkeley        Hugo Canseco (Haas)
//   Georgetown         Troy Keen Jr.
//   Minnesota          Eliphaz Getachew (Carlson)
//   New Hampshire      Erick Angwenyi
//   SMBC               Christopher Floyd (prior)
//   Fifth Third        Christopher Floyd (prior)
//
// Deliberately excluded: Bondway.ai and Envoy Capital Advisors are real
// affiliations but carry no recognition, and a marquee of unknown names reads
// as filler rather than proof.
const AFFILIATIONS = [
  // The track is duplicated and the animation starts at -50%, so the opening
  // frame straddles the seam between the end of one copy and the start of the
  // next. Strong names sit at BOTH ends so the first two seconds always read
  // as serious, whatever frame a visitor happens to arrive on.
  'Wells Fargo',
  'Bank of America',
  'J.P. Morgan',
  'Goldman Sachs',
  'Columbia University',
  'UC Berkeley',
  'University of Pennsylvania',
  'Georgetown University',
  'SMBC',
  'Fifth Third Securities',
  'University of Minnesota',
  'University of New Hampshire',
  'Duke University',
  'UNC Kenan-Flagler',
  'Morgan Stanley',
]

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
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.18em] text-center mb-6 px-6">
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
