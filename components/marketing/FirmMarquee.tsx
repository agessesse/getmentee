'use client';

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

const doubled = [...FIRMS, ...FIRMS];

export default function FirmMarquee() {
  return (
    <div className="py-7 border-y border-gray-100 bg-white overflow-hidden">
      <p className="text-[9px] font-semibold text-gray-300 uppercase tracking-[0.32em] text-center mb-4 select-none">
        Where our mentors have built careers
      </p>
      <div className="overflow-hidden">
        <div
          className="flex animate-carousel-left"
          style={{ width: 'max-content' }}
        >
          {doubled.map((firm, i) => (
            <span
              key={i}
              className="flex-none text-[12px] font-medium text-gray-400 tracking-wide px-8 select-none"
            >
              {firm}
              <span className="ml-8 text-gray-200" aria-hidden="true">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
