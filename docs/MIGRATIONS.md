# Database Migrations Guide

**Last Updated:** 2024-12-30

## Overview

Database migrations are automatically handled via GitHub Actions. When SQL migration files are merged to `main`, they are automatically detected, executed, and archived.

## How It Works

### Automatic Flow

1. **Developer creates migration file** in `backend/supabase/migrations/`
2. **Commits and pushes** to feature branch
3. **Opens PR** and merges to `main`
4. **GitHub Actions triggers** automatically on merge
5. **Migrations detected** and executed
6. **Successful migrations archived** to `archive/` directory
7. **Tracking file updated** with applied migrations

### Manual Trigger

You can manually trigger migrations via GitHub Actions:

1. Go to **Actions** → **Database Migrations**
2. Click **Run workflow**
3. Select branch (usually `main`)
4. Optionally enable **Force run all migrations**
5. Click **Run workflow**

## Migration File Structure

```
backend/supabase/migrations/
├── 001_create_user_profiles.sql
├── 002_create_prompt_atoms.sql
├── ...
├── 012_add_rls_core_tables.sql
├── 013_add_billing_and_orgs.sql
├── archive/                    # Archived migrations (after execution)
│   ├── 001_create_user_profiles.sql
│   └── ...
└── .migrations_tracked.txt     # Tracking file (runtime state)
```

## Adding a New Migration

### Step 1: Create Migration File

Create a new SQL file in `backend/supabase/migrations/`:

```bash
# Example: 014_add_new_table.sql
touch backend/supabase/migrations/014_add_new_table.sql
```

### Step 2: Write Migration SQL

```sql
-- Migration: 014_add_new_table.sql
-- Description: Add new feature table

CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_new_table_user_id ON new_table(user_id);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records"
  ON new_table
  FOR SELECT
  USING (auth.uid()::text = user_id);
```

### Step 3: Commit and Push

```bash
git add backend/supabase/migrations/014_add_new_table.sql
git commit -m "feat: Add new table migration"
git push origin your-branch
```

### Step 4: Merge to Main

- Create PR
- Get approval
- Merge to `main`
- **Migration runs automatically**

## Migration Best Practices

### ✅ Do's

- **Use sequential numbering**: `001_`, `002_`, `003_`, etc.
- **Make migrations idempotent**: Use `IF NOT EXISTS`, `IF EXISTS`
- **One change per migration**: Keep migrations focused
- **Test locally first**: Run migrations locally before committing
- **Use descriptive names**: `014_add_user_preferences.sql`

### ❌ Don'ts

- **Don't modify existing migrations**: Create new ones instead
- **Don't skip numbers**: Keep sequence consistent
- **Don't include data migrations**: Use separate scripts
- **Don't forget RLS**: Enable RLS on user-owned tables

## Local Development

### Run Migrations Locally

```bash
# Set database URL
export SUPABASE_DB_URL="postgresql://user:pass@host:port/db"
# Or
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Run migrations
./scripts/migrate-and-archive.sh

# Force run all migrations (ignore tracking)
./scripts/migrate-and-archive.sh force
```

### Check Migration Status

```bash
# View tracked migrations
cat backend/supabase/migrations/.migrations_tracked.txt

# View archived migrations
ls backend/supabase/migrations/archive/
```

## GitHub Actions Secrets

Required secrets for migrations workflow:

- `SUPABASE_DB_URL` - Direct PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
- `DATABASE_URL` - Alternative database URL (if not using SUPABASE_DB_URL)

### Setting Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add `SUPABASE_DB_URL` with your connection string
4. Save

## Troubleshooting

### Migration Fails in CI

**Symptoms:** GitHub Actions workflow fails

**Solutions:**
1. Check workflow logs for error details
2. Verify database credentials in secrets
3. Ensure migration is idempotent (uses IF NOT EXISTS)
4. Test migration locally first

### Migration Already Applied

**Symptoms:** Migration skipped, already in tracking file

**Solutions:**
1. Check `.migrations_tracked.txt`
2. Check `archive/` directory
3. Use force mode if needed to re-run

### Need to Re-run Migration

**Options:**
1. **Manual trigger with force**: GitHub Actions → Run workflow → Enable force
2. **Local force run**: `./scripts/migrate-and-archive.sh force`
3. **Remove from tracking**: Edit `.migrations_tracked.txt` and move file back from archive

### Archive Not Committing

**Symptoms:** Migrations run but archive not committed

**Solutions:**
1. Check GitHub Actions permissions (needs `contents: write`)
2. Verify GITHUB_TOKEN has write access
3. Check if changes exist: `git status` in workflow
4. May need manual commit if permissions insufficient

## Migration Tracking

### Tracking File

`.migrations_tracked.txt` contains list of successfully applied migrations:

```
001_create_user_profiles.sql
002_create_prompt_atoms.sql
012_add_rls_core_tables.sql
```

### Archive Directory

`archive/` contains migrated SQL files. Files are moved here after successful execution to prevent re-running.

## Example Workflow

```bash
# 1. Create migration
echo "CREATE TABLE test (id UUID PRIMARY KEY);" > backend/supabase/migrations/014_test.sql

# 2. Commit
git add backend/supabase/migrations/014_test.sql
git commit -m "feat: Add test table"

# 3. Push and create PR
git push origin feature-branch
# Create PR on GitHub

# 4. Merge PR
# Migration runs automatically on merge to main

# 5. Verify
# Check GitHub Actions → Database Migrations
# Check archive/ directory for migrated file
```

## Security Notes

- **Never commit database credentials** - Use GitHub Secrets
- **Use service role key** for migrations (has elevated permissions)
- **Review migrations** before merging (they run automatically)
- **Test in staging** first if possible

## Related Files

- `.github/workflows/migrations.yml` - GitHub Actions workflow
- `scripts/migrate-and-archive.sh` - Local migration script
- `backend/supabase/migrations/README.md` - Migration directory guide

---

**For questions or issues, check GitHub Actions logs or contact DevOps team.**
