'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { trackLandingEvent } from '@/lib/landing-analytics';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/mentee', label: 'Mentee' },
  { href: '/mentor', label: 'Mentor' },
  { href: '/about', label: 'About' },
];

export default function MarketingNav() {
  const pathname = usePathname();
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // A sentinel is cheaper than a scroll listener and never reads layout on
    // the main thread.
    const sentinel = document.getElementById('nav-sentinel');
    if (!sentinel) { setCondensed(true); return; }
    const io = new IntersectionObserver(([e]) => setCondensed(!e.isIntersecting), { threshold: 0 });
    io.observe(sentinel);
    return () => io.disconnect();
  }, [pathname]);

  // Close the mobile sheet on navigation, and lock the page behind it.
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[60] border-b transition-all duration-300 ${
          condensed
            ? 'h-14 bg-cream-50/85 backdrop-blur-md border-purple-100 shadow-[0_1px_16px_rgba(36,25,62,0.06)]'
            : 'h-16 bg-cream-50/90 backdrop-blur-sm border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 lg:px-10 h-full flex items-center justify-between gap-6">
          <Link
            href="/"
            aria-label="Mentable home"
            className="flex items-center shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50"
          >
            {/* 28px mobile, 32px desktop per the brand handoff. */}
            <span className="sm:hidden"><Logo height={26} priority /></span>
            <span className="hidden sm:block"><Logo height={30} priority /></span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? 'page' : undefined}
                className={`relative px-3.5 py-2 text-[14px] font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  isActive(l.href)
                    ? 'text-purple-900'
                    : 'text-purple-900/55 hover:text-purple-900'
                }`}
              >
                {l.label}
                {isActive(l.href) && (
                  <span className="absolute left-3.5 right-3.5 -bottom-px h-[2px] rounded-full bg-purple-700" />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-5 shrink-0">
            <Link
              href="/login"
              className="text-sm font-medium text-purple-900/60 hover:text-purple-900 transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'nav_get_started' })}
              className="bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-purple-800 active:scale-[0.98] transition-all shadow-[0_1px_2px_rgba(36,25,62,0.12)] hover:shadow-[0_8px_20px_rgba(71,23,202,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            >
              Get started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="md:hidden -mr-2 p-2.5 text-purple-900 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile sheet. Sits above the route-transition overlay so a tap that
          opens the menu is never hidden behind a brand wipe. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="md:hidden fixed inset-0 z-[90] bg-cream-50"
      >
        <div className="flex items-center justify-between h-16 px-6">
          <Logo height={26} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="-mr-2 p-2.5 text-purple-900 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pt-4 flex flex-col">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`py-4 border-b border-purple-100 font-serif text-[26px] leading-none transition-colors ${
                isActive(l.href) ? 'text-purple-700' : 'text-purple-900'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/signup"
              className="w-full text-center bg-purple-700 text-white font-semibold px-5 py-4 rounded-xl"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="w-full text-center text-purple-900 font-medium px-5 py-4 rounded-xl border border-purple-200"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
