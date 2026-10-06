import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import {
  googleCredentials, microsoftCredentials, providerConfigured,
  redirectUri, type Provider,
} from '@/lib/calendar/config';
import { saveConnection } from '@/lib/calendar/connections';

export const dynamic = 'force-dynamic';

const SETTINGS = '/profile/setup#calendar';

/**
 * Finish the OAuth handshake and store the credentials.
 *
 * ORDER MATTERS HERE. The state cookie is verified BEFORE the authorization
 * code is exchanged, so a forged callback never causes a token request at
 * all. Then the session is resolved from the user's own cookie, so the
 * connection is attached to whoever is actually signed in rather than to any
 * id present in the URL.
 *
 * Tokens are written straight into calendar_connections, which the browser
 * has no grant on, and nothing token-shaped is ever put in a redirect, a
 * query string or a response body.
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
  const url = new URL(request.url);

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`${SETTINGS}&calendar_error=${reason}`.replace('#calendar&', '?'), request.url));

  if (!providerConfigured(provider)) return fail('unavailable');

  // The user declined, or the provider refused.
  if (url.searchParams.get('error')) return fail('declined');

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return fail('invalid');

  const cookieName = `mentable_cal_state_${provider}`;
  const expected = request.cookies.get(cookieName)?.value;
  const actual = createHash('sha256').update(state).digest('hex');
  if (!expected || expected !== actual) return fail('state');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  const cred = provider === 'google' ? googleCredentials()! : microsoftCredentials()!;
  const tokenUrl = provider === 'google'
    ? 'https://oauth2.googleapis.com/token'
    : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

  let tokenRes: Response;
  try {
    tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cred.clientId,
        client_secret: cred.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri(provider),
      }),
    });
  } catch {
    return fail('network');
  }

  if (!tokenRes.ok) return fail('exchange');

  const token = (await tokenRes.json()) as {
    access_token?: string; refresh_token?: string; expires_in?: number; scope?: string;
  };
  if (!token.access_token) return fail('exchange');

  /*
    Which account was actually connected. Asked of the provider rather than
    assumed from the Mentable login, because people routinely connect a work
    calendar under a different address, and that address is what we would
    have to show them to explain where their events are going.
  */
  let accountEmail: string | null = null;
  try {
    const meRes = await fetch(
      provider === 'google'
        ? 'https://www.googleapis.com/oauth2/v2/userinfo'
        : 'https://graph.microsoft.com/v1.0/me',
      { headers: { Authorization: `Bearer ${token.access_token}` } },
    );
    if (meRes.ok) {
      const me = (await meRes.json()) as { email?: string; mail?: string; userPrincipalName?: string };
      accountEmail = me.email ?? me.mail ?? me.userPrincipalName ?? null;
    }
  } catch { /* identity is a nicety; the connection still works without it */ }

  const saved = await saveConnection({
    profileId: user.id,
    provider,
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? null,
    expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
    scope: token.scope ?? null,
    accountEmail,
  });

  const res = NextResponse.redirect(
    new URL(saved ? '/profile/setup?calendar=connected#calendar' : '/profile/setup?calendar_error=save', request.url),
  );
  res.cookies.delete(cookieName);
  return res;
}
