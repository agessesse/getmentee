import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import { notifyAdmins } from '@/lib/notify';
import { CANONICAL_SITE } from '@/lib/site';
import { isRole, validate, toColumns } from '@/lib/apply/schema';

/**
 * POST /api/apply — mentee and mentor applications.
 *
 * Replaces /api/founding-cohort/apply, which only understood students. The
 * security model is carried over unchanged: cohort_applications has RLS on
 * with no policies and no privileges for anon or authenticated, so a browser
 * cannot reach it. This route holds the service-role key and writes on the
 * applicant's behalf, which keeps a public write path out of the client bundle
 * and keeps other people's applications unreadable from any browser.
 *
 * Validation runs here as well as in the form, from the same lib/apply/schema
 * definitions, because a form is a convenience and never a control.
 *
 * REQUIRES MIGRATION 0026. The mentor columns and the role column do not exist
 * until it is applied. Written but deliberately not applied in this pass, so a
 * mentor submission will fail against the current production schema — see the
 * handover notes. Student submissions are unaffected either way.
 */

const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;

/*
  A small in-memory throttle. Not a security control — a process restart or a
  second instance clears it — but enough to stop one browser hammering submit,
  which is the realistic failure during outreach.
*/
function throttled(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  if (recent.size > 5_000) recent.clear();
  return hits.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  const serviceKey = getServiceRoleKey();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    // A configuration problem, not the applicant's problem. Say so without
    // describing the server.
    return NextResponse.json(
      { error: 'Applications aren’t available right now. Please try again shortly.' },
      { status: 503 },
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (throttled(ip)) {
    return NextResponse.json(
      { error: 'That’s a few submissions in a row. Give it a few minutes and try again.' },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'We couldn’t read that submission. Please try again.' }, { status: 400 });
  }

  const role = body.role;
  if (!isRole(role)) {
    return NextResponse.json({ error: 'Please choose how you’d like to take part.' }, { status: 400 });
  }

  const problem = validate(role, body);
  if (problem) {
    return NextResponse.json({ error: problem.message, field: problem.field }, { status: 400 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await admin.from('cohort_applications').insert(toColumns(role, body));

  if (error) {
    /*
      A second application from the same address and role is answered exactly
      like a first one. Telling the sender "you've already applied" would turn
      this endpoint into a way to test whether a given person has applied,
      which is not something a stranger should be able to find out.
    */
    if (error.code === '23505') {
      console.warn('[apply] duplicate application suppressed');
      return NextResponse.json({ ok: true }, { status: 201 });
    }
    console.error('[apply] insert failed', error);
    return NextResponse.json(
      { error: 'We couldn’t save your application. Please try again in a moment.' },
      { status: 500 },
    );
  }

  /*
    Awaited, so a serverless instance cannot be frozen before the request goes
    out, but it can only ever resolve: notifyAdmins swallows its own failures
    and returns immediately when no webhook is configured. The message
    deliberately carries nothing about the applicant beyond which queue to read.
  */
  await notifyAdmins(
    `New ${role} application. Review in Mentable Admin:`,
    `${CANONICAL_SITE}/admin/applications`,
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
