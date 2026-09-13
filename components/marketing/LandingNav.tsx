'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Wordmark from '@/components/ui/Wordmark';
import { trackLandingEvent } from '@/lib/landing-analytics';

const LINKS = [
  { href: '#mentor-carousel-heading', label: 'Mentors' },
  { href: '#product-demo-heading', label: 'How it works' },
  { href: '#fund-heading', label: 'Opportunity Fund' },
];

export default function LandingNav() {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    // A sentinel at the top of the page is cheaper and smoother than a
    // scroll listener, and never fires layout reads on the main thread.
    const sentinel = document.getElementById('nav-sentinel');
    if (!sentinel) return;
    const io = new IntersectionObserver(
      ([entry]) => setCondensed(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        condensed
          ? 'h-14 bg-cream-50/85 backdrop-blur-md border-gray-200/70 shadow-sm'
          : 'h-16 bg-cream-50/90 backdrop-blur-sm border-gray-100/80'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-10 h-full flex items-center justify-between">
        <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded">
          <Wordmark size={condensed ? 'sm' : 'md'} className="text-navy-900 transition-all duration-300" />
        </Link>

        <div className="flex items-center gap-6 lg:gap-7">
          <div
            className="hidden lg:flex items-center gap-6 transition-opacity duration-300"
            style={{ opacity: condensed ? 1 : 0, pointerEvents: condensed ? 'auto' : 'none' }}
            aria-hidden={!condensed}
          >
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                tabIndex={condensed ? 0 : -1}
                className="text-[13px] text-gray-500 hover:text-navy-900 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
              >
                {l.label}
              </a>
            ))}
          </div>

          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-navy-900 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'nav_get_started' })}
            className="bg-navy-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy-800 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}
