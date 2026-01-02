# SUPABASE MIGRATION EXECUTION INSTRUCTIONS

## Database Connection
- **Host**: db.yekbmihsqoghbtjkwgkn.supabase.co
- **Port**: 5432
- **Database**: postgres
- **User**: postgres
- **Password**: 84Px0bMoJmGhLXhB

## Option 1: Supabase SQL Editor (Recommended)

1. **Navigate to Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/yekbmihsqoghbtjkwgkn/sql/new

2. **Open PATCH.sql**:
   - File location: `backend/supabase/PATCH.sql`
   - Copy the entire contents of the file

3. **Execute**:
   - Paste the SQL into the SQL Editor
   - Click "Run" or press Ctrl+Enter
   - The patch is idempotent - safe to run multiple times

4. **Verify**:
   - After execution, run `VERIFY.sql` in the same SQL Editor
   - All checks should show "PASS" status

## Option 2: psql Command Line

If you have `psql` installed locally:

```bash
psql "postgresql://postgres:84Px0bMoJmGhLXhB@db.yekbmihsqoghbtjkwgkn.supabase.co:5432/postgres" \
  -f backend/supabase/PATCH.sql
```

## Option 3: Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref yekbmihsqoghbtjkwgkn

# Execute the patch
supabase db execute -f backend/supabase/PATCH.sql
```

## What the Patch Does

The `PATCH.sql` file will:

✅ Create missing extensions (uuid-ossp, vector)  
✅ Create 19 tables if they don't exist  
✅ Add missing columns to existing tables  
✅ Create 50+ indexes  
✅ Add constraints (CHECK, UNIQUE, FOREIGN KEY)  
✅ Create/replace 4 functions with proper security settings  
✅ Create 7 triggers  
✅ Enable RLS on all user-owned tables  
✅ Create 40+ RLS policies  

**Safety**: The patch is **idempotent** - it uses `IF NOT EXISTS` patterns and is safe to run multiple times. No data will be lost.

## Verification

After running PATCH.sql, execute VERIFY.sql:

```bash
# Via Supabase SQL Editor:
# Copy/paste backend/supabase/VERIFY.sql and run

# Or via psql:
psql "postgresql://postgres:84Px0bMoJmGhLXhB@db.yekbmihsqoghbtjkwgkn.supabase.co:5432/postgres" \
  -f backend/supabase/VERIFY.sql
```

Expected results:
- ✅ Extensions: PASS
- ✅ Tables: PASS (19+ tables)
- ✅ Columns: PASS
- ✅ Indexes: PASS (50+ indexes)
- ✅ RLS Enabled: PASS (15+ tables)
- ✅ RLS Policies: PASS (40+ policies)
- ✅ Functions: PASS (4 functions)
- ✅ Triggers: PASS (7 triggers)
- ✅ Constraints: PASS

## Troubleshooting

### Error: "relation already exists"
**Solution**: This is expected - the patch is idempotent. These warnings can be ignored.

### Error: "permission denied"
**Solution**: Ensure you're using the service_role key or database admin account.

### Error: "connection refused"
**Solution**: Check network connectivity and firewall settings.

## Files Ready for Execution

All SQL files are in `backend/supabase/`:

- ✅ **PATCH.sql** - Main migration (run this first)
- ✅ **VERIFY.sql** - Verification queries (run after patch)
- ✅ **INTROSPECTION.sql** - Capture current state (optional, for analysis)
- ✅ **ROLLBACK.sql** - Limited rollback (only if needed)

## Next Steps

1. ✅ Execute PATCH.sql via Supabase SQL Editor
2. ✅ Execute VERIFY.sql to confirm success
3. ✅ Review any warnings (most are expected for idempotent operations)
4. ✅ Test your application with the updated schema

---

**Status**: Ready for execution  
**File**: `backend/supabase/PATCH.sql`  
**Size**: ~1,200 lines  
**Estimated Time**: 2-5 minutes
