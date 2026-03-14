-- Allow pending invitees to read the team they've been invited to
-- (so Settings can show team name in the Pending Invitations section)

CREATE OR REPLACE FUNCTION is_pending_invitee(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND email = (SELECT email FROM users WHERE id = p_user_id)
      AND status = 'pending'
  );
$$;

CREATE POLICY "Pending invitees can read their invited team"
  ON teams FOR SELECT
  USING (is_pending_invitee(id, auth.uid()));
