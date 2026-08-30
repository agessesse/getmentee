-- ============================================================
-- Migration 0007: saved_mentors and notifications
-- ============================================================

-- -------------------------------------------------------
-- saved_mentors
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, mentor_id)
);

CREATE INDEX idx_saved_mentors_user ON public.saved_mentors(user_id);
CREATE INDEX idx_saved_mentors_mentor ON public.saved_mentors(mentor_id);

ALTER TABLE public.saved_mentors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved mentors"
  ON public.saved_mentors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save mentors"
  ON public.saved_mentors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave mentors"
  ON public.saved_mentors FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- notifications
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'request_received',
    'request_accepted',
    'request_declined',
    'new_message',
    'session_scheduled',
    'session_reminder',
    'goal_completed',
    'action_item_due',
    'review_received'
  )),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark notifications read"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);
