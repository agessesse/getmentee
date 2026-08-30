-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (1:1 with auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'mentee')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- Enable Row-Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
-- 1. Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Users cannot delete their profile (admin only)
-- No DELETE policy created intentionally

-- 4. Prevent INSERT (profiles should be created by trigger only)
-- No INSERT policy created intentionally

-- Create trigger to automatically create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'mentee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ============================================================
-- Migration 0002: mentor_profiles, mentee_profiles,
--                 mentorship_requests, mentorships
-- ============================================================

-- -------------------------------------------------------
-- mentor_profiles
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  expertise_tags TEXT[] NOT NULL DEFAULT '{}',
  years_experience INT NOT NULL DEFAULT 0,
  weekly_hours INT NOT NULL DEFAULT 0,
  timezone TEXT,
  session_rate DECIMAL(10, 2),
  goals TEXT[] NOT NULL DEFAULT '{}',
  is_available BOOLEAN NOT NULL DEFAULT true,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
  review_count INT NOT NULL DEFAULT 0,
  profile_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read mentor profiles"
  ON public.mentor_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mentors can update own profile"
  ON public.mentor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Mentors can insert own profile"
  ON public.mentor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------
-- mentee_profiles
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentee_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  interest_tags TEXT[] NOT NULL DEFAULT '{}',
  goals TEXT[] NOT NULL DEFAULT '{}',
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  preferred_format TEXT CHECK (preferred_format IN ('video', 'chat', 'async')),
  timezone TEXT,
  profile_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mentee_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentees can read own profile"
  ON public.mentee_profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.mentor_id = auth.uid() AND m.mentee_id = mentee_profiles.id
    )
  );

CREATE POLICY "Mentees can update own profile"
  ON public.mentee_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Mentees can insert own profile"
  ON public.mentee_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------
-- mentorship_requests
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  goals TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (mentee_id, mentor_id)
);

CREATE INDEX idx_mentorship_requests_mentee ON public.mentorship_requests(mentee_id);
CREATE INDEX idx_mentorship_requests_mentor ON public.mentorship_requests(mentor_id);
CREATE INDEX idx_mentorship_requests_status ON public.mentorship_requests(status);

ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can read their requests"
  ON public.mentorship_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = mentee_id OR auth.uid() = mentor_id);

CREATE POLICY "Mentees can create requests"
  ON public.mentorship_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentors can update request status"
  ON public.mentorship_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = mentor_id)
  WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentees can delete pending requests"
  ON public.mentorship_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = mentee_id AND status = 'pending');

-- -------------------------------------------------------
-- mentorships
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.mentorship_requests(id),
  mentee_id UUID NOT NULL REFERENCES public.profiles(id),
  mentor_id UUID NOT NULL REFERENCES public.profiles(id),
  sessions_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mentorships_mentee ON public.mentorships(mentee_id);
CREATE INDEX idx_mentorships_mentor ON public.mentorships(mentor_id);
CREATE INDEX idx_mentorships_status ON public.mentorships(status);

ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can read their mentorships"
  ON public.mentorships FOR SELECT
  TO authenticated
  USING (auth.uid() = mentee_id OR auth.uid() = mentor_id);

CREATE POLICY "System inserts mentorships on approval"
  ON public.mentorships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = mentor_id);

-- -------------------------------------------------------
-- updated_at triggers
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_mentor_profiles_updated_at
  BEFORE UPDATE ON public.mentor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_mentee_profiles_updated_at
  BEFORE UPDATE ON public.mentee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_mentorship_requests_updated_at
  BEFORE UPDATE ON public.mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
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
