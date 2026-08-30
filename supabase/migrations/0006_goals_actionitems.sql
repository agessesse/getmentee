-- ============================================================
-- Migration 0006: mentorship_goals and action_items
-- ============================================================

-- -------------------------------------------------------
-- mentorship_goals
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentorship_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id UUID NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  target_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_mentorship ON public.mentorship_goals(mentorship_id);
CREATE INDEX idx_goals_status ON public.mentorship_goals(status);

ALTER TABLE public.mentorship_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can read their mentorship goals"
  ON public.mentorship_goals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id
        AND (m.mentee_id = auth.uid() OR m.mentor_id = auth.uid())
    )
  );

CREATE POLICY "Parties can insert mentorship goals"
  ON public.mentorship_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id
        AND (m.mentee_id = auth.uid() OR m.mentor_id = auth.uid())
    )
  );

CREATE POLICY "Goal creator can update their goals"
  ON public.mentorship_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Goal creator can delete their goals"
  ON public.mentorship_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE TRIGGER set_mentorship_goals_updated_at
  BEFORE UPDATE ON public.mentorship_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------
-- action_items
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id UUID NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES public.mentorship_goals(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  assigned_to UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_action_items_mentorship ON public.action_items(mentorship_id);
CREATE INDEX idx_action_items_assigned ON public.action_items(assigned_to);
CREATE INDEX idx_action_items_goal ON public.action_items(goal_id);

ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can read their action items"
  ON public.action_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id
        AND (m.mentee_id = auth.uid() OR m.mentor_id = auth.uid())
    )
  );

CREATE POLICY "Parties can insert action items"
  ON public.action_items FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id
        AND (m.mentee_id = auth.uid() OR m.mentor_id = auth.uid())
    )
  );

CREATE POLICY "Parties can update action items in their mentorship"
  ON public.action_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id
        AND (m.mentee_id = auth.uid() OR m.mentor_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id
        AND (m.mentee_id = auth.uid() OR m.mentor_id = auth.uid())
    )
  );

CREATE POLICY "Creator can delete action items"
  ON public.action_items FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE TRIGGER set_action_items_updated_at
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
