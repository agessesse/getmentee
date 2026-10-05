'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { navFor, isNavItemActive } from '@/lib/app-nav';

/**
 * Mobile navigation.
 *
 * Mobile is not a narrow desktop here. A student is the likeliest person on
 * this product to only ever open it on a phone, and the previous answer was a
 * hamburger drawer: four taps and an animation to reach a destination that
 * should cost one. Four items is exactly what a bottom bar holds comfortably,
 * which is not a coincidence, it is the constraint that keeps the information
 * architecture honest.
 *
 * Three details that decide whether this feels native or ported:
 *
 *   safe-area-inset-bottom   so the bar clears the home indicator instead of
 *                            sitting under it
 *   min-h-[44px] targets     the smallest comfortable tap target
 *   no labels hidden         an icon-only bar is a guessing game, and these
 *                            four words are short enough to always fit
 *
 * The companion rule lives on <main>, which carries bottom padding of the
 * bar's height plus the inset so the last line of every page can be read.
 */
export default function BottomNav({ role }: { role: 'mentor' | 'mentee' }) {
  const pathname = usePathname() ?? '';
  const items = navFor(role);

  return (
    <nav
      aria-label="Main"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-halo-ivory/95 backdrop-blur-md border-t border-halo-rule"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch">
        {items.map((item) => {
          const { href, icon: Icon, label } = item;
          const active = isNavItemActive(item, pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className="group relative flex min-h-[44px] flex-col items-center justify-center gap-1 px-1 pt-2 pb-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-halo-purple"
              >
                {/* The indicator sits on the top edge, mirroring the vertical
                    rule the desktop nav puts on the left edge, so the two
                    read as the same product. Same 3:1 brand-line token. */}
                <span
                  aria-hidden="true"
                  className={clsx(
                    'absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full bg-halo-brand-line transition-transform duration-300 ease-[cubic-bezier(.65,0,.35,1)]',
                    active ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
                <Icon
                  className={clsx(
                    'h-[18px] w-[18px] flex-none transition-colors',
                    active ? 'text-halo-brand-text' : 'text-halo-mist-strong',
                  )}
                />
                <span
                  className={clsx(
                    'text-[10.5px] leading-none tracking-tight transition-colors',
                    active ? 'font-semibold text-halo-ink' : 'font-medium text-halo-heather',
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
