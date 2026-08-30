-- ============================================================
-- Migration 0003: messages
-- ============================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id UUID NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_mentorship ON public.messages(mentorship_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentorship parties can read messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = messages.mentorship_id
        AND (m.mentee_id = auth.uid() OR m.mentor_id = auth.uid())
    )
  );

CREATE POLICY "Mentorship parties can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = messages.mentorship_id
        AND (m.mentee_id = auth.uid() OR m.mentor_id = auth.uid())
        AND m.status = 'active'
    )
  );

CREATE POLICY "Recipients can mark messages read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    auth.uid() != sender_id
    AND EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = messages.mentorship_id
        AND (m.mentee_id = auth.uid() OR m.mentor_id = auth.uid())
    )
  )
  WITH CHECK (is_read = true);

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
