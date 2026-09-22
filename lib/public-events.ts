/**
 * The four public funnel events, in one place.
 *
 * Shared by the client that sends them, the route that validates them and the
 * CHECK constraint in migration 0025 that stores them. Adding an event means
 * changing all three deliberately, which is the point: analytics that accepts
 * arbitrary client-supplied names is a free-text column with extra steps.
 */
export const PUBLIC_EVENTS = [
  'cohort_cta_clicked',
  'cohort_application_started',
  'cohort_application_submitted',
  'founding_mentor_cta_clicked',
] as const;

export type PublicEvent = (typeof PUBLIC_EVENTS)[number];
