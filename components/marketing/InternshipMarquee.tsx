'use client';

import { useState } from 'react';
import { companyFaviconUrl } from '@/lib/logos';

// Firms backed by actual mentee experience data in SOURCED_NEAR_PEERS.
// Goldman Sachs: Teagan Fitzgerald
// J.P. Morgan: Jaden Small (Fixed Income Treasury + Securitized Products), Erick Angwenyi (Global Markets), Bethlehem Agegne (JPMorganChase)
// Wells Fargo: Abel Gessesse (Fixed Income Strategy), Hugo Canseco (CIB Markets)
// Bank of America: Eliphaz Getachew
const FIRMS = [
  'Goldman Sachs',
  'J.P. Morgan',
  'Wells Fargo',
  'Bank of America',
];

const doubled = [...FIRMS, ...FIRMS];

function FirmLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const url = companyFaviconUrl(name);

  if (!url || failed) {
    return (
      <span className="text-[11px] font-medium text-gray-500 tracking-wide select-none whitespace-nowrap">
        {name}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      title={name}
      width={24}
      height={24}
      className="h-6 w-6 object-contain opacity-80 flex-none"
      onError={() => setFailed(true)}
    />
  );
}

export default function InternshipMarquee() {
  return (
    <div className="py-8 border-b border-gray-100 bg-white">
      <p className="text-[9px] font-semibold text-gray-300 uppercase tracking-[0.32em] text-center mb-5 select-none">
        Where Our Mentees Have Interned
      </p>
      <div className="overflow-hidden">
        <div
          className="flex items-center animate-carousel-left"
          style={{ width: 'max-content', animationDuration: '32s' }}
        >
          {doubled.map((firm, i) => (
            <span key={i} className="flex-none flex items-center px-10">
              <FirmLogo name={firm} />
              <span className="ml-10 text-gray-200 select-none" aria-hidden="true">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
