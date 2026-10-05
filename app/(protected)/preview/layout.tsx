import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { tokenStyle } from '@/lib/theme/derive';
import { CAROLINA_TENANT } from '@/lib/preview/carolina-fixture';

export const dynamic = 'force-dynamic';

/**
 * The preview gate and the preview frame.
 *
 * WHAT PREVIEW IS. A rendering mode. It takes the real components and gives
 * them fixture props and a tenant theme. It is not a session, not an
 * identity, and not an elevated permission.
 *
 * WHAT IT THEREFORE CANNOT DO, by construction rather than by rule:
 *
 *   read private messages            it never queries messages
 *   read mentorship notes            the mentor notes it shows are fixture
 *                                    strings, not anybody's
 *   modify goals or commitments      every control is readOnly
 *   send messages as another person  there is no write path in here at all
 *   gain cohort membership           it writes nothing, ever
 *   bypass RLS                       it performs no authorized read to bypass
 *
 * There is no impersonation parameter. Nothing in these routes accepts a user
 * id, a mentorship id or an organisation id, so there is no value a caller
 * could supply that would turn preview into access to a real relationship.
 *
 * THE GATE is platform admin, checked through the caller's own client. RLS
 * lets a user read their own profile row and is_admin is not user-writable,
 * so this fails closed. A non-admin gets 404 rather than 403: whether this
 * route exists is not information a non-admin needs.
 *
 * Note that platform admin is used here ONLY to reach a fixture. It confers
 * nothing in /mentorship/[id], which authorizes on participation and reads
 * through RLS; see lib/mentorship/workspace-data.ts.
 */
export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: self } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!self?.is_admin) notFound();

  return (
    <div style={tokenStyle(CAROLINA_TENANT.tokens!) as React.CSSProperties}>
      {/*
        Unmistakable, and it does not scroll away. The brief's requirement is
        that preview never looks like a real participant session; a banner
        that disappears on scroll fails that the moment somebody screenshots
        the middle of a page.
      */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-10 -mt-4 sm:-mt-6 lg:-mt-10 mb-6">
        <div className="bg-halo-ink text-white px-4 sm:px-6 lg:px-10 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-[12.5px] font-medium">
            Previewing {CAROLINA_TENANT.displayName}
            <span className="hidden sm:inline text-white/60"> · fictional people, no real participant data</span>
          </p>
          <Link
            href="/dashboard"
            className="text-[12.5px] font-semibold underline underline-offset-2 hover:text-white/80 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Exit preview
          </Link>
        </div>
      </div>

      {children}

      <div className="mt-10 pt-4 border-t border-halo-rule max-w-3xl">
        <p className="text-[11px] leading-relaxed text-halo-mist-body">{CAROLINA_TENANT.notice}</p>
      </div>
    </div>
  );
}
