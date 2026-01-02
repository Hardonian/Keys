# EXECUTION PLAN: SUPABASE BACKEND REALITY VALIDATION

## Deliverables Summary

✅ **INTROSPECTION.sql** - Capture actual database state  
✅ **PATCH.sql** - Consolidated, idempotent fix for all gaps  
✅ **VERIFY.sql** - Verification queries with pass/fail checks  
✅ **GAPS_REPORT.md** - Comprehensive gap analysis framework  
✅ **ROLLBACK.sql** - Limited rollback (policies/functions/triggers only)  
✅ **REALITY_VALIDATION_SUMMARY.md** - Quick reference guide  

---

## Execution Workflow

### Phase 1: Reality Capture (15 minutes)

```bash
# Step 1: Connect to Supabase
# Option A: Via psql
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" \
  -f backend/supabase/INTROSPECTION.sql \
  > REALITY_SNAPSHOT_$(date +%Y%m%d_%H%M%S).txt

# Option B: Via Supabase SQL Editor
# Copy/paste INTROSPECTION.sql content, run, download results

# Option C: Via TypeScript script
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... tsx scripts/db-inventory.ts
# Output: .db-inventory.json
```

**Expected Output**: 
- Extensions list
- Tables with columns
- Indexes
- Constraints
- RLS status
- Policies
- Functions
- Triggers
- Grants
- Realtime publication

---

### Phase 2: Gap Analysis (30 minutes)

1. **Open GAPS_REPORT.md**
2. **Compare INTENDED vs ACTUAL**:
   - Count tables (expected: 19)
   - Count columns per table
   - Count indexes (expected: 50+)
   - Count RLS-enabled tables (expected: 15+)
   - Count policies (expected: 40+)
   - Count functions (expected: 4)
   - Count triggers (expected: 7)

3. **Document Gaps** using template:
   ```markdown
   ### Gap ID: GAP-XXX
   **Category**: [Missing Objects / Divergent Definitions / Missing RLS / etc.]
   **Severity**: [Critical / High / Medium / Low]
   **Object**: [table/column/index/function/policy name]
   **Issue**: [Description]
   **Evidence**: [Query result]
   **Expected**: [What should exist]
   **Actual**: [What actually exists]
   ```

4. **Prioritize Gaps**:
   - **Critical**: Missing RLS, missing core tables, security issues
   - **High**: Missing indexes, missing constraints, missing functions
   - **Medium**: Missing triggers, missing policies
   - **Low**: Missing comments, realtime configuration

---

### Phase 3: Apply Patch (5 minutes)

```bash
# Run PATCH.sql (idempotent, safe to re-run)
psql $DATABASE_URL -f backend/supabase/PATCH.sql

# Or via Supabase SQL Editor: Copy/paste entire PATCH.sql content
```

**What Happens**:
- ✅ Creates missing extensions
- ✅ Creates missing tables
- ✅ Adds missing columns
- ✅ Creates missing indexes
- ✅ Adds missing constraints
- ✅ Creates/replaces functions with correct signatures
- ✅ Creates/replaces triggers
- ✅ Enables RLS on all user-owned tables
- ✅ Creates/replaces RLS policies with consistent names

**Safety**: 
- No data loss
- No destructive drops
- Idempotent (safe to run multiple times)
- Transaction-wrapped (all-or-nothing)

---

### Phase 4: Verification (10 minutes)

```bash
# Run verification queries
psql $DATABASE_URL -f backend/supabase/VERIFY.sql

# Expected output: All checks show "PASS"
```

**Verification Checks**:
1. ✅ Extensions: uuid-ossp, vector exist
2. ✅ Tables: 19+ tables exist
3. ✅ Columns: Critical columns exist
4. ✅ Indexes: 50+ indexes exist
5. ✅ RLS Enabled: 15+ tables have RLS enabled
6. ✅ RLS Policies: 40+ policies exist
7. ✅ Functions: 4 functions exist
8. ✅ Triggers: 7 triggers exist
9. ✅ Constraints: CHECK/UNIQUE/FK constraints exist
10. ✅ Summary: Overall counts match expected

**If Any Check Fails**:
1. Review error message
2. Check specific failing object
3. Re-run PATCH.sql (idempotent)
4. Re-run VERIFY.sql
5. Document any remaining gaps for manual review

---

### Phase 5: Post-Verification (Optional, 10 minutes)

```bash
# Re-capture reality to confirm fixes
psql $DATABASE_URL -f backend/supabase/INTROSPECTION.sql \
  > REALITY_SNAPSHOT_POST_PATCH_$(date +%Y%m%d_%H%M%S).txt

# Compare with pre-patch snapshot
diff REALITY_SNAPSHOT_*.txt REALITY_SNAPSHOT_POST_PATCH_*.txt
```

**Expected**: 
- New objects added (tables, columns, indexes, policies)
- No objects removed
- Definitions match intended state

---

## Quick Reference: File Purposes

| File | Purpose | When to Use |
|------|---------|-------------|
| `INTROSPECTION.sql` | Capture DB state | Before patch, after patch |
| `GAPS_REPORT.md` | Gap analysis guide | During analysis |
| `PATCH.sql` | Fix gaps | When gaps identified |
| `VERIFY.sql` | Prove fixes | After patch applied |
| `ROLLBACK.sql` | Remove policies/functions | Only if needed |
| `REALITY_VALIDATION_SUMMARY.md` | Quick reference | Anytime |

---

## Common Issues & Solutions

### Issue 1: "relation already exists"
**Cause**: Table/index already exists  
**Solution**: Expected - PATCH.sql uses `IF NOT EXISTS`. Check if you're running non-idempotent migrations.

### Issue 2: "policy already exists"
**Cause**: Policy exists with different name  
**Solution**: PATCH.sql drops and recreates with consistent names. Safe.

### Issue 3: "function already exists with different definition"
**Cause**: Function signature differs  
**Solution**: PATCH.sql uses `CREATE OR REPLACE FUNCTION`. Safe.

### Issue 4: Verification shows "FAIL"
**Cause**: Gap still exists  
**Solution**: 
1. Check VERIFY.sql output for specific failing check
2. Review INTROSPECTION.sql output for that object
3. Re-run PATCH.sql (idempotent)
4. Re-run VERIFY.sql

### Issue 5: "permission denied"
**Cause**: Insufficient privileges  
**Solution**: Use service_role key or database admin account.

---

## Success Criteria

✅ All 19 tables exist  
✅ All expected columns exist with correct types  
✅ All 50+ indexes exist  
✅ RLS enabled on all 15+ user-owned tables  
✅ All 40+ RLS policies exist with correct definitions  
✅ All 4 functions exist with correct signatures and search_path  
✅ All 7 triggers exist  
✅ All constraints exist (CHECK, UNIQUE, FK)  
✅ subscription_tier includes 'pro+'  
✅ Failure memory tables exist and linked  

---

## Time Estimates

- **Reality Capture**: 15 minutes
- **Gap Analysis**: 30 minutes
- **Apply Patch**: 5 minutes
- **Verification**: 10 minutes
- **Post-Verification**: 10 minutes (optional)

**Total**: ~60 minutes for complete validation and patching

---

## Next Steps After Validation

1. ✅ Document any remaining gaps (if any)
2. ✅ Update application code if schema changes affect queries
3. ✅ Test application with new schema
4. ✅ Monitor for any runtime issues
5. ✅ Schedule periodic re-validation (monthly/quarterly)

---

## Support

For questions or issues:
1. Review `GAPS_REPORT.md` for detailed analysis framework
2. Check `VERIFY.sql` output for specific failures
3. Compare `INTROSPECTION.sql` output with intended state
4. Re-run `PATCH.sql` if needed (idempotent)

---

**Version**: 1.0  
**Last Updated**: Based on migrations 000-015  
**Status**: Ready for execution
