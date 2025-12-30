# Database Migration Next Steps

## ✅ Migration System Ready

All migration infrastructure is complete and ready to use:

### Files Created/Updated:
- ✅ `backend/scripts/run-all-migrations.ts` - TypeScript migration runner (recommended)
- ✅ `backend/scripts/run-all-migrations.sh` - Shell script runner
- ✅ `scripts/verify-migrations.ts` - Migration verification script
- ✅ `MIGRATION_COMPLETE.md` - Complete migration guide
- ✅ `backend/package.json` - Added `migrate` and `verify-migrations` scripts
- ✅ `pg` package installed for database connectivity

## 🚀 Quick Start

### Step 1: Set Database URL

Choose one of these methods:

**Option A: Direct PostgreSQL Connection (Recommended)**
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

**Option B: Supabase Connection String**
```bash
# Get from: Supabase Dashboard → Settings → Database → Connection string
export DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

**Option C: Supabase Environment Variables**
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_DB_PASSWORD="your_database_password"
# Or set SUPABASE_DB_URL directly
export SUPABASE_DB_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
```

### Step 2: Run Migrations

```bash
cd backend
npm run migrate
```

This will:
- ✅ Connect to your database
- ✅ Run all 12 migrations in order
- ✅ Track applied migrations in `schema_migrations` table
- ✅ Skip already-applied migrations
- ✅ Handle errors gracefully

### Step 3: Verify Migrations

```bash
cd backend
npm run verify-migrations
```

This will:
- ✅ Check which migrations have been applied
- ✅ Verify key tables exist
- ✅ Show migration status summary

## 📋 Migration Files (12 Total)

All migrations are in `backend/supabase/migrations/`:

1. `001_create_user_profiles.sql` - Core user profiles
2. `002_create_prompt_atoms.sql` - Prompt atoms system
3. `003_create_vibe_configs.sql` - Vibe configurations
4. `004_create_agent_runs.sql` - Agent run tracking
5. `005_create_background_events.sql` - Background events
6. `006_add_indexes.sql` - Performance indexes
7. `007_add_constraints.sql` - Data integrity
8. `008_add_premium_features.sql` - Premium features
9. `010_create_user_template_customizations.sql` - Template customizations
10. `011_enhance_template_system.sql` - Enhanced templates
11. `012_add_rls_core_tables.sql` - Row Level Security ⚠️ CRITICAL
12. `013_add_billing_and_orgs.sql` - Billing & organizations

## 🔧 Alternative Methods

### Method 1: Shell Script
```bash
export DATABASE_URL="postgresql://..."
./backend/scripts/run-all-migrations.sh
```

### Method 2: Supabase CLI
```bash
npm install -g supabase
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_key"
supabase link --project-ref your-project-ref
supabase db push
```

### Method 3: Direct psql
```bash
export DATABASE_URL="postgresql://..."
for file in backend/supabase/migrations/*.sql; do
  psql "$DATABASE_URL" -f "$file"
done
```

### Method 4: Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste each migration file content
3. Run in order (001 through 013)

## ✅ Post-Migration Checklist

After running migrations:

- [ ] Verify migrations: `npm run verify-migrations`
- [ ] Check RLS policies are enabled
- [ ] Test authentication flow
- [ ] Verify user_profiles table exists
- [ ] Check billing tables (if using billing)
- [ ] Test API endpoints
- [ ] Monitor for errors

## 🔍 Verification Queries

Run these SQL queries to verify:

```sql
-- Check applied migrations
SELECT * FROM schema_migrations ORDER BY applied_at;

-- Verify key tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'prompt_atoms', 'vibe_configs', 'agent_runs');

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Verify indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
```

## ⚠️ Important Notes

1. **Migration Order**: Migrations must run in numerical order (001 → 013)
2. **Idempotency**: Migrations use `IF NOT EXISTS` - safe to re-run
3. **RLS Critical**: Migration 012 adds Row Level Security - critical for production
4. **Billing**: Migration 013 adds billing tables - required for Stripe integration
5. **Tracking**: TypeScript runner tracks migrations in `schema_migrations` table

## 🐛 Troubleshooting

### Connection Issues
```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT version();"
```

### Permission Issues
Ensure database user has:
- CREATE TABLE
- CREATE INDEX  
- ALTER TABLE
- CREATE EXTENSION (for uuid-ossp, vector)

### "Already Exists" Errors
These are safe to ignore - migrations use `IF NOT EXISTS` clauses.

### Migration Tracking
If migrations were run manually, create tracking table:
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📚 Documentation

- **Full Guide**: See `MIGRATION_COMPLETE.md`
- **Migration Files**: `backend/supabase/migrations/`
- **Status**: See `MIGRATION_STATUS.md`

## 🎯 Next Steps After Migrations

1. **Environment Variables**: Ensure all env vars are set (see `.env.example`)
2. **RLS Policies**: Verify Row Level Security is working
3. **Authentication**: Test signup/login flows
4. **API Testing**: Run API tests to verify database connectivity
5. **Monitoring**: Set up monitoring for database errors

---

**Status**: ✅ Migration system ready
**Action Required**: Set DATABASE_URL and run `npm run migrate`
**Estimated Time**: 2-5 minutes
