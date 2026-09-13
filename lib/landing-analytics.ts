import { trackEvent } from '@/lib/analytics';

/**
 * Landing-page conversion instrumentation.
 *
 * IMPORTANT LIMITATION: pilot_events.user_id is NOT NULL REFERENCES profiles(id)
 * and its RLS insert policy is `auth.uid() = user_id`, so an anonymous visitor
 * cannot write a row. trackEvent() already early-returns without a session.
 *
 * That means these calls only record for visitors who are ALREADY signed in and
 * happen to be on the marketing page — which is the minority of landing traffic.
 * Capturing genuine top-of-funnel conversion needs a separate anonymous-events
 * table (nullable user_id + anon insert policy + a client-generated visitor id).
 * That is a schema change, so it is deliberately not done here.
 *
 * The call sites are wired correctly, so swapping the transport below is the
 * only change required once such a table exists.
 */
export function trackLandingEvent(
  event:
    | 'landing_cta_clicked'
    | 'mentor_card_opened'
    | 'mentee_card_opened'
    | 'product_demo_interacted'
    | 'product_demo_stage_viewed'
    | 'landing_carousel_interacted'
    | 'opportunity_fund_clicked',
  metadata: Record<string, string | number | boolean> = {}
): void {
  void trackEvent(event, 'mentee', { metadata });
}
