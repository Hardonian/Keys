-- Add indexes for performance optimization

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stack ON user_profiles USING GIN(stack);

-- Prompt atoms indexes
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_target_roles ON prompt_atoms USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_target_verticals ON prompt_atoms USING GIN(target_verticals);
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_compatible_atoms ON prompt_atoms USING GIN(compatible_atoms);

-- Vibe configs indexes
CREATE INDEX IF NOT EXISTS idx_vibe_configs_user_created ON vibe_configs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vibe_configs_selected_atoms ON vibe_configs USING GIN(selected_atoms);

-- Agent runs indexes
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_created ON agent_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_trigger ON agent_runs(trigger, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_feedback ON agent_runs(user_id, user_feedback);

-- Background events indexes
CREATE INDEX IF NOT EXISTS idx_background_events_user_type ON background_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_background_events_suggestion ON background_events(suggestion_generated, user_actioned);
CREATE INDEX IF NOT EXISTS idx_background_events_timestamp ON background_events(event_timestamp DESC NULLS LAST);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_background_events_user_unprocessed ON background_events(user_id, suggestion_generated, created_at DESC) 
  WHERE suggestion_generated = false;

CREATE INDEX IF NOT EXISTS idx_agent_runs_user_recent ON agent_runs(user_id, created_at DESC) 
  WHERE created_at > NOW() - INTERVAL '30 days';
