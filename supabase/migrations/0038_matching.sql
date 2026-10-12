-- ============================================================================
-- Migration 0038: matching — rationale, provenance, activation
-- ============================================================================
-- WHAT ALREADY EXISTS AND IS NOT BEING REBUILT
--
--   cohort_applications.status   submitted | reviewing | accepted | declined
--                                | withdrawn. The pipeline's Applied,
--                                Reviewing, Selected and Declined stages are
--                                these, renamed in the interface only.
--   mentorships                  already the relationship, already carries
--                                cohort_id and origin ('admin_created' is
--                                exactly what an operator match is).
--   cohort_memberships           already models belonging and lifecycle.
--
-- So Matched and Activated are NOT copied into the application row. A stage
-- that exists in two tables disagrees with itself within a week. The
-- pipeline derives those two from the relationship, which is where they
-- actually live.
--
-- THIS ADDS ONE STATUS AND FOUR COLUMNS.
--
-- WHY match_rationale IS A REAL COLUMN AND NOT A NOTE SOMEWHERE
--
-- The whole point is to be able to ask, a semester later:
--
--     why did we think this relationship would work?
--     did it actually work?
--
-- That comparison is the only proprietary thing matching can produce. It
-- requires the reasoning to sit on the relationship it explains, written at
-- the moment of the decision, durable and retrievable. Overloading a notes
-- field to dodge a migration would make the second question unanswerable.
--
-- match_concerns exists for the same reason and is arguably more valuable:
-- forcing an operator to name what might go wrong is what stops a rationale
-- from being a justification written after the fact.
--
-- ROLLBACK
--   ALTER TABLE public.mentorships ALTER COLUMN request_id SET NOT NULL;  -- only if no admin matches exist
--   ALTER TABLE public.mentorships
--     DROP COLUMN IF EXISTS match_rationale, DROP COLUMN IF EXISTS match_concerns,
--     DROP COLUMN IF EXISTS matched_by, DROP COLUMN IF EXISTS activated_at;
--   ALTER TABLE public.cohort_applications DROP CONSTRAINT IF EXISTS cohort_applications_status_check;
--   ALTER TABLE public.cohort_applications ADD CONSTRAINT cohort_applications_status_check
--     CHECK (status IN ('submitted','reviewing','accepted','declined','withdrawn'));
-- ============================================================================

-- ── 1. Hold, without cluttering the primary flow ────────────────────────────
/*
  'hold' is a real operator state: a strong applicant we are not declining
  and cannot yet place. Without it an operator either declines somebody they
  want, or leaves them in Reviewing and loses track of why.
*/
ALTER TABLE public.cohort_applications
  DROP CONSTRAINT IF EXISTS cohort_applications_status_check;

ALTER TABLE public.cohort_applications
  ADD CONSTRAINT cohort_applications_status_check
  CHECK (status IN ('submitted', 'reviewing', 'accepted', 'hold', 'declined', 'withdrawn'));

-- ── 2. A match does not require a request ───────────────────────────────────
/*
  THE REASON MATCHING HAS NEVER EXISTED IN THIS PRODUCT.

  mentorships.request_id is NOT NULL, from migration 0002, when the only way
  a relationship could begin was a student asking a mentor and the mentor
  accepting. Every mentorship was downstream of a mentorship_requests row.

  An operator-created match has no request. The student did not ask for this
  mentor; a human decided the pairing. Migration 0030 already anticipated
  this by adding origin = 'admin_created', but the NOT NULL was never
  relaxed, so the insert fails and no match can be created at all.

  The alternative would be to write a mentorship_requests row to satisfy the
  constraint, which would be a record of a request that never happened,
  attributed to a student who never made it. `origin` exists precisely to
  tell these two apart; faking the request would destroy that distinction.

  So the column becomes nullable. NULL request_id now means exactly what it
  should: this relationship was created by an operator, not asked for.
*/
ALTER TABLE public.mentorships ALTER COLUMN request_id DROP NOT NULL;

COMMENT ON COLUMN public.mentorships.request_id IS
  'The request that produced this relationship, when a student asked. NULL for an operator-created match, where origin is admin_created.';

-- ── 3. Why we made this match ───────────────────────────────────────────────
ALTER TABLE public.mentorships
  ADD COLUMN IF NOT EXISTS match_rationale TEXT
    CHECK (match_rationale IS NULL OR char_length(match_rationale) <= 2000),
  ADD COLUMN IF NOT EXISTS match_concerns TEXT
    CHECK (match_concerns IS NULL OR char_length(match_concerns) <= 2000),
  -- Who decided. At n=10 every match has a named human behind it.
  ADD COLUMN IF NOT EXISTS matched_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  /*
    ACTIVATION, as a timestamp rather than a boolean.

    Matched is when the operator created the pairing: started_at already
    records that. Activated is when the relationship actually began, and
    knowing WHEN is what makes the activation window measurable at all --
    a boolean cannot tell you whether it happened inside fourteen days.
  */
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS mentorships_activated_idx
  ON public.mentorships (cohort_id, activated_at) WHERE cohort_id IS NOT NULL;

COMMENT ON COLUMN public.mentorships.match_rationale IS
  'Why the operator paired these two, written at the moment of the decision. Retrievable later so "why we thought this would work" can be compared against what happened. Visible to operators; never rendered to participants.';
COMMENT ON COLUMN public.mentorships.match_concerns IS
  'What might not work. Recorded so a rationale has to be a judgement rather than a justification.';
COMMENT ON COLUMN public.mentorships.activated_at IS
  'When the relationship actually began, per the activation rule. NULL means matched but not yet started.';

-- ── 4. Security ─────────────────────────────────────────────────────────────
/*
  No grant changes and no policy changes.

  mentorships already grants UPDATE table-wide to authenticated, so the new
  columns inherit it and the 0035 class of bug cannot recur here. RLS still
  scopes every row to its two participants.

  The operator writes these through a service-role admin route, which is the
  only path that can set matched_by honestly: a participant must never be
  able to write their own match rationale, and nothing in the participant
  product reads these columns.
*/
REVOKE ALL ON public.cohort_applications FROM anon, authenticated;
