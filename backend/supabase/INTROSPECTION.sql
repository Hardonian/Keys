-- ============================================================================
-- SUPABASE BACKEND INTROSPECTION QUERIES
-- ============================================================================
-- Run these queries against your Supabase database to capture the ACTUAL state.
-- Save the output to compare against intended state from migrations.
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================
SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname NOT IN ('plpgsql', 'pg_catalog')
ORDER BY extname;

-- ============================================================================
-- SECTION 2: TABLES AND COLUMNS
-- ============================================================================
SELECT 
  t.table_schema,
  t.table_name,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default,
  c.character_maximum_length,
  CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_schema = c.table_schema AND t.table_name = c.table_name
LEFT JOIN (
  SELECT ku.table_schema, ku.table_name, ku.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku
    ON tc.constraint_name = ku.constraint_name
  WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_schema = pk.table_schema 
  AND c.table_name = pk.table_name 
  AND c.column_name = pk.column_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 4: CONSTRAINTS (PK, FK, UNIQUE, CHECK)
-- ============================================================================
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM information_schema.table_constraints tc
JOIN pg_constraint c ON c.conname = tc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================================================
-- SECTION 5: RLS STATUS
-- ============================================================================
SELECT
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- ============================================================================
-- SECTION 6: RLS POLICIES
-- ============================================================================
SELECT
  n.nspname as schema_name,
  c.relname as table_name,
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  CASE pol.polpermissive
    WHEN true THEN 'PERMISSIVE'
    ELSE 'RESTRICTIVE'
  END as permissive,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY c.relname, pol.polname;

-- ============================================================================
-- SECTION 7: FUNCTIONS
-- ============================================================================
SELECT
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments,
  CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END as security_type,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;

-- ============================================================================
-- SECTION 8: TRIGGERS
-- ============================================================================
SELECT
  t.trigger_schema,
  t.event_object_table as table_name,
  t.trigger_name,
  t.event_manipulation as event,
  t.action_timing as timing,
  t.action_statement as function_call
FROM information_schema.triggers t
WHERE t.trigger_schema = 'public'
ORDER BY t.event_object_table, t.trigger_name;

-- ============================================================================
-- SECTION 9: GRANTS
-- ============================================================================
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

SELECT
  grantee,
  routine_schema,
  routine_name,
  privilege_type
FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
ORDER BY routine_name, grantee, privilege_type;

-- ============================================================================
-- SECTION 10: REALTIME PUBLICATION
-- ============================================================================
SELECT
  pubname as publication_name,
  puballtables as all_tables
FROM pg_publication
WHERE pubname = 'supabase_realtime' OR pubname LIKE '%realtime%';

SELECT
  p.pubname as publication_name,
  t.schemaname,
  t.tablename
FROM pg_publication_tables t
JOIN pg_publication p ON p.oid = t.pubid
WHERE p.pubname = 'supabase_realtime' OR p.pubname LIKE '%realtime%'
ORDER BY t.tablename;

-- ============================================================================
-- SECTION 11: STORAGE BUCKETS (if applicable)
-- ============================================================================
SELECT
  name,
  id,
  public as is_public,
  created_at,
  updated_at
FROM storage.buckets
ORDER BY name;

-- ============================================================================
-- SECTION 12: ENUMS AND CUSTOM TYPES
-- ============================================================================
SELECT
  t.typname as type_name,
  t.typtype as type_type,
  e.enumlabel as enum_value
FROM pg_type t
LEFT JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND (t.typtype = 'e' OR t.typtype = 'c')
ORDER BY t.typname, e.enumsortorder;

-- ============================================================================
-- END OF INTROSPECTION QUERIES
-- ============================================================================
