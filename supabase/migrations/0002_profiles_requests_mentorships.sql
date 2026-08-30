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

-- Simple read policy first; mentor cross-read policy added after mentorships table is created below
CREATE POLICY "Mentees can read own profile"
  ON public.mentee_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

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

-- Mentor can read their mentees' profiles (added after mentorships table exists)
CREATE POLICY "Mentors can read mentee profiles"
  ON public.mentee_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.mentor_id = auth.uid() AND m.mentee_id = mentee_profiles.id
    )
  );

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
