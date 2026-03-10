-- Add review_period_days to decisions so each decision remembers its review period.
-- "Still playing out" resets outcome_due_date using this value instead of the user default.
ALTER TABLE decisions
  ADD COLUMN review_period_days int NOT NULL DEFAULT 90
  CHECK (review_period_days IN (30, 60, 90, 180));

-- Backfill existing decisions from their user's default_review_days setting
UPDATE decisions d
SET review_period_days = u.default_review_days
FROM users u
WHERE d.user_id = u.id;

-- Allow 180 days in the user settings too
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_default_review_days_check;
ALTER TABLE users ADD CONSTRAINT users_default_review_days_check
  CHECK (default_review_days IN (30, 60, 90, 180));
