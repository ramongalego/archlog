-- Cap decision_edits to the 10 most recent per decision.
-- Prevents unbounded growth from frequent edits.

CREATE OR REPLACE FUNCTION cap_decision_edits()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM decision_edits
  WHERE id IN (
    SELECT id FROM decision_edits
    WHERE decision_id = NEW.decision_id
    ORDER BY edited_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cap_decision_edits
  AFTER INSERT ON decision_edits
  FOR EACH ROW
  EXECUTE FUNCTION cap_decision_edits();
