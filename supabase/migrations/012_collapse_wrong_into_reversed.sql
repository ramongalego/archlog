-- Collapse 'wrong' out of the outcome_status enum.

-- 1. Drop partial index that references the enum in its WHERE clause
DROP INDEX IF EXISTS idx_decisions_pending_review;

-- 2. Drop default (references the enum type)
ALTER TABLE decisions ALTER COLUMN outcome_status DROP DEFAULT;

-- 3. Convert column to plain text
ALTER TABLE decisions ALTER COLUMN outcome_status TYPE text;

-- 4. Drop the old enum (CASCADE removes dependent functions/policies)
DROP TYPE outcome_status CASCADE;

-- 5. Create the new enum without 'wrong'
CREATE TYPE outcome_status AS ENUM ('pending', 'vindicated', 'reversed', 'still_playing_out');

-- 6. Convert column back to the new enum
ALTER TABLE decisions ALTER COLUMN outcome_status TYPE outcome_status USING outcome_status::outcome_status;

-- 7. Restore default
ALTER TABLE decisions ALTER COLUMN outcome_status SET DEFAULT 'pending'::outcome_status;

-- 8. Recreate the partial index
CREATE INDEX idx_decisions_pending_review ON decisions (user_id, outcome_due_date) WHERE outcome_status = 'pending';
