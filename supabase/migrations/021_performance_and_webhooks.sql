-- Performance: add indexes for frequently-filtered columns and webhook idempotency.

-- Index to accelerate team project lookups (dashboard projects page, team decision scoping).
CREATE INDEX IF NOT EXISTS idx_projects_team_id
  ON projects(team_id)
  WHERE team_id IS NOT NULL;

-- Index to accelerate personal project lookups by owner.
CREATE INDEX IF NOT EXISTS idx_projects_user_id
  ON projects(user_id)
  WHERE user_id IS NOT NULL;

-- Index to accelerate decision list pagination by project + created_at order.
CREATE INDEX IF NOT EXISTS idx_decisions_project_created
  ON decisions(project_id, created_at DESC)
  WHERE is_archived = false;

-- Index to accelerate suggestions page (user_id + status filter).
CREATE INDEX IF NOT EXISTS idx_suggested_decisions_user_status
  ON suggested_decisions(user_id, status, created_at DESC);

-- Index to accelerate team membership lookups from auth checks.
CREATE INDEX IF NOT EXISTS idx_team_members_user_status
  ON team_members(user_id, status)
  WHERE user_id IS NOT NULL;

------------------------------------------------------------------------
-- Stripe webhook idempotency
------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS but do not expose any rows: only the service role writes here.
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
