import Link from 'next/link';
import Logo from '@/components/brand/Logo';

const COLUMNS = [
  {
    heading: 'Explore',
    links: [
      { href: '/mentee', label: 'For students' },
      { href: '/mentor', label: 'For mentors' },
      { href: '/about', label: 'About' },
    ],
  },
  {
    heading: 'Get started',
    links: [
      { href: '/signup?role=mentee', label: 'Find a mentor' },
      { href: '/signup?role=mentor', label: 'Become a mentor' },
      { href: '/login', label: 'Sign in' },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="bg-purple-950 text-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr,1fr,1fr] gap-12 md:gap-10">
          <div>
            {/* Reversed lockup: the only correct variant on a dark ground. */}
            <Logo variant="lockup" tone="reversed" height={30} />
            <p className="text-purple-200/75 font-light mt-5 max-w-xs text-[15px] leading-relaxed">
              Mentorship should not depend on luck.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-300 mb-4">
                {col.heading}
              </p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="tap-target text-[15px] text-purple-100/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-sm"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-7 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-purple-300/70">
            &copy; {new Date().getFullYear()} Mentable. All rights reserved.
          </p>
          <p className="text-sm text-purple-300/70">Chapel Hill, North Carolina</p>
        </div>
      </div>
    </footer>
  );
}
