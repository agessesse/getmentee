-- ============================================================================
-- Migration 0025: anonymous public funnel events
-- ============================================================================
-- WHY
--
-- pilot_events.user_id is NOT NULL REFERENCES profiles(id) and its INSERT
-- policy is auth.uid() = user_id, so a logged-out visitor cannot write a row.
-- Every landing-page event therefore recorded only for people who already had
-- an account — the minority of public traffic, and precisely the wrong half
-- for measuring acquisition. Mentable is about to be shared publicly, so the
-- four events that matter are the ones a stranger generates before signing up.
--
-- This adds a separate table rather than relaxing pilot_events. That table's
-- semantics (an authenticated user's own activity, readable by them) are
-- correct and are left exactly as they are.
--
-- WHAT IS DELIBERATELY NOT COLLECTED
--
--   * No email address, name, or any application answer. The apply route and
--     this table never see each other's data.
--   * No IP address, no user agent, no fingerprint, no cookie.
--   * No free-text from the client. `event` is constrained to a fixed list by
--     a CHECK, so a compromised or curious client cannot invent event names or
--     smuggle content into the analytics table.
--   * No full referrer. Only the host, because a full referrer URL can carry
--     search queries and personal identifiers in its query string.
--
-- WHAT IS COLLECTED, AND WHY EACH FIELD EARNS ITS PLACE
--
--   event        which of four things happened. Fixed allowlist.
--   path         which page it happened on, so we can tell the hero CTA from
--                the footer one. Capped and stored as a path, never a URL.
--   referrer_host  'instagram.com' or 'linkedin.com' — the entire point of the
--                exercise is knowing which post sent someone.
--   session_id   a random id held in sessionStorage for one browsing session.
--                Without it, "40 clicks" cannot be told apart from "one person
--                clicking 40 times". It is not a cookie, does not survive the
--                tab closing, is never joined to an account, and carries
--                nothing about the person.
--
-- SECURITY MODEL — identical to cohort_applications (0024)
--
-- RLS on, no policies, no grants to anon or authenticated. The only writer is
-- /api/events, a server route holding the service-role key, which validates
-- the event against the same allowlist before inserting. Nothing client-side
-- can read these rows, so this cannot become a way to enumerate traffic.
--
-- Granting anon INSERT would have been simpler and is the common pattern. It
-- is rejected here because it hands the public key a write path into the
-- database that anyone can see in a network tab, with no way to validate or
-- rate-limit before the row lands.
--
-- ROLLBACK
--   DROP TABLE IF EXISTS public.public_events;
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.public_events (
  id             BIGSERIAL   PRIMARY KEY,

  event          TEXT        NOT NULL CHECK (event IN (
                               'cohort_cta_clicked',
                               'cohort_application_started',
                               'cohort_application_submitted',
                               'founding_mentor_cta_clicked'
                             )),

  -- Where it happened, and where the visitor came from. Both bounded.
  path           TEXT        CHECK (path IS NULL OR char_length(path) <= 200),
  referrer_host  TEXT        CHECK (referrer_host IS NULL OR char_length(referrer_host) <= 120),

  -- Which CTA on the page, e.g. 'hero' or 'final'. Bounded, and set by the
  -- application's own call sites rather than by anything a visitor types.
  surface        TEXT        CHECK (surface IS NULL OR char_length(surface) <= 60),

  -- Per-session, per-tab, random. Not an identity.
  session_id     UUID,

  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS public_events_event_time_idx
  ON public.public_events (event, created_at DESC);

ALTER TABLE public.public_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.public_events FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.public_events_id_seq FROM anon, authenticated;

COMMENT ON TABLE public.public_events IS
  'Anonymous public funnel events. Written only by the service-role route /api/events, which validates against a fixed event allowlist. No PII: no email, name, IP, user agent or application content. session_id is a per-tab random value, never joined to an account.';
