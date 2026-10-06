import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import {
  googleCredentials, microsoftCredentials, providerConfigured,
  redirectUri, GOOGLE_SCOPES, MICROSOFT_SCOPES, type Provider,
} from '@/lib/calendar/config';

export const dynamic = 'force-dynamic';

/**
 * Begin the OAuth handshake.
 *
 * CSRF PROTECTION IS THE WHOLE REASON THIS IS A ROUTE AND NOT A LINK. The
 * `state` parameter is 32 random bytes, stored as an httpOnly cookie and
 * compared on the way back. Without it, an attacker can complete an
 * authorization flow in their own browser and have the victim's Mentable
 * account end up connected to the ATTACKER's calendar, which quietly turns
 * into a feed of the victim's meetings.
 *
 * The cookie holds the hash, not the value, for the same reason
 * program_invitations stores a hash: a cookie that leaks should not be
 * replayable.
 *
 * Nothing about the provider is taken from the client beyond which of the two
 * it is, and that is matched against a fixed list.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: raw } = await params;
  if (raw !== 'google' && raw !== 'microsoft') {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 404 });
  }
  const provider = raw as Provider;

  // Fail closed and say so. Never redirect somebody into a broken consent
  // screen because an environment variable is missing.
  if (!providerConfigured(provider)) {
    return NextResponse.redirect(new URL('/profile/setup?calendar=unavailable', request.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  const state = randomBytes(32).toString('hex');
  const stateHash = createHash('sha256').update(state).digest('hex');

  const cred = provider === 'google' ? googleCredentials()! : microsoftCredentials()!;

  const authUrl = new URL(
    provider === 'google'
      ? 'https://accounts.google.com/o/oauth2/v2/auth'
      : 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  );
  authUrl.searchParams.set('client_id', cred.clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri(provider));
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', provider === 'google' ? GOOGLE_SCOPES : MICROSOFT_SCOPES);
  authUrl.searchParams.set('state', state);
  if (provider === 'google') {
    // offline + consent is the only combination that reliably returns a
    // refresh token on re-authorisation. Without it a reconnect yields an
    // access token that expires in an hour and never renews.
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('include_granted_scopes', 'true');
  } else {
    authUrl.searchParams.set('response_mode', 'query');
  }

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set(`mentable_cal_state_${provider}`, stateHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return res;
}
