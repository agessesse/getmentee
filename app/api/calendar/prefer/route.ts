import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { setPreferred } from '@/lib/calendar/connections';

export const dynamic = 'force-dynamic';

/** Choose which connected calendar new conversations are created in. */
export async function POST(request: NextRequest) {
  const provider = new URL(request.url).searchParams.get('provider');
  if (provider !== 'google' && provider !== 'microsoft') {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  await setPreferred(user.id, provider);
  return NextResponse.redirect(new URL('/profile/setup?calendar=preferred#calendar', request.url));
}
