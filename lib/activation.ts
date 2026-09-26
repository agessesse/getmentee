import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Activation: the bridge from approved applicant to member.
 *
 * WHAT PROBLEM THIS SOLVES. Before this, the only route to an account was
 * /signup — open registration that anyone could complete without applying, and
 * which produced a profile with no connection to the application the same
 * person had already filled in. Approval meant nothing, and one human could
 * end up as two unrelated records.
 *
 * THE SHAPE. Approving an application mints a token. The raw token is returned
 * exactly once, to the admin who approved it, and is never stored: the table
 * keeps only its SHA-256. The applicant follows the link, proves nothing more
 * than possession of it, and sets a password. The account is created under the
 * email recorded on the application, not one the visitor types, so a link
 * cannot be used to claim someone else's place.
 *
 * WHY NOT SUPABASE'S OWN INVITE. inviteUserByEmail needs transactional email
 * configured on the project, and it is not. Approvals would be minted and
 * silently never delivered. This works today, and the honest part is visible:
 * a human copies the link and sends it. When email is configured, only
 * delivery changes.
 *
 * server-only, so none of this can be pulled into a browser bundle.
 */

/** Long enough that guessing is not a strategy; URL-safe without encoding. */
const TOKEN_BYTES = 32;
const TTL_DAYS = 14;

export const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export interface MintedActivation {
  /** Shown once, to the approver. Never persisted. */
  token: string;
  expiresAt: string;
}

/**
 * Approve an application and mint its activation link.
 *
 * Writes the status and the token together. If an unused token already exists
 * it is replaced, so re-approving (or re-sending after a lost email) always
 * yields exactly one live link per application rather than a growing set.
 */
export async function approveAndMint(
  db: SupabaseClient,
  applicationId: string,
  email: string,
): Promise<MintedActivation | { error: string }> {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  const expiresAt = new Date(Date.now() + TTL_DAYS * 86_400_000).toISOString();

  // Old links for this application stop working the moment a new one is made.
  await db.from('activation_tokens').delete().eq('application_id', applicationId);

  const { error: tokenError } = await db.from('activation_tokens').insert({
    token_hash: hashToken(token),
    application_id: applicationId,
    email: email.trim().toLowerCase(),
    expires_at: expiresAt,
  });
  if (tokenError) return { error: tokenError.message };

  const { error: statusError } = await db
    .from('cohort_applications')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', applicationId);
  if (statusError) return { error: statusError.message };

  return { token, expiresAt };
}

export interface ResolvedActivation {
  applicationId: string;
  email: string;
  fullName: string;
  role: 'mentee' | 'mentor';
}

export type ActivationProblem =
  | 'not_found'   // no such token, or it was replaced
  | 'expired'
  | 'used'
  | 'already';    // the application already has an account

/**
 * Resolve a raw token to the application it belongs to.
 *
 * Read-only, so it is safe to call from the page that renders the form as well
 * as from the route that completes it. The four failure modes are distinct
 * because the page says something different and useful for each.
 */
export async function resolveActivation(
  db: SupabaseClient,
  token: string,
): Promise<ResolvedActivation | { problem: ActivationProblem }> {
  if (!token || token.length < 20) return { problem: 'not_found' };

  const { data: row } = await db
    .from('activation_tokens')
    .select('application_id, email, expires_at, used_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle();

  if (!row) return { problem: 'not_found' };
  if (row.used_at) return { problem: 'used' };
  if (new Date(row.expires_at).getTime() < Date.now()) return { problem: 'expired' };

  const { data: app } = await db
    .from('cohort_applications')
    .select('id, email, full_name, role, user_id')
    .eq('id', row.application_id)
    .maybeSingle();

  if (!app) return { problem: 'not_found' };
  if (app.user_id) return { problem: 'already' };

  return {
    applicationId: app.id as string,
    // The token's own email wins. The application is the record of who applied;
    // the token is the record of who we invited.
    email: row.email as string,
    fullName: (app.full_name as string) ?? '',
    role: (app.role as 'mentee' | 'mentor') ?? 'mentee',
  };
}

/** Marks a token spent. Called only after an account exists. */
export async function consumeActivation(db: SupabaseClient, token: string) {
  await db
    .from('activation_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token_hash', hashToken(token));
}

/**
 * Everything the application already told us, mapped onto the profile.
 *
 * The point of activating from an application is not re-typing it. School
 * becomes university, a mentor's role becomes their headline, and the two
 * fields that exist on both sides carry straight over.
 */
export function profileFromApplication(app: Record<string, unknown>) {
  const s = (k: string) => (typeof app[k] === 'string' ? (app[k] as string).trim() || null : null);
  const full = (s('full_name') ?? '').split(/\s+/);
  return {
    first_name: full[0] ?? '',
    last_name: full.slice(1).join(' '),
    headline: s('title'),
    location: s('location'),
    linkedin_url: s('linkedin_url'),
    university: s('school'),
  };
}
