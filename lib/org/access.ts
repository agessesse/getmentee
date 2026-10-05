import 'server-only';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';

/**
 * Who may administer what.
 *
 * THREE SEPARATE AUTHORITIES, AND THEY DO NOT IMPLY EACH OTHER.
 *
 *   platform admin        profiles.is_admin. Mentable-wide. Reviews
 *                         applications, reads inquiries. Granted only by a
 *                         direct UPDATE (see migration 0030); the column is
 *                         not user-writable.
 *   organization admin    a row in organization_members. Authority inside one
 *                         organisation and nowhere else.
 *   program admin         a row in program_admins. Authority inside specific
 *                         programmes of an organisation.
 *
 * An organisation owner is not a platform admin. A platform admin is not
 * automatically an organisation member either: they can reach the platform
 * admin surface, and that is a different surface.
 *
 * THE RULE THAT MATTERS. Authorization never reads an organisation or
 * programme id supplied by the caller and then checks whether it looks
 * plausible. It resolves what the signed-in profile may touch, from the
 * database, and the caller's id is only ever used to look up a row that the
 * resolved access already permits. A forged id resolves to no access rather
 * than to somebody else's organisation.
 *
 * server-only: none of this can be pulled into a browser bundle.
 */

export type OrgRole = 'owner' | 'admin' | 'viewer';

/** What a caller may do once resolved. */
export interface OrgAccess {
  profileId: string;
  organizationId: string;
  role: OrgRole;
  /** Programmes they may administer. Empty for org owners/admins, who may administer all. */
  programIds: string[];
  /** Org-wide authority, as opposed to delegated programme-only authority. */
  orgWide: boolean;
  canMutate: boolean;
  db: SupabaseClient;
}

export type AccessFailure =
  | { ok: false; reason: 'unauthenticated' }
  | { ok: false; reason: 'forbidden' }
  | { ok: false; reason: 'misconfigured' };

export type AccessResult = ({ ok: true } & OrgAccess) | AccessFailure;

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** The signed-in profile id, or null. */
async function currentProfileId(): Promise<string | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Every organisation the caller may administer, with their role in each.
 *
 * This is the entry point for "show me my organisations". It never takes an
 * organisation id, which is the point: the list is derived from membership,
 * so there is nothing for a caller to tamper with.
 */
export async function listMyOrganizations(): Promise<
  { ok: true; profileId: string; db: SupabaseClient; orgs: { id: string; name: string; slug: string; kind: string; role: OrgRole }[] } | AccessFailure
> {
  const profileId = await currentProfileId();
  if (!profileId) return { ok: false, reason: 'unauthenticated' };
  const db = serviceClient();
  if (!db) return { ok: false, reason: 'misconfigured' };

  const { data: memberships } = await db
    .from('organization_members')
    .select('organization_id, role, organizations(id, name, slug, kind)')
    .eq('profile_id', profileId);

  // Programme-only admins have no organization_members row, but must still be
  // able to reach the organisation their programme belongs to.
  const { data: progAdmin } = await db
    .from('program_admins')
    .select('programs(organization_id, organizations(id, name, slug, kind))')
    .eq('profile_id', profileId);

  const seen = new Map<string, { id: string; name: string; slug: string; kind: string; role: OrgRole }>();
  for (const m of memberships ?? []) {
    const o = m.organizations as unknown as { id: string; name: string; slug: string; kind: string } | null;
    if (o) seen.set(o.id, { ...o, role: m.role as OrgRole });
  }
  for (const r of progAdmin ?? []) {
    const p = r.programs as unknown as { organizations: { id: string; name: string; slug: string; kind: string } | null } | null;
    const o = p?.organizations;
    // Delegated admins see the organisation as a viewer at org level; their
    // real authority is scoped to their programmes.
    if (o && !seen.has(o.id)) seen.set(o.id, { ...o, role: 'viewer' });
  }

  return { ok: true, profileId, db, orgs: [...seen.values()] };
}

/**
 * Resolve what the caller may do in one organisation.
 *
 * `organizationId` arrives from the URL, so it is treated as a claim to be
 * checked, never as authorization. If no membership and no delegated
 * programme ties the caller to it, the answer is forbidden, which is also the
 * answer for an organisation that does not exist. The two are deliberately
 * indistinguishable: otherwise this becomes a way to enumerate tenants.
 */
export async function resolveOrgAccess(organizationId: string): Promise<AccessResult> {
  const profileId = await currentProfileId();
  if (!profileId) return { ok: false, reason: 'unauthenticated' };
  const db = serviceClient();
  if (!db) return { ok: false, reason: 'misconfigured' };

  const { data: member } = await db
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (member) {
    const role = member.role as OrgRole;
    return {
      ok: true, profileId, organizationId, role,
      programIds: [],
      orgWide: true,
      canMutate: role === 'owner' || role === 'admin',
      db,
    };
  }

  // No org membership: they may still administer specific programmes in it.
  const { data: delegated } = await db
    .from('program_admins')
    .select('program_id, programs!inner(organization_id)')
    .eq('profile_id', profileId)
    .eq('programs.organization_id', organizationId);

  const programIds = (delegated ?? []).map((d) => d.program_id as string);
  if (programIds.length === 0) return { ok: false, reason: 'forbidden' };

  return {
    ok: true, profileId, organizationId,
    role: 'admin',
    programIds,
    orgWide: false,
    canMutate: true,
    db,
  };
}

/**
 * Whether a resolved caller may act on one programme.
 *
 * Org-wide roles cover every programme in their organisation. A delegated
 * admin covers only the programmes listed on them, which is the entire reason
 * program_admins exists: running Family Business Mentorship must not confer
 * authority over the whole university.
 */
export function canAccessProgram(access: OrgAccess, programId: string): boolean {
  return access.orgWide || access.programIds.includes(programId);
}

/** Read-only roles must not reach a mutating path. */
export function canMutateProgram(access: OrgAccess, programId: string): boolean {
  return access.canMutate && canAccessProgram(access, programId);
}

/**
 * Confirm a programme really belongs to the organisation already resolved.
 *
 * Guards the cross-tenant case: a valid admin of organisation A passing a
 * programme id belonging to organisation B. Membership alone would not catch
 * it, because the caller genuinely is an administrator, just not of that.
 */
export async function programBelongsToOrg(
  db: SupabaseClient,
  programId: string,
  organizationId: string,
): Promise<boolean> {
  const { data } = await db
    .from('programs')
    .select('id')
    .eq('id', programId)
    .eq('organization_id', organizationId)
    .maybeSingle();
  return Boolean(data);
}

/** The same check for a cohort, resolved through its programme. */
export async function cohortBelongsToOrg(
  db: SupabaseClient,
  cohortId: string,
  organizationId: string,
): Promise<{ ok: boolean; programId?: string }> {
  const { data } = await db
    .from('cohorts')
    .select('id, program_id, programs!inner(organization_id)')
    .eq('id', cohortId)
    .eq('programs.organization_id', organizationId)
    .maybeSingle();
  return data ? { ok: true, programId: data.program_id as string } : { ok: false };
}
