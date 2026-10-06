import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { disconnect } from '@/lib/calendar/connections';

export const dynamic = 'force-dynamic';

/**
 * Let go of a calendar.
 *
 * POST, not GET, because it is destructive and a GET would be triggerable by
 * any image tag on any page. The provider is read from the query string and
 * matched against a fixed list; the PROFILE is read from the session and
 * never from the request, so this can only ever disconnect the caller's own
 * connection.
 */
export async function POST(request: NextRequest) {
  const provider = new URL(request.url).searchParams.get('provider');
  if (provider !== 'google' && provider !== 'microsoft') {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  await disconnect(user.id, provider);
  return NextResponse.redirect(new URL('/profile/setup?calendar=disconnected#calendar', request.url));
}
