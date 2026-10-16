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

async function hasFunction(base: string, key: string, fn: string): Promise<boolean> {
  try {
    /*
      Called with a deliberately absent argument name so it cannot do
      anything. A missing function answers 404 PGRST202; a present one
      answers 400 for the bad signature. Either way nothing is written.
    */
    const r = await fetch(`${base}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ __probe: null }),
      cache: 'no-store',
    });
    if (r.status === 404) return false;
    const body = await r.text();
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
      hasFunction(base, key, 'approve_mentorship_request'),
      hasColumn(base, key, 'mentorships', 'match_rationale'),
      hasColumn(base, key, 'relationship_outcomes', 'usefulness'),
      hasColumn(base, key, 'mentor_profiles', 'companies_known'),
    ]);

  const value = { atomicApprove, operatorMatches, relationshipOutcomes, intelligenceInputs };
  cache = { at: Date.now(), value };
  return value;
}
