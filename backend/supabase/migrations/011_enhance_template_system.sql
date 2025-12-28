-- Enhance template system with versioning, history, analytics, and more

-- Template versions table
CREATE TABLE IF NOT EXISTS template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  version INT NOT NULL,
  changelog TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(template_id, version)
);

CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id);

-- Template customization history (for rollback)
CREATE TABLE IF NOT EXISTS template_customization_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customization_id UUID NOT NULL REFERENCES user_template_customizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  
  -- Snapshot of customization
  custom_variables JSONB,
  custom_instructions TEXT,
  enabled BOOLEAN,
  
  -- Metadata
  change_type TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Who made the change
  changed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_template_customization_history_customization_id 
  ON template_customization_history(customization_id);
CREATE INDEX IF NOT EXISTS idx_template_customization_history_user_id 
  ON template_customization_history(user_id);

-- Template analytics
CREATE TABLE IF NOT EXISTS template_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  
  -- Usage metrics
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,
  
  -- Quality metrics
  average_rating FLOAT,
  total_ratings INT DEFAULT 0,
  
  -- Performance metrics
  average_tokens_used INT,
  average_latency_ms INT,
  
  -- Timestamps
  first_used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_user_id 
  ON template_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_template_id 
  ON template_usage_analytics(template_id);

-- Template feedback/ratings
CREATE TABLE IF NOT EXISTS template_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  
  -- Feedback
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  suggestions TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_template_feedback_template_id ON template_feedback(template_id);

-- Shared templates (team sharing)
CREATE TABLE IF NOT EXISTS shared_template_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  
  -- Sharing settings
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  shared_with_user_ids UUID[] DEFAULT ARRAY[]::UUID[],
  shared_with_team_ids UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Template data
  custom_variables JSONB DEFAULT '{}'::jsonb,
  custom_instructions TEXT,
  
  -- Metadata
  usage_count INT DEFAULT 0,
  rating_average FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_template_customizations_owner_id 
  ON shared_template_customizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_template_customizations_template_id 
  ON shared_template_customizations(template_id);
CREATE INDEX IF NOT EXISTS idx_shared_template_customizations_public 
  ON shared_template_customizations(is_public) WHERE is_public = true;

-- Template presets
CREATE TABLE IF NOT EXISTS template_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'quick-start', 'scenario', 'industry', etc.
  
  -- Preset configuration
  template_ids TEXT[] NOT NULL,
  custom_variables JSONB DEFAULT '{}'::jsonb,
  custom_instructions TEXT,
  
  -- Metadata
  is_system_preset BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_presets_category ON template_presets(category);

-- Enable RLS on new tables
ALTER TABLE template_customization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_template_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_customization_history
CREATE POLICY "Users can view own customization history"
  ON template_customization_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for template_usage_analytics
CREATE POLICY "Users can view own analytics"
  ON template_usage_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON template_usage_analytics
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for template_feedback
CREATE POLICY "Users can manage own feedback"
  ON template_feedback
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public feedback"
  ON template_feedback
  FOR SELECT
  USING (true); -- Public feedback is viewable by all

-- RLS Policies for shared_template_customizations
CREATE POLICY "Users can view public shared templates"
  ON shared_template_customizations
  FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id OR auth.uid() = ANY(shared_with_user_ids));

CREATE POLICY "Users can manage own shared templates"
  ON shared_template_customizations
  FOR ALL
  USING (auth.uid() = owner_id);

-- RLS Policies for template_presets
CREATE POLICY "Users can view all presets"
  ON template_presets
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create own presets"
  ON template_presets
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own presets"
  ON template_presets
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Function to track template usage
CREATE OR REPLACE FUNCTION track_template_usage(
  p_user_id UUID,
  p_template_id TEXT,
  p_success BOOLEAN DEFAULT true,
  p_tokens_used INT DEFAULT NULL,
  p_latency_ms INT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO template_usage_analytics (
    user_id, template_id, usage_count, success_count, failure_count,
    last_used_at, first_used_at, average_tokens_used, average_latency_ms
  )
  VALUES (
    p_user_id, p_template_id, 1,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    NOW(), NOW(), p_tokens_used, p_latency_ms
  )
  ON CONFLICT (user_id, template_id) DO UPDATE SET
    usage_count = template_usage_analytics.usage_count + 1,
    success_count = template_usage_analytics.success_count + 
      CASE WHEN p_success THEN 1 ELSE 0 END,
    failure_count = template_usage_analytics.failure_count + 
      CASE WHEN p_success THEN 0 ELSE 1 END,
    last_used_at = NOW(),
    average_tokens_used = CASE 
      WHEN p_tokens_used IS NOT NULL THEN
        (template_usage_analytics.average_tokens_used * (template_usage_analytics.usage_count - 1) + p_tokens_used) / template_usage_analytics.usage_count
      ELSE template_usage_analytics.average_tokens_used
    END,
    average_latency_ms = CASE
      WHEN p_latency_ms IS NOT NULL THEN
        (template_usage_analytics.average_latency_ms * (template_usage_analytics.usage_count - 1) + p_latency_ms) / template_usage_analytics.usage_count
      ELSE template_usage_analytics.average_latency_ms
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create customization history entry
CREATE OR REPLACE FUNCTION create_customization_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO template_customization_history (
    customization_id, user_id, template_id,
    custom_variables, custom_instructions, enabled,
    change_type, changed_by
  )
  VALUES (
    NEW.id, NEW.user_id, NEW.template_id,
    NEW.custom_variables, NEW.custom_instructions, NEW.enabled,
    CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'updated' END,
    NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track customization changes
CREATE TRIGGER track_customization_changes
  AFTER INSERT OR UPDATE ON user_template_customizations
  FOR EACH ROW
  EXECUTE FUNCTION create_customization_history();

-- Update updated_at triggers
CREATE TRIGGER update_template_presets_updated_at
  BEFORE UPDATE ON template_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_user_template_customizations_updated_at();

CREATE TRIGGER update_shared_template_customizations_updated_at
  BEFORE UPDATE ON shared_template_customizations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_template_customizations_updated_at();

CREATE TRIGGER update_template_feedback_updated_at
  BEFORE UPDATE ON template_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_user_template_customizations_updated_at();
