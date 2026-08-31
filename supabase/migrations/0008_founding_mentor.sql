-- ============================================================
-- Migration 0008: founding_mentor flag, session_notes column
-- ============================================================

-- Explicit founding-mentor status — set manually, never inferred from join date.
ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS is_founding_mentor BOOLEAN NOT NULL DEFAULT false;

-- Track mentor-written session recap so post-session follow-up persists.
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS mentor_recap TEXT;
