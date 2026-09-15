'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Wordmark from '@/components/ui/Wordmark';
import { MARKETING_PAGES } from '@/components/marketing/marketing-links';
import { trackLandingEvent } from '@/lib/landing-analytics';

// Mirrors the page spine: who teaches, who learns, how it works, what you get,
// and the fund. The Problem, Trajectory and Flywheel sections are deliberately
// absent — they are arguments you read past, not destinations you navigate to.
const LINKS = [
  { href: '#mentor-carousel-heading', label: 'Mentors' },
  { href: '#mentees-heading', label: 'Students' },
  { href: '#product-demo-heading', label: 'How it works' },
  { href: '#outcomes-heading', label: 'Outcomes' },
  { href: '#fund-heading', label: 'Opportunity Fund' },
];

export default function LandingNav() {
  const pathname = usePathname();
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Escape closes the mobile menu and returns focus to the trigger.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

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
          ? 'h-14 bg-halo-ivory/85 backdrop-blur-md border-halo-rule/70 shadow-sm'
          : 'h-16 bg-halo-ivory/90 backdrop-blur-sm border-halo-rule/80'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-10 h-full flex items-center justify-between">
        <Link href="/" className="py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded">
          <Wordmark size={condensed ? 'sm' : 'md'} className="text-halo-ink transition-all duration-300" />
        </Link>

        <div className="flex items-center gap-6 lg:gap-7">
          {/*
            These were hidden on arrival: opacity 0, pointer-events none,
            aria-hidden, tabIndex -1, revealed only after an IntersectionObserver
            saw you scroll past an 80px sentinel. Below 1024px they never
            appeared at all and there was no hamburger, so phones had no section
            navigation whatsoever. They are now visible immediately at every
            width; `condensed` still drives the height and wordmark shrink,
            which is what it is actually good at.
          */}
          {/*
            Two link groups, which is why they break at different widths.

            MARKETING_PAGES are destinations and appear from md up. LINKS are
            anchors into this page's own sections and return at xl, where the
            row has the width for both. Between 768 and 1279 the section
            anchors stand down rather than the page nav, because a link that
            leaves the page is worth more to a stranger than a link that scrolls
            it. Below md both live in the sheet.
          */}
          <div className="hidden md:flex items-center gap-5 lg:gap-6">
            {MARKETING_PAGES.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? 'page' : undefined}
                className="text-[14px] text-halo-heather hover:text-halo-ink transition-colors font-medium py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden xl:flex items-center gap-5 lg:gap-6">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[14px] text-halo-heather hover:text-halo-ink transition-colors font-medium py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Below md the section links do not fit inline, so they live behind
              a standard disclosure rather than being dropped entirely. */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="landing-nav-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 text-halo-ink rounded-xl hover:bg-halo-lav-wash transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
          >
            {menuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>

          <Link
            href="/login"
            className="text-sm text-halo-mist-body hover:text-halo-ink transition-colors font-medium py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'nav_get_started' })}
            className="bg-halo-purple text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-halo-purple-d active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
          >
            Get started
          </Link>
        </div>
      </div>

      {menuOpen && (
        <div
          id="landing-nav-menu"
          // Was bg-halo-ivory/95 + backdrop-blur. At 95% the hero's large serif headline
          // read straight through the panel as grey ghost lettering behind every
          // link. This is a sheet, not a glass bar: the translucency bought nothing
          // and cost legibility.
          className="md:hidden border-t border-halo-rule/70 bg-halo-ivory shadow-lg"
        >
          <ul className="max-w-6xl mx-auto px-6 py-2">
            {MARKETING_PAGES.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={pathname === l.href ? 'page' : undefined}
                  className="block py-3 text-[15px] font-medium text-halo-ink border-b border-halo-rule focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {/* Divider: destinations above, this page's own sections below. */}
            <li aria-hidden="true" className="h-2" />
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-[15px] font-medium text-halo-ink border-b border-halo-rule last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
