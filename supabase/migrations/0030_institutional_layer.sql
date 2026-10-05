-- ============================================================================
-- Migration 0030: the institutional layer
-- ============================================================================
-- WHY
--
-- 0029 built institutions -> programs -> cohorts -> cohort_memberships to run
-- Cohort 001. That shape turns out to be the whole tenancy model; what it was
-- missing is anybody who can administer it, any way to invite a person into
-- it, and any link from a cohort to the relationships inside it.
--
-- So this migration deliberately does NOT introduce a parallel
-- organizations/program_members/program_applications system. It renames one
-- table, adds four, and adds two columns. Everything else is reused.
--
-- WHAT IS REUSED, NOT REBUILT
--   programs, cohorts, cohort_memberships, cohort_applications,
--   career_pathways, mentorship_requests, mentorships, mentor_profiles,
--   and the activation_tokens hashing pattern.
--
-- THE RENAME
--
-- institutions -> organizations. The tenant has to hold companies, nonprofits,
-- veterans' organisations and professional associations, and "institution"
-- quietly means university to everyone who reads it. ALTER TABLE RENAME keeps
-- the oid, so every row, index, constraint and foreign key survives untouched;
-- the one referencing column (programs.institution_id) is renamed with it.
-- No application code reads this table today, so nothing breaks above it.
--
-- THREE KINDS OF ADMINISTRATOR, DELIBERATELY SEPARATE
--
--   platform admin        profiles.is_admin. Mentable-wide. Pre-existing.
--   organization admin    organization_members. One organisation.
--   program admin         program_admins. One or more programs inside it.
--
-- The last one exists because a Family Business Mentorship lead should not
-- inherit authority over every programme a university runs. Nothing here
-- grants platform admin: an organisation owner has no visibility outside
-- their own organisation, and that is checked in the route layer, never from
-- a client-supplied organisation id.
--
-- SECURITY
--
-- Same posture as every table added since 0024: RLS on, no policies, no grants
-- to anon or authenticated. These tables are reachable only through
-- service-role server routes that have already resolved the caller's
-- membership. Institutional analytics read mentorships, sessions, goals and
-- action_items; `messages` is never joined, and administrators get no grant on
-- it, so the privacy boundary is enforced by the database rather than by
-- discipline.
--
-- ROLLBACK
--   ALTER TABLE public.mentorships DROP COLUMN IF EXISTS cohort_id,
--                                  DROP COLUMN IF EXISTS origin;
--   DROP TABLE IF EXISTS public.organization_inquiries;
--   DROP TABLE IF EXISTS public.program_invitations;
--   DROP TABLE IF EXISTS public.program_admins;
--   DROP TABLE IF EXISTS public.organization_members;
--   ALTER TABLE public.programs RENAME COLUMN organization_id TO institution_id;
--   ALTER TABLE public.organizations RENAME TO institutions;
-- ============================================================================

-- ── 1. Rename the tenant ────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.institutions RENAME TO organizations;
ALTER TABLE public.programs RENAME COLUMN institution_id TO organization_id;

-- What kind of community this is. Affects nothing in logic yet; it is here so
-- the first non-university tenant does not need a migration.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'university'
    CHECK (kind IN ('university', 'company', 'nonprofit', 'veterans', 'association', 'foundation', 'other'));

COMMENT ON TABLE public.organizations IS
  'A community that runs mentorship programs. Renamed from institutions in 0030 because the tenant must hold companies, nonprofits and veterans organisations, not only universities.';

-- ── 2. Who administers an organisation ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  /*
    owner   can manage members and every programme in the organisation
    admin   can manage every programme, cannot change ownership
    viewer  read-only. Exists for the dean or donor who should see engagement
            and must not be able to alter a programme.
  */
  role            TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, profile_id)
);

CREATE INDEX IF NOT EXISTS organization_members_profile_idx
  ON public.organization_members (profile_id);

-- ── 3. Delegated, per-programme administration ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.program_admins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, profile_id)
);

CREATE INDEX IF NOT EXISTS program_admins_profile_idx
  ON public.program_admins (profile_id);

-- ── 4. Invitations ──────────────────────────────────────────────────────────
-- Same security shape as activation_tokens (0027), which is already in
-- production: only the SHA-256 is stored, the link is single use, it expires,
-- and it is bound to the address it was sent to.
CREATE TABLE IF NOT EXISTS public.program_invitations (
  token_hash  TEXT PRIMARY KEY CHECK (char_length(token_hash) = 64),
  cohort_id   UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  email       TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  -- program_admin is here so delegating a programme uses the same audited,
  -- expiring path as inviting a student, rather than a second mechanism.
  role        TEXT NOT NULL CHECK (role IN ('mentee', 'mentor', 'program_admin')),
  invited_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoked_at  TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS program_invitations_cohort_idx
  ON public.program_invitations (cohort_id, created_at DESC);
CREATE INDEX IF NOT EXISTS program_invitations_email_idx
  ON public.program_invitations (lower(email));

-- ── 5. Inbound institutional interest ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organization_inquiries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      TEXT NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 1 AND 120),
  email          TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  organization   TEXT NOT NULL CHECK (char_length(trim(organization)) BETWEEN 1 AND 200),
  title          TEXT CHECK (title IS NULL OR char_length(title) <= 160),
  community      TEXT CHECK (community IS NULL OR char_length(community) <= 600),
  -- A band, not a number. Nobody knows their exact participant count at the
  -- point of first contact, and a required number invents precision.
  participants   TEXT CHECK (participants IS NULL OR char_length(participants) <= 60),
  goal           TEXT CHECK (goal IS NULL OR char_length(goal) <= 2000),
  status         TEXT NOT NULL DEFAULT 'new'
                 CHECK (status IN ('new', 'reading', 'replied', 'archived')),
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organization_inquiries_status_idx
  ON public.organization_inquiries (status, created_at DESC);

-- ── 6. Programme provenance on the relationship ─────────────────────────────
/*
  Nullable on purpose, and this is the backward-compatibility guarantee.

  cohort_id IS NULL  -> an ordinary Mentable relationship, behaving exactly as
                        it does today. All ten current mentorships are this.
  cohort_id NOT NULL -> the relationship belongs to that programme cohort.

  No program_matches table. An administrator creating a match is creating a
  mentorship; the only thing the existing row could not express is where it
  came from, so `origin` records that and nothing else changes.
*/
ALTER TABLE public.mentorships
  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'requested'
    CHECK (origin IN ('requested', 'suggested', 'admin_created'));

CREATE INDEX IF NOT EXISTS mentorships_cohort_idx
  ON public.mentorships (cohort_id) WHERE cohort_id IS NOT NULL;

COMMENT ON COLUMN public.mentorships.cohort_id IS
  'Optional programme scope. NULL means an individual relationship, which is the pre-0030 behaviour and remains untouched.';
COMMENT ON COLUMN public.mentorships.origin IS
  'How the relationship started: requested (mentee asked), suggested (proposed, accepted by both), admin_created (programme administrator paired them). Defaults to requested so existing rows stay accurate.';

-- ── 7. Security ─────────────────────────────────────────────────────────────
ALTER TABLE public.organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_admins         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_invitations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_inquiries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.organizations          FROM anon, authenticated;
REVOKE ALL ON public.organization_members   FROM anon, authenticated;
REVOKE ALL ON public.program_admins         FROM anon, authenticated;
REVOKE ALL ON public.program_invitations    FROM anon, authenticated;
REVOKE ALL ON public.organization_inquiries FROM anon, authenticated;

-- ── 8. The first platform administrator ─────────────────────────────────────
/*
  Production currently has zero platform admins, which means the admin surface
  is unreachable by anybody, including the Cohort 001 application reviewer.

  Resolved by email rather than by a hard-coded id, and the email is not
  referenced anywhere in application logic: this statement is the whole of it.
  To add another platform admin, run the same UPDATE for their address; to
  remove one, set is_admin to false. is_admin is not user-writable (0015
  revoked the column-level grant), so this is the only path.

  Granting platform admin does NOT grant organisation administration, and
  being an organisation owner does not set this flag. The two are unrelated by
  design.
*/
UPDATE public.profiles SET is_admin = true WHERE lower(email) = 'agessesse15@gmail.com';

COMMENT ON TABLE public.organization_members IS
  'Organisation-level administration. Separate from profiles.is_admin (platform-wide) and program_admins (one programme). An owner here has no authority outside their own organisation.';
