import 'server-only';
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import { deriveTokens, tokenStyle, type TenantPalette } from './derive';
import type { TenantIdentity } from './identity';

/**
 * Which institution, if any, a signed-in person is participating through.
 *
 * THE SECURITY PROPERTY, AND IT IS THE WHOLE POINT OF THIS FILE.
 *
 * Tenant context is never taken from a URL, a query parameter, a cookie or a
 * header. It is derived from the caller's own rows: a cohort membership, or a
 * mentorship that belongs to a cohort. There is therefore nothing for a
 * caller to tamper with. Passing somebody else's organisation id resolves to
 * their own context, or to none; it cannot resolve to that organisation.
 *
 * This matters more than it looks. The themed shell renders an institution's
 * name over the whole application, so a client-supplied tenant id would let
 * anyone dress Mentable up as any organisation in the database and screenshot
 * it. Membership-derived, that is not expressible.
 *
 * WHAT IT DOES NOT TOUCH. No messages, ever. This resolves identity and
 * colour, nothing about the content of a relationship.
 *
 * server-only, and it uses the service role because organizations, programs
 * and cohorts have RLS on with no policies and no grants to authenticated
 * (0029-0031). The caller is resolved before any row is read.
 */

export type { TenantIdentity };

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A theme row is only trusted if it still matches the shape 0031 enforces. */
function readPalette(raw: unknown): TenantPalette | null {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as Record<string, unknown>;
  const keys = ['surface', 'ink', 'primary', 'wash'] as const;
  const hex = /^#[0-9A-Fa-f]{6}$/;
  for (const k of keys) {
    if (typeof t[k] !== 'string' || !hex.test(t[k] as string)) return null;
  }
  return {
    surface: t.surface as string,
    ink: t.ink as string,
    primary: t.primary as string,
    wash: t.wash as string,
  };
}

interface OrgRow {
  id: string;
  name: string;
  display_name: string | null;
  tagline: string | null;
  notice: string | null;
  theme: unknown;
}

function buildIdentity(
  org: OrgRow,
  programName: string | null,
  cohortName: string | null,
  term: string | null,
): TenantIdentity {
  const palette = readPalette(org.theme);
  return {
    organizationId: org.id,
    legalName: org.name,
    displayName: org.display_name?.trim() || org.name,
    tagline: org.tagline,
    notice: org.notice,
    programName,
    cohortName,
    term,
    palette,
    tokens: palette ? deriveTokens(palette) : null,
  };
}

const ORG_FIELDS = 'id, name, display_name, tagline, notice, theme';

/** The shape of the cohort -> programme -> organisation embed, both queries. */
interface CohortJoin {
  cohorts: {
    name: string;
    term: string | null;
    programs: { name: string; organizations: OrgRow | null } | null;
  } | null;
}

/**
 * The institutional context for one participant, or null.
 *
 * Null is the normal case and must stay cheap: all ten current mentorships
 * have cohort_id NULL, every one of them a perfectly valid individual
 * relationship. Those people see Mentable, unthemed, exactly as they do now.
 *
 * Two sources, in order of directness:
 *
 *   1. cohort_memberships  the person was enrolled in a programme cohort.
 *   2. mentorships.cohort_id  they were matched inside a cohort without a
 *      membership row, which an administrator creating a pairing can produce.
 *
 * A person in more than one cohort gets the most recently created. Multi-
 * programme participants are a real future case and will need a switcher;
 * resolving deterministically now is better than resolving arbitrarily.
 */
export async function resolveParticipantContext(
  profileId: string,
): Promise<TenantIdentity | null> {
  const db = serviceClient();
  if (!db) return null;

  // 1. Enrolled in a cohort.
  const { data: membership } = await db
    .from('cohort_memberships')
    .select('cohort_id, created_at, cohorts(name, term, programs(name, organizations(' + ORG_FIELDS + ')))')
    .eq('profile_id', profileId)
    .in('state', ['invited', 'active', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Cast through unknown: PostgREST's generated types widen an embedded
  // select to a union with GenericStringError, which is not what comes back.
  const fromMembership = (membership as unknown as CohortJoin | null)?.cohorts ?? null;

  if (fromMembership?.programs?.organizations) {
    return buildIdentity(
      fromMembership.programs.organizations,
      fromMembership.programs.name,
      fromMembership.name,
      fromMembership.term,
    );
  }

  // 2. Matched inside a cohort without an enrolment row.
  const { data: paired } = await db
    .from('mentorships')
    .select('cohort_id, created_at, cohorts(name, term, programs(name, organizations(' + ORG_FIELDS + ')))')
    .or(`mentor_id.eq.${profileId},mentee_id.eq.${profileId}`)
    .not('cohort_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const fromPairing = (paired as unknown as CohortJoin | null)?.cohorts ?? null;

  if (fromPairing?.programs?.organizations) {
    return buildIdentity(
      fromPairing.programs.organizations,
      fromPairing.programs.name,
      fromPairing.name,
      fromPairing.term,
    );
  }

  return null;
}

/**
 * The identity of an organisation an administrator is already inside.
 *
 * Takes the client from an access check that has ALREADY succeeded, rather
 * than making its own. That is deliberate: there is no code path where this
 * can be called with an unverified organisation id, because the caller has to
 * produce a resolved client to call it at all.
 */
export async function resolveOrgIdentity(
  db: SupabaseClient,
  organizationId: string,
): Promise<TenantIdentity | null> {
  const { data } = await db
    .from('organizations')
    .select(ORG_FIELDS)
    .eq('id', organizationId)
    .maybeSingle();
  if (!data) return null;
  return buildIdentity(data as OrgRow, null, null, null);
}

/** CSS custom properties for the shell, or an empty object for the default. */
export function themeStyle(identity: TenantIdentity | null): Record<string, string> {
  return identity?.tokens ? tokenStyle(identity.tokens) : {};
}
