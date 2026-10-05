import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { resolveOrgAccess, canAccessProgram, cohortBelongsToOrg } from '@/lib/org/access';
import { cohortMetrics } from '@/lib/org/metrics';
import { Panel, Empty, Stat, Tag, Th, Td } from '@/components/admin/ui';
import InviteParticipant from '@/components/org/InviteParticipant';

export const dynamic = 'force-dynamic';

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

/**
 * One cohort: who is in it, who is still unmatched, which relationships are
 * moving, and an invitation form.
 *
 * TWO AUTHORIZATION CHECKS, NOT ONE. resolveOrgAccess proves the caller
 * administers this organisation. cohortBelongsToOrg then proves this cohort
 * is actually inside it. The second catches the case the first cannot: a
 * genuine administrator of organisation A passing a cohort id belonging to
 * organisation B. Without it, being an admin anywhere would be enough to read
 * a cohort everywhere.
 */
export default async function CohortDetail({
  params,
}: {
  params: Promise<{ orgId: string; cohortId: string }>;
}) {
  const { orgId, cohortId } = await params;
  const access = await resolveOrgAccess(orgId);

  const denied = (
    <Panel title="Not found">
      <Empty>No cohort here, or your account doesn’t administer it.</Empty>
      <Link href="/organization" className="inline-block mt-4 text-sm font-semibold text-halo-purple-d hover:text-halo-ink">
        Your organizations
      </Link>
    </Panel>
  );

  if (!access.ok) return denied;
  const { db } = access;

  // Cross-tenant guard.
  const belongs = await cohortBelongsToOrg(db, cohortId, orgId);
  if (!belongs.ok) return denied;
  // And the delegated-admin guard: the right organisation, the wrong programme.
  if (!canAccessProgram(access, belongs.programId!)) return denied;

  const { data: cohort } = await db
    .from('cohorts')
    .select('id, name, status, starts_at, ends_at, target_size, programs(name)')
    .eq('id', cohortId)
    .maybeSingle();

  const m = await cohortMetrics(db, cohortId);

  const { data: members } = await db
    .from('cohort_memberships')
    .select('profile_id, role, state, joined_at, profiles(first_name, last_name, email)')
    .eq('cohort_id', cohortId)
    .order('created_at');

  const { data: rels } = await db
    .from('mentorships')
    .select('id, mentee_id, mentor_id, status, started_at, origin')
    .eq('cohort_id', cohortId);

  const paired = new Set<string>();
  for (const r of rels ?? []) { paired.add(r.mentee_id as string); paired.add(r.mentor_id as string); }

  const { data: invites } = await db
    .from('program_invitations')
    .select('email, role, expires_at, accepted_at, revoked_at, created_at')
    .eq('cohort_id', cohortId)
    .order('created_at', { ascending: false })
    .limit(25);

  const programName = (cohort?.programs as unknown as { name: string } | null)?.name ?? '';

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/organization/${orgId}`} className="inline-flex items-center gap-1.5 text-sm text-halo-mist-body hover:text-halo-ink transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {programName || 'Organization'}
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display font-normal text-[2rem] leading-tight text-halo-ink">
            {cohort?.name ?? 'Cohort'}
          </h1>
          <Tag tone={cohort?.status === 'open' ? 'green' : 'neutral'}>{cohort?.status}</Tag>
        </div>
        <p className="text-[15px] text-halo-heather mt-1.5">
          {programName}
          {cohort?.starts_at ? ` · starts ${fmt(cohort.starts_at as string)}` : ''}
          {cohort?.target_size ? ` · aiming for ${cohort.target_size}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Mentees" value={m.mentees} />
        <Stat label="Mentors" value={m.mentors} />
        <Stat label="Active mentorships" value={m.activeMentorships} />
        <Stat label="Awaiting a match" value={m.unmatched} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Sessions held" value={m.sessionsCompleted} />
        <Stat label="Sessions upcoming" value={m.sessionsUpcoming} />
        <Stat label="Goals completed" value={`${m.goalsCompleted}/${m.goalsCreated}`} />
        <Stat label="Quiet 30+ days" value={m.needsAttention} />
      </div>

      {access.canMutate && (
        <Panel title="Invite someone">
          <InviteParticipant orgId={orgId} cohortId={cohortId} />
        </Panel>
      )}

      <Panel title={`Participants (${(members ?? []).length})`}>
        {(members ?? []).length === 0 ? (
          <Empty>Nobody has joined this cohort yet. Invitations appear here once accepted.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <Th>Name</Th><Th>Role</Th><Th>State</Th><Th>Matched</Th><Th>Joined</Th>
                </tr>
              </thead>
              <tbody>
                {(members ?? []).map((x) => {
                  const p = x.profiles as unknown as { first_name: string; last_name: string } | null;
                  const isPaired = paired.has(x.profile_id as string);
                  return (
                    <tr key={x.profile_id as string} className="border-t border-halo-rule">
                      <Td>{p ? `${p.first_name} ${p.last_name}`.trim() : '—'}</Td>
                      <Td><Tag tone={x.role === 'mentor' ? 'amber' : 'green'}>{x.role as string}</Tag></Td>
                      <Td>{x.state as string}</Td>
                      <Td>{isPaired ? 'Yes' : <span className="text-halo-mist-body">Not yet</span>}</Td>
                      <Td>{fmt(x.joined_at as string | null)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title={`Relationships (${(rels ?? []).length})`}>
        {(rels ?? []).length === 0 ? (
          <Empty>No mentorships in this cohort yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr><Th>Started</Th><Th>Status</Th><Th>How it began</Th></tr>
              </thead>
              <tbody>
                {(rels ?? []).map((r) => (
                  <tr key={r.id as string} className="border-t border-halo-rule">
                    <Td>{fmt(r.started_at as string | null)}</Td>
                    <Td>{r.status as string}</Td>
                    <Td>{(r.origin as string).replace('_', ' ')}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {(invites ?? []).length > 0 && (
        <Panel title="Recent invitations">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Sent</Th></tr></thead>
              <tbody>
                {(invites ?? []).map((i, n) => {
                  const state = i.revoked_at ? 'revoked'
                    : i.accepted_at ? 'accepted'
                    : new Date(i.expires_at as string) < new Date() ? 'expired' : 'pending';
                  return (
                    <tr key={n} className="border-t border-halo-rule">
                      <Td>{i.email as string}</Td>
                      <Td>{(i.role as string).replace('_', ' ')}</Td>
                      <Td><Tag tone={state === 'accepted' ? 'green' : state === 'pending' ? 'neutral' : 'amber'}>{state}</Tag></Td>
                      <Td>{fmt(i.created_at as string)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <p className="text-[13px] text-halo-mist-body leading-relaxed">
        Activity is measured from sessions, goals and next steps. Messages between a
        mentor and a mentee are never read here.
      </p>
    </div>
  );
}
