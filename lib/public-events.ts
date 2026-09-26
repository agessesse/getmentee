/**
 * The public funnel events, in one place.
 *
 * Shared by the client that sends them, the route that validates them and the
 * CHECK constraint in migration 0025 that stores them. Adding an event means
 * changing all three deliberately, which is the point: analytics that accepts
 * arbitrary client-supplied names is a free-text column with extra steps.
 */
export const PUBLIC_EVENTS = [
  /* The original four. Kept, not renamed: renaming would orphan the rows
     already collected and buy nothing. */
  'cohort_cta_clicked',
  'cohort_application_started',
  'cohort_application_submitted',
  'founding_mentor_cta_clicked',

  /* Reach. */
  'public_page_view',

  /* Application funnel, in order. `surface` carries the CTA position, the
     role, or 'role:step' — a position in a form, never anything written in
     one. */
  'apply_cta_clicked',
  'apply_started',
  'role_selected',
  'application_step_completed',
  'application_submitted',

  /* Returning members. */
  'login_started',
  'login_succeeded',

  /* Approved applicant becomes a member. */
  'account_activation_started',
  'account_activated',

  /* Whether membership led anywhere. */
  'onboarding_completed',
  'first_meaningful_action',
] as const;

export type PublicEvent = (typeof PUBLIC_EVENTS)[number];
