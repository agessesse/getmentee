-- ============================================================================
-- Migration 0020: hardening
-- ============================================================================
-- Closes V7 (mutable search_path on definer functions), V6 (unvalidated
-- outbound URLs), and the three missing RLS-predicate indexes.
-- None of this is exploitable on its own. It is the work that stops the next
-- round of findings.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- V7: pin search_path on the SECURITY DEFINER functions
-- ----------------------------------------------------------------------------
-- A definer function with a mutable search_path can be induced to resolve an
-- unqualified name against a schema the caller controls. Supabase's own linter
-- flags all three. Their bodies already qualify every application table, and
-- built-ins keep resolving because pg_catalog is always searched implicitly, so
-- pinning the path is safe without rewriting them.
--
-- (The functions added in 0017 and 0018 already set search_path = ''.)

ALTER FUNCTION public.handle_new_user()          SET search_path = '';
ALTER FUNCTION public.increment_sessions_count() SET search_path = '';
ALTER FUNCTION public.update_mentor_rating()     SET search_path = '';


-- ----------------------------------------------------------------------------
-- V6: constrain user-supplied URLs
-- ----------------------------------------------------------------------------
-- There is no Supabase Storage bucket anywhere in this project, so all media is
-- an external URL the user sets on their own row, which is then rendered into
-- other users' browsers by a raw <img> (components/ui/Avatar.tsx). That is a
-- working tracking pixel: point your avatar at a host you control and log the
-- IP and user agent of everyone who views your profile.
--
-- This is the interim fix. It blocks the script-bearing and plaintext schemes
-- and permits only same-origin relative paths or https. The durable fix is a
-- storage bucket with its own policies, and uploads through it.
--
-- NOT VALID so the constraint applies to new and updated rows without failing
-- on any legacy row already in the table. Run
--   ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_avatar_url_scheme;
-- once existing data is known to conform.

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_avatar_url_scheme
  CHECK (avatar_url IS NULL OR avatar_url ~ '^(/|https://)')
  NOT VALID;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_attachment_url_scheme
  CHECK (attachment_url IS NULL OR attachment_url ~ '^(/|https://)')
  NOT VALID;


-- ----------------------------------------------------------------------------
-- Index the RLS predicates that lack one
-- ----------------------------------------------------------------------------
-- Index coverage is otherwise good — 28 indexes, including every column the
-- EXISTS subqueries join on. These three tables are the exception, and their
-- SELECT policies run a subquery per row.

CREATE INDEX IF NOT EXISTS idx_session_transcripts_session
  ON public.session_transcripts(session_id);

CREATE INDEX IF NOT EXISTS idx_session_summaries_session
  ON public.session_summaries(session_id);

CREATE INDEX IF NOT EXISTS idx_session_voice_notes_mentorship
  ON public.session_voice_notes(mentorship_id);
