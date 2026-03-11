-- Add extracted_context column to suggested_decisions
-- Previously, reasoning and context were combined in extracted_reasoning.
-- Now they are separate: extracted_reasoning = why, extracted_context = background situation.
ALTER TABLE suggested_decisions ADD COLUMN extracted_context text;
