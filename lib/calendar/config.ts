import 'server-only';

/**
 * Whether a calendar provider is actually usable in this deployment.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE: Mentable must never render a
 * "Connect Google Calendar" button that cannot work. An integration that
 * looks available and then dead-ends on a misconfigured OAuth client is
 * worse than one that is honestly absent, because the user blames
 * themselves and tries again.
 *
 * So provider availability is derived from whether the credentials exist,
 * server-side, and the UI is given a boolean. No credentials, no button.
 *
 * WHAT HAS TO BE PROVISIONED, by a human with console access:
 *
 *   Google    Cloud Console -> APIs & Services -> Credentials -> OAuth client
 *             (Web). Enable the Google Calendar API. Authorised redirect URI:
 *             <app>/api/calendar/google/callback
 *             -> GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *
 *   Microsoft Entra ID -> App registrations -> New registration, Web
 *             platform. Redirect URI:
 *             <app>/api/calendar/microsoft/callback
 *             Delegated Graph permissions: Calendars.ReadWrite,
 *             OnlineMeetings.ReadWrite, User.Read, offline_access
 *             -> MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET
 *
 * Neither can be created from here; both need the owner's account.
 */

export type Provider = 'google' | 'microsoft';

/*
  SCOPES ARE THE MINIMUM THAT WORKS, and deliberately not the convenient
  maximum.

  Google: calendar.events is per-event access, NOT the full `calendar` scope,
  which would grant read of every calendar the user owns including ones
  Mentable has no business seeing. userinfo.email identifies which account
  was connected, which matters because it is frequently not their Mentable
  login address.

  Microsoft: Calendars.ReadWrite is the narrowest scope that can create an
  event with attendees. OnlineMeetings.ReadWrite is required only to attach a
  Teams link. offline_access is what returns a refresh token at all.
*/
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
].join(' ');

export const MICROSOFT_SCOPES = [
  'offline_access',
  'openid',
  'email',
  'User.Read',
  'Calendars.ReadWrite',
  'OnlineMeetings.ReadWrite',
].join(' ');

export interface ProviderCredentials {
  clientId: string;
  clientSecret: string;
}

function creds(idVar: string, secretVar: string): ProviderCredentials | null {
  const clientId = process.env[idVar];
  const clientSecret = process.env[secretVar];
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export const googleCredentials = () => creds('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET');
export const microsoftCredentials = () => creds('MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET');

export function providerConfigured(p: Provider): boolean {
  return (p === 'google' ? googleCredentials() : microsoftCredentials()) !== null;
}

/** Which providers this deployment can offer at all. */
export function configuredProviders(): Provider[] {
  return (['google', 'microsoft'] as Provider[]).filter(providerConfigured);
}

/**
 * The app's own origin, for OAuth redirect URIs.
 *
 * Must match what is registered in the provider console exactly, so it is
 * read from configuration rather than from the incoming request: deriving it
 * from a Host header would let a forged host redirect an authorization code
 * somewhere else.
 */
export function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function redirectUri(p: Provider): string {
  return `${appOrigin()}/api/calendar/${p}/callback`;
}
