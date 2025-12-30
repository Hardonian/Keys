# Database Migrations

This directory contains SQL migration files for the Supabase database.

## How It Works

### Automatic Migration (GitHub Actions)

1. **On Merge to Main**: When SQL files are merged to `main`, GitHub Actions automatically:
   - Detects new migration files
   - Runs them against the production database
   - Archives successful migrations to `archive/` directory
   - Updates tracking file (`.migrations_tracked.txt`)

2. **Manual Trigger**: You can manually trigger migrations via GitHub Actions:
   - Go to Actions → Database Migrations → Run workflow
   - Optionally enable "Force run all migrations"

### Manual Migration (Local Development)

```bash
# Run migrations locally
./scripts/migrate-and-archive.sh

# Force run all migrations (ignore tracking)
./scripts/migrate-and-archive.sh force
```

### Migration File Naming

Migration files should follow this naming convention:
```
###_description.sql
```

Example:
- `001_create_user_profiles.sql`
- `012_add_rls_core_tables.sql`
- `013_add_billing_and_orgs.sql`

### Migration Tracking

- **Tracking File**: `.migrations_tracked.txt` (gitignored)
  - Contains list of successfully applied migrations
  - Updated automatically after each successful migration

- **Archive Directory**: `archive/` (gitignored)
  - Contains migrated SQL files
  - Files are moved here after successful migration
  - Prevents re-running the same migration

### Adding a New Migration

1. **Create SQL file** in `backend/supabase/migrations/`
   - Use next sequential number
   - Descriptive name

2. **Commit and push** to a branch

3. **Merge to main** - Migration runs automatically

4. **Verify** - Check GitHub Actions logs

### Migration Best Practices

- ✅ **Idempotent**: Migrations should be safe to run multiple times
- ✅ **Use IF NOT EXISTS**: For tables, indexes, etc.
- ✅ **Use IF EXISTS**: For drops
- ✅ **Test locally** before committing
- ✅ **One change per migration**: Keep migrations focused

### Example Migration

```sql
-- Migration: 014_add_new_feature.sql
-- Description: Add new feature table

CREATE TABLE IF NOT EXISTS new_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_new_feature_user_id ON new_feature(user_id);

-- Enable RLS
ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own features"
  ON new_feature
  FOR SELECT
  USING (auth.uid()::text = user_id);
```

### Troubleshooting

**Migration fails in CI:**
- Check GitHub Actions logs
- Verify database credentials in secrets
- Ensure migration is idempotent

**Migration already applied:**
- Check `.migrations_tracked.txt`
- Check `archive/` directory
- Use force mode if needed

**Need to re-run migration:**
- Remove from tracking file
- Move back from archive
- Or use force mode

---

**Note:** The tracking file and archive directory are gitignored to prevent conflicts. Only the source migration files are committed.
