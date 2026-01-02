-- ============================================================================
-- SUPABASE BACKEND CONSOLIDATED PATCH (IDEMPOTENT)
-- ============================================================================
-- This patch consolidates all migrations into a single, idempotent SQL script.
-- Safe to run multiple times. Only adds/fixes missing objects.
-- 
-- Execution: Run this entire script in Supabase SQL Editor or via psql.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- SECTION 2: CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- User Profiles Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Core Profile
  name TEXT,
  role TEXT,
  vertical TEXT,
  
  -- Stack Preferences (JSON)
  stack JSONB DEFAULT '{
    "code_repo": true,
    "issue_tracker": true,
    "doc_space": true,
    "ci_cd": true,
    "infra": true,
    "analytics": false
  }'::jsonb,
  
  -- Vibe Preferences
  tone TEXT DEFAULT 'balanced',
  risk_tolerance TEXT DEFAULT 'moderate',
  kpi_focus TEXT DEFAULT 'velocity',
  perspective TEXT DEFAULT 'founder',
  
  -- Behavior Embeddings
  behavior_embedding VECTOR(1536),
  
  -- Metadata
  brand_voice TEXT,
  company_context TEXT,
  preferred_models JSONB DEFAULT '["gpt-4-turbo", "claude-3-opus"]'::jsonb,
  timezone TEXT DEFAULT 'UTC',
  
  -- Premium Features
  premium_features JSONB DEFAULT '{
    "enabled": false,
    "voiceToText": false,
    "tokenLimit": 4000,
    "advancedFilters": false,
    "customPrompts": false
  }'::jsonb,
  
  -- Billing
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'inactive', 'canceled', 'past_due')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'pro+', 'enterprise')),
  subscription_current_period_end TIMESTAMPTZ,
  org_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Failure Memory System
  prevented_failures_count INT DEFAULT 0,
  guarantee_coverage TEXT[] DEFAULT ARRAY[]::TEXT[],
  integration_access TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Add missing columns (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'premium_features'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN premium_features JSONB DEFAULT '{
      "enabled": false,
      "voiceToText": false,
      "tokenLimit": 4000,
      "advancedFilters": false,
      "customPrompts": false
    }'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD COLUMN stripe_customer_id TEXT,
      ADD COLUMN subscription_status TEXT DEFAULT 'free',
      ADD COLUMN subscription_tier TEXT DEFAULT 'free',
      ADD COLUMN subscription_current_period_end TIMESTAMPTZ,
      ADD COLUMN org_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'prevented_failures_count'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD COLUMN prevented_failures_count INT DEFAULT 0,
      ADD COLUMN guarantee_coverage TEXT[] DEFAULT ARRAY[]::TEXT[],
      ADD COLUMN integration_access TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
  
  -- Update subscription_tier constraint to include 'pro+'
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_subscription_tier_check'
  ) THEN
    ALTER TABLE public.user_profiles DROP CONSTRAINT user_profiles_subscription_tier_check;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_subscription_tier_check'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_subscription_tier_check 
      CHECK (subscription_tier IN ('free', 'pro', 'pro+', 'enterprise'));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Prompt Atoms Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prompt_atoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  version INT DEFAULT 1,
  
  system_prompt TEXT,
  constraints JSONB,
  examples JSONB,
  
  weight FLOAT DEFAULT 1.0,
  compatible_atoms TEXT[],
  target_roles TEXT[],
  target_verticals TEXT[],
  
  usage_count INT DEFAULT 0,
  success_rate FLOAT DEFAULT 0.5,
  active BOOLEAN DEFAULT true
);

-- Ensure NOT NULL constraints
DO $$
BEGIN
  ALTER TABLE public.prompt_atoms 
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN category SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- Vibe Configs Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vibe_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  name TEXT,
  
  playfulness INT DEFAULT 50 CHECK (playfulness >= 0 AND playfulness <= 100),
  revenue_focus INT DEFAULT 60 CHECK (revenue_focus >= 0 AND revenue_focus <= 100),
  investor_perspective INT DEFAULT 40 CHECK (investor_perspective >= 0 AND investor_perspective <= 100),
  
  selected_atoms UUID[],
  custom_instructions TEXT,
  
  auto_suggest BOOLEAN DEFAULT true,
  approval_required BOOLEAN DEFAULT true,
  logging_level TEXT DEFAULT 'standard'
);

-- ----------------------------------------------------------------------------
-- Agent Runs Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  trigger TEXT NOT NULL,
  trigger_data JSONB,
  
  assembled_prompt TEXT,
  selected_atoms UUID[],
  vibe_config_snapshot JSONB,
  
  agent_type TEXT,
  model_used TEXT,
  
  generated_content JSONB,
  user_feedback TEXT,
  feedback_detail TEXT,
  
  tokens_used INT,
  latency_ms INT,
  cost_usd FLOAT,
  
  -- Failure Memory System columns
  failure_pattern_id UUID,
  success_pattern_id UUID,
  safety_checks_passed BOOLEAN DEFAULT true,
  safety_check_results JSONB
);

-- Ensure NOT NULL constraints
DO $$
BEGIN
  ALTER TABLE public.agent_runs 
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN trigger SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Add failure memory columns if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'agent_runs' AND column_name = 'failure_pattern_id'
  ) THEN
    ALTER TABLE public.agent_runs
      ADD COLUMN failure_pattern_id UUID,
      ADD COLUMN success_pattern_id UUID,
      ADD COLUMN safety_checks_passed BOOLEAN DEFAULT true,
      ADD COLUMN safety_check_results JSONB;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Background Events Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.background_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  event_data JSONB,
  event_timestamp TIMESTAMP,
  
  suggestion_generated BOOLEAN DEFAULT false,
  suggestion_id UUID,
  user_actioned BOOLEAN DEFAULT false
);

-- Ensure NOT NULL constraints
DO $$
BEGIN
  ALTER TABLE public.background_events 
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN event_type SET NOT NULL,
    ALTER COLUMN source SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- SECTION 3: TEMPLATE SYSTEM TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_template_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  milestone TEXT NOT NULL,
  
  custom_variables JSONB DEFAULT '{}'::jsonb,
  custom_instructions TEXT,
  enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, template_id)
);

CREATE TABLE IF NOT EXISTS public.template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  version INT NOT NULL,
  changelog TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(template_id, version)
);

CREATE TABLE IF NOT EXISTS public.template_customization_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customization_id UUID NOT NULL REFERENCES public.user_template_customizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  
  custom_variables JSONB,
  custom_instructions TEXT,
  enabled BOOLEAN,
  
  change_type TEXT NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  changed_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.template_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,
  
  average_rating FLOAT,
  total_ratings INT DEFAULT 0,
  
  average_tokens_used INT,
  average_latency_ms INT,
  
  first_used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, template_id)
);

CREATE TABLE IF NOT EXISTS public.template_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  suggestions TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, template_id)
);

CREATE TABLE IF NOT EXISTS public.shared_template_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  shared_with_user_ids UUID[] DEFAULT ARRAY[]::UUID[],
  shared_with_team_ids UUID[] DEFAULT ARRAY[]::UUID[],
  
  custom_variables JSONB DEFAULT '{}'::jsonb,
  custom_instructions TEXT,
  
  usage_count INT DEFAULT 0,
  rating_average FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.template_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  
  template_ids TEXT[] NOT NULL,
  custom_variables JSONB DEFAULT '{}'::jsonb,
  custom_instructions TEXT,
  
  is_system_preset BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: BILLING & ORGANIZATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, email)
);

CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('runs', 'tokens', 'templates', 'exports')),
  metric_value INT NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, metric_type, period_start)
);

-- ============================================================================
-- SECTION 5: FAILURE MEMORY SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.failure_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'security', 'quality', 'compliance', 'performance', 'architecture',
    'best_practice', 'user_rejection', 'user_revision'
  )),
  
  pattern_description TEXT NOT NULL,
  pattern_signature TEXT NOT NULL,
  detected_in TEXT,
  original_output TEXT,
  failure_reason TEXT,
  
  prevention_rule TEXT NOT NULL,
  prevention_prompt_addition TEXT,
  
  context_snapshot JSONB,
  template_id TEXT,
  vibe_config_snapshot JSONB,
  
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  
  occurrence_count INT DEFAULT 1,
  last_occurrence TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.success_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'security', 'quality', 'compliance', 'performance', 'architecture',
    'best_practice', 'user_approval', 'production_ready'
  )),
  
  pattern_description TEXT NOT NULL,
  pattern_signature TEXT NOT NULL,
  context TEXT NOT NULL,
  outcome TEXT NOT NULL,
  
  success_factors TEXT[],
  template_id TEXT,
  vibe_config_snapshot JSONB,
  
  context_snapshot JSONB,
  output_example TEXT,
  
  usage_count INT DEFAULT 1,
  success_rate FLOAT DEFAULT 1.0,
  last_used TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pattern_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  pattern_id UUID NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('failure', 'success')),
  match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'similar', 'prevented')),
  
  matched_against TEXT NOT NULL,
  match_confidence FLOAT DEFAULT 0.5,
  context_snapshot JSONB,
  
  action_taken TEXT,
  outcome TEXT
);

-- Add foreign key references for failure patterns in agent_runs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'agent_runs_failure_pattern_id_fkey'
  ) THEN
    ALTER TABLE public.agent_runs
      ADD CONSTRAINT agent_runs_failure_pattern_id_fkey 
      FOREIGN KEY (failure_pattern_id) REFERENCES public.failure_patterns(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'agent_runs_success_pattern_id_fkey'
  ) THEN
    ALTER TABLE public.agent_runs
      ADD CONSTRAINT agent_runs_success_pattern_id_fkey 
      FOREIGN KEY (success_pattern_id) REFERENCES public.success_patterns(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- SECTION 6: INDEXES
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_vertical ON public.user_profiles(vertical);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON public.user_profiles(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stack ON public.user_profiles USING GIN(stack);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id_unique ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_premium 
  ON public.user_profiles ((premium_features->>'enabled'))
  WHERE (premium_features->>'enabled')::boolean = true;
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON public.user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON public.user_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_prevented_failures ON public.user_profiles(prevented_failures_count);

-- Prompt atoms indexes
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_category ON public.prompt_atoms(category);
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_active ON public.prompt_atoms(active);
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_name ON public.prompt_atoms(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_atoms_name_version ON public.prompt_atoms(name, version);
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_target_roles ON public.prompt_atoms USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_target_verticals ON public.prompt_atoms USING GIN(target_verticals);
CREATE INDEX IF NOT EXISTS idx_prompt_atoms_compatible_atoms ON public.prompt_atoms USING GIN(compatible_atoms);

-- Vibe configs indexes
CREATE INDEX IF NOT EXISTS idx_vibe_configs_user_id ON public.vibe_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_configs_created_at ON public.vibe_configs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vibe_configs_user_created ON public.vibe_configs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vibe_configs_selected_atoms ON public.vibe_configs USING GIN(selected_atoms);

-- Agent runs indexes
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON public.agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created ON public.agent_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_trigger ON public.agent_runs(trigger);
CREATE INDEX IF NOT EXISTS idx_agent_runs_feedback ON public.agent_runs(user_feedback);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_created ON public.agent_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_trigger_created ON public.agent_runs(trigger, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_feedback ON public.agent_runs(user_id, user_feedback);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_recent ON public.agent_runs(user_id, created_at DESC) 
  WHERE created_at > NOW() - INTERVAL '30 days';
CREATE INDEX IF NOT EXISTS idx_agent_runs_failure_pattern ON public.agent_runs(failure_pattern_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_success_pattern ON public.agent_runs(success_pattern_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_safety_checks ON public.agent_runs(safety_checks_passed);

-- Background events indexes
CREATE INDEX IF NOT EXISTS idx_background_events_user_id ON public.background_events(user_id);
CREATE INDEX IF NOT EXISTS idx_background_events_type ON public.background_events(event_type);
CREATE INDEX IF NOT EXISTS idx_background_events_source ON public.background_events(source);
CREATE INDEX IF NOT EXISTS idx_background_events_created ON public.background_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_background_events_actioned ON public.background_events(user_actioned);
CREATE INDEX IF NOT EXISTS idx_background_events_user_type ON public.background_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_background_events_suggestion ON public.background_events(suggestion_generated, user_actioned);
CREATE INDEX IF NOT EXISTS idx_background_events_timestamp ON public.background_events(event_timestamp DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_background_events_user_unprocessed ON public.background_events(user_id, suggestion_generated, created_at DESC) 
  WHERE suggestion_generated = false;

-- Template customization indexes
CREATE INDEX IF NOT EXISTS idx_user_template_customizations_user_id 
  ON public.user_template_customizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_template_customizations_template_id 
  ON public.user_template_customizations(template_id);

-- Template system indexes
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON public.template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_customization_history_customization_id 
  ON public.template_customization_history(customization_id);
CREATE INDEX IF NOT EXISTS idx_template_customization_history_user_id 
  ON public.template_customization_history(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_user_id 
  ON public.template_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_template_id 
  ON public.template_usage_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_feedback_template_id ON public.template_feedback(template_id);
CREATE INDEX IF NOT EXISTS idx_shared_template_customizations_owner_id 
  ON public.shared_template_customizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_template_customizations_template_id 
  ON public.shared_template_customizations(template_id);
CREATE INDEX IF NOT EXISTS idx_shared_template_customizations_public 
  ON public.shared_template_customizations(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_template_presets_category ON public.template_presets(category);

-- Billing & org indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON public.invitations(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_id ON public.usage_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_period ON public.usage_metrics(period_start, period_end);

-- Failure memory indexes
CREATE INDEX IF NOT EXISTS idx_failure_patterns_user_id ON public.failure_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_type ON public.failure_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_signature ON public.failure_patterns(pattern_signature);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_detected_in ON public.failure_patterns(detected_in);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_severity ON public.failure_patterns(severity);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_resolved ON public.failure_patterns(resolved);

CREATE INDEX IF NOT EXISTS idx_success_patterns_user_id ON public.success_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_success_patterns_type ON public.success_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_success_patterns_signature ON public.success_patterns(pattern_signature);
CREATE INDEX IF NOT EXISTS idx_success_patterns_context ON public.success_patterns(context);

CREATE INDEX IF NOT EXISTS idx_pattern_matches_user_id ON public.pattern_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_pattern_matches_pattern_id ON public.pattern_matches(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_matches_type ON public.pattern_matches(pattern_type);

-- ============================================================================
-- SECTION 7: CONSTRAINTS
-- ============================================================================

-- Add check constraints for vibe_configs (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_playfulness_range'
  ) THEN
    ALTER TABLE public.vibe_configs 
      ADD CONSTRAINT check_playfulness_range CHECK (playfulness >= 0 AND playfulness <= 100);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_revenue_focus_range'
  ) THEN
    ALTER TABLE public.vibe_configs 
      ADD CONSTRAINT check_revenue_focus_range CHECK (revenue_focus >= 0 AND revenue_focus <= 100);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_investor_perspective_range'
  ) THEN
    ALTER TABLE public.vibe_configs 
      ADD CONSTRAINT check_investor_perspective_range CHECK (investor_perspective >= 0 AND investor_perspective <= 100);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 8: FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_template_customizations_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_template_usage(
  p_user_id UUID,
  p_template_id TEXT,
  p_success BOOLEAN DEFAULT true,
  p_tokens_used INT DEFAULT NULL,
  p_latency_ms INT DEFAULT NULL
)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.template_usage_analytics (
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
    usage_count = public.template_usage_analytics.usage_count + 1,
    success_count = public.template_usage_analytics.success_count + 
      CASE WHEN p_success THEN 1 ELSE 0 END,
    failure_count = public.template_usage_analytics.failure_count + 
      CASE WHEN p_success THEN 0 ELSE 1 END,
    last_used_at = NOW(),
    average_tokens_used = CASE 
      WHEN p_tokens_used IS NOT NULL THEN
        (public.template_usage_analytics.average_tokens_used * (public.template_usage_analytics.usage_count - 1) + p_tokens_used) / public.template_usage_analytics.usage_count
      ELSE public.template_usage_analytics.average_tokens_used
    END,
    average_latency_ms = CASE
      WHEN p_latency_ms IS NOT NULL THEN
        (public.template_usage_analytics.average_latency_ms * (public.template_usage_analytics.usage_count - 1) + p_latency_ms) / public.template_usage_analytics.usage_count
      ELSE public.template_usage_analytics.average_latency_ms
    END,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.create_customization_history()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.template_customization_history (
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
$$;

-- ============================================================================
-- SECTION 9: TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vibe_configs_updated_at ON public.vibe_configs;
CREATE TRIGGER update_vibe_configs_updated_at
  BEFORE UPDATE ON public.vibe_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_template_customizations_updated_at ON public.user_template_customizations;
CREATE TRIGGER update_user_template_customizations_updated_at
  BEFORE UPDATE ON public.user_template_customizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_template_customizations_updated_at();

DROP TRIGGER IF EXISTS track_customization_changes ON public.user_template_customizations;
CREATE TRIGGER track_customization_changes
  AFTER INSERT OR UPDATE ON public.user_template_customizations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_customization_history();

DROP TRIGGER IF EXISTS update_template_presets_updated_at ON public.template_presets;
CREATE TRIGGER update_template_presets_updated_at
  BEFORE UPDATE ON public.template_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_template_customizations_updated_at();

DROP TRIGGER IF EXISTS update_shared_template_customizations_updated_at ON public.shared_template_customizations;
CREATE TRIGGER update_shared_template_customizations_updated_at
  BEFORE UPDATE ON public.shared_template_customizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_template_customizations_updated_at();

DROP TRIGGER IF EXISTS update_template_feedback_updated_at ON public.template_feedback;
CREATE TRIGGER update_template_feedback_updated_at
  BEFORE UPDATE ON public.template_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_template_customizations_updated_at();

-- ============================================================================
-- SECTION 10: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all user-owned tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_template_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_customization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_template_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failure_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
END $$;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own profile"
  ON public.user_profiles FOR DELETE
  USING (auth.uid()::text = user_id);

-- RLS Policies for vibe_configs
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own vibe configs" ON public.vibe_configs;
  DROP POLICY IF EXISTS "Users can insert own vibe configs" ON public.vibe_configs;
  DROP POLICY IF EXISTS "Users can update own vibe configs" ON public.vibe_configs;
  DROP POLICY IF EXISTS "Users can delete own vibe configs" ON public.vibe_configs;
END $$;

CREATE POLICY "Users can view own vibe configs"
  ON public.vibe_configs FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own vibe configs"
  ON public.vibe_configs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own vibe configs"
  ON public.vibe_configs FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own vibe configs"
  ON public.vibe_configs FOR DELETE
  USING (auth.uid()::text = user_id);

-- RLS Policies for agent_runs
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own agent runs" ON public.agent_runs;
  DROP POLICY IF EXISTS "Users can insert own agent runs" ON public.agent_runs;
  DROP POLICY IF EXISTS "Users can update own agent runs" ON public.agent_runs;
  DROP POLICY IF EXISTS "Users can delete own agent runs" ON public.agent_runs;
END $$;

CREATE POLICY "Users can view own agent runs"
  ON public.agent_runs FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own agent runs"
  ON public.agent_runs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own agent runs"
  ON public.agent_runs FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own agent runs"
  ON public.agent_runs FOR DELETE
  USING (auth.uid()::text = user_id);

-- RLS Policies for background_events
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own background events" ON public.background_events;
  DROP POLICY IF EXISTS "Users can insert own background events" ON public.background_events;
  DROP POLICY IF EXISTS "Users can update own background events" ON public.background_events;
  DROP POLICY IF EXISTS "Users can delete own background events" ON public.background_events;
END $$;

CREATE POLICY "Users can view own background events"
  ON public.background_events FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own background events"
  ON public.background_events FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own background events"
  ON public.background_events FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own background events"
  ON public.background_events FOR DELETE
  USING (auth.uid()::text = user_id);

-- RLS Policies for user_template_customizations
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own template customizations" ON public.user_template_customizations;
  DROP POLICY IF EXISTS "Users can insert own template customizations" ON public.user_template_customizations;
  DROP POLICY IF EXISTS "Users can update own template customizations" ON public.user_template_customizations;
  DROP POLICY IF EXISTS "Users can delete own template customizations" ON public.user_template_customizations;
END $$;

CREATE POLICY "Users can view own template customizations"
  ON public.user_template_customizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own template customizations"
  ON public.user_template_customizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own template customizations"
  ON public.user_template_customizations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own template customizations"
  ON public.user_template_customizations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for template_customization_history
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own customization history" ON public.template_customization_history;
END $$;

CREATE POLICY "Users can view own customization history"
  ON public.template_customization_history FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for template_usage_analytics
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own analytics" ON public.template_usage_analytics;
  DROP POLICY IF EXISTS "Users can update own analytics" ON public.template_usage_analytics;
END $$;

CREATE POLICY "Users can view own analytics"
  ON public.template_usage_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON public.template_usage_analytics FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for template_feedback
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can manage own feedback" ON public.template_feedback;
  DROP POLICY IF EXISTS "Users can view public feedback" ON public.template_feedback;
END $$;

CREATE POLICY "Users can manage own feedback"
  ON public.template_feedback FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public feedback"
  ON public.template_feedback FOR SELECT
  USING (true);

-- RLS Policies for shared_template_customizations
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view public shared templates" ON public.shared_template_customizations;
  DROP POLICY IF EXISTS "Users can manage own shared templates" ON public.shared_template_customizations;
END $$;

CREATE POLICY "Users can view public shared templates"
  ON public.shared_template_customizations FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id OR auth.uid() = ANY(shared_with_user_ids));

CREATE POLICY "Users can manage own shared templates"
  ON public.shared_template_customizations FOR ALL
  USING (auth.uid() = owner_id);

-- RLS Policies for template_presets
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view all presets" ON public.template_presets;
  DROP POLICY IF EXISTS "Users can create own presets" ON public.template_presets;
  DROP POLICY IF EXISTS "Users can update own presets" ON public.template_presets;
END $$;

CREATE POLICY "Users can view all presets"
  ON public.template_presets FOR SELECT
  USING (true);

CREATE POLICY "Users can create own presets"
  ON public.template_presets FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own presets"
  ON public.template_presets FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for organizations
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own organizations" ON public.organizations;
  DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
  DROP POLICY IF EXISTS "Owners can update organizations" ON public.organizations;
END $$;

CREATE POLICY "Users can view own organizations"
  ON public.organizations FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE public.organization_members.org_id = public.organizations.id
      AND public.organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update organizations"
  ON public.organizations FOR UPDATE
  USING (auth.uid() = owner_id);

-- RLS Policies for organization_members
DO $$
BEGIN
  DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
  DROP POLICY IF EXISTS "Admins can manage members" ON public.organization_members;
END $$;

CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = public.organization_members.org_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage members"
  ON public.organization_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = public.organization_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for invitations
DO $$
BEGIN
  DROP POLICY IF EXISTS "Members can view invitations" ON public.invitations;
  DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;
END $$;

CREATE POLICY "Members can view invitations"
  ON public.invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE public.organization_members.org_id = public.invitations.org_id
      AND public.organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage invitations"
  ON public.invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE public.organization_members.org_id = public.invitations.org_id
      AND public.organization_members.user_id = auth.uid()
      AND public.organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for usage_metrics
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own usage metrics" ON public.usage_metrics;
  DROP POLICY IF EXISTS "System can insert usage metrics" ON public.usage_metrics;
END $$;

CREATE POLICY "Users can view own usage metrics"
  ON public.usage_metrics FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "System can insert usage metrics"
  ON public.usage_metrics FOR INSERT
  WITH CHECK (true);

-- RLS Policies for failure_patterns
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own failure patterns" ON public.failure_patterns;
  DROP POLICY IF EXISTS "Users can insert own failure patterns" ON public.failure_patterns;
  DROP POLICY IF EXISTS "Users can update own failure patterns" ON public.failure_patterns;
END $$;

CREATE POLICY "Users can view own failure patterns"
  ON public.failure_patterns FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own failure patterns"
  ON public.failure_patterns FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own failure patterns"
  ON public.failure_patterns FOR UPDATE
  USING (auth.uid()::text = user_id);

-- RLS Policies for success_patterns
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own success patterns" ON public.success_patterns;
  DROP POLICY IF EXISTS "Users can insert own success patterns" ON public.success_patterns;
  DROP POLICY IF EXISTS "Users can update own success patterns" ON public.success_patterns;
END $$;

CREATE POLICY "Users can view own success patterns"
  ON public.success_patterns FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own success patterns"
  ON public.success_patterns FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own success patterns"
  ON public.success_patterns FOR UPDATE
  USING (auth.uid()::text = user_id);

-- RLS Policies for pattern_matches
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own pattern matches" ON public.pattern_matches;
  DROP POLICY IF EXISTS "Users can insert own pattern matches" ON public.pattern_matches;
END $$;

CREATE POLICY "Users can view own pattern matches"
  ON public.pattern_matches FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own pattern matches"
  ON public.pattern_matches FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

COMMIT;

-- ============================================================================
-- END OF PATCH
-- ============================================================================
