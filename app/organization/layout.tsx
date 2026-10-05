import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/marketing/SiteFooter';

export const metadata: Metadata = {
  title: 'Program administration · Mentable',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * The organisation administration shell.
 *
 * WHY THIS IS NOT UNDER /admin. /admin is the platform surface, gated on
 * profiles.is_admin, and an organisation administrator is deliberately not a
 * platform administrator. A university programme lead must be able to run
 * their programme without being able to read every application Mentable has
 * ever received. Two authorities, two surfaces.
 *
 * There is no gate in this layout on purpose. Every page below resolves its
 * own access from the database, the same way each /admin page calls
 * requireAdmin() itself, so a page can never render because a parent happened
 * to run.
 */
export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col">
      <header className="border-b border-halo-rule bg-white/70 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/organization" className="font-display text-[20px] text-halo-ink">
            Mentable
            <span className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d ml-2.5 align-middle">
              Programs
            </span>
          </Link>
          <Link href="/dashboard" className="text-[14px] text-halo-heather hover:text-halo-ink transition-colors">
            Back to Mentable
          </Link>
        </div>
      </header>
      <main id="main-content" className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
