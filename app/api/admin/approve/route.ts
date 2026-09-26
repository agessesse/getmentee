import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin';
import { approveAndMint } from '@/lib/activation';
import { CANONICAL_SITE } from '@/lib/site';

/**
 * POST /api/admin/approve — approve an application and mint its activation link.
 *
 * Gated by requireAdmin() in this route itself rather than by the admin
 * layout, matching every other admin surface: a route that can create a
 * working account link should not depend on a parent component having run.
 *
 * The raw token is returned exactly once, here, and is never stored — the
 * table keeps only its SHA-256. If the admin loses the link, approving again
 * mints a fresh one and invalidates the old.
 *
 * Delivery is deliberately manual. Supabase transactional email is not
 * configured on this project, so anything that claimed to send the email
 * would be minting links that go nowhere. The admin copies the URL and sends
 * it. When email is configured, only this last step changes.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    const status = gate.reason === 'unauthenticated' ? 401 : gate.reason === 'forbidden' ? 403 : 503;
    return NextResponse.json({ error: 'Not permitted.' }, { status });
  }

  let body: { applicationId?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Could not read that request.' }, { status: 400 });
  }

  const applicationId = typeof body.applicationId === 'string' ? body.applicationId : '';
  if (!applicationId) {
    return NextResponse.json({ error: 'Missing application.' }, { status: 400 });
  }

  // The email is read from the row, never from the request, so an admin
  // cannot mint a link for an address the applicant did not give us.
  const { data: app } = await gate.db
    .from('cohort_applications')
    .select('id, email, full_name, user_id, status')
    .eq('id', applicationId)
    .maybeSingle();

  if (!app) return NextResponse.json({ error: 'No such application.' }, { status: 404 });
  if (app.user_id) {
    return NextResponse.json(
      { error: 'This applicant has already activated an account.' },
      { status: 409 },
    );
  }

  const minted = await approveAndMint(gate.db, app.id as string, app.email as string);
  if ('error' in minted) {
    console.error('[admin/approve] mint failed', minted.error);
    return NextResponse.json({ error: 'Could not create the activation link.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    email: app.email,
    fullName: app.full_name,
    url: `${CANONICAL_SITE}/activate?token=${minted.token}`,
    expiresAt: minted.expiresAt,
  });
}
