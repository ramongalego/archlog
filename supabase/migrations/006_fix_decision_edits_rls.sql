-- The capture_decision_edit trigger inserts into decision_edits when a decision
-- is updated, but RLS only has a SELECT policy. Mark the function as SECURITY
-- DEFINER so the trigger bypasses RLS (it's internal bookkeeping, not user input).
CREATE OR REPLACE FUNCTION capture_decision_edit()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.title IS DISTINCT FROM NEW.title
     OR OLD.why IS DISTINCT FROM NEW.why
     OR OLD.context IS DISTINCT FROM NEW.context
     OR OLD.confidence IS DISTINCT FROM NEW.confidence
     OR OLD.category IS DISTINCT FROM NEW.category THEN
    INSERT INTO decision_edits (decision_id, user_id, previous_title, previous_why, previous_context, previous_confidence, previous_category)
    VALUES (OLD.id, OLD.user_id, OLD.title, OLD.why, OLD.context, OLD.confidence, OLD.category);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Same fix for cap_decision_edits which deletes old rows after insert
CREATE OR REPLACE FUNCTION cap_decision_edits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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
