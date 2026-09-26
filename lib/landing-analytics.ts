import { trackEvent } from '@/lib/analytics';
import { trackPublicEvent } from '@/lib/public-analytics';
import { PUBLIC_EVENTS, type PublicEvent } from '@/lib/public-events';

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
    | 'opportunity_fund_clicked'
    // Founding cohort funnel. Subject to the same limitation as everything
    // above: an anonymous visitor writes nothing, so these record only for the
    // minority of applicants who already have an account.
    | 'cohort_cta_clicked'
    | 'cohort_application_started'
    | 'cohort_application_submitted'
    | 'founding_mentor_cta_clicked'
    /* The rest of the funnel, added once outreach made the bottom of it the
       part that mattered. These all reach public_events, so they record for
       logged-out visitors too. */
    | 'public_page_view'
    | 'apply_cta_clicked'
    | 'apply_started'
    | 'role_selected'
    | 'application_step_completed'
    | 'application_submitted'
    | 'login_started'
    | 'login_succeeded'
    | 'account_activation_started'
    | 'account_activated'
    | 'onboarding_completed'
    | 'first_meaningful_action',
  metadata: Record<string, string | number | boolean> = {}
): void {
  void trackEvent(event, 'mentee', { metadata });

  /*
    The four acquisition events also go to the anonymous path, because the
    call above records nothing for a logged-out visitor (see the note at the
    top). A signed-in visitor produces both rows; that is intended, and the two
    tables answer different questions — one is a user's own activity, the other
    is how many strangers reached the funnel.
  */
  if ((PUBLIC_EVENTS as readonly string[]).includes(event)) {
    /*
      One bounded string describing where this happened. `cta` for a button
      position, `role` for which path, and both together as 'mentor:2' for a
      step, which is how abandonment gets measured without touching a single
      word anyone typed.
    */
    const parts = [metadata.role, metadata.cta, metadata.step]
      .filter((v) => typeof v === 'string' || typeof v === 'number')
      .map(String);
    const surface = parts.length ? parts.join(':').slice(0, 60) : undefined;
    trackPublicEvent(event as PublicEvent, surface);
  }
}
