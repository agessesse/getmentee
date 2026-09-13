'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Only areas that are actually backed by data. No placeholder pages.
const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/mentorships', label: 'Mentorships' },
  { href: '/admin/reports', label: 'Reports' },
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
        const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={`flex-none px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-t ${
              active
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-gray-600 hover:text-navy-900'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
