-- ============================================================================
-- Migration 0031: tenant identity and theme
-- ============================================================================
-- WHY
--
-- 0030 gave an organisation administrators, invitations and relationships. It
-- did not give it a face. A participant who arrives through an institutional
-- programme currently sees a product called Mentable and no indication of the
-- programme that brought them, which is the P0 gap in the institutional work.
--
-- This migration adds the smallest set of columns that lets one product
-- belong to several communities, and nothing more.
--
-- WHAT IS DELIBERATELY NOT HERE
--
-- No theme editor tables, no uploaded fonts, no arbitrary CSS, no custom
-- domains, no per-programme overrides, no logo storage. Those are late-stage
-- institutional features and every one of them is a way to ship an illegible
-- or an impersonating page. A tenant gets four colours and three strings.
--
-- THE FOUR COLOURS
--
-- `theme` holds exactly four roles and the CHECK below refuses anything else:
--
--   surface  page ground                  Carolina #FFFFFF
--   ink      text and high contrast       Carolina #13294B
--   primary  institutional identity       Carolina #7BAFD4
--   wash     soft tinted surface          Carolina #F3F8FC
--
-- Everything else in the design system is derived from these four at render
-- time by lib/theme/derive.ts, which measures WCAG contrast and darkens the
-- identity colour until text and indicators actually pass. Carolina Blue is
-- 1.9:1 on white; storing more colours would only create more ways for a
-- tenant to configure unreadable text.
--
-- NULL theme means the Mentable default, which is a literal token set in
-- app/globals.css and never passes through derivation. The platform's own
-- appearance cannot drift when a tenant is themed.
--
-- `notice` AND WHY IT IS A COLUMN
--
-- The Carolina deployment is illustrative. Mentable has no agreement with
-- UNC-Chapel Hill, and a claim that strong must not live in a component that
-- somebody can forget to render. Storing it on the organisation means the
-- disclaimer travels with the branding: any surface that renders the tenant's
-- identity renders the tenant's notice from the same row.
--
-- ROLLBACK
--   ALTER TABLE public.cohorts DROP COLUMN IF EXISTS term;
--   ALTER TABLE public.organizations
--     DROP COLUMN IF EXISTS display_name,
--     DROP COLUMN IF EXISTS tagline,
--     DROP COLUMN IF EXISTS notice,
--     DROP COLUMN IF EXISTS theme;
-- ============================================================================

-- ── 1. Participant-facing identity ──────────────────────────────────────────
/*
  `name` is the legal entity: "University of North Carolina at Chapel Hill".
  `display_name` is what a participant is actually in: "Carolina Alumni
  Mentorship". They are different strings and conflating them is how a demo
  starts implying an institutional relationship that does not exist. Nullable:
  with no display_name the organisation shows its legal name, unchanged.
*/
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS display_name TEXT
    CHECK (display_name IS NULL OR char_length(trim(display_name)) BETWEEN 1 AND 120),
  ADD COLUMN IF NOT EXISTS tagline TEXT
    CHECK (tagline IS NULL OR char_length(trim(tagline)) BETWEEN 1 AND 160),
  ADD COLUMN IF NOT EXISTS notice TEXT
    CHECK (notice IS NULL OR char_length(trim(notice)) BETWEEN 1 AND 400),
  ADD COLUMN IF NOT EXISTS theme JSONB;

-- ── 2. The theme contract, enforced by the database ─────────────────────────
/*
  Four keys, no more, no fewer, each a six-digit hex colour.

  Expressed with jsonb operators rather than a subquery because CHECK
  constraints cannot contain subqueries. `theme - key - key ... = '{}'` is the
  operator-only way to say "and no other keys", which is the half that
  actually matters: without it, a tenant could smuggle arbitrary values into a
  column that is read at render time.
*/
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_theme_shape;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_theme_shape CHECK (
    theme IS NULL OR (
      jsonb_typeof(theme) = 'object'
      AND theme ?& array['surface', 'ink', 'primary', 'wash']
      AND (theme - 'surface' - 'ink' - 'primary' - 'wash') = '{}'::jsonb
      AND theme->>'surface' ~ '^#[0-9A-Fa-f]{6}$'
      AND theme->>'ink'     ~ '^#[0-9A-Fa-f]{6}$'
      AND theme->>'primary' ~ '^#[0-9A-Fa-f]{6}$'
      AND theme->>'wash'    ~ '^#[0-9A-Fa-f]{6}$'
    )
  );

COMMENT ON COLUMN public.organizations.theme IS
  'Exactly four hex colours (surface, ink, primary, wash) or NULL for the Mentable default. The rest of the design system is derived from these by lib/theme/derive.ts with a WCAG contrast guard. Not a white-label editor: the shape is fixed by organizations_theme_shape.';
COMMENT ON COLUMN public.organizations.display_name IS
  'What participants call the programme ("Carolina Alumni Mentorship"), as opposed to name, which is the legal entity. Never implies the entity has endorsed anything.';
COMMENT ON COLUMN public.organizations.notice IS
  'A disclaimer rendered wherever this tenant identity is shown. Stored on the row so it cannot be separated from the branding it qualifies.';

-- ── 3. When a cohort ran ────────────────────────────────────────────────────
/*
  starts_at and ends_at are dates and both are NULL today. "Fall 2026" is what
  a participant reads in the programme identity line, and deriving it from two
  null dates is not possible. One nullable string, no term vocabulary table.
*/
ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS term TEXT
    CHECK (term IS NULL OR char_length(trim(term)) BETWEEN 1 AND 40);

COMMENT ON COLUMN public.cohorts.term IS
  'Human label for when this cohort runs ("Fall 2026"). Display only.';

-- ── 4. Security ─────────────────────────────────────────────────────────────
/*
  No new tables, so no new RLS surface. organizations and cohorts already have
  RLS enabled with no policies and no grants to anon or authenticated (0029,
  0030); these columns inherit that and are reachable only through
  service-role server routes that have already resolved the caller.

  Re-asserted rather than assumed, because adding a column is exactly the
  moment a grant quietly reappears.
*/
REVOKE ALL ON public.organizations FROM anon, authenticated;
REVOKE ALL ON public.cohorts        FROM anon, authenticated;
