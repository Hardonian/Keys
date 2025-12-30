# PR: Trigger Migration System to Run All Existing SQL Files

## Summary

This PR adds a trigger migration file that will cause the automated migration system to detect and run all existing SQL migration files when merged to `main`.

## What Will Happen After Merge

When this PR is merged to `main`, the GitHub Actions migration workflow will:

1. **Detect all migration files** in `backend/supabase/migrations/`
2. **Run them in order** using the `DATABASE_URL` secret
3. **Archive successful migrations** to `archive/` directory
4. **Update tracking file** (`.migrations_tracked.txt`)
5. **Commit archive changes** back to the repo

## Migration Files to Be Processed

The system will detect and run these migration files (if not already tracked):

- `001_create_user_profiles.sql`
- `002_create_prompt_atoms.sql`
- `003_create_vibe_configs.sql`
- `004_create_agent_runs.sql`
- `005_create_background_events.sql`
- `006_add_indexes.sql`
- `007_add_constraints.sql`
- `008_add_premium_features.sql`
- `010_create_user_template_customizations.sql`
- `011_enhance_template_system.sql`
- `012_add_rls_core_tables.sql`
- `013_add_billing_and_orgs.sql`
- `014_trigger_migration_system.sql` (this file)

## Prerequisites

✅ `DATABASE_URL` secret is configured in GitHub  
✅ Database is accessible from GitHub Actions  
✅ All migrations are idempotent (use IF NOT EXISTS, etc.)

## Verification Steps

After merge, verify:

1. **GitHub Actions Workflow**
   - Go to Actions → Database Migrations
   - Check workflow runs successfully
   - Review logs for each migration

2. **Archive Directory**
   - Check `backend/supabase/migrations/archive/`
   - Verify migrated files are archived

3. **Tracking File**
   - Check `.migrations_tracked.txt`
   - Verify all migrations are listed

4. **Database**
   - Verify tables exist
   - Check RLS policies are applied
   - Confirm indexes are created

## How the System Works

1. **Detection**: Workflow scans `backend/supabase/migrations/` for `.sql` files
2. **Filtering**: Skips files already in `.migrations_tracked.txt` or `archive/`
3. **Execution**: Runs each migration via `psql` using `DATABASE_URL`
4. **Tracking**: Adds successful migrations to `.migrations_tracked.txt`
5. **Archiving**: Moves migrated files to `archive/` directory
6. **Commit**: Commits archive changes back to repo

## Notes

- Migrations will only run if they haven't been tracked yet
- Failed migrations will stop the process (workflow fails)
- Archive commits happen automatically after successful migration
- All migrations use `IF NOT EXISTS` / `IF EXISTS` for idempotency

## Files Changed

- `backend/supabase/migrations/014_trigger_migration_system.sql` - New trigger file

## Ready to Merge

✅ Branch pushed: `migrate-all-existing-sql-files`  
✅ All migrations are idempotent  
✅ Workflow configured correctly  
✅ Secrets are set up  

**Merge this PR to trigger the migration system!** 🚀
