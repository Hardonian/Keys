# Database Migration Status

## Migration Files

All migration files are present and ready to run:

1. ✅ `001_create_user_profiles.sql` - Base user profiles table
2. ✅ `002_create_prompt_atoms.sql` - Prompt atoms table
3. ✅ `003_create_vibe_configs.sql` - Vibe configurations
4. ✅ `004_create_agent_runs.sql` - Agent run history
5. ✅ `005_create_background_events.sql` - Background events
6. ✅ `006_add_indexes.sql` - Performance indexes
7. ✅ `007_add_constraints.sql` - Data constraints
8. ✅ `008_add_premium_features.sql` - Premium features
9. ✅ `010_create_user_template_customizations.sql` - Template customizations
10. ✅ `011_enhance_template_system.sql` - Template enhancements
11. ✅ `012_add_rls_core_tables.sql` - **CRITICAL: RLS policies**
12. ✅ `013_add_billing_and_orgs.sql` - **CRITICAL: Billing & multi-tenant**

## Critical Migrations

### Migration 012: RLS Policies
**Status**: Ready to run
**Impact**: CRITICAL - Enables database-level security
**Tables Affected**:
- `user_profiles`
- `vibe_configs`
- `agent_runs`
- `background_events`

**What it does**:
- Enables Row Level Security on all core tables
- Creates policies so users can only access their own data
- Prevents unauthorized data access even with direct DB access

### Migration 013: Billing & Multi-tenant
**Status**: Ready to run
**Impact**: HIGH - Enables billing and organizations
**Tables Created**:
- `organizations`
- `organization_members`
- `invitations`
- `usage_metrics`

**Columns Added to `user_profiles`**:
- `stripe_customer_id`
- `subscription_status`
- `subscription_tier`
- `subscription_current_period_end`
- `org_id`

## Running Migrations

See `DEPLOYMENT.md` for detailed instructions.

Quick start:
```bash
# Using Supabase Dashboard (Recommended)
# 1. Go to SQL Editor
# 2. Copy/paste migration SQL
# 3. Run

# Using Supabase CLI
supabase db push

# Using psql
psql $DATABASE_URL -f backend/supabase/migrations/012_add_rls_core_tables.sql
psql $DATABASE_URL -f backend/supabase/migrations/013_add_billing_and_orgs.sql
```

## Verification

After running migrations, verify:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'vibe_configs', 'agent_runs', 'background_events');

-- Check billing columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('stripe_customer_id', 'subscription_status', 'subscription_tier');

-- Check new tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'organization_members', 'invitations', 'usage_metrics');
```

## Rollback

Migrations use `IF NOT EXISTS` clauses where possible, making them safe to re-run. However, if you need to rollback:

1. **RLS Policies**: Can be disabled (not recommended for security)
2. **Billing Columns**: Can be dropped if needed
3. **New Tables**: Can be dropped if not in use

**Note**: Only rollback if absolutely necessary. These migrations are critical for production security.
