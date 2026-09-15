'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Wordmark from '@/components/ui/Wordmark';
import { MARKETING_PAGES } from '@/components/marketing/marketing-links';

/**
 * Header for public pages that are not the landing page.
 *
 * LandingNav is not reusable here: its links are in-page anchors
 * (#mentor-carousel-heading and friends) which resolve to nothing anywhere
 * else, so a visitor would get a nav bar whose every item silently did nothing.
 * This keeps the two things a stranger on a profile page or a 404 actually
 * needs — a way home and a way in.
 *
 * It now also carries the marketing pages, which do resolve everywhere, so
 * /mentee, /mentor and /about are reachable from any public page rather than
 * from the home page alone. That required a client component and a disclosure:
 * three links plus the wordmark plus both auth actions do not fit on a 375px
 * row, and dropping them below md would leave phones with no page navigation
 * at all, which is the failure LandingNav's own comment describes.
 */
export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Escape closes the menu and returns focus to the trigger, matching LandingNav.
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

  // A route change while the sheet is open would otherwise leave it covering
  // the new page.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-halo-ivory/95 backdrop-blur-sm border-b border-halo-rule">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="tap-target py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
        >
          <Wordmark size="md" className="text-halo-ink" />
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
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

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="site-header-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 -ml-1 text-halo-ink rounded-xl hover:bg-halo-lav-wash transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
          >
            {menuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>

          <Link
            href="/login"
            className="text-sm text-halo-heather hover:text-halo-ink transition-colors font-medium py-3 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-halo-purple text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-halo-purple-d active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
          >
            Get started
          </Link>
        </div>
      </div>

      {menuOpen && (
        <div
          id="site-header-menu"
          className="md:hidden border-t border-halo-rule/70 bg-halo-ivory shadow-lg"
        >
          <ul className="max-w-6xl mx-auto px-6 py-2">
            {MARKETING_PAGES.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={pathname === l.href ? 'page' : undefined}
                  className="block py-3 text-[15px] font-medium text-halo-ink border-b border-halo-rule last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
