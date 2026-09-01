-- ============================================================
-- Migration 0010: Session intelligence — transcripts, summaries, voice notes
--
-- All tables are ADDITIVE. No existing tables, columns, or policies altered.
-- Every table enforces RLS. Mentor A cannot read Mentor B's transcripts.
-- ============================================================

-- -------------------------------------------------------
-- session_transcripts
-- Records the full text transcript of a recorded session.
-- Consent must be obtained before recording begins — this
-- is enforced at the application layer (ConsentModal) and
-- documented here for clarity.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.session_transcripts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID        NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  -- Raw transcript text from Whisper or Web Speech API
  transcript       TEXT        NOT NULL,
  -- True when both parties explicitly confirmed consent before recording
  both_consented   BOOLEAN     NOT NULL DEFAULT false,
  -- User who initiated recording
  created_by       UUID        NOT NULL REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id)           -- one transcript per session
);

CREATE INDEX IF NOT EXISTS idx_session_transcripts_session ON public.session_transcripts(session_id);

ALTER TABLE public.session_transcripts ENABLE ROW LEVEL SECURITY;

-- Only parties to the session may read or write their transcript
CREATE POLICY "Parties can read their session transcript"
  ON public.session_transcripts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND (s.mentor_id = auth.uid() OR s.mentee_id = auth.uid())
    )
  );

CREATE POLICY "Session party can create transcript"
  ON public.session_transcripts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND (s.mentor_id = auth.uid() OR s.mentee_id = auth.uid())
    )
  );

-- -------------------------------------------------------
-- session_summaries
-- AI-generated (or manually written) structured summary.
-- Visibility: 'shared' = both parties see it; 'private' = only creator.
-- AI output must be reviewed before sharing — enforced in the UI.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.session_summaries (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID        NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  transcript_id    UUID        REFERENCES public.session_transcripts(id) ON DELETE SET NULL,
  summary          TEXT,
  key_takeaways    TEXT[]      DEFAULT '{}',
  action_items     JSONB       DEFAULT '[]',  -- [{ assignee, item }]
  topics_discussed TEXT[]      DEFAULT '{}',
  follow_up        TEXT,
  -- 'private' = creator-only; 'shared' = both mentorship parties
  visibility       TEXT        NOT NULL DEFAULT 'private'
                               CHECK (visibility IN ('private', 'shared')),
  -- True once the creator has reviewed and saved the AI output
  reviewed         BOOLEAN     NOT NULL DEFAULT false,
  created_by       UUID        NOT NULL REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, created_by)  -- one summary per participant per session
);

CREATE INDEX IF NOT EXISTS idx_session_summaries_session ON public.session_summaries(session_id);

ALTER TABLE public.session_summaries ENABLE ROW LEVEL SECURITY;

-- Creator always sees their own summary.
-- A shared summary is visible to both parties.
CREATE POLICY "Creator can read own summary"
  ON public.session_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Parties can read shared summaries"
  ON public.session_summaries FOR SELECT
  TO authenticated
  USING (
    visibility = 'shared' AND
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND (s.mentor_id = auth.uid() OR s.mentee_id = auth.uid())
    )
  );

CREATE POLICY "Session party can create summary"
  ON public.session_summaries FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND (s.mentor_id = auth.uid() OR s.mentee_id = auth.uid())
    )
  );

CREATE POLICY "Creator can update own summary"
  ON public.session_summaries FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE OR REPLACE FUNCTION public.set_session_summaries_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_session_summaries_updated_at ON public.session_summaries;
CREATE TRIGGER trg_session_summaries_updated_at
  BEFORE UPDATE ON public.session_summaries
  FOR EACH ROW EXECUTE FUNCTION public.set_session_summaries_updated_at();

-- -------------------------------------------------------
-- session_voice_notes
-- Short personal notes dictated or typed after (or during)
-- a mentorship session or independently.
-- Private by default — NEVER automatically shared.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.session_voice_notes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Required: must belong to a mentorship
  mentorship_id    UUID        NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
  -- Optional: may relate to a specific session
  session_id       UUID        REFERENCES public.sessions(id) ON DELETE SET NULL,
  created_by       UUID        NOT NULL REFERENCES public.profiles(id),
  content          TEXT        NOT NULL,
  -- 'private' = only creator sees it; 'shared' = both participants see it
  visibility       TEXT        NOT NULL DEFAULT 'private'
                               CHECK (visibility IN ('private', 'shared')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_notes_mentorship ON public.session_voice_notes(mentorship_id);
CREATE INDEX IF NOT EXISTS idx_voice_notes_session    ON public.session_voice_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_notes_creator    ON public.session_voice_notes(created_by);

ALTER TABLE public.session_voice_notes ENABLE ROW LEVEL SECURITY;

-- Private: only creator
CREATE POLICY "Creator can read own voice notes"
  ON public.session_voice_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- Shared: both parties in the mentorship
CREATE POLICY "Parties can read shared voice notes"
  ON public.session_voice_notes FOR SELECT
  TO authenticated
  USING (
    visibility = 'shared' AND
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id
        AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())
    )
  );

CREATE POLICY "Parties can create voice notes in their mentorship"
  ON public.session_voice_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id
        AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())
    )
  );

CREATE POLICY "Creator can update own voice notes"
  ON public.session_voice_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can delete own voice notes"
  ON public.session_voice_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE OR REPLACE FUNCTION public.set_voice_notes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_voice_notes_updated_at ON public.session_voice_notes;
CREATE TRIGGER trg_voice_notes_updated_at
  BEFORE UPDATE ON public.session_voice_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_voice_notes_updated_at();
