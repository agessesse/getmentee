import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { resolveOrgAccess, canAccessProgram } from '@/lib/org/access';
import { cohortMetrics, sumMetrics, type ProgramMetrics } from '@/lib/org/metrics';
import { Panel, Empty, Stat, Tag } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

/**
 * One organisation: its programmes, their cohorts, and how much is actually
 * happening inside them.
 *
 * The orgId comes from the URL and is treated as a claim. resolveOrgAccess
 * checks it against membership before anything is read, and answers
 * "forbidden" both for an organisation the caller cannot touch and for one
 * that does not exist, so this page cannot be used to discover which tenants
 * are real.
 */
export default async function OrganizationOverview({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const access = await resolveOrgAccess(orgId);

  if (!access.ok) {
    return (
      <Panel title={access.reason === 'unauthenticated' ? 'Sign in required' : 'Not found'}>
        <Empty>
          {access.reason === 'unauthenticated'
            ? 'Sign in to Mentable to reach program administration.'
            : 'No organization here, or your account doesn’t administer it.'}
        </Empty>
        <Link href="/organization" className="inline-block mt-4 text-sm font-semibold text-halo-purple-d hover:text-halo-ink">
          Your organizations
        </Link>
      </Panel>
    );
  }

  const { db } = access;

  const { data: org } = await db
    .from('organizations')
    .select('id, name, kind')
    .eq('id', orgId)
    .maybeSingle();

  const { data: programs } = await db
    .from('programs')
    .select('id, name, slug, cohorts(id, name, slug, status, starts_at)')
    .eq('organization_id', orgId)
    .order('created_at');

  // A delegated administrator sees only the programmes delegated to them.
  const visible = (programs ?? []).filter((p) => canAccessProgram(access, p.id as string));

  const allCohorts = visible.flatMap((p) =>
    ((p.cohorts ?? []) as { id: string; name: string; slug: string; status: string; starts_at: string | null }[])
      .map((c) => ({ ...c, programId: p.id as string, programName: p.name as string })),
  );

  const totals = await sumMetrics(db, allCohorts.map((c) => c.id));
  const perCohort = new Map<string, ProgramMetrics>();
  await Promise.all(
    allCohorts.map(async (c) => { perCohort.set(c.id, await cohortMetrics(db, c.id)); }),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/organization" className="inline-flex items-center gap-1.5 text-sm text-halo-mist-body hover:text-halo-ink transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Organizations
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display font-normal text-[2rem] leading-tight text-halo-ink">
            {org?.name ?? 'Organization'}
          </h1>
          <Tag tone="neutral">{access.role}</Tag>
          {!access.orgWide && <Tag tone="amber">program access</Tag>}
        </div>
        <p className="text-[15px] text-halo-heather mt-1.5">
          {visible.length === 0
            ? 'No programs yet.'
            : `${visible.length} ${visible.length === 1 ? 'program' : 'programs'}, ${allCohorts.length} ${allCohorts.length === 1 ? 'cohort' : 'cohorts'}.`}
        </p>
      </div>

      {allCohorts.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Participants" value={totals.participants} />
          <Stat label="Active mentorships" value={totals.activeMentorships} />
          <Stat label="Awaiting a match" value={totals.unmatched} />
          <Stat label="Need attention" value={totals.needsAttention} />
        </div>
      )}

      {visible.length === 0 ? (
        <Panel title="No programs">
          <Empty>
            This organization has no programs you can administer yet.
          </Empty>
        </Panel>
      ) : (
        visible.map((p) => {
          const cohorts = allCohorts.filter((c) => c.programId === p.id);
          return (
            <Panel key={p.id as string} title={p.name as string}>
              {cohorts.length === 0 ? (
                <Empty>No cohorts in this program yet.</Empty>
              ) : (
                <div className="space-y-3">
                  {cohorts.map((c) => {
                    const m = perCohort.get(c.id)!;
                    return (
                      <div key={c.id} className="border border-halo-rule rounded-xl px-4 py-3.5">
                        <div className="flex items-center justify-between gap-3 flex-wrap mb-2.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-semibold text-[15px] text-halo-ink">{c.name}</span>
                            <Tag tone={c.status === 'open' ? 'green' : c.status === 'active' ? 'amber' : 'neutral'}>
                              {c.status}
                            </Tag>
                          </div>
                          <Link
                            href={`/organization/${orgId}/cohort/${c.id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-halo-purple-d hover:text-halo-ink transition-colors"
                          >
                            Open cohort
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                          </Link>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-halo-heather">
                          <span>{m.mentees} mentees</span>
                          <span>{m.mentors} mentors</span>
                          <span>{m.activeMentorships} active</span>
                          <span>{m.sessionsCompleted} sessions held</span>
                          {m.needsAttention > 0 && (
                            <span className="text-halo-ink font-medium">{m.needsAttention} quiet 30+ days</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          );
        })
      )}

      {/* Said on the surface, not only in the schema. An administrator should
          know what they cannot see without having to test it. */}
      <p className="text-[13px] text-halo-mist-body leading-relaxed">
        You can see whether relationships are happening and moving. You cannot read
        messages between a mentor and a mentee, and Mentable does not provide a way to.
      </p>
    </div>
  );
}
