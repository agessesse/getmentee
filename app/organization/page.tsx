import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listMyOrganizations } from '@/lib/org/access';
import { Panel, Empty, Tag } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

/**
 * Every organisation the signed-in person may administer.
 *
 * Takes no id. The list is derived from organization_members plus any
 * delegated programmes, so there is nothing here for a caller to tamper
 * with: you see what your membership says you see, and an empty list is the
 * correct answer for almost everybody.
 */
export default async function OrganizationIndex() {
  const res = await listMyOrganizations();

  if (!res.ok) {
    return (
      <Panel title={res.reason === 'unauthenticated' ? 'Sign in required' : 'Not available'}>
        <Empty>
          {res.reason === 'unauthenticated'
            ? 'Sign in to Mentable to reach program administration.'
            : 'Program administration is not available on this account.'}
        </Empty>
        <Link href="/login" className="inline-block mt-4 text-sm font-semibold text-halo-purple-d hover:text-halo-ink">
          Sign in
        </Link>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-normal text-[2rem] leading-tight text-halo-ink">Your organizations</h1>
        <p className="text-[15px] text-halo-heather mt-1.5">
          Programs you administer. Mentorship conversations stay private to the two people in them.
        </p>
      </div>

      {res.orgs.length === 0 ? (
        <Panel title="Nothing to administer yet">
          <Empty>
            This account doesn&apos;t administer an organization. If your institution is
            setting up a Mentable program, ask whoever owns it to add you.
          </Empty>
        </Panel>
      ) : (
        res.orgs.map((o) => (
          <Panel key={o.id} title={o.name} action={<Tag tone="neutral">{o.role}</Tag>}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-[14px] text-halo-heather capitalize">{o.kind}</p>
              <Link
                href={`/organization/${o.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-halo-purple-d hover:text-halo-ink transition-colors"
              >
                Open
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </Panel>
        ))
      )}
    </div>
  );
}
