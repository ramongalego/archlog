-- Team feature: tables, RLS helpers, and updated policies

-- Enums for team membership
CREATE TYPE team_role AS ENUM ('owner', 'member');
CREATE TYPE team_member_status AS ENUM ('pending', 'accepted');

-- Teams table
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Team members table
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  status team_member_status NOT NULL DEFAULT 'pending',
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (team_id, email)
);

-- Add team_id to projects (NULL = personal project)
ALTER TABLE projects ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

------------------------------------------------------------------------
-- SECURITY DEFINER helpers (bypass RLS to avoid recursion)
------------------------------------------------------------------------

-- Check if user owns a team (teams table only, no RLS)
CREATE OR REPLACE FUNCTION is_team_owner(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teams WHERE id = p_team_id AND owner_id = p_user_id
  );
$$;

-- Check if user is an accepted member of a team (team_members table only, no RLS)
CREATE OR REPLACE FUNCTION is_accepted_member(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = p_user_id AND status = 'accepted'
  );
$$;

-- Get a user's email by id (users table only, no RLS)
CREATE OR REPLACE FUNCTION get_user_email(p_user_id uuid)
RETURNS text
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT email FROM users WHERE id = p_user_id;
$$;

-- Check if two users share a team (both accepted members)
CREATE OR REPLACE FUNCTION is_teammate(p_viewer_id uuid, p_target_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_members tm1
    JOIN team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = p_viewer_id AND tm1.status = 'accepted'
      AND tm2.user_id = p_target_id AND tm2.status = 'accepted'
  );
$$;

-- Check if user is an accepted member of the team that owns a project
CREATE OR REPLACE FUNCTION is_team_member_of_project(p_project_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM projects p
    JOIN team_members tm ON tm.team_id = p.team_id
    WHERE p.id = p_project_id
      AND p.team_id IS NOT NULL
      AND tm.user_id = p_user_id
      AND tm.status = 'accepted'
  );
$$;

-- Check if user is the owner of the team that owns a project
CREATE OR REPLACE FUNCTION is_team_owner_of_project(p_project_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM projects p
    JOIN teams t ON t.id = p.team_id
    WHERE p.id = p_project_id
      AND p.team_id IS NOT NULL
      AND t.owner_id = p_user_id
  );
$$;

------------------------------------------------------------------------
-- RLS on new tables (all cross-table refs go through helpers above)
------------------------------------------------------------------------

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Teams: members can read, owner can manage
CREATE POLICY "Team members can read their team"
  ON teams FOR SELECT
  USING (
    auth.uid() = owner_id
    OR is_accepted_member(id, auth.uid())
  );

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update team"
  ON teams FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner can delete team"
  ON teams FOR DELETE
  USING (auth.uid() = owner_id);

-- Team members: read roster, owner manages, user can accept own / leave
CREATE POLICY "Accepted members can read roster"
  ON team_members FOR SELECT
  USING (
    is_accepted_member(team_id, auth.uid())
    OR email = get_user_email(auth.uid())
  );

CREATE POLICY "Team owner can insert members"
  ON team_members FOR INSERT
  WITH CHECK (is_team_owner(team_id, auth.uid()));

CREATE POLICY "Team owner or self can delete members"
  ON team_members FOR DELETE
  USING (
    is_team_owner(team_id, auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can accept own invite"
  ON team_members FOR UPDATE
  USING (
    email = get_user_email(auth.uid())
    OR is_team_owner(team_id, auth.uid())
  );

------------------------------------------------------------------------
-- Users: teammates can see each other's profiles
------------------------------------------------------------------------

CREATE POLICY "Teammates can read teammate profiles"
  ON users FOR SELECT
  USING (is_teammate(auth.uid(), id));

------------------------------------------------------------------------
-- Updated policies on existing tables
------------------------------------------------------------------------

-- Projects: team members can read team projects
DROP POLICY "Users can read own projects" ON projects;
CREATE POLICY "Users can read own or team projects"
  ON projects FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_team_member_of_project(id, auth.uid())
  );

-- Decisions: team members can read, owner can update/delete
DROP POLICY "Users can read own decisions" ON decisions;
CREATE POLICY "Users can read own or team decisions"
  ON decisions FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_team_member_of_project(project_id, auth.uid())
  );

DROP POLICY "Users can update own decisions" ON decisions;
CREATE POLICY "Users can update own or team-owned decisions"
  ON decisions FOR UPDATE
  USING (
    auth.uid() = user_id
    OR is_team_owner_of_project(project_id, auth.uid())
  );

DROP POLICY "Users can delete own decisions" ON decisions;
CREATE POLICY "Users can delete own or team-owned decisions"
  ON decisions FOR DELETE
  USING (
    auth.uid() = user_id
    OR is_team_owner_of_project(project_id, auth.uid())
  );

-- Decision edits: team members can read
DROP POLICY "Users can read own decision edits" ON decision_edits;
CREATE POLICY "Users can read own or team decision edits"
  ON decision_edits FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM decisions d
      WHERE d.id = decision_edits.decision_id
        AND is_team_member_of_project(d.project_id, auth.uid())
    )
  );
