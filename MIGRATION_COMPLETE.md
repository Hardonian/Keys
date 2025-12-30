# Database Migration Completion Guide

## Overview

All database migrations are ready to run. This guide provides multiple methods to execute migrations using your database URL from environment variables.

## Migration Files

All 12 migration files are present and ready:

1. `001_create_user_profiles.sql` - Core user profiles table
2. `002_create_prompt_atoms.sql` - Prompt atoms system
3. `003_create_vibe_configs.sql` - Vibe configuration tables
4. `004_create_agent_runs.sql` - Agent run tracking
5. `005_create_background_events.sql` - Background event system
6. `006_add_indexes.sql` - Performance indexes
7. `007_add_constraints.sql` - Data integrity constraints
8. `008_add_premium_features.sql` - Premium features support
9. `010_create_user_template_customizations.sql` - Template customizations
10. `011_enhance_template_system.sql` - Enhanced template features
11. `012_add_rls_core_tables.sql` - Row Level Security policies
12. `013_add_billing_and_orgs.sql` - Billing and organizations

## Method 1: TypeScript Migration Runner (Recommended)

The most robust method using the TypeScript migration runner:

```bash
# Set your database URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Or for Supabase, get the connection string from:
# Dashboard → Settings → Database → Connection string (use "Connection pooling")

# Run migrations
cd backend
npm run migrate
```

**Features:**
- ✅ Tracks applied migrations in `schema_migrations` table
- ✅ Skips already-applied migrations
- ✅ Handles "already exists" errors gracefully
- ✅ Transaction support (rollback on error)
- ✅ Detailed progress output

## Method 2: Shell Script

Using the shell script runner:

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Run migrations
./backend/scripts/run-all-migrations.sh
```

## Method 3: Supabase CLI

If using Supabase and have CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Link to project (if needed)
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Method 4: Direct psql

Using PostgreSQL client directly:

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Run each migration
psql "$DATABASE_URL" -f backend/supabase/migrations/001_create_user_profiles.sql
psql "$DATABASE_URL" -f backend/supabase/migrations/002_create_prompt_atoms.sql
# ... continue for all 12 migrations
```

Or run all at once:

```bash
for file in backend/supabase/migrations/*.sql; do
  echo "Running: $file"
  psql "$DATABASE_URL" -f "$file"
done
```

## Method 5: Supabase Dashboard

For Supabase projects, you can also run migrations via the dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of each migration file
3. Paste and run in order (001 through 013)
4. Check for errors (some "already exists" errors are safe to ignore)

## Getting Database URL

### For Supabase:

1. Go to Supabase Dashboard → Settings → Database
2. Under "Connection string", select "Connection pooling" mode
3. Copy the connection string
4. Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

Or use direct connection:
- Format: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

### For Other PostgreSQL Databases:

Format: `postgresql://[user]:[password]@[host]:[port]/[database]`

## Environment Variables

Set these in your environment:

```bash
# Direct PostgreSQL connection (preferred for migrations)
export DATABASE_URL="postgresql://user:password@host:port/database"

# Or Supabase (for Supabase CLI)
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export SUPABASE_PROJECT_ID="your-project-ref"  # Optional, for CLI linking
```

## Verification

After running migrations, verify they were applied:

```sql
-- Check if schema_migrations table exists and has records
SELECT * FROM schema_migrations ORDER BY applied_at;

-- Verify key tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_profiles',
  'prompt_atoms',
  'vibe_configs',
  'agent_runs',
  'background_events',
  'organizations'
);

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Error Handling

### "Already Exists" Errors

Many migrations use `IF NOT EXISTS` clauses, so these errors are safe to ignore:
- `relation already exists`
- `duplicate key value`
- Error codes: `42P07`, `42710`

### Migration Tracking

The TypeScript runner creates a `schema_migrations` table to track applied migrations. If you run migrations manually, you can create this table:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
```

Then record each migration:

```sql
INSERT INTO schema_migrations (filename) VALUES ('001_create_user_profiles.sql') ON CONFLICT DO NOTHING;
-- Repeat for all migrations
```

## Rollback

⚠️ **Warning**: These migrations are designed to be additive only. Rolling back requires manual SQL.

If you need to rollback:

1. Check what was added in each migration
2. Manually drop tables/columns/indexes in reverse order
3. Update `schema_migrations` table to remove records

**Example rollback for migration 013:**

```sql
-- Remove billing columns (if needed)
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS subscription_current_period_end,
DROP COLUMN IF EXISTS org_id;

-- Drop org tables (if needed)
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
```

## Next Steps After Migrations

1. **Verify RLS Policies**: Check that Row Level Security is enabled
2. **Test Authentication**: Verify auth flows work correctly
3. **Check Billing**: Verify Stripe integration if using billing
4. **Test API**: Run API tests to verify database connectivity
5. **Monitor Logs**: Check for any migration-related errors

## Troubleshooting

### Connection Issues

```bash
# Test database connection
psql "$DATABASE_URL" -c "SELECT version();"
```

### Permission Issues

Ensure your database user has:
- CREATE TABLE permissions
- CREATE INDEX permissions
- ALTER TABLE permissions
- CREATE EXTENSION permissions (for uuid-ossp, vector)

### Migration Order Issues

Migrations must be run in numerical order. If you skip one, you may need to:
1. Check what that migration created
2. Manually create those objects
3. Continue with remaining migrations

## Support

For issues:
1. Check migration file for syntax errors
2. Verify database URL is correct
3. Check database user permissions
4. Review error messages for specific table/column conflicts

---

**Status**: ✅ All migration files ready and tested
**Total Migrations**: 12 files
**Estimated Time**: 2-5 minutes
