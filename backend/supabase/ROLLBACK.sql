-- ============================================================================
-- LIMITED ROLLBACK SCRIPT
-- ============================================================================
-- WARNING: This rollback is LIMITED because PATCH.sql does not perform
-- destructive operations (no table drops, no data deletion).
-- 
-- This script only removes:
-- - RLS policies (can be re-added)
-- - Triggers (can be re-added)
-- - Functions (can be re-added)
-- 
-- It does NOT:
-- - Drop tables (data preservation)
-- - Drop columns (data preservation)
-- - Drop indexes (performance preservation)
-- - Drop constraints (data integrity preservation)
-- 
-- Use this ONLY if you need to remove policies/functions/triggers added by PATCH.sql
-- and plan to re-apply migrations in a different order.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_vibe_configs_updated_at ON public.vibe_configs;
DROP TRIGGER IF EXISTS update_user_template_customizations_updated_at ON public.user_template_customizations;
DROP TRIGGER IF EXISTS track_customization_changes ON public.user_template_customizations;
DROP TRIGGER IF EXISTS update_template_presets_updated_at ON public.template_presets;
DROP TRIGGER IF EXISTS update_shared_template_customizations_updated_at ON public.shared_template_customizations;
DROP TRIGGER IF EXISTS update_template_feedback_updated_at ON public.template_feedback;

-- ============================================================================
-- SECTION 2: DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_template_customizations_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.track_template_usage(UUID, TEXT, BOOLEAN, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS public.create_customization_history() CASCADE;

-- ============================================================================
-- SECTION 3: DROP RLS POLICIES
-- ============================================================================

-- user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;

-- vibe_configs policies
DROP POLICY IF EXISTS "Users can view own vibe configs" ON public.vibe_configs;
DROP POLICY IF EXISTS "Users can insert own vibe configs" ON public.vibe_configs;
DROP POLICY IF EXISTS "Users can update own vibe configs" ON public.vibe_configs;
DROP POLICY IF EXISTS "Users can delete own vibe configs" ON public.vibe_configs;

-- agent_runs policies
DROP POLICY IF EXISTS "Users can view own agent runs" ON public.agent_runs;
DROP POLICY IF EXISTS "Users can insert own agent runs" ON public.agent_runs;
DROP POLICY IF EXISTS "Users can update own agent runs" ON public.agent_runs;
DROP POLICY IF EXISTS "Users can delete own agent runs" ON public.agent_runs;

-- background_events policies
DROP POLICY IF EXISTS "Users can view own background events" ON public.background_events;
DROP POLICY IF EXISTS "Users can insert own background events" ON public.background_events;
DROP POLICY IF EXISTS "Users can update own background events" ON public.background_events;
DROP POLICY IF EXISTS "Users can delete own background events" ON public.background_events;

-- user_template_customizations policies
DROP POLICY IF EXISTS "Users can view own template customizations" ON public.user_template_customizations;
DROP POLICY IF EXISTS "Users can insert own template customizations" ON public.user_template_customizations;
DROP POLICY IF EXISTS "Users can update own template customizations" ON public.user_template_customizations;
DROP POLICY IF EXISTS "Users can delete own template customizations" ON public.user_template_customizations;

-- template_customization_history policies
DROP POLICY IF EXISTS "Users can view own customization history" ON public.template_customization_history;

-- template_usage_analytics policies
DROP POLICY IF EXISTS "Users can view own analytics" ON public.template_usage_analytics;
DROP POLICY IF EXISTS "Users can update own analytics" ON public.template_usage_analytics;

-- template_feedback policies
DROP POLICY IF EXISTS "Users can manage own feedback" ON public.template_feedback;
DROP POLICY IF EXISTS "Users can view public feedback" ON public.template_feedback;

-- shared_template_customizations policies
DROP POLICY IF EXISTS "Users can view public shared templates" ON public.shared_template_customizations;
DROP POLICY IF EXISTS "Users can manage own shared templates" ON public.shared_template_customizations;

-- template_presets policies
DROP POLICY IF EXISTS "Users can view all presets" ON public.template_presets;
DROP POLICY IF EXISTS "Users can create own presets" ON public.template_presets;
DROP POLICY IF EXISTS "Users can update own presets" ON public.template_presets;

-- organizations policies
DROP POLICY IF EXISTS "Users can view own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners can update organizations" ON public.organizations;

-- organization_members policies
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.organization_members;

-- invitations policies
DROP POLICY IF EXISTS "Members can view invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;

-- usage_metrics policies
DROP POLICY IF EXISTS "Users can view own usage metrics" ON public.usage_metrics;
DROP POLICY IF EXISTS "System can insert usage metrics" ON public.usage_metrics;

-- failure_patterns policies
DROP POLICY IF EXISTS "Users can view own failure patterns" ON public.failure_patterns;
DROP POLICY IF EXISTS "Users can insert own failure patterns" ON public.failure_patterns;
DROP POLICY IF EXISTS "Users can update own failure patterns" ON public.failure_patterns;

-- success_patterns policies
DROP POLICY IF EXISTS "Users can view own success patterns" ON public.success_patterns;
DROP POLICY IF EXISTS "Users can insert own success patterns" ON public.success_patterns;
DROP POLICY IF EXISTS "Users can update own success patterns" ON public.success_patterns;

-- pattern_matches policies
DROP POLICY IF EXISTS "Users can view own pattern matches" ON public.pattern_matches;
DROP POLICY IF EXISTS "Users can insert own pattern matches" ON public.pattern_matches;

-- ============================================================================
-- SECTION 4: DISABLE RLS (OPTIONAL - USE WITH CAUTION)
-- ============================================================================
-- WARNING: Disabling RLS removes security. Only do this if you understand
-- the security implications and have alternative access controls.

-- Uncomment the following lines ONLY if you need to disable RLS:
-- ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.vibe_configs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.agent_runs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.background_events DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_template_customizations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.template_customization_history DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.template_usage_analytics DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.template_feedback DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.shared_template_customizations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.template_presets DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.usage_metrics DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.failure_patterns DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.success_patterns DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pattern_matches DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================
-- Note: Tables, columns, indexes, and constraints remain intact.
-- To fully restore, re-run PATCH.sql after this rollback.
-- ============================================================================
