'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Wordmark from '@/components/ui/Wordmark';
import { MARKETING_PAGES } from '@/components/marketing/marketing-links';

/**
 * Header for the authentication routes.
 *
 * TWO PROBLEMS THIS FIXES.
 *
 * 1. The wordmark jumped left on the way in. The auth nav was padded `px-6` at
 *    every width while SiteHeader is `px-6 lg:px-10`, so from 1024px up the
 *    same word sat 16px further left the moment you clicked Sign in. The
 *    container, the padding and the Wordmark component are now identical to
 *    SiteHeader's, so the word does not move. The nav was also `fixed` where
 *    SiteHeader is `sticky`, which is the second half of the same bug: a fixed
 *    bar sits over the scrollbar gutter, so on any platform with classic
 *    scrollbars the centred container shifted again between a scrolling
 *    marketing page and a short login page. Sticky removes that.
 *
 * 2. Authentication felt like a different website. There was one link, the
 *    wordmark, and no way to reach anything. This carries the same three
 *    marketing pages the public header does, plus the auth action you are not
 *    currently on, so signing in is somewhere you can arrive at and leave from.
 *
 * SiteHeader is not reused directly: its right-hand side is Sign in and Get
 * started, and on /login the first of those is a link to the page you are
 * already reading. The disclosure below is deliberately the same interaction
 * SiteHeader uses, so the two headers behave identically on a phone even though
 * they hold different actions.
 */
export default function AuthHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // The action you are not currently performing. On forgot-password neither
  // page is "current", so signing in is the useful way out.
  const onSignup = pathname?.startsWith('/signup') || pathname?.startsWith('/apply');
  const altAction = onSignup
    ? { href: '/login', label: 'Sign in' }
    : { href: '/apply', label: 'Apply' };

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
            aria-controls="auth-header-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 -ml-1 text-halo-ink rounded-xl hover:bg-halo-lav-wash transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
          >
            {menuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>

          <Link
            href={altAction.href}
            className="text-sm text-halo-heather hover:text-halo-ink transition-colors font-medium py-3 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
          >
            {altAction.label}
          </Link>
        </div>
      </div>

      {menuOpen && (
        <div id="auth-header-menu" className="md:hidden border-t border-halo-rule/70 bg-halo-ivory shadow-lg">
          <ul className="max-w-6xl mx-auto px-6 py-2">
            {MARKETING_PAGES.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-[15px] font-medium text-halo-ink border-b border-halo-rule focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={altAction.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-[15px] font-medium text-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
              >
                {altAction.label}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
