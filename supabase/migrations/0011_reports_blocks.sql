-- ============================================================
-- Migration 0011: user_reports and user_blocks
--
-- Additive only. No existing tables, columns, or policies altered.
-- All tables enforce RLS. Reports are only visible to the reporter;
-- blocks are only visible to the blocker.
-- ============================================================

-- -------------------------------------------------------
-- user_reports
-- Stores in-app reports from one user about another.
-- Only the reporter can read their own report.
-- Admins (service role) can read all.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_reports (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason        TEXT        NOT NULL CHECK (reason IN (
                              'harassment',
                              'spam',
                              'impersonation',
                              'inappropriate_behavior',
                              'safety_concern',
                              'other'
                            )),
  details       TEXT,
  context       TEXT,       -- e.g. 'message', 'profile', 'mentorship'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate reports for the same pair
  UNIQUE (reporter_id, reported_id)
);

CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON public.user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON public.user_reports(reported_id);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Reporter can read their own reports
CREATE POLICY "Reporter can read own reports"
  ON public.user_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Reporter can submit a report
CREATE POLICY "Authenticated users can submit reports"
  ON public.user_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Reporter can delete their own report (withdraw)
CREATE POLICY "Reporter can delete own reports"
  ON public.user_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = reporter_id);

-- -------------------------------------------------------
-- user_blocks
-- Stores block relationships between users.
-- When User A blocks User B:
--   - A will not see B in discovery
--   - B should not be able to send A messages
-- Enforcement happens at the application layer for now;
-- the RLS policy prevents cross-read of blocks.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Blocker can read their own block list
CREATE POLICY "Blocker can read own blocks"
  ON public.user_blocks FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Blocker can add a block
CREATE POLICY "Authenticated users can block others"
  ON public.user_blocks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

-- Blocker can remove a block
CREATE POLICY "Blocker can unblock"
  ON public.user_blocks FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);
