-- Add constraints for data integrity

-- Add check constraints
ALTER TABLE vibe_configs 
  ADD CONSTRAINT check_playfulness_range CHECK (playfulness >= 0 AND playfulness <= 100);

ALTER TABLE vibe_configs 
  ADD CONSTRAINT check_revenue_focus_range CHECK (revenue_focus >= 0 AND revenue_focus <= 100);

ALTER TABLE vibe_configs 
  ADD CONSTRAINT check_investor_perspective_range CHECK (investor_perspective >= 0 AND investor_perspective <= 100);

-- Add foreign key constraints (if not already present)
-- Note: These assume UUIDs are properly formatted
-- ALTER TABLE agent_runs ADD CONSTRAINT fk_agent_runs_user 
--   FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- ALTER TABLE vibe_configs ADD CONSTRAINT fk_vibe_configs_user 
--   FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- ALTER TABLE background_events ADD CONSTRAINT fk_background_events_user 
--   FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id_unique ON user_profiles(user_id);

-- Add not null constraints where appropriate
ALTER TABLE prompt_atoms 
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN category SET NOT NULL;

ALTER TABLE agent_runs 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN trigger SET NOT NULL;

ALTER TABLE background_events 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN event_type SET NOT NULL,
  ALTER COLUMN source SET NOT NULL;
