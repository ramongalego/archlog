-- ArchLog Initial Schema
-- Enums, base tables, indexes, triggers

-- Enums
CREATE TYPE confidence_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE decision_category AS ENUM ('product', 'pricing', 'technical', 'hiring', 'marketing', 'other');
CREATE TYPE outcome_status AS ENUM ('pending', 'vindicated', 'reversed', 'still_playing_out', 'wrong');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro');

-- Users (extends Supabase auth.users)
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  display_name text,
  default_review_days integer NOT NULL DEFAULT 90 CHECK (default_review_days IN (30, 60, 90)),
  digest_opted_in boolean NOT NULL DEFAULT true,
  timezone text NOT NULL DEFAULT 'UTC',
  stripe_customer_id text UNIQUE,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name) -- no duplicate project names per user
);

-- Decisions
CREATE TABLE decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  why jsonb,
  context text,
  confidence confidence_level NOT NULL DEFAULT 'medium',
  category decision_category NOT NULL DEFAULT 'product',
  custom_category text,
  outcome_status outcome_status NOT NULL DEFAULT 'pending',
  outcome_notes text,
  outcome_recorded_at timestamptz,
  outcome_due_date timestamptz NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Decision edit history
CREATE TABLE decision_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  previous_title text,
  previous_why jsonb,
  previous_context text,
  previous_confidence confidence_level,
  previous_category decision_category,
  edited_at timestamptz NOT NULL DEFAULT now()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_price_id text NOT NULL,
  status text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_decisions_user_created ON decisions (user_id, created_at DESC);
CREATE INDEX idx_decisions_user_category ON decisions (user_id, category);
CREATE INDEX idx_decisions_user_outcome ON decisions (user_id, outcome_status);
CREATE INDEX idx_decisions_pending_review ON decisions (user_id, outcome_due_date) WHERE outcome_status = 'pending';
CREATE INDEX idx_decisions_project ON decisions (project_id);
CREATE INDEX idx_decision_edits_decision ON decision_edits (decision_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_decisions_updated_at BEFORE UPDATE ON decisions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Edit history trigger: capture previous values before update
CREATE OR REPLACE FUNCTION capture_decision_edit()
RETURNS TRIGGER AS $$
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

CREATE TRIGGER capture_decision_edit_trigger BEFORE UPDATE ON decisions FOR EACH ROW EXECUTE FUNCTION capture_decision_edit();

-- Auto-create user profile and default project on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email) VALUES (NEW.id, NEW.email);
  INSERT INTO projects (user_id, name, is_default) VALUES (NEW.id, 'My Decisions', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
