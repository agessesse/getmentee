'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Wordmark from '@/components/ui/Wordmark';
import { MARKETING_PAGES } from '@/components/marketing/marketing-links';

/**
 * The one public header. Every public page now renders this and only this.
 *
 * WHAT WAS WRONG. There were two headers. The home page used LandingNav, which
 * was `fixed`, condensed from 64px to 56px once you scrolled past a sentinel,
 * and carried five in-page section anchors that appeared only from 1280px up.
 * Every other public page used a second component that was `sticky`, always
 * 64px, and carried three page links from 768px up. Neither named Home. So the
 * header changed height, changed position, changed contents and changed
 * breakpoint behaviour depending on which page you were reading, and links
 * genuinely did disappear. That is the whole of the reported problem.
 *
 * WHAT IT IS NOW. One height, one container, one position, one set of four
 * destinations, one mobile disclosure, on every public route. Nothing is
 * conditional on the page except which destination is marked current.
 *
 * HIERARCHY, in reading order. The wordmark anchors the product. The four
 * destinations explain the site and share one quiet weight. Sign in and Get
 * started are actions and sit past a wider gap, the second of them filled,
 * so six links do not read as six equal things.
 *
 * The five home-page section anchors are gone from the header. They were a
 * table of contents for one page living in the site's navigation, and they are
 * what made the header look different on Home.
 */
export default function SiteHeader() {
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

  // A route change while the sheet is open would leave it covering the new page.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isCurrent = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-40 bg-halo-ivory/95 backdrop-blur-sm border-b border-halo-rule">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="tap-target py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
        >
          <Wordmark size="md" className="text-halo-ink" />
        </Link>

        <div className="flex items-center gap-4 sm:gap-7">
          {/*
            Destinations. The active one is darker plus a two-pixel rule sitting
            on the header's own bottom border, so "where am I" is answered
            without a pill, a fill, or six things that look like buttons.
          */}
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-5 lg:gap-7">
              {MARKETING_PAGES.map((l) => {
                const current = isCurrent(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={current ? 'page' : undefined}
                      className={`relative inline-block text-[14px] font-medium py-[21px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded ${
                        current ? 'text-halo-ink' : 'text-halo-heather hover:text-halo-ink'
                      }`}
                    >
                      {l.label}
                      {current && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 right-0 -bottom-px h-[2px] bg-halo-purple rounded-full"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

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

          {/* Actions, past a wider gap than the destinations use. */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="hidden sm:inline-block text-sm text-halo-heather hover:text-halo-ink transition-colors font-medium py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
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
      </div>

      {/* Same four destinations and the same actions, on every route. */}
      {menuOpen && (
        <div id="site-header-menu" className="md:hidden border-t border-halo-rule/70 bg-halo-ivory shadow-lg">
          <ul className="max-w-6xl mx-auto px-6 py-2">
            {MARKETING_PAGES.map((l) => {
              const current = isCurrent(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={current ? 'page' : undefined}
                    className={`flex items-center gap-2.5 py-3 text-[15px] font-medium border-b border-halo-rule focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded ${
                      current ? 'text-halo-ink' : 'text-halo-heather'
                    }`}
                  >
                    {current && (
                      <span aria-hidden="true" className="w-[3px] h-4 rounded-full bg-halo-purple" />
                    )}
                    <span className={current ? '' : 'pl-[13px]'}>{l.label}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-[15px] font-medium text-halo-heather pl-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
              >
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
