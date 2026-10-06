import 'server-only';
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import {
  googleCredentials, microsoftCredentials, providerConfigured,
  type Provider,
} from '@/lib/calendar/config';

/**
 * Account-level calendar credentials.
 *
 * WHY SERVICE ROLE, AND WHY THAT IS THE SAFE CHOICE HERE. calendar_connections
 * has RLS on with zero policies and zero grants to anon or authenticated
 * (0033). The browser cannot read it under any session, which is the point:
 * these are OAuth refresh tokens for somebody's real calendar. The only way
 * to reach them is a server route that has already resolved the caller's id
 * from their session, and every function below takes that id as its first
 * argument rather than accepting one from a request body.
 *
 * NOTHING IN THIS FILE IS IMPORTABLE FROM THE BROWSER. server-only makes
 * that a build error rather than a code review.
 */

export interface Connection {
  id: string;
  profileId: string;
  provider: Provider;
  accountEmail: string | null;
  calendarId: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  isPreferred: boolean;
}

/** What the browser is allowed to know about a connection. Never a token. */
export interface ConnectionSummary {
  provider: Provider;
  accountEmail: string | null;
  isPreferred: boolean;
}

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

type Row = {
  id: string; profile_id: string; provider: Provider; account_email: string | null;
  calendar_id: string | null; access_token: string; refresh_token: string | null;
  expires_at: string | null; is_preferred: boolean;
};

const toConnection = (r: Row): Connection => ({
  id: r.id, profileId: r.profile_id, provider: r.provider, accountEmail: r.account_email,
  calendarId: r.calendar_id, accessToken: r.access_token, refreshToken: r.refresh_token,
  expiresAt: r.expires_at, isPreferred: r.is_preferred,
});

/** Live connections for one person. Revoked rows are excluded. */
export async function listConnections(profileId: string): Promise<Connection[]> {
  const c = db();
  if (!c) return [];
  const { data } = await c
    .from('calendar_connections')
    .select('*')
    .eq('profile_id', profileId)
    .is('revoked_at', null);
  return ((data ?? []) as Row[]).map(toConnection);
}

/** The safe shape, for rendering settings. */
export async function listConnectionSummaries(profileId: string): Promise<ConnectionSummary[]> {
  return (await listConnections(profileId)).map((c) => ({
    provider: c.provider, accountEmail: c.accountEmail, isPreferred: c.isPreferred,
  }));
}

/**
 * Which provider should create this person's events.
 *
 * NEVER INFERRED FROM AN EMAIL DOMAIN. A @unc.edu address is Google Workspace
 * at one university and Microsoft 365 at the next, and a @gmail.com login can
 * belong to somebody whose work calendar is Outlook. The authoritative answer
 * is the account they actually connected, and when they connected two, the
 * one they marked preferred.
 */
export function pickProvider(connections: Connection[]): Connection | null {
  if (connections.length === 0) return null;
  if (connections.length === 1) return connections[0];
  return connections.find((c) => c.isPreferred) ?? connections[0];
}

export async function setPreferred(profileId: string, provider: Provider): Promise<boolean> {
  const c = db();
  if (!c) return false;
  await c.from('calendar_connections').update({ is_preferred: false, updated_at: new Date().toISOString() })
    .eq('profile_id', profileId);
  const { error } = await c.from('calendar_connections')
    .update({ is_preferred: true, updated_at: new Date().toISOString() })
    .eq('profile_id', profileId).eq('provider', provider);
  return !error;
}

export async function saveConnection(input: {
  profileId: string; provider: Provider; accessToken: string; refreshToken: string | null;
  expiresAt: string | null; scope: string | null; accountEmail: string | null;
}): Promise<boolean> {
  const c = db();
  if (!c) return false;

  // First connection becomes preferred by default, so a single-provider user
  // is never asked to make a choice they do not have.
  const existing = await listConnections(input.profileId);
  const isFirst = existing.length === 0;

  const { error } = await c.from('calendar_connections').upsert({
    profile_id: input.profileId,
    provider: input.provider,
    access_token: input.accessToken,
    /*
      A provider may omit the refresh token on RE-consent (Google only
      returns it on the first grant unless prompt=consent). Overwriting the
      stored one with null would silently break refresh a week later, so it
      is only written when present.
    */
    ...(input.refreshToken ? { refresh_token: input.refreshToken } : {}),
    expires_at: input.expiresAt,
    scope: input.scope,
    account_email: input.accountEmail,
    is_preferred: isFirst,
    revoked_at: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'profile_id,provider' });

  return !error;
}

export async function disconnect(profileId: string, provider: Provider): Promise<boolean> {
  const c = db();
  if (!c) return false;
  /*
    Hard delete, not a revoked_at tombstone. The row's reason for existing is
    the token it holds; keeping a disconnected row keeps a live refresh token
    for a calendar the user has told us to let go of.
  */
  const { error } = await c.from('calendar_connections')
    .delete().eq('profile_id', profileId).eq('provider', provider);
  return !error;
}

/** Mark a connection unusable after the provider rejects its credentials. */
export async function markRevoked(profileId: string, provider: Provider): Promise<void> {
  const c = db();
  if (!c) return;
  await c.from('calendar_connections')
    .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('profile_id', profileId).eq('provider', provider);
}

const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const MS_TOKEN = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

/**
 * A usable access token, refreshing first if it is close to expiring.
 *
 * Returns null when the credentials can no longer be used, having marked the
 * connection revoked. Callers must treat null as "this person needs to
 * reconnect" and must NOT report a meeting as scheduled.
 *
 * The 60-second margin exists because a token that is valid when we check and
 * expired when the API call lands is the single most common intermittent
 * failure in this kind of integration.
 */
export async function freshAccessToken(conn: Connection): Promise<string | null> {
  const stillValid =
    conn.expiresAt && new Date(conn.expiresAt).getTime() - Date.now() > 60_000;
  if (stillValid) return conn.accessToken;
  if (!conn.refreshToken) {
    await markRevoked(conn.profileId, conn.provider);
    return null;
  }
  if (!providerConfigured(conn.provider)) return null;

  const cred = conn.provider === 'google' ? googleCredentials() : microsoftCredentials();
  if (!cred) return null;

  const body = new URLSearchParams({
    client_id: cred.clientId,
    client_secret: cred.clientSecret,
    refresh_token: conn.refreshToken,
    grant_type: 'refresh_token',
  });

  let res: Response;
  try {
    res = await fetch(conn.provider === 'google' ? GOOGLE_TOKEN : MS_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch {
    // A network failure is not a revoked grant. Leave the connection alone
    // so a transient outage does not force everybody to reconnect.
    return null;
  }

  if (!res.ok) {
    // 400 invalid_grant means the user revoked access or changed password.
    if (res.status === 400 || res.status === 401) {
      await markRevoked(conn.profileId, conn.provider);
    }
    return null;
  }

  const json = (await res.json()) as {
    access_token?: string; refresh_token?: string; expires_in?: number;
  };
  if (!json.access_token) return null;

  const expiresAt = json.expires_in
    ? new Date(Date.now() + json.expires_in * 1000).toISOString()
    : null;

  const c = db();
  if (c) {
    await c.from('calendar_connections').update({
      access_token: json.access_token,
      ...(json.refresh_token ? { refresh_token: json.refresh_token } : {}),
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }).eq('id', conn.id);
  }

  return json.access_token;
}
