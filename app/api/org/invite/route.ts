import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { resolveOrgAccess, canMutateProgram, cohortBelongsToOrg } from '@/lib/org/access';
import { CANONICAL_SITE } from '@/lib/site';

/**
 * POST /api/org/invite — mint a programme invitation.
 *
 * AUTHORIZATION, IN ORDER, AND ALL OF IT SERVER-SIDE.
 *   1. resolveOrgAccess proves the caller administers this organisation.
 *   2. cohortBelongsToOrg proves the cohort is inside that organisation,
 *      which is the check that stops an admin of A inviting into B.
 *   3. canMutateProgram proves they are not a viewer and, for a delegated
 *      admin, that this programme is one of theirs.
 *
 * Only then is a token minted. The organisationId in the body is a claim
 * checked at step 1, never a grant.
 *
 * The token itself follows activation_tokens (0027): 32 random bytes, stored
 * only as SHA-256, single use, expiring, bound to the invited address.
 */

const TTL_DAYS = 14;
const ROLES = new Set(['mentee', 'mentor', 'program_admin']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Could not read that request.' }, { status: 400 });
  }

  const organizationId = typeof body.organizationId === 'string' ? body.organizationId : '';
  const cohortId = typeof body.cohortId === 'string' ? body.cohortId : '';
  const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
  const role = typeof body.role === 'string' ? body.role : '';

  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!ROLES.has(role)) return NextResponse.json({ error: 'Choose a role.' }, { status: 400 });

  const access = await resolveOrgAccess(organizationId);
  if (!access.ok) {
    const status = access.reason === 'unauthenticated' ? 401 : access.reason === 'forbidden' ? 403 : 503;
    return NextResponse.json({ error: 'Not permitted.' }, { status });
  }

  const belongs = await cohortBelongsToOrg(access.db, cohortId, organizationId);
  if (!belongs.ok) return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  if (!canMutateProgram(access, belongs.programId!)) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + TTL_DAYS * 86_400_000).toISOString();

  // Replace any live invitation for the same person and cohort, so there is
  // always exactly one working link rather than a growing set.
  await access.db
    .from('program_invitations')
    .delete()
    .eq('cohort_id', cohortId)
    .eq('email', email)
    .is('accepted_at', null);

  const { error } = await access.db.from('program_invitations').insert({
    token_hash: tokenHash,
    cohort_id: cohortId,
    email,
    role,
    invited_by: access.profileId,
    expires_at: expiresAt,
  });

  if (error) {
    console.error('[org/invite] insert failed', error.message);
    return NextResponse.json({ error: 'Could not create the invitation.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    url: `${CANONICAL_SITE}/invite?token=${token}`,
    expiresAt,
  });
}
