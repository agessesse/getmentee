-- ============================================================================
-- Migration 0039: atomic accept, operator matches, relationship outcomes
-- ============================================================================
-- Three things that all require DDL, consolidated so they can be applied in
-- a single paste. Nothing here is destructive; every statement is additive
-- or a CREATE OR REPLACE.
--
-- ── 1. THE MISSING FUNCTION ────────────────────────────────────────────────
-- 0018 defines approve_mentorship_request() but it is NOT PRESENT in the
-- database -- verified by invoking it as an authenticated mentor, which
-- answers "could not find the function", while 0018's other half (the
-- profiles.email revoke) IS live. The migration applied partially.
--
-- Until this exists, accepting runs as two writes from a server action with
-- a compensating revert: correct in outcome, not atomic. This restores the
-- lock-and-insert in one transaction.
--
-- ── 2. OPERATOR-CREATED MATCHES (the narrowed 0038) ────────────────────────
-- mentorships.request_id is NOT NULL, from 0002, when the only way a
-- relationship could start was a student asking. An operator match has no
-- request; writing a fake one would record something that never happened and
-- destroy the distinction `origin` exists to draw.
--
-- Narrowed per instruction: this adds ONLY what operator matches need. The
-- member path keeps using mentorship_requests and is untouched.
--
-- ── 3. RELATIONSHIP OUTCOMES ───────────────────────────────────────────────
-- Nothing currently feeds results back into matching. `reviews` exists but
-- is a session-scoped star rating with one integer and one text field; two
-- distinct structured questions per side do not fit it without overloading
-- columns, which is how data becomes unreadable a year later.
--
-- ROLLBACK
--   DROP TABLE IF EXISTS public.relationship_outcomes;
--   ALTER TABLE public.mentorships ALTER COLUMN request_id SET NOT NULL;
--   ALTER TABLE public.mentorships
--     DROP COLUMN IF EXISTS match_rationale, DROP COLUMN IF EXISTS match_concerns,
--     DROP COLUMN IF EXISTS matched_by, DROP COLUMN IF EXISTS activated_at;
--   DROP FUNCTION IF EXISTS public.approve_mentorship_request(UUID);
-- ============================================================================

-- ── 1. Atomic acceptance ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_mentorship_request(p_request_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_request public.mentorship_requests; v_max INT; v_active INT; v_id UUID;
BEGIN
  -- FOR UPDATE is what makes two simultaneous approvals impossible: the
  -- second waits, then fails the status check below.
  SELECT * INTO v_request FROM public.mentorship_requests WHERE id = p_request_id FOR UPDATE;
  IF v_request.id IS NULL THEN RAISE EXCEPTION 'Request not found.'; END IF;
  -- The caller must be the mentor it was addressed to. This is what makes
  -- the mentee_id below trustworthy: it comes from the row, never the caller.
  IF v_request.mentor_id <> auth.uid() THEN RAISE EXCEPTION 'Not authorised.'; END IF;
  IF v_request.status <> 'pending' THEN RAISE EXCEPTION 'No longer pending.'; END IF;
  SELECT max_mentees INTO v_max FROM public.mentor_profiles WHERE id = v_request.mentor_id;
  SELECT COUNT(*) INTO v_active FROM public.mentorships
    WHERE mentor_id = v_request.mentor_id AND status = 'active';
  IF v_max IS NOT NULL AND v_active >= v_max THEN RAISE EXCEPTION 'Capacity reached.'; END IF;
  UPDATE public.mentorship_requests SET status = 'approved' WHERE id = p_request_id;
  INSERT INTO public.mentorships (request_id, mentee_id, mentor_id)
    VALUES (v_request.id, v_request.mentee_id, v_request.mentor_id) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.approve_mentorship_request(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.approve_mentorship_request(UUID) TO authenticated;

-- ── 2. Operator-created matches only ───────────────────────────────────────
ALTER TABLE public.mentorships ALTER COLUMN request_id DROP NOT NULL;

COMMENT ON COLUMN public.mentorships.request_id IS
  'The request that produced this relationship. NULL ONLY for an operator-created match, where origin = admin_created and no participant asked.';

ALTER TABLE public.mentorships
  ADD COLUMN IF NOT EXISTS match_rationale TEXT
    CHECK (match_rationale IS NULL OR char_length(match_rationale) <= 2000),
  ADD COLUMN IF NOT EXISTS match_concerns TEXT
    CHECK (match_concerns IS NULL OR char_length(match_concerns) <= 2000),
  ADD COLUMN IF NOT EXISTS matched_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS mentorships_activated_idx
  ON public.mentorships (cohort_id, activated_at) WHERE cohort_id IS NOT NULL;

-- ── 3. Relationship outcomes ───────────────────────────────────────────────
/*
  TWO QUESTIONS PER SIDE, ASKED ONCE, AFTER A CONVERSATION HAPPENED.

  Stored as small enums rather than a 1-5 scale. "Very / Somewhat / Not
  really" is a judgement a person can make honestly in two seconds; a
  seven-point scale invites precision nobody has and produces averages that
  look like measurement.

  usefulness  what the conversation was worth
  continue    whether they want another one

  The second is the more predictive of the two and the one a future ranking
  should weight: people are polite about usefulness and honest about
  whether they would do it again.

  Service-role only, like every table added since 0024. These are candid
  answers about a named other person; a participant must never be able to
  read what their counterpart said, and an organisation must never see it
  attributed. Aggregates are what an operator gets.
*/
CREATE TABLE IF NOT EXISTS public.relationship_outcomes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id  UUID NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
  session_id     UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  respondent_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role           TEXT NOT NULL CHECK (role IN ('mentee','mentor')),

  usefulness     TEXT NOT NULL CHECK (usefulness IN ('high','some','low')),
  continue_intent TEXT NOT NULL CHECK (continue_intent IN ('yes','maybe','no')),

  -- Optional, unprompted. Most people leave it blank and that is fine.
  note           TEXT CHECK (note IS NULL OR char_length(note) <= 1000),

  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- One answer per person per conversation.
  UNIQUE (mentorship_id, respondent_id, session_id)
);

CREATE INDEX IF NOT EXISTS relationship_outcomes_mentorship_idx
  ON public.relationship_outcomes (mentorship_id, created_at DESC);

ALTER TABLE public.relationship_outcomes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.relationship_outcomes FROM anon, authenticated;

COMMENT ON TABLE public.relationship_outcomes IS
  'What each side thought after a conversation. Two questions, asked once. Service-role only: a participant must never read their counterpart''s answer, and organisations see aggregates, never attributed responses.';

-- ── 4. RELATIONSHIP-INTELLIGENCE INPUTS ────────────────────────────────────
/*
  THE ENGINE'S CEILING IS ITS INPUTS, AND THE INPUTS ARE THIN.

  Measured before writing this: 25 of 25 mentors have `industry` set, 25 of
  25 have `expertise_tags`, and ZERO have `can_help_with` -- the one field
  that says what a person can be brought, as opposed to what subject they
  are tagged with. So every recommendation in production is currently
  reasoning over a job title and a topic list. It cannot do better than
  that, no matter how good the ranking is.

  Everything below is a fact a matching engine can actually use, and each
  one answers a question a person can answer in a few seconds.

  THE SPLIT THAT MATTERS, and the reason this is two places and not one:

    A PROFILE DESCRIBES A PERSON.   Durable. True in a year. Where they have
                                    worked, what they have navigated, who
                                    they tend to be useful to.

    AN INTENT DESCRIBES WHY TWO PEOPLE SHOULD KNOW EACH OTHER NOW.
                                    Dated. Expires. "I am deciding between
                                    two offers by March" is the reason a
                                    match is urgent, and it is wrong three
                                    months later.

  Collapsing the two is the standard mistake, and it produces a network that
  recommends the same people forever and cannot tell a live need from a
  stale one. Columns below; the intent is its own table, with a date on it.
*/

-- 4a. Mentors: what they can actually be brought.
ALTER TABLE public.mentor_profiles
  -- Where they have been. The single strongest signal in a network: people
  -- want to talk to someone who has sat in the seat, not near it.
  ADD COLUMN IF NOT EXISTS companies_known   TEXT[] NOT NULL DEFAULT '{}',
  -- What they do, as distinct from the industry they do it in. A product
  -- manager in banking and a banker are not interchangeable.
  ADD COLUMN IF NOT EXISTS functions         TEXT[] NOT NULL DEFAULT '{}',
  -- Moves they have personally made. Someone who went consulting -> PE is
  -- the right person for someone trying to, and no tag captures that.
  ADD COLUMN IF NOT EXISTS transitions_made  TEXT[] NOT NULL DEFAULT '{}',
  -- What they like talking about, which is not the same as what they are
  -- qualified for -- and is what keeps a mentor answering the fifth email.
  ADD COLUMN IF NOT EXISTS topics_enjoyed    TEXT[] NOT NULL DEFAULT '{}',
  -- Who they think they are useful to. Their own words about their own
  -- audience, and the cheapest way to avoid mismatching seniority.
  ADD COLUMN IF NOT EXISTS useful_to         TEXT[] NOT NULL DEFAULT '{}',
  -- Schools, service, employers-as-alumni-networks, communities. An
  -- affiliation in common is why a cold message gets answered.
  ADD COLUMN IF NOT EXISTS affiliations      TEXT[] NOT NULL DEFAULT '{}',
  -- What they are offering: one conversation, a few, or an ongoing
  -- relationship. Asked, not assumed, because assuming it is how mentors
  -- get over-committed and quietly leave.
  ADD COLUMN IF NOT EXISTS relationship_types TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meeting_cadence   TEXT
    CHECK (meeting_cadence IS NULL OR meeting_cadence IN ('weekly','biweekly','monthly','quarterly','ad_hoc')),
  ADD COLUMN IF NOT EXISTS meeting_mode      TEXT
    CHECK (meeting_mode IS NULL OR meeting_mode IN ('virtual','in_person','either'));

-- 4b. Seekers: what they are trying to do.
ALTER TABLE public.mentee_profiles
  ADD COLUMN IF NOT EXISTS functions_exploring    TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS transitions_navigating TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS communities            TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_companies       TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS background             TEXT
    CHECK (background IS NULL OR char_length(background) <= 1000);

-- 4c. Intent: why now, with a date on it.
/*
  One live row per person, enforced by the partial unique index below.
  Superseding is a new row plus a closed-out old one, never an edit, so
  that "what were you trying to do in October" stays answerable -- which is
  the whole point of collecting this before a match rather than after.
*/
CREATE TABLE IF NOT EXISTS public.member_intent (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- The sentence a person would say out loud. Free text on purpose: the
  -- useful version of this is never on a dropdown.
  objective     TEXT NOT NULL CHECK (char_length(objective) BETWEEN 3 AND 500),
  -- Up to three things they actually want to ask. These become the opener.
  questions     TEXT[] NOT NULL DEFAULT '{}',
  -- Who would be useful RIGHT NOW -- which changes month to month even
  -- though the person's profile does not.
  looking_for   TEXT[] NOT NULL DEFAULT '{}',
  -- What makes it urgent, if anything. Nullable: most intent has no deadline.
  by_date       DATE,

  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','met','expired','superseded')),
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  closed_at     TIMESTAMP WITH TIME ZONE
);

-- At most one ACTIVE intent per person; any number of closed ones.
CREATE UNIQUE INDEX IF NOT EXISTS member_intent_one_active
  ON public.member_intent (profile_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS member_intent_profile_idx
  ON public.member_intent (profile_id, created_at DESC);

ALTER TABLE public.member_intent ENABLE ROW LEVEL SECURITY;

/*
  Your own intent is yours to write.

  SELECT is deliberately wider than "your own row": a mentor looking at an
  introduction request needs to see what the person is trying to do, and
  that is exactly what this table holds. It is scoped to people you are
  already connected to or who have asked you -- never the whole network.
  Everything else (operator views, matching) runs service-role.
*/
/*
  DROP ... IF EXISTS before each CREATE, because CREATE POLICY has no
  IF NOT EXISTS and a re-run would abort the whole migration with 42710.

  That is not hypothetical here. This migration ships through the
  GitHub -> Supabase pipeline, which can retry a failed deploy, and the
  four statements below are the only part of this file that is not already
  idempotent -- everything else is CREATE OR REPLACE, ADD COLUMN IF NOT
  EXISTS, CREATE TABLE IF NOT EXISTS, or a GRANT. One non-re-runnable
  statement is enough to turn a retry into a manual recovery.

  Dropping a policy that was created moments earlier by this same
  migration is safe; there is no window in which the table exists with
  data and no policy, because the table is created in this transaction.
*/
DROP POLICY IF EXISTS "Own intent is readable"     ON public.member_intent;
DROP POLICY IF EXISTS "Counterparts can read intent" ON public.member_intent;
DROP POLICY IF EXISTS "Own intent is writable"     ON public.member_intent;
DROP POLICY IF EXISTS "Own intent is closable"     ON public.member_intent;

CREATE POLICY "Own intent is readable" ON public.member_intent
  FOR SELECT TO authenticated USING (profile_id = auth.uid());

CREATE POLICY "Counterparts can read intent" ON public.member_intent
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.mentorships m
            WHERE (m.mentee_id = member_intent.profile_id AND m.mentor_id = auth.uid())
               OR (m.mentor_id = member_intent.profile_id AND m.mentee_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.mentorship_requests r
            WHERE r.mentee_id = member_intent.profile_id AND r.mentor_id = auth.uid())
  );

CREATE POLICY "Own intent is writable" ON public.member_intent
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Own intent is closable" ON public.member_intent
  FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

GRANT SELECT, INSERT ON public.member_intent TO authenticated;
-- Only the two fields a person may change after the fact. Writing `objective`
-- in place would rewrite history, which is the one thing this table exists
-- to prevent.
GRANT UPDATE (status, closed_at) ON public.member_intent TO authenticated;

COMMENT ON TABLE public.member_intent IS
  'Why someone needs an introduction NOW. Profiles describe people and are durable; intent is dated, expires, and is superseded rather than edited.';

-- 4d. The new profile columns must be writable by their owner.
/*
  0017 replaced table-level UPDATE on these two tables with a per-column
  allowlist, so a mentor cannot award themselves a rating or a verified
  badge. New columns are NOT covered by that grant and would be silently
  unwritable -- the same class of failure as 0033's scheduling columns,
  which were added without grants and would never have stored anything.
  scripts/check-grants.ts fails the build if this list drifts again.
*/
GRANT UPDATE (companies_known, functions, transitions_made, topics_enjoyed,
              useful_to, affiliations, relationship_types, meeting_cadence,
              meeting_mode)
  ON public.mentor_profiles TO authenticated;

GRANT UPDATE (functions_exploring, transitions_navigating, communities,
              target_companies, background)
  ON public.mentee_profiles TO authenticated;

-- ── 5. TWO COLUMNS THAT WERE NEVER WRITABLE ────────────────────────────────
/*
  FOUND BY scripts/check-migration-grants.ts, WHICH THIS PASS ADDED, AND
  THEN CONFIRMED AGAINST PRODUCTION BY TRYING THE WRITE AS A REAL USER.

  Both are the 0033 failure class again: a column added by a later
  migration to a table whose table-level UPDATE was revoked by 0017, with
  no matching entry in the column allowlist. PostgreSQL answers 42501 and
  nothing in the product was looking.

  ── mentor_profiles.can_help_with (added by 0029) ────────────────────────
  This is the root cause of the measurement that started this whole pass.
  can_help_with is empty for 25 of 25 production mentors, and the reason
  is NOT that mentors skipped the question: the database refused to store
  it. Worse, the profile form sends every field in ONE statement, and
  PostgreSQL rejects the whole statement if any named column is denied --
  so since 0029, NO MENTOR HAS BEEN ABLE TO SAVE THEIR PROFILE AT ALL.
  Verified as the demo mentor: can_help_with -> 403 42501, every other
  column in the same form -> 200.

  ── sessions.prep (added by 0032) ────────────────────────────────────────
  Conversation preparation, one of the pillars built in an earlier pass,
  has never once saved in production. savePrep() returns the Postgres
  error to the caller, so it is at least not silent -- but the feature
  does not work. Verified as the demo seeker on a session they are a
  party to: prep -> 403 42501, notes -> 200.

  RLS IS UNCHANGED AND STILL DECIDES WHICH ROWS. This widens only WHICH
  COLUMNS, for rows the caller could already update:
    mentor_profiles  "Mentors can update own profile"  (id = auth.uid())
    sessions         "Parties can update their sessions"
  Nothing here lets anyone touch a row they could not touch before.

  sessions.intervention is deliberately NOT granted: it is written with
  the service role after an explicit participant check in
  app/(protected)/cohort/actions.ts, which is the stronger arrangement.
  organizer_id, meeting_provider and location are set on INSERT, a
  separate privilege that 0017 never revoked.
*/

GRANT UPDATE (can_help_with) ON public.mentor_profiles TO authenticated;
GRANT UPDATE (prep)          ON public.sessions        TO authenticated;
