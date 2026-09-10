'use client';

import { useState } from 'react';
import { companyFaviconUrl, schoolFaviconUrl } from '@/lib/logos';

const FIRMS = [
  'Wells Fargo',
  'Morgan Stanley',
  'SMBC',
  'Fifth Third Securities',
  'Bondway.ai',
  'Keane Capital Management',
  'MyEyeDr.',
  'Engineered Land Solutions',
  'UNC Kenan-Flagler',
  'Wall Street Oasis',
  'Beds for Kids',
];

function firmLogoUrl(name: string): string | null {
  return companyFaviconUrl(name) ?? schoolFaviconUrl(name);
}

const doubled = [...FIRMS, ...FIRMS];

function FirmLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const url = firmLogoUrl(name);

  if (!url || failed) {
    return (
      <span className="text-[11px] font-medium text-gray-400 tracking-wide select-none whitespace-nowrap">
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
      className="h-6 w-6 object-contain grayscale opacity-50 flex-none"
      onError={() => setFailed(true)}
    />
  );
}

export default function FirmMarquee() {
  return (
    <div className="py-7 border-y border-gray-100 bg-white">
      <p className="text-[9px] font-semibold text-gray-300 uppercase tracking-[0.32em] text-center mb-5 select-none">
        Where Our Mentors Have Worked
      </p>
      <div className="overflow-hidden">
        <div
          className="flex items-center animate-carousel-left"
          style={{ width: 'max-content' }}
        >
          {doubled.map((firm, i) => (
            <span
              key={i}
              className="flex-none flex items-center px-8"
            >
              <FirmLogo name={firm} />
              <span className="ml-8 text-gray-200 select-none" aria-hidden="true">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
