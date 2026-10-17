import 'server-only';

import { getServiceRoleKey } from '@/lib/supabase/service-key';

/**
 * Which migrations are actually live, asked of the database rather than
 * assumed from the files in supabase/migrations.
 *
 * WHY THIS EXISTS AT ALL. A migration file in the repo is not a migration
 * in production, and this project has been bitten by that gap four times:
 *
 *   0018  defined approve_mentorship_request() and applied only its other
 *         half. Accepting an introduction was broken in production for
 *         weeks while the function sat in version control looking applied.
 *   0033  added scheduling columns without adding them to 0017's
 *         column-level UPDATE grant, so the success path would have
 *         silently failed to store external_event_id.
 *   0015  revoked a grant that requireAdmin() depended on, which made the
 *         entire admin area unreachable for everyone.
 *   0002  left mentorships.request_id NOT NULL, which is the reason
 *         operator-created matching could never be built.
 *
 * Every one of those was silent. The code looked right, the deploy
 * succeeded, and the failure surfaced as "this feature does nothing".
 *
 * So rather than render a form whose save will fail on a column that does
 * not exist, the form asks first and renders only what the database can
 * actually store. The moment 0039 is applied the fields appear, with no
 * deploy and no code change.
 *
 * NOT A SECURITY BOUNDARY. This decides what to show, never what someone
 * is allowed to do; RLS and the column grants decide that, and they are
 * unchanged.
 */

export interface SchemaCapabilities {
  /** 0039 §1 — the atomic accept RPC. */
  atomicApprove: boolean;
  /** 0039 §2 — operator-created matches with no originating request. */
  operatorMatches: boolean;
  /** 0039 §3 — structured outcomes after a conversation. */
  relationshipOutcomes: boolean;
  /** 0039 §4 — the relationship-intelligence input columns. */
  intelligenceInputs: boolean;
}

const NONE: SchemaCapabilities = {
  atomicApprove: false,
  operatorMatches: false,
  relationshipOutcomes: false,
  intelligenceInputs: false,
};

/*
  Cached for a minute, not forever.

  Forever would mean a server instance that started before the migration
  never notices it, and the operator applying 0039 would have to redeploy
  to see any effect — exactly the kind of invisible coupling this module
  exists to remove. A minute is short enough that applying the migration
  feels immediate and long enough that this costs nothing per request.
*/
let cache: { at: number; value: SchemaCapabilities } | null = null;
const TTL_MS = 60_000;

/** Does PostgREST know this column? A 400 means it does not. */
async function hasColumn(base: string, key: string, table: string, column: string): Promise<boolean> {
  try {
    const r = await fetch(`${base}/rest/v1/${table}?select=${column}&limit=0`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Does this function exist, asked by calling it with its real signature
 * and arguments chosen so the call cannot change anything.
 *
 * THE FIRST VERSION OF THIS WAS WRONG AND REPORTED A LIVE FUNCTION AS
 * MISSING. It passed a deliberately bogus argument name, on the reasoning
 * that a present function would answer 400 for the bad signature and an
 * absent one 404. PostgREST does not work that way: it resolves an RPC by
 * ARGUMENT NAMES, so an unknown name is indistinguishable from an unknown
 * function and both answer 404 PGRST202. The probe could never return
 * true, and it did not — it reported approve_mentorship_request missing
 * minutes after that function was verified working in production.
 *
 * Caught only because the capability probe disagreed with a direct check
 * standing next to it. A probe that can only ever answer one way is worse
 * than no probe, because it looks like evidence.
 *
 * So: real argument names, and a value that makes the function bail on
 * its first guard. approve_mentorship_request looks the request up before
 * it checks anything else, so an all-zero UUID raises 'Request not found'
 * and nothing is read, locked or written.
 */
async function hasFunction(
  base: string,
  key: string,
  fn: string,
  inertArgs: Record<string, unknown>,
): Promise<boolean> {
  try {
    const r = await fetch(`${base}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(inertArgs),
      cache: 'no-store',
    });
    if (r.ok) return true;
    const body = await r.text();
    /*
      PGRST202 is the only answer that means "no such function". Anything
      else -- including the function raising its own exception, which is
      the expected outcome here -- means it is installed and ran.
    */
    return !/PGRST202|Could not find the function/i.test(body);
  } catch {
    return false;
  }
}

export async function schemaCapabilities(): Promise<SchemaCapabilities> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();
  // Unconfigured is reported as "nothing available", never as "available".
  if (!base || !key) return NONE;

  const [atomicApprove, operatorMatches, relationshipOutcomes, intelligenceInputs] =
    await Promise.all([
      hasFunction(base, key, 'approve_mentorship_request', {
        p_request_id: '00000000-0000-0000-0000-000000000000',
      }),
      hasColumn(base, key, 'mentorships', 'match_rationale'),
      hasColumn(base, key, 'relationship_outcomes', 'usefulness'),
      hasColumn(base, key, 'mentor_profiles', 'companies_known'),
    ]);

  const value = { atomicApprove, operatorMatches, relationshipOutcomes, intelligenceInputs };
  cache = { at: Date.now(), value };
  return value;
}
