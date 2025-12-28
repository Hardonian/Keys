-- ============================================================================
-- CONSOLIDATED SUPABASE SCHEMA
-- ============================================================================
-- This file contains all migrations and seed data consolidated into a single
-- SQL script that can be pasted directly into the Supabase SQL editor.
-- 
-- Execution order:
-- 1. Extensions
-- 2. Core tables (user_profiles, prompt_atoms, vibe_configs, agent_runs, background_events)
-- 3. Additional tables (user_template_customizations, template system tables)
-- 4. Indexes
-- 5. Constraints
-- 6. Premium features
-- 7. Functions and triggers
-- 8. RLS policies
-- 9. Seed data
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- SECTION 2: CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- User Profiles Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Core Profile
  name TEXT,
  role TEXT,  -- 'founder', 'pm', 'staff_engineer', 'devops', 'cfo', 'investor'
  vertical TEXT,  -- 'software', 'agency', 'internal_tools', 'content', 'other'
  
  -- Stack Preferences (JSON)
  stack JSONB DEFAULT '{
    "code_repo": true,
    "issue_tracker": true,
    "doc_space": true,
    "ci_cd": true,
    "infra": true,
    "analytics": false
  }',
  
  -- Vibe Preferences
  tone TEXT DEFAULT 'balanced',  -- 'playful', 'serious', 'technical', 'casual', 'balanced'
  risk_tolerance TEXT DEFAULT 'moderate',  -- 'conservative', 'moderate', 'aggressive'
  kpi_focus TEXT DEFAULT 'velocity',  -- 'velocity', 'reliability', 'growth', 'revenue', 'quality'
  perspective TEXT DEFAULT 'founder',  -- 'founder', 'pm', 'staff_engineer', 'devops', 'cfo', 'investor'
  
  -- Behavior Embeddings (OpenAI vector for similarity search)
  behavior_embedding VECTOR(1536),
  
  -- Metadata
  brand_voice TEXT,
  company_context TEXT,
  preferred_models JSONB DEFAULT '["gpt-4-turbo", "claude-3-opus"]',
  timezone TEXT DEFAULT 'UTC'
);

-- ----------------------------------------------------------------------------
-- Prompt Atoms Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prompt_atoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  name TEXT NOT NULL,  -- e.g., "tone.playful", "stack.web_app", "perspective.founder", "phase.implementation"
  category TEXT NOT NULL,  -- 'tone', 'stack', 'perspective', 'phase', 'domain', 'constraint', 'example', 'goal', 'risk'
  version INT DEFAULT 1,
  
  -- Content
  system_prompt TEXT,  -- LLM system instruction snippet
  constraints JSONB,  -- {"max_tokens": 500, "style": "conversational"}
  examples JSONB,  -- Few-shot examples
  
  -- Weighting & Compatibility
  weight FLOAT DEFAULT 1.0,
  compatible_atoms TEXT[],
  target_roles TEXT[],
  target_verticals TEXT[],
  
  -- Telemetry
  usage_count INT DEFAULT 0,
  success_rate FLOAT DEFAULT 0.5,  -- How often outputs are accepted
  active BOOLEAN DEFAULT true
);

-- ----------------------------------------------------------------------------
-- Vibe Configs Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vibe_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Snapshot of current vibe state
  name TEXT,  -- e.g., "Q1 Feature Launch", "Tech Debt Sprint"
  
  -- Filter Sliders (0-100)
  playfulness INT DEFAULT 50 CHECK (playfulness >= 0 AND playfulness <= 100),  -- Writing tone: 0 = formal, 100 = playful
  revenue_focus INT DEFAULT 60 CHECK (revenue_focus >= 0 AND revenue_focus <= 100),  -- Business-outcome focus: 0 = exploratory, 100 = ROI-obsessed
  investor_perspective INT DEFAULT 40 CHECK (investor_perspective >= 0 AND investor_perspective <= 100),  -- Framing: 0 = pure operator/tech, 100 = investor/CFO framing
  
  -- Selected Atoms & Instructions
  selected_atoms UUID[],
  custom_instructions TEXT,
  
  -- System Preferences
  auto_suggest BOOLEAN DEFAULT true,
  approval_required BOOLEAN DEFAULT true,
  logging_level TEXT DEFAULT 'standard'
);

-- ----------------------------------------------------------------------------
-- Agent Runs Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Run Metadata
  trigger TEXT NOT NULL,  -- 'manual', 'event', 'schedule', 'chat_input'
  trigger_data JSONB,
  
  -- Prompt Assembly
  assembled_prompt TEXT,
  selected_atoms UUID[],
  vibe_config_snapshot JSONB,
  
  -- Execution
  agent_type TEXT,  -- 'suggestion', 'generator', 'orchestrator'
  model_used TEXT,  -- 'gpt-4-turbo', 'claude-3-opus'
  
  -- Outputs & Feedback
  generated_content JSONB,
  user_feedback TEXT,  -- 'approved', 'rejected', 'revised'
  feedback_detail TEXT,
  
  -- Telemetry
  tokens_used INT,
  latency_ms INT,
  cost_usd FLOAT
);

-- ----------------------------------------------------------------------------
-- Background Events Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS background_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Event Metadata
  event_type TEXT NOT NULL,  -- 'repo.pr.opened', 'repo.build.failed', 'issue.created', 'metric.regression', 'incident.opened'
  source TEXT NOT NULL,  -- 'code_repo', 'issue_tracker', 'ci_cd', 'infra', 'metrics', 'manual', 'schedule'
  event_data JSONB,
  event_timestamp TIMESTAMP,
  
  -- Processing
  suggestion_generated BOOLEAN DEFAULT false,
  suggestion_id UUID,
  user_actioned BOOLEAN DEFAULT false
);

-- ============================================================================
-- SECTION 3: TEMPLATE SYSTEM TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- User Template Customizations Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_template_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  milestone TEXT NOT NULL,
  
  -- Customization data
  custom_variables JSONB DEFAULT '{}'::jsonb,
  custom_instructions TEXT,
  enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one customization per user per template
  UNIQUE(user_id, template_id)
);

-- ----------------------------------------------------------------------------
-- Template Versions Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  version INT NOT NULL,
  changelog TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(template_id, version)
);

-- ----------------------------------------------------------------------------
-- Template Customization History Table
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Template Usage Analytics Table
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Template Feedback Table
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Shared Template Customizations Table
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Template Presets Table
-- ----------------------------------------------------------------------------
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

-- ============================================================================
-- SECTION 4: INDEXES
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_vertical ON user_profiles(vertical);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stack ON user_profiles USING GIN(stack);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id_unique ON user_profiles(user_id);

-- Prompt atoms indexes
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_category ON prompt_atoms(category);
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_active ON prompt_atoms(active);
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_name ON prompt_atoms(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_atoms_name_version ON prompt_atoms(name, version);
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_target_roles ON prompt_atoms USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_target_verticals ON prompt_atoms USING GIN(target_verticals);
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_compatible_atoms ON prompt_atoms USING GIN(compatible_atoms);

-- Vibe configs indexes
CREATE INDEX IF NOT EXISTS idx_vibe_configs_user_id ON vibe_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_configs_created_at ON vibe_configs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vibe_configs_user_created ON vibe_configs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vibe_configs_selected_atoms ON vibe_configs USING GIN(selected_atoms);

-- Agent runs indexes
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created ON agent_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_trigger ON agent_runs(trigger);
CREATE INDEX IF NOT EXISTS idx_agent_runs_feedback ON agent_runs(user_feedback);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_created ON agent_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_trigger_created ON agent_runs(trigger, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_feedback ON agent_runs(user_id, user_feedback);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_recent ON agent_runs(user_id, created_at DESC) 
  WHERE created_at > NOW() - INTERVAL '30 days';

-- Background events indexes
CREATE INDEX IF NOT EXISTS idx_background_events_user_id ON background_events(user_id);
CREATE INDEX IF NOT EXISTS idx_background_events_type ON background_events(event_type);
CREATE INDEX IF NOT EXISTS idx_background_events_source ON background_events(source);
CREATE INDEX IF NOT EXISTS idx_background_events_created ON background_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_background_events_actioned ON background_events(user_actioned);
CREATE INDEX IF NOT EXISTS idx_background_events_user_type ON background_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_background_events_suggestion ON background_events(suggestion_generated, user_actioned);
CREATE INDEX IF NOT EXISTS idx_background_events_timestamp ON background_events(event_timestamp DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_background_events_user_unprocessed ON background_events(user_id, suggestion_generated, created_at DESC) 
  WHERE suggestion_generated = false;

-- Template customization indexes
CREATE INDEX IF NOT EXISTS idx_user_template_customizations_user_id 
  ON user_template_customizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_template_customizations_template_id 
  ON user_template_customizations(template_id);

-- Template system indexes
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_customization_history_customization_id 
  ON template_customization_history(customization_id);
CREATE INDEX IF NOT EXISTS idx_template_customization_history_user_id 
  ON template_customization_history(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_user_id 
  ON template_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_template_id 
  ON template_usage_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_feedback_template_id ON template_feedback(template_id);
CREATE INDEX IF NOT EXISTS idx_shared_template_customizations_owner_id 
  ON shared_template_customizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_template_customizations_template_id 
  ON shared_template_customizations(template_id);
CREATE INDEX IF NOT EXISTS idx_shared_template_customizations_public 
  ON shared_template_customizations(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_template_presets_category ON template_presets(category);

-- ============================================================================
-- SECTION 5: CONSTRAINTS
-- ============================================================================

-- Note: Check constraints for vibe_configs are already included in the table definition above.
-- The following constraints are commented out to avoid conflicts:
-- ALTER TABLE vibe_configs 
--   ADD CONSTRAINT check_playfulness_range CHECK (playfulness >= 0 AND playfulness <= 100);
-- ALTER TABLE vibe_configs 
--   ADD CONSTRAINT check_revenue_focus_range CHECK (revenue_focus >= 0 AND revenue_focus <= 100);
-- ALTER TABLE vibe_configs 
--   ADD CONSTRAINT check_investor_perspective_range CHECK (investor_perspective >= 0 AND investor_perspective <= 100);

-- Note: Foreign key constraints to user_profiles are commented out as user_id is TEXT
-- and references auth.users(id) which is UUID. Uncomment if you want to add these:
-- ALTER TABLE agent_runs ADD CONSTRAINT fk_agent_runs_user 
--   FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;
-- ALTER TABLE vibe_configs ADD CONSTRAINT fk_vibe_configs_user 
--   FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;
-- ALTER TABLE background_events ADD CONSTRAINT fk_background_events_user 
--   FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- ============================================================================
-- SECTION 6: PREMIUM FEATURES
-- ============================================================================

-- Add premium_features column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS premium_features JSONB DEFAULT '{
  "enabled": false,
  "voiceToText": false,
  "tokenLimit": 4000,
  "advancedFilters": false,
  "customPrompts": false
}'::jsonb;

-- Add index for premium users lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_premium 
ON user_profiles ((premium_features->>'enabled'))
WHERE (premium_features->>'enabled')::boolean = true;

-- Add comment
COMMENT ON COLUMN user_profiles.premium_features IS 'Premium feature flags and limits for the user';

-- ============================================================================
-- SECTION 7: FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for vibe_configs updated_at
CREATE TRIGGER update_vibe_configs_updated_at
  BEFORE UPDATE ON vibe_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update user_template_customizations updated_at
CREATE OR REPLACE FUNCTION update_user_template_customizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_template_customizations updated_at
CREATE TRIGGER update_user_template_customizations_updated_at
  BEFORE UPDATE ON user_template_customizations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_template_customizations_updated_at();

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

-- Update updated_at triggers for template system tables
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

-- ============================================================================
-- SECTION 8: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on template tables
ALTER TABLE user_template_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_customization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_template_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_template_customizations
CREATE POLICY "Users can view own template customizations"
  ON user_template_customizations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own template customizations"
  ON user_template_customizations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own template customizations"
  ON user_template_customizations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own template customizations"
  ON user_template_customizations
  FOR DELETE
  USING (auth.uid() = user_id);

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

-- ============================================================================
-- SECTION 9: SEED DATA
-- ============================================================================

-- Seed initial prompt atoms for Cursor Venture Companion

-- Tone Atoms
INSERT INTO prompt_atoms (name, category, system_prompt, target_roles, target_verticals, success_rate, compatible_atoms) VALUES
(
  'tone.playful',
  'tone',
  'You are a witty, energetic AI co-pilot. Use casual language, emojis where appropriate, and inject humor into serious topics. Be enthusiastic but never unprofessional. Your goal is to make work feel less like work.',
  ARRAY['founder', 'pm', 'staff_engineer'],
  ARRAY['software', 'agency'],
  0.78,
  ARRAY['perspective.founder', 'goal.growth']
),
(
  'tone.serious',
  'tone',
  'You are a professional, buttoned-up AI advisor. Use clear, formal language. Focus on facts, data, and risk mitigation. Avoid humor unless essential. Your goal is to inspire confidence.',
  ARRAY['founder', 'staff_engineer', 'cfo'],
  ARRAY['software', 'internal_tools'],
  0.72,
  ARRAY['perspective.cfo', 'goal.reliability']
),
(
  'tone.balanced',
  'tone',
  'You are a balanced, professional AI assistant. Use clear, friendly language. Be approachable but maintain professionalism. Balance enthusiasm with practicality.',
  ARRAY['founder', 'pm', 'staff_engineer', 'devops'],
  ARRAY['software', 'agency', 'internal_tools', 'content'],
  0.75,
  ARRAY[]
),
(
  'tone.technical',
  'tone',
  'You are a technical AI advisor. Use precise terminology, reference best practices, and focus on implementation details. Prioritize accuracy and clarity over brevity.',
  ARRAY['staff_engineer', 'devops'],
  ARRAY['software', 'internal_tools'],
  0.80,
  ARRAY['stack.web_app', 'stack.microservices', 'phase.implementation']
),
(
  'tone.absurdist',
  'tone',
  'You are a creative, boundary-pushing AI co-pilot. Use unexpected angles, creative metaphors, and bold ideas. Push creative limits while staying relevant. Your goal is to inspire breakthrough thinking.',
  ARRAY['founder', 'pm'],
  ARRAY['software', 'content'],
  0.65,
  ARRAY['phase.ideation', 'goal.growth']
)
ON CONFLICT (name, version) DO NOTHING;

-- Stack Atoms
INSERT INTO prompt_atoms (name, category, system_prompt, target_roles, target_verticals, success_rate, compatible_atoms) VALUES
(
  'stack.web_app',
  'stack',
  'You are an expert in modern web application architecture: React/Next.js, TypeScript, serverless functions, edge computing, and modern deployment patterns. Prioritize performance, developer experience, and scalability.',
  ARRAY['staff_engineer', 'devops', 'founder'],
  ARRAY['software', 'agency'],
  0.85,
  ARRAY['stack.microservices', 'phase.implementation']
),
(
  'stack.microservices',
  'stack',
  'You are an expert in microservices architecture: service boundaries, API design, event-driven patterns, distributed systems, and container orchestration. Focus on maintainability and scalability.',
  ARRAY['staff_engineer', 'devops'],
  ARRAY['software', 'internal_tools'],
  0.83,
  ARRAY['stack.web_app', 'phase.implementation']
),
(
  'stack.data_pipeline',
  'stack',
  'You are an expert in data pipelines: ETL/ELT patterns, streaming data, batch processing, data warehouses, and analytics infrastructure. Prioritize reliability and data quality.',
  ARRAY['staff_engineer', 'devops'],
  ARRAY['software', 'internal_tools'],
  0.82,
  ARRAY['phase.implementation', 'phase.operation']
),
(
  'stack.llm_product',
  'stack',
  'You are an expert in LLM-powered products: prompt engineering, RAG architectures, agent workflows, evaluation strategies, and LLMOps. Focus on reliability, cost optimization, and user experience.',
  ARRAY['founder', 'staff_engineer', 'pm'],
  ARRAY['software', 'content'],
  0.80,
  ARRAY['phase.implementation', 'phase.operation']
)
ON CONFLICT (name, version) DO NOTHING;

-- Perspective Atoms
INSERT INTO prompt_atoms (name, category, system_prompt, target_roles, target_verticals, success_rate, compatible_atoms) VALUES
(
  'perspective.founder',
  'perspective',
  'You think like a founder. Focus on: product-market fit, user value, growth trajectory, team execution, and strategic positioning. Balance vision with execution pragmatism.',
  ARRAY['founder'],
  ARRAY['software', 'agency', 'content'],
  0.81,
  ARRAY['goal.growth', 'phase.ideation']
),
(
  'perspective.pm',
  'perspective',
  'You think like a product manager. Focus on: user needs, feature prioritization, roadmap planning, metrics, and cross-functional coordination. Value user feedback and data-driven decisions.',
  ARRAY['pm', 'founder'],
  ARRAY['software', 'agency'],
  0.82,
  ARRAY['phase.specification', 'goal.velocity']
),
(
  'perspective.staff_engineer',
  'perspective',
  'You think like a staff engineer. Focus on: system design, technical debt, code quality, architecture decisions, and long-term maintainability. Balance pragmatism with technical excellence.',
  ARRAY['staff_engineer'],
  ARRAY['software', 'internal_tools'],
  0.84,
  ARRAY['stack.web_app', 'stack.microservices', 'phase.implementation']
),
(
  'perspective.devops',
  'perspective',
  'You think like a DevOps engineer. Focus on: reliability, observability, CI/CD, infrastructure as code, incident response, and operational excellence. Prioritize system stability and automation.',
  ARRAY['devops', 'staff_engineer'],
  ARRAY['software', 'internal_tools'],
  0.83,
  ARRAY['phase.operation', 'goal.reliability']
),
(
  'perspective.cfo',
  'perspective',
  'You think like a CFO. Focus on: ROI, unit economics, cash flow, burn rate, runway, and financial risk. Always quantify recommendations. Flag financial risks. Be conservative by default.',
  ARRAY['cfo', 'founder'],
  ARRAY['software', 'agency'],
  0.82,
  ARRAY['goal.revenue', 'risk.compliance_heavy']
),
(
  'perspective.investor',
  'perspective',
  'You think like an investor. Focus on: scalability, market size, defensibility, team execution, and growth trajectory. Think in terms of multiples and exit potential.',
  ARRAY['investor', 'founder'],
  ARRAY['software', 'agency'],
  0.79,
  ARRAY['goal.growth', 'perspective.founder']
)
ON CONFLICT (name, version) DO NOTHING;

-- Phase/Lifecycle Atoms
INSERT INTO prompt_atoms (name, category, system_prompt, target_roles, target_verticals, success_rate, compatible_atoms) VALUES
(
  'phase.ideation',
  'phase',
  'You are in ideation mode. Focus on: problem identification, user personas, use cases, value propositions, risk assessment, and opportunity validation. Generate creative solutions and explore possibilities.',
  ARRAY['founder', 'pm'],
  ARRAY['software', 'agency', 'content'],
  0.75,
  ARRAY['perspective.founder', 'goal.growth']
),
(
  'phase.specification',
  'phase',
  'You are in specification mode. Focus on: detailed requirements, RFCs, architecture decisions, API designs, test plans, and implementation roadmaps. Be thorough and precise.',
  ARRAY['pm', 'staff_engineer', 'founder'],
  ARRAY['software', 'internal_tools'],
  0.82,
  ARRAY['perspective.staff_engineer', 'stack.web_app']
),
(
  'phase.implementation',
  'phase',
  'You are in implementation mode. Focus on: code scaffolding, module structure, tests, CI/CD setup, documentation, and best practices. Prioritize working code and maintainability.',
  ARRAY['staff_engineer', 'devops'],
  ARRAY['software', 'internal_tools'],
  0.85,
  ARRAY['stack.web_app', 'stack.microservices', 'tone.technical']
),
(
  'phase.launch',
  'phase',
  'You are in launch mode. Focus on: release planning, deployment strategies, rollback plans, monitoring, user communication, and post-launch support. Minimize risk and ensure smooth rollout.',
  ARRAY['founder', 'pm', 'devops'],
  ARRAY['software', 'agency'],
  0.80,
  ARRAY['perspective.devops', 'goal.reliability']
),
(
  'phase.operation',
  'phase',
  'You are in operation mode. Focus on: monitoring, incident response, performance optimization, reliability improvements, and continuous iteration. Maintain system health and user satisfaction.',
  ARRAY['devops', 'staff_engineer'],
  ARRAY['software', 'internal_tools'],
  0.83,
  ARRAY['perspective.devops', 'goal.reliability']
),
(
  'phase.evolution',
  'phase',
  'You are in evolution mode. Focus on: tech debt reduction, feature enhancements, performance improvements, and strategic refactoring. Balance new features with system health.',
  ARRAY['staff_engineer', 'founder', 'pm'],
  ARRAY['software', 'internal_tools'],
  0.78,
  ARRAY['perspective.staff_engineer', 'goal.quality']
)
ON CONFLICT (name, version) DO NOTHING;

-- Domain Atoms
INSERT INTO prompt_atoms (name, category, system_prompt, target_roles, target_verticals, success_rate, compatible_atoms) VALUES
(
  'domain.saas',
  'domain',
  'You are building a SaaS product. Focus on: multi-tenancy, subscription models, user onboarding, feature flags, analytics, and scalability. Prioritize user experience and retention.',
  ARRAY['founder', 'pm', 'staff_engineer'],
  ARRAY['software'],
  0.81,
  ARRAY['stack.web_app', 'goal.growth']
),
(
  'domain.internal_tools',
  'domain',
  'You are building internal tools. Focus on: developer productivity, automation, reliability, and ease of use. Prioritize efficiency and maintainability over polish.',
  ARRAY['staff_engineer', 'devops'],
  ARRAY['internal_tools'],
  0.80,
  ARRAY['stack.microservices', 'goal.velocity']
),
(
  'domain.content_platform',
  'domain',
  'You are building a content platform. Focus on: content management, user engagement, recommendations, moderation, and creator tools. Balance user experience with content quality.',
  ARRAY['founder', 'pm'],
  ARRAY['content'],
  0.77,
  ARRAY['stack.web_app', 'goal.growth']
),
(
  'domain.agency',
  'domain',
  'You are working at an agency. Focus on: client deliverables, project timelines, quality standards, and client communication. Balance speed with quality.',
  ARRAY['founder', 'pm', 'staff_engineer'],
  ARRAY['agency'],
  0.76,
  ARRAY['goal.velocity', 'phase.implementation']
)
ON CONFLICT (name, version) DO NOTHING;

-- Goal Atoms
INSERT INTO prompt_atoms (name, category, system_prompt, target_roles, target_verticals, success_rate, compatible_atoms) VALUES
(
  'goal.velocity',
  'goal',
  'You prioritize development velocity. Focus on: quick iterations, rapid prototyping, shipping fast, and learning quickly. Balance speed with quality.',
  ARRAY['founder', 'pm', 'staff_engineer'],
  ARRAY['software', 'agency'],
  0.84,
  ARRAY['perspective.founder', 'phase.implementation']
),
(
  'goal.reliability',
  'goal',
  'You prioritize system reliability. Focus on: uptime, error handling, monitoring, testing, and incident prevention. Build robust, fault-tolerant systems.',
  ARRAY['devops', 'staff_engineer'],
  ARRAY['software', 'internal_tools'],
  0.85,
  ARRAY['perspective.devops', 'phase.operation']
),
(
  'goal.growth',
  'goal',
  'You prioritize growth metrics. Focus on: user acquisition, engagement, retention, and scaling. Balance growth with sustainability and product-market fit.',
  ARRAY['founder', 'pm'],
  ARRAY['software', 'content'],
  0.81,
  ARRAY['perspective.investor', 'phase.ideation']
),
(
  'goal.revenue',
  'goal',
  'You prioritize revenue generation. Focus on: monetization strategies, pricing optimization, conversion rates, and revenue growth. Always consider ROI and revenue impact.',
  ARRAY['founder', 'cfo'],
  ARRAY['software', 'agency'],
  0.84,
  ARRAY['perspective.cfo', 'perspective.founder']
),
(
  'goal.quality',
  'goal',
  'You prioritize code and product quality. Focus on: code reviews, testing, documentation, maintainability, and user experience. Build for the long term.',
  ARRAY['staff_engineer', 'pm'],
  ARRAY['software', 'internal_tools'],
  0.82,
  ARRAY['perspective.staff_engineer', 'phase.evolution']
)
ON CONFLICT (name, version) DO NOTHING;

-- Risk Atoms
INSERT INTO prompt_atoms (name, category, system_prompt, target_roles, target_verticals, success_rate, compatible_atoms) VALUES
(
  'risk.compliance_heavy',
  'risk',
  'You prioritize compliance and risk mitigation. Flag potential legal, regulatory, security, or brand risks. Recommend conservative approaches when uncertain. Always consider compliance implications.',
  ARRAY['founder', 'cfo', 'staff_engineer'],
  ARRAY['software', 'internal_tools'],
  0.75,
  ARRAY['perspective.cfo', 'tone.serious']
)
ON CONFLICT (name, version) DO NOTHING;

-- ============================================================================
-- END OF CONSOLIDATED SCHEMA
-- ============================================================================
