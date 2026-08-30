-- ============================================================
-- Migration 0004: availability_slots, sessions, reviews
-- ============================================================

-- -------------------------------------------------------
-- availability_slots
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

CREATE INDEX idx_availability_mentor ON public.availability_slots(mentor_id);

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read availability"
  ON public.availability_slots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mentors can manage own availability"
  ON public.availability_slots FOR ALL
  TO authenticated
  USING (auth.uid() = mentor_id)
  WITH CHECK (auth.uid() = mentor_id);

-- -------------------------------------------------------
-- sessions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id UUID NOT NULL REFERENCES public.mentorships(id),
  mentor_id UUID NOT NULL REFERENCES public.profiles(id),
  mentee_id UUID NOT NULL REFERENCES public.profiles(id),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  session_type TEXT NOT NULL DEFAULT 'video' CHECK (session_type IN ('video', 'async')),
  notes TEXT,
  video_link TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_mentorship ON public.sessions(mentorship_id);
CREATE INDEX idx_sessions_mentor ON public.sessions(mentor_id);
CREATE INDEX idx_sessions_mentee ON public.sessions(mentee_id);
CREATE INDEX idx_sessions_scheduled_at ON public.sessions(scheduled_at);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can read their sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Mentees can book sessions"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = mentee_id
    AND EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = sessions.mentorship_id
        AND m.mentee_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "Parties can update their sessions"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id)
  WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- Increment sessions_count on mentorships when a session completes
CREATE OR REPLACE FUNCTION public.increment_sessions_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.mentorships
    SET sessions_count = sessions_count + 1
    WHERE id = NEW.mentorship_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_session_completed
  AFTER UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.increment_sessions_count();

-- -------------------------------------------------------
-- reviews
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, reviewer_id)
);

CREATE INDEX idx_reviews_session ON public.reviews(session_id);
CREATE INDEX idx_reviews_reviewee ON public.reviews(reviewee_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Session parties can submit reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = reviews.session_id
        AND (s.mentor_id = auth.uid() OR s.mentee_id = auth.uid())
        AND s.status = 'completed'
    )
  );

-- Recompute mentor rating after a review is inserted
CREATE OR REPLACE FUNCTION public.update_mentor_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_mentor_id UUID;
  v_avg DECIMAL(3, 2);
  v_count INT;
BEGIN
  SELECT s.mentor_id INTO v_mentor_id
  FROM public.sessions s
  WHERE s.id = NEW.session_id;

  SELECT AVG(r.rating)::DECIMAL(3,2), COUNT(*)
  INTO v_avg, v_count
  FROM public.reviews r
  JOIN public.sessions s ON s.id = r.session_id
  WHERE s.mentor_id = v_mentor_id;

  UPDATE public.mentor_profiles
  SET rating = COALESCE(v_avg, 0.00),
      review_count = v_count
  WHERE id = v_mentor_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_inserted
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_mentor_rating();
