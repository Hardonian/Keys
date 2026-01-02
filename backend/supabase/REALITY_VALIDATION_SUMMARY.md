# SUPABASE BACKEND REALITY VALIDATOR + MIGRATION CONSOLIDATOR

## Summary

This validation and consolidation system provides:

1. **INTROSPECTION.sql** - Queries to capture actual database state
2. **PATCH.sql** - Consolidated, idempotent SQL patch that fixes gaps
3. **VERIFY.sql** - Verification queries to prove patch worked
4. **GAPS_REPORT.md** - Comprehensive guide for gap analysis

---

## Quick Start

### Step 1: Capture Reality
```bash
# Option A: Run introspection queries
psql $DATABASE_URL -f backend/supabase/INTROSPECTION.sql > REALITY_SNAPSHOT.txt

# Option B: Use TypeScript script
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... tsx scripts/db-inventory.ts
```

### Step 2: Analyze Gaps
1. Review `GAPS_REPORT.md` for intended state
2. Compare your `REALITY_SNAPSHOT.txt` against intended state
3. Document gaps using the evidence template

### Step 3: Apply Patch
```bash
# Run the consolidated patch (idempotent, safe to re-run)
psql $DATABASE_URL -f backend/supabase/PATCH.sql

# Or via Supabase SQL Editor: Copy/paste PATCH.sql content
```

### Step 4: Verify
```bash
# Run verification queries
psql $DATABASE_URL -f backend/supabase/VERIFY.sql

# Expected: All checks should show "PASS" status
```

---

## What's Fixed by PATCH.sql

The patch ensures:

✅ **Extensions**: uuid-ossp, vector  
✅ **19 Tables**: All core, template, billing, and failure memory tables  
✅ **50+ Indexes**: Including GIN indexes for JSONB/arrays, partial indexes  
✅ **Constraints**: CHECK, UNIQUE, FOREIGN KEY constraints  
✅ **RLS Enabled**: On all 15+ user-owned tables  
✅ **40+ RLS Policies**: Proper user isolation for all tables  
✅ **4 Functions**: With SECURITY DEFINER and search_path set  
✅ **7 Triggers**: For updated_at automation and history tracking  
✅ **Pro+ Tier**: subscription_tier constraint includes 'pro+'  
✅ **Failure Memory**: All 3 tables and foreign key links  

---

## Key Features

### Idempotent Design
- Uses `IF NOT EXISTS` patterns
- Uses `DO $$ BEGIN ... IF NOT EXISTS ... END $$;` blocks
- Safe to run multiple times
- No data loss or destructive operations

### Schema Safety
- All objects explicitly qualified with `public.` schema
- Functions set `search_path = public` to prevent search_path attacks
- SECURITY DEFINER functions properly configured

### Evidence-Based
- INTROSPECTION.sql captures actual state
- VERIFY.sql provides pass/fail checks
- GAPS_REPORT.md provides comparison framework

---

## Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `INTROSPECTION.sql` | Capture actual DB state | Before patch, after patch |
| `PATCH.sql` | Fix gaps (idempotent) | When gaps are identified |
| `VERIFY.sql` | Prove patch worked | After applying patch |
| `GAPS_REPORT.md` | Gap analysis guide | During analysis phase |

---

## Common Scenarios

### Scenario 1: Fresh Database
**Situation**: New Supabase project, no migrations applied  
**Action**: Run `PATCH.sql` once  
**Result**: All objects created, RLS enabled, policies added

### Scenario 2: Partial Migrations
**Situation**: Some migrations applied, some missing  
**Action**: Run `PATCH.sql` (idempotent, only adds missing pieces)  
**Result**: Missing objects added, existing objects unchanged

### Scenario 3: Verification Only
**Situation**: Want to verify current state matches intended  
**Action**: Run `INTROSPECTION.sql`, compare with `GAPS_REPORT.md`  
**Result**: Gap report showing what's missing/divergent

### Scenario 4: Post-Patch Validation
**Situation**: Applied patch, want to confirm success  
**Action**: Run `VERIFY.sql`  
**Result**: Pass/fail report for all checks

---

## Safety Guarantees

✅ **No Drops**: Never drops tables, columns, or data  
✅ **No Renames**: Never renames objects automatically  
✅ **Additive Only**: Only adds missing objects/fixes  
✅ **Idempotent**: Safe to run multiple times  
✅ **Transaction Wrapped**: PATCH.sql uses BEGIN/COMMIT  
✅ **Schema Qualified**: All objects use `public.` prefix  

---

## Troubleshooting

### Error: "relation already exists"
**Cause**: Table/index already exists  
**Solution**: This is expected - PATCH.sql uses `IF NOT EXISTS`, so this shouldn't happen. Check if you're running non-idempotent migrations.

### Error: "policy already exists"
**Cause**: Policy exists but name differs  
**Solution**: PATCH.sql drops and recreates policies with consistent names. This is safe.

### Error: "function already exists with different definition"
**Cause**: Function exists but signature differs  
**Solution**: PATCH.sql uses `CREATE OR REPLACE FUNCTION`, so this updates the definition safely.

### Verification Queries Show "FAIL"
**Cause**: Gap still exists after patch  
**Solution**: 
1. Check error messages in VERIFY.sql output
2. Review specific failing checks
3. Manually inspect using INTROSPECTION.sql
4. Re-run PATCH.sql if needed (idempotent)

---

## Next Steps After Validation

1. ✅ Run INTROSPECTION.sql → Capture reality
2. ✅ Compare with GAPS_REPORT.md → Identify gaps
3. ✅ Run PATCH.sql → Fix gaps
4. ✅ Run VERIFY.sql → Confirm fixes
5. ✅ Re-run INTROSPECTION.sql → Verify final state
6. ✅ Document any remaining gaps → For manual review

---

## Support

For issues or questions:
1. Review `GAPS_REPORT.md` for detailed gap analysis framework
2. Check `VERIFY.sql` output for specific failing checks
3. Compare `INTROSPECTION.sql` output with intended state in `GAPS_REPORT.md`

---

**Version**: 1.0  
**Last Updated**: Based on migrations 000-015  
**Compatibility**: Supabase PostgreSQL 14+
