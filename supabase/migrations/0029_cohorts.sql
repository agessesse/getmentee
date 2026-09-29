-- ============================================================================
-- Migration 0029: the cohort layer
-- ============================================================================
-- WHY
--
-- Mentable is about to run its first cohort: ten UNC-Chapel Hill sophomores
-- heading into finance recruiting, paired with ten people who have already
-- done it. Everything needed to run that already exists — profiles,
-- mentorships, sessions, goals, action_items — except any way to say which
-- programme a person belongs to.
--
-- This adds that, and nothing else. A cohort sits ABOVE mentorship: it records
-- that a person is part of a group for a period of time. It does not pair
-- anybody with anybody. Pairing stays in `mentorships`, which already works.
--
-- WHY INSTITUTIONS AND PROGRAMS EXIST NOW, WITH NO UI
--
-- Retrofitting an owner onto live cohort data later is the expensive version
-- of this. Three small reference tables now mean a second university is a row
-- rather than a migration. They are seeded with exactly one institution, one
-- programme and one cohort, and nothing in the product reads them yet.
--
-- WHAT IS DELIBERATELY NOT HERE
--
-- No matches table: Cohort 001 is matched by two people who will know all
-- twenty names. No outcomes table: there are no outcomes yet, and a schema
-- for them written before the first conversation would encode guesses about
-- what matters. No institutional dashboard, no billing, no seat counts.
--
-- SECURITY
--
-- Same model as 0024 through 0027. RLS on, no policies, no grants to anon or
-- authenticated. Every one of these tables is reached only by a service-role
-- server route. cohort_applications keeps holding the only personal data and
-- keeps its existing lockdown; the columns added to it inherit that.
--
-- ROLLBACK
--   ALTER TABLE public.mentor_profiles DROP COLUMN IF EXISTS can_help_with;
--   ALTER TABLE public.cohort_applications
--     DROP COLUMN IF EXISTS cohort_id, DROP COLUMN IF EXISTS major,
--     DROP COLUMN IF EXISTS finance_paths, DROP COLUMN IF EXISTS hardest,
--     DROP COLUMN IF EXISTS advice_source;
--   DROP TABLE IF EXISTS public.cohort_memberships;
--   DROP TABLE IF EXISTS public.career_pathways;
--   DROP TABLE IF EXISTS public.cohorts;
--   DROP TABLE IF EXISTS public.programs;
--   DROP TABLE IF EXISTS public.institutions;
-- ============================================================================

-- ── Institutions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.institutions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 200),
  slug       TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{1,80}$'),
  -- Nullable on purpose: a nonprofit or an employer running a cohort is not a
  -- university and should not be forced to pretend it has a domain.
  domain     TEXT CHECK (domain IS NULL OR char_length(domain) <= 120),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── Programs ────────────────────────────────────────────────────────────────
-- A recurring thing an institution runs. Cohorts are its instances.
CREATE TABLE IF NOT EXISTS public.programs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name           TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 200),
  slug           TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]{1,80}$'),
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (institution_id, slug)
);

-- ── Cohorts ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cohorts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 200),
  -- Globally unique: the slug appears in URLs and analytics, where a
  -- collision between two institutions' "cohort-001" would be silent.
  slug       TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{1,80}$'),
  /*
    open       accepting applications
    matching   applications closed, pairing under way
    active     the cohort is running
    complete   finished
    draft      exists but not public
  */
  status     TEXT NOT NULL DEFAULT 'draft'
             CHECK (status IN ('draft', 'open', 'matching', 'active', 'complete')),
  -- The intended size. Recorded because it is a real operational fact, NOT to
  -- render a seats-remaining counter; nothing public reads it.
  target_size INTEGER CHECK (target_size IS NULL OR target_size BETWEEN 1 AND 10000),
  starts_at  DATE,
  ends_at    DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);

-- ── Cohort membership ───────────────────────────────────────────────────────
-- "This person belongs to this cohort." Not "this mentor is paired with this
-- mentee" — pairing lives in `mentorships` and is unchanged.
CREATE TABLE IF NOT EXISTS public.cohort_memberships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id  UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('mentee', 'mentor')),
  state      TEXT NOT NULL DEFAULT 'invited'
             CHECK (state IN ('invited', 'active', 'withdrawn', 'completed')),
  joined_at  TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- One membership per person per cohort. Somebody could mentor one cohort and
  -- be mentored in another, so the role is not part of the key.
  UNIQUE (cohort_id, profile_id)
);

CREATE INDEX IF NOT EXISTS cohort_memberships_cohort_role_idx
  ON public.cohort_memberships (cohort_id, role, state);

-- ── Career pathways ─────────────────────────────────────────────────────────
-- The paths a cohort is oriented around. Kept flat and small: this is a
-- vocabulary, not a taxonomy, and it earns depth only when a second cohort
-- needs it.
CREATE TABLE IF NOT EXISTS public.career_pathways (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  slug       TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{1,80}$'),
  -- Groups pathways loosely ('finance'), so a future cohort in another field
  -- does not have to share a list with this one.
  family     TEXT NOT NULL DEFAULT 'finance' CHECK (char_length(family) <= 60),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── Application: cohort context and the new questions ───────────────────────
-- Additive only. Every existing row stays valid: cohort_id is nullable, so
-- applications submitted before Cohort 001 existed simply have none.
ALTER TABLE public.cohort_applications
  ADD COLUMN IF NOT EXISTS cohort_id     UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS major         TEXT CHECK (major IS NULL OR char_length(major) <= 160),
  -- An array because "which paths are you exploring" is genuinely plural and
  -- "still exploring" is a legitimate answer.
  ADD COLUMN IF NOT EXISTS finance_paths TEXT[],
  ADD COLUMN IF NOT EXISTS hardest       TEXT CHECK (hardest IS NULL OR char_length(hardest) <= 2000),
  -- Optional by design. This asks who a student can already turn to, which is
  -- the access question, and it is deliberately not a question about money.
  ADD COLUMN IF NOT EXISTS advice_source TEXT CHECK (advice_source IS NULL OR char_length(advice_source) <= 400);

CREATE INDEX IF NOT EXISTS cohort_applications_cohort_idx
  ON public.cohort_applications (cohort_id, created_at DESC);

-- ── Mentor: what they can help someone navigate ─────────────────────────────
-- expertise_tags says what a mentor knows. This says what a student can bring
-- them. They are different questions and the second is the one a request is
-- actually built on. Future matching infrastructure; nothing scores it.
ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS can_help_with TEXT[];

-- ── Security: identical to every other table added since 0024 ───────────────
ALTER TABLE public.institutions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_pathways    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.institutions       FROM anon, authenticated;
REVOKE ALL ON public.programs           FROM anon, authenticated;
REVOKE ALL ON public.cohorts            FROM anon, authenticated;
REVOKE ALL ON public.cohort_memberships FROM anon, authenticated;
REVOKE ALL ON public.career_pathways    FROM anon, authenticated;

-- ── Seed: exactly one of each ───────────────────────────────────────────────
INSERT INTO public.institutions (name, slug, domain)
VALUES ('University of North Carolina at Chapel Hill', 'unc-chapel-hill', 'unc.edu')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.programs (institution_id, name, slug)
SELECT i.id, 'Finance Access', 'finance-access'
FROM public.institutions i
WHERE i.slug = 'unc-chapel-hill'
ON CONFLICT (institution_id, slug) DO NOTHING;

INSERT INTO public.cohorts (program_id, name, slug, status, target_size)
SELECT p.id, 'Cohort 001', 'cohort-001', 'open', 10
FROM public.programs p
JOIN public.institutions i ON i.id = p.institution_id
WHERE i.slug = 'unc-chapel-hill' AND p.slug = 'finance-access'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.career_pathways (name, slug, family, sort_order) VALUES
  ('Investment Banking',        'investment-banking',   'finance', 1),
  ('Sales & Trading / Markets', 'markets',              'finance', 2),
  ('Asset Management',          'asset-management',     'finance', 3),
  ('Private Equity',            'private-equity',       'finance', 4),
  ('Wealth Management',         'wealth-management',    'finance', 5),
  ('Corporate Finance',         'corporate-finance',    'finance', 6),
  ('Consulting',                'consulting',           'finance', 7),
  ('Still exploring',           'still-exploring',      'finance', 8)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE public.cohorts IS
  'A run of a program. Sits above mentorship: membership says who belongs, pairing stays in mentorships. target_size is operational and is never rendered as a seats-remaining counter.';
COMMENT ON COLUMN public.cohort_applications.advice_source IS
  'Optional. Who the applicant can already turn to for career advice. Asks about access to people, never about household income.';
COMMENT ON COLUMN public.mentor_profiles.can_help_with IS
  'Situations a mentor can help someone navigate, e.g. "Technical interview preparation". Distinct from expertise_tags, which is what they know. Matching infrastructure; nothing ranks or scores it.';
