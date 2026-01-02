-- ============================================================================
-- SUPABASE BACKEND VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after applying PATCH.sql to verify everything is correct.
-- All queries should return expected results (no errors, correct counts).
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS VERIFICATION
-- ============================================================================
SELECT 
  'Extensions Check' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 2 THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'vector');

-- Expected: count >= 2, status = PASS

-- ============================================================================
-- SECTION 2: TABLES VERIFICATION
-- ============================================================================
SELECT 
  'Tables Check' as check_name,
  COUNT(*) as table_count,
  CASE 
    WHEN COUNT(*) >= 20 THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'user_profiles', 'prompt_atoms', 'vibe_configs', 'agent_runs', 'background_events',
    'user_template_customizations', 'template_versions', 'template_customization_history',
    'template_usage_analytics', 'template_feedback', 'shared_template_customizations',
    'template_presets', 'organizations', 'organization_members', 'invitations',
    'usage_metrics', 'failure_patterns', 'success_patterns', 'pattern_matches'
  );

-- Expected: table_count >= 19, status = PASS

-- ============================================================================
-- SECTION 3: CRITICAL COLUMNS VERIFICATION
-- ============================================================================
SELECT 
  'Critical Columns Check' as check_name,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) >= 10 THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'user_profiles' AND column_name IN ('id', 'user_id', 'premium_features', 'subscription_tier', 'org_id')) OR
    (table_name = 'agent_runs' AND column_name IN ('id', 'user_id', 'trigger', 'failure_pattern_id')) OR
    (table_name = 'vibe_configs' AND column_name IN ('id', 'user_id')) OR
    (table_name = 'user_template_customizations' AND column_name IN ('id', 'user_id', 'template_id'))
  );

-- Expected: column_count >= 10, status = PASS

-- ============================================================================
-- SECTION 4: INDEXES VERIFICATION
-- ============================================================================
SELECT 
  'Indexes Check' as check_name,
  COUNT(*) as index_count,
  CASE 
    WHEN COUNT(*) >= 50 THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles', 'prompt_atoms', 'vibe_configs', 'agent_runs', 'background_events',
    'user_template_customizations', 'template_versions', 'template_customization_history',
    'template_usage_analytics', 'template_feedback', 'shared_template_customizations',
    'template_presets', 'organizations', 'organization_members', 'invitations',
    'usage_metrics', 'failure_patterns', 'success_patterns', 'pattern_matches'
  );

-- Expected: index_count >= 50, status = PASS

-- ============================================================================
-- SECTION 5: RLS ENABLED VERIFICATION
-- ============================================================================
SELECT 
  'RLS Enabled Check' as check_name,
  COUNT(*) as rls_enabled_count,
  CASE 
    WHEN COUNT(*) >= 15 THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND c.relname IN (
    'user_profiles', 'vibe_configs', 'agent_runs', 'background_events',
    'user_template_customizations', 'template_customization_history',
    'template_usage_analytics', 'template_feedback', 'shared_template_customizations',
    'template_presets', 'organizations', 'organization_members', 'invitations',
    'usage_metrics', 'failure_patterns', 'success_patterns', 'pattern_matches'
  );

-- Expected: rls_enabled_count >= 15, status = PASS

-- ============================================================================
-- SECTION 6: RLS POLICIES VERIFICATION
-- ============================================================================
SELECT 
  'RLS Policies Check' as check_name,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 40 THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'user_profiles', 'vibe_configs', 'agent_runs', 'background_events',
    'user_template_customizations', 'template_customization_history',
    'template_usage_analytics', 'template_feedback', 'shared_template_customizations',
    'template_presets', 'organizations', 'organization_members', 'invitations',
    'usage_metrics', 'failure_patterns', 'success_patterns', 'pattern_matches'
  );

-- Expected: policy_count >= 40, status = PASS

-- ============================================================================
-- SECTION 7: FUNCTIONS VERIFICATION
-- ============================================================================
SELECT 
  'Functions Check' as check_name,
  COUNT(*) as function_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.proname IN (
    'update_updated_at_column',
    'update_user_template_customizations_updated_at',
    'track_template_usage',
    'create_customization_history'
  );

-- Expected: function_count >= 4, status = PASS

-- ============================================================================
-- SECTION 8: TRIGGERS VERIFICATION
-- ============================================================================
SELECT 
  'Triggers Check' as check_name,
  COUNT(*) as trigger_count,
  CASE 
    WHEN COUNT(*) >= 7 THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'update_user_profiles_updated_at',
    'update_vibe_configs_updated_at',
    'update_user_template_customizations_updated_at',
    'track_customization_changes',
    'update_template_presets_updated_at',
    'update_shared_template_customizations_updated_at',
    'update_template_feedback_updated_at'
  );

-- Expected: trigger_count >= 7, status = PASS

-- ============================================================================
-- SECTION 9: CONSTRAINTS VERIFICATION
-- ============================================================================
SELECT 
  'Constraints Check' as check_name,
  COUNT(*) as constraint_count,
  CASE 
    WHEN COUNT(*) >= 5 THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK')
  AND (
    (tc.table_name = 'user_profiles' AND tc.constraint_name LIKE '%subscription%') OR
    (tc.table_name = 'vibe_configs' AND tc.constraint_name LIKE '%range%') OR
    (tc.table_name = 'user_template_customizations' AND tc.constraint_type = 'UNIQUE') OR
    (tc.table_name = 'organization_members' AND tc.constraint_type = 'UNIQUE')
  );

-- Expected: constraint_count >= 5, status = PASS

-- ============================================================================
-- SECTION 10: SMOKE TEST - INSERT/SELECT PATTERN
-- ============================================================================
-- Note: These tests require an authenticated user context
-- Run these with a test user authenticated via Supabase client

-- Test 1: Verify user_profiles RLS (should work with auth context)
-- SELECT auth.uid(); -- Should return UUID if authenticated

-- Test 2: Verify template function exists and is callable
-- SELECT public.track_template_usage(
--   '00000000-0000-0000-0000-000000000000'::uuid,
--   'test-template',
--   true,
--   100,
--  50
-- );

-- ============================================================================
-- SECTION 11: SUMMARY REPORT
-- ============================================================================
SELECT 
  'SUMMARY' as report_section,
  (SELECT COUNT(*) FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector')) as extensions,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indexes,
  (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true) as rls_enabled_tables,
  (SELECT COUNT(*) FROM pg_policy pol JOIN pg_class c ON c.oid = pol.polrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public') as rls_policies,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.prokind = 'f') as functions,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as triggers;

-- ============================================================================
-- END OF VERIFICATION QUERIES
-- ============================================================================
