import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { configuredProviders } from '@/lib/calendar/config';
import { listConnectionSummaries } from '@/lib/calendar/connections';

export const dynamic = 'force-dynamic';

/**
 * What the browser is allowed to know about calendar connections.
 *
 * SUMMARIES ONLY. The response contains the provider, the connected account
 * address and which one is the default. It does NOT contain access tokens,
 * refresh tokens, expiry or scope, and the type that carries it
 * (ConnectionSummary) has no field for them, so a future edit cannot leak
 * one by widening a select.
 *
 * Scoped to the caller's own session. There is no profile id parameter, so
 * there is nothing to tamper with.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  return NextResponse.json({
    configured: configuredProviders(),
    connections: await listConnectionSummaries(user.id),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
