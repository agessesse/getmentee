import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import { PUBLIC_EVENTS, type PublicEvent } from '@/lib/public-events';

/**
 * POST /api/events — anonymous public funnel events.
 *
 * The only writer to public.public_events. The table grants nothing to anon or
 * authenticated, so this route is the whole write path, and it validates
 * before inserting: an event name not on the allowlist is dropped, and every
 * other field is bounded and sanitised here as well as by a CHECK constraint.
 *
 * It answers 204 to everything, including things it discards. Analytics must
 * never become a side channel — a client that could tell a rejected event from
 * an accepted one could use this endpoint to probe the server, and a visitor
 * gains nothing from the difference either way.
 */

const MAX = { path: 200, referrer_host: 120, surface: 60 } as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/*
  Per-IP ceiling. Analytics is the one public endpoint worth spamming, since a
  flood costs us storage and makes the numbers useless. This is in-memory, so
  it resets with the process — enough for accidental loops and casual abuse,
  which is the realistic threat at this size.
*/
const recent = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;

function throttled(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  if (recent.size > 10_000) recent.clear();
  return hits.length > MAX_PER_WINDOW;
}

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim().slice(0, max);
  return t || null;
};

const NO_CONTENT = new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  const serviceKey = getServiceRoleKey();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) return NO_CONTENT;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (throttled(ip)) return NO_CONTENT;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NO_CONTENT;
  }

  const event = typeof body.event === 'string' ? body.event : '';
  if (!(PUBLIC_EVENTS as readonly string[]).includes(event)) return NO_CONTENT;

  // A path, never a URL: anything with a scheme or a query string is trimmed
  // down, so a full location with search parameters cannot be stored.
  const rawPath = clean(body.path, MAX.path);
  const path = rawPath ? rawPath.split('?')[0].replace(/^https?:\/\/[^/]+/i, '') || '/' : null;

  const session = typeof body.session_id === 'string' && UUID_RE.test(body.session_id)
    ? body.session_id
    : null;

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await admin.from('public_events').insert({
    event: event as PublicEvent,
    path,
    referrer_host: clean(body.referrer_host, MAX.referrer_host),
    surface: clean(body.surface, MAX.surface),
    session_id: session,
  });

  // A failed analytics write is never the visitor's problem and never changes
  // what they see.
  if (error) console.error('[events] insert failed', error.message);
  return NO_CONTENT;
}
