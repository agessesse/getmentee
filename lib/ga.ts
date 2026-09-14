/**
 * GA4 custom events for the pilot funnel.
 *
 * Division of labour with pilot_events: that table cannot record anonymous
 * visitors at all (user_id is NOT NULL with an auth.uid() = user_id insert
 * policy), so it can never see the top of the funnel. GA4 covers acquisition
 * and the signup funnel; pilot_events keeps the detailed in-product behaviour.
 * Neither mirrors the other.
 *
 * Nothing here sends page_view — Enhanced Measurement already does, including
 * App Router history navigation. See components/analytics/GoogleAnalytics.tsx.
 */

type GaEvent =
  | 'sign_up_started'
  | 'sign_up_completed'
  | 'mentor_discovery_viewed'
  | 'mentor_profile_viewed'
  | 'mentorship_request_started'
  | 'mentorship_request_submitted';

/**
 * Only these keys may reach Google, and only with values drawn from a fixed
 * vocabulary. Anything describing a person — name, email, bio, message text,
 * goals, or a Supabase UUID — is absent by construction rather than by
 * remembering to strip it at each call site.
 */
type GaParams = {
  role?: 'mentee' | 'mentor';
  cta_location?: string;
  request_status?: 'started' | 'submitted';
  mentor_kind?: 'founding' | 'preview';
  result_count?: number;
};

const ALLOWED_KEYS: readonly (keyof GaParams)[] = [
  'role',
  'cta_location',
  'request_status',
  'mentor_kind',
  'result_count',
];

// Guards against a UUID or an email slipping through a string parameter.
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export function trackGa(event: GaEvent, params: GaParams = {}): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (!gtag) return;

  const safe: Record<string, string | number> = {};
  for (const key of ALLOWED_KEYS) {
    const value = params[key];
    if (value === undefined) continue;
    if (typeof value === 'number') {
      safe[key] = value;
      continue;
    }
    if (typeof value !== 'string') continue;
    if (UUID.test(value) || EMAIL.test(value)) continue;
    safe[key] = value.slice(0, 64);
  }

  gtag('event', event, safe);
}
