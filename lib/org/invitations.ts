import 'server-only';
import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Programme invitation redemption.
 *
 * Same contract as activation (0027): the raw token is never stored, a link
 * works once, it expires, and it is bound to the address it was issued to.
 * The email binding is what stops a forwarded link being used by somebody
 * else to join a programme they were not invited to.
 */

export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

export type InviteProblem = 'not_found' | 'expired' | 'used' | 'revoked';

export interface ResolvedInvite {
  cohortId: string;
  cohortName: string;
  programName: string;
  organizationName: string;
  email: string;
  role: 'mentee' | 'mentor' | 'program_admin';
}

export async function resolveInvite(
  db: SupabaseClient,
  token: string,
): Promise<ResolvedInvite | { problem: InviteProblem }> {
  if (!token || token.length < 20) return { problem: 'not_found' };

  const { data: row } = await db
    .from('program_invitations')
    .select('cohort_id, email, role, expires_at, accepted_at, revoked_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle();

  if (!row) return { problem: 'not_found' };
  if (row.revoked_at) return { problem: 'revoked' };
  if (row.accepted_at) return { problem: 'used' };
  if (new Date(row.expires_at as string).getTime() < Date.now()) return { problem: 'expired' };

  const { data: cohort } = await db
    .from('cohorts')
    .select('id, name, programs(name, organizations(name))')
    .eq('id', row.cohort_id)
    .maybeSingle();

  if (!cohort) return { problem: 'not_found' };
  const prog = cohort.programs as unknown as { name: string; organizations: { name: string } | null } | null;

  return {
    cohortId: cohort.id as string,
    cohortName: cohort.name as string,
    programName: prog?.name ?? '',
    organizationName: prog?.organizations?.name ?? '',
    email: row.email as string,
    role: row.role as ResolvedInvite['role'],
  };
}

/**
 * Join the cohort, then burn the token.
 *
 * Membership first and the token last, so a failure halfway leaves a link
 * that still works rather than a person locked out of a programme they were
 * invited to. Re-running is harmless: the membership upsert is keyed on
 * (cohort, profile).
 */
export async function acceptInvite(
  db: SupabaseClient,
  token: string,
  invite: ResolvedInvite,
  profileId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (invite.role === 'program_admin') {
    const { data: cohort } = await db.from('cohorts').select('program_id').eq('id', invite.cohortId).maybeSingle();
    if (!cohort) return { ok: false, error: 'That program no longer exists.' };
    const { error } = await db
      .from('program_admins')
      .upsert({ program_id: cohort.program_id, profile_id: profileId }, { onConflict: 'program_id,profile_id' });
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await db.from('cohort_memberships').upsert(
      {
        cohort_id: invite.cohortId,
        profile_id: profileId,
        role: invite.role,
        state: 'active',
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'cohort_id,profile_id' },
    );
    if (error) return { ok: false, error: error.message };
  }

  await db
    .from('program_invitations')
    .update({ accepted_at: new Date().toISOString(), accepted_by: profileId })
    .eq('token_hash', hashToken(token));

  return { ok: true };
}
