-- Default display_name to email prefix and timezone from auth metadata on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, display_name, timezone)
  VALUES (
    NEW.id,
    NEW.email,
    split_part(NEW.email, '@', 1),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  );
  INSERT INTO projects (user_id, name, is_default) VALUES (NEW.id, 'My Decisions', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
