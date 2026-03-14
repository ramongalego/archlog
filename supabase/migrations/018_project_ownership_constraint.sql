-- Project ownership: exactly one of user_id or team_id must be set.
-- A project belongs to either a user (personal) or a team, never both.

-- Fix any existing data: team projects should not have user_id
UPDATE projects SET user_id = NULL WHERE team_id IS NOT NULL;

-- Make user_id nullable (team projects have no user)
ALTER TABLE projects ALTER COLUMN user_id DROP NOT NULL;

-- Enforce exclusive ownership
ALTER TABLE projects ADD CONSTRAINT project_owner_check
  CHECK (
    (user_id IS NOT NULL AND team_id IS NULL)
    OR (user_id IS NULL AND team_id IS NOT NULL)
  );

-- Unique team project names (existing user_id+name unique handles personal projects)
ALTER TABLE projects ADD CONSTRAINT projects_team_id_name_key UNIQUE (team_id, name);

-- Change team_id FK from ON DELETE SET NULL to ON DELETE CASCADE.
-- With the new CHECK constraint, SET NULL would leave both columns NULL (invalid).
-- Dissolving a team deletes its projects; personal projects are unaffected.
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_team_id_fkey;
ALTER TABLE projects
  ADD CONSTRAINT projects_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

------------------------------------------------------------------------
-- Updated RLS policies for projects
------------------------------------------------------------------------

-- SELECT: include team owner path (covers insert-returning before team_member check)
DROP POLICY IF EXISTS "Users can read own or team projects" ON projects;
CREATE POLICY "Users can read own or team projects"
  ON projects FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_team_member_of_project(id, auth.uid())
    OR (team_id IS NOT NULL AND is_team_owner(team_id, auth.uid()))
  );

-- INSERT: team owner can create team projects (user_id = NULL)
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (user_id IS NULL AND team_id IS NOT NULL AND is_team_owner(team_id, auth.uid()))
  );

-- UPDATE: team owner can update team projects
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own or team projects"
  ON projects FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (team_id IS NOT NULL AND is_team_owner(team_id, auth.uid()))
  );

-- DELETE: team owner can delete team projects
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own or team projects"
  ON projects FOR DELETE
  USING (
    auth.uid() = user_id
    OR (team_id IS NOT NULL AND is_team_owner(team_id, auth.uid()))
  );
