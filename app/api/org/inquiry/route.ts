import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import { notifyAdmins } from '@/lib/notify';
import { CANONICAL_SITE } from '@/lib/site';

/**
 * POST /api/org/inquiry — "bring Mentable to your community".
 *
 * Public and unauthenticated, so it is the one new write path a stranger can
 * reach. organization_inquiries has RLS on with no policies and no grants, so
 * this route is the only writer and nothing client-side can read a single
 * row back. Same shape as /api/apply, which has been in production since
 * 0024.
 */

const MAX = { full_name: 120, email: 320, organization: 200, title: 160, community: 600, participants: 60, goal: 2000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;

function throttled(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  if (recent.size > 5_000) recent.clear();
  return hits.length > MAX_PER_WINDOW;
}

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

export async function POST(req: NextRequest) {
  const serviceKey = getServiceRoleKey();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json({ error: 'Not available right now. Please try again shortly.' }, { status: 503 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (throttled(ip)) {
    return NextResponse.json({ error: 'That’s a few in a row. Give it a few minutes.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'We couldn’t read that. Please try again.' }, { status: 400 });
  }

  const full_name = clean(body.full_name, MAX.full_name);
  const email = clean(body.email, MAX.email).toLowerCase();
  const organization = clean(body.organization, MAX.organization);

  if (!full_name) return NextResponse.json({ error: 'Please add your name.', field: 'full_name' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Please add an email we can reply to.', field: 'email' }, { status: 400 });
  if (!organization) return NextResponse.json({ error: 'Please add your organization.', field: 'organization' }, { status: 400 });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await admin.from('organization_inquiries').insert({
    full_name, email, organization,
    title: clean(body.title, MAX.title) || null,
    community: clean(body.community, MAX.community) || null,
    participants: clean(body.participants, MAX.participants) || null,
    goal: clean(body.goal, MAX.goal) || null,
  });

  if (error) {
    console.error('[org/inquiry] insert failed', error.message);
    return NextResponse.json({ error: 'We couldn’t save that. Please try again in a moment.' }, { status: 500 });
  }

  // Carries no detail about the sender beyond which queue to read.
  await notifyAdmins('New organization inquiry. Review in Mentable Admin:', `${CANONICAL_SITE}/admin/inquiries`);

  return NextResponse.json({ ok: true }, { status: 201 });
}
