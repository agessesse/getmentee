-- ============================================================================
-- Migration 0028: the whole funnel, not just the top of it
-- ============================================================================
-- WHY
--
-- 0025 allowed four events, all of them clicks near the top of the funnel.
-- They answer "did anyone press the button" and nothing after it. With
-- outreach starting, the questions that matter are further down: which role
-- people choose, which step they abandon, how many approved applicants ever
-- activate, and whether an activated member does anything at all.
--
-- The four original names are kept rather than renamed. Renaming would orphan
-- the rows already collected for no benefit, and the new names sit beside them.
--
-- WHAT IS STILL NOT COLLECTED
--
-- Unchanged from 0025, and worth restating because this list grew: no email,
-- no name, no school, no answer text, no IP, no user agent, no cookie. The
-- event name remains a fixed allowlist rather than free text, so a client
-- cannot smuggle content into this table by inventing an event. `surface`
-- stays bounded and is set by the application's own call sites, never by
-- anything a visitor types.
--
-- Abandonment is measured by which step last completed, so the step number
-- travels in `surface` (e.g. 'mentor:2'). That is a position in a form, not
-- anything a person wrote in it.
--
-- ROLLBACK
--   ALTER TABLE public.public_events DROP CONSTRAINT public_events_event_check;
--   ALTER TABLE public.public_events ADD CONSTRAINT public_events_event_check
--     CHECK (event IN ('cohort_cta_clicked','cohort_application_started',
--                      'cohort_application_submitted','founding_mentor_cta_clicked'));
-- ============================================================================

ALTER TABLE public.public_events
  DROP CONSTRAINT IF EXISTS public_events_event_check;

ALTER TABLE public.public_events
  ADD CONSTRAINT public_events_event_check CHECK (event IN (
    -- Original four, kept so existing rows stay valid.
    'cohort_cta_clicked',
    'cohort_application_started',
    'cohort_application_submitted',
    'founding_mentor_cta_clicked',

    -- Reach: how many people saw a public page at all.
    'public_page_view',

    -- Application funnel.
    'apply_cta_clicked',
    'apply_started',
    'role_selected',
    'application_step_completed',
    'application_submitted',

    -- Returning members.
    'login_started',
    'login_succeeded',

    -- Approved applicant becomes a member.
    'account_activation_started',
    'account_activated',

    -- Did becoming a member lead to anything.
    'onboarding_completed',
    'first_meaningful_action'
  ));

COMMENT ON COLUMN public.public_events.surface IS
  'Which call site fired the event: a CTA position (''hero'', ''final''), a role, or a role and step (''mentor:2''). Bounded, set by the application, never free text from a visitor.';
