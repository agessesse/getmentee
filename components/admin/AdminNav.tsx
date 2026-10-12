'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Only areas that are actually backed by data. No placeholder pages.
const TABS = [
  { href: '/admin', label: 'Overview' },
  // First after Overview: the cohort is the thing the company is currently
  // trying to prove, so it is where an operator should land.
  // Assembling comes before running: build the cohort, then watch it.
  { href: '/admin/cohort/pipeline', label: 'Pipeline' },
  { href: '/admin/cohort', label: 'Cohort' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/mentorships', label: 'Mentorships' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/inquiries', label: 'Inquiries' },
  { href: '/admin/feedback', label: 'Feedback' },
  { href: '/admin/analytics', label: 'Analytics' },
] as const;

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="px-4 sm:px-6 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {TABS.map((t) => {
        /*
          LONGEST MATCH WINS. A plain startsWith lit both Pipeline and
          Cohort on /admin/cohort/pipeline, because one href is a prefix of
          the other. Two current tabs is worse than none: it tells the
          operator the navigation does not know where they are.
        */
        const best = TABS
          .filter((x) => (x.href === '/admin' ? pathname === '/admin' : pathname.startsWith(x.href)))
          .sort((a, b) => b.href.length - a.href.length)[0];
        const active = best?.href === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={`flex-none px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded-t ${
              active
                ? 'border-halo-purple text-halo-ink'
                : 'border-transparent text-halo-heather hover:text-halo-ink'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
