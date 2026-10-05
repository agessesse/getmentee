'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { navFor, isNavItemActive } from '@/lib/app-nav';
import ProgramIdentity, { TenantNotice } from '@/components/app/ProgramIdentity';
import type { TenantIdentity } from '@/lib/theme/identity';

/**
 * Desktop navigation.
 *
 * Desktop only, and that is a change: this used to be an off-canvas drawer on
 * mobile behind a hamburger, which meant every destination on a phone cost a
 * tap to open, a read, a tap to choose and an animation. With four
 * destinations there is nothing to hide, so mobile gets BottomNav instead and
 * this panel simply is not rendered there.
 *
 * Still the ivory ground with a hairline rule rather than a dark slab, so
 * signing in reads as stepping further into the same site. Under a tenant
 * theme the ground becomes the institution's surface and the active rule its
 * identity colour, by CSS custom property: not one class in here changes.
 */
export default function SideNav({
  role,
  tenant,
  firstName,
  lastName,
}: {
  role: 'mentor' | 'mentee';
  tenant: TenantIdentity | null;
  firstName?: string;
  lastName?: string;
}) {
  const pathname = usePathname() ?? '';
  const items = navFor(role);

  return (
    <aside className="hidden lg:flex w-60 flex-none flex-col bg-halo-ivory border-r border-halo-rule">
      {/* Identity. Taller than the top bar when a programme is named, because
          three lines of hierarchy do not fit in 64px and squeezing them into
          it would flatten exactly the distinction the block exists to make. */}
      <div
        className={clsx(
          'flex items-center px-5 flex-none border-b border-halo-rule',
          tenant ? 'py-4' : 'h-16',
        )}
      >
        <Link
          href="/dashboard"
          className="block min-w-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
        >
          <ProgramIdentity tenant={tenant} />
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 px-3 pt-5 pb-2 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const { href, icon: Icon, label } = item;
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'group relative flex items-center gap-3 pl-4 pr-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple',
                active
                  ? 'bg-halo-veil text-halo-ink'
                  : 'text-halo-heather hover:bg-halo-veil/60 hover:text-halo-ink',
              )}
            >
              {/*
                The active indicator uses brand-line, not brand. A 2px mark on
                the ground has to clear 3:1 to be a signal rather than a
                decoration, and an institution's identity colour frequently
                does not: Carolina Blue is 1.9:1 on white. brand-line is that
                same colour darkened until it measures, so the indicator keeps
                the institution's hue and is still visible. State is never
                carried by colour alone in any case, the row also changes
                ground and text weight.
              */}
              <span
                aria-hidden="true"
                className={clsx(
                  'absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-halo-brand-line origin-center transition-transform duration-300 ease-[cubic-bezier(.65,0,.35,1)]',
                  active ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50',
                )}
              />
              <Icon
                className={clsx(
                  'h-4 w-4 flex-shrink-0 transition-colors',
                  active ? 'text-halo-brand-text' : 'text-halo-mist-strong group-hover:text-halo-brand-text',
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {tenant?.notice && (
        <div className="px-5 pb-4 pt-2">
          <TenantNotice notice={tenant.notice} />
        </div>
      )}

      <div className="px-3 py-4 border-t border-halo-rule">
        <div className="flex items-center gap-3 px-3 py-1">
          <div className="w-8 h-8 rounded-full bg-halo-deep flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">
              {firstName?.[0] ?? ''}{lastName?.[0] ?? ''}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-halo-ink truncate">
              {firstName} {lastName}
            </p>
            <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
              {role === 'mentor' ? 'Mentor' : 'Student'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
