# 🚀 Execute Deployment Now

## Quick Execution Guide

### Prerequisites Check

You need these environment variables (from GitHub Secrets):
- ✅ `SUPABASE_URL` = `https://yekbmihsqoghbtjkwgkn.supabase.co`
- ⏳ `SUPABASE_SERVICE_ROLE_KEY` = (get from GitHub Secrets)
- ⏳ `STRIPE_SECRET_KEY` = (optional, get from Stripe Dashboard)

---

## Step 1: Run Migration 020 (REQUIRED FIRST)

**Copy this SQL and run in Supabase SQL Editor**:

```sql
-- Full SQL is in: backend/supabase/migrations/020_extend_marketplace_new_tool_types.sql
-- Or see: MIGRATION_020_SQL.md for formatted version
```

**Quick Access**:
```bash
cat backend/supabase/migrations/020_extend_marketplace_new_tool_types.sql
```

**After running migration**, verify:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'marketplace_keys' 
AND column_name = 'tool';
-- Should return: tool
```

---

## Step 2: Execute Complete Deployment

Once migration is done and environment variables are set:

```bash
cd backend

# Set environment variables
export SUPABASE_URL="https://yekbmihsqoghbtjkwgkn.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_from_github_secrets"
export STRIPE_SECRET_KEY="your_stripe_secret_key"  # Optional

# Run complete deployment
npx tsx scripts/deploy-roadmap.ts
```

This single command will:
1. ✅ Ingest all 16 keys
2. ✅ Verify keys appear
3. ✅ Create Stripe products (if key set)
4. ✅ Create bundles

---

## Individual Steps (If Needed)

If you prefer to run steps individually:

```bash
cd backend

# Step 1: Ingest keys
npx tsx scripts/ingest-all-keys.ts

# Step 2: Verify keys
npx tsx scripts/verify-keys.ts

# Step 3: Create Stripe products (optional)
npx tsx scripts/create-stripe-products.ts

# Step 4: Create bundles
npx tsx scripts/create-bundles.ts
```

---

## Expected Output

After successful deployment:

```
✅ Key ingestion completed
   - Successfully ingested: 16
   - Errors: 0

✅ Keys verified
   Found 16+ keys in marketplace
   - STRIPE: 4 keys
   - GITHUB: 3 keys
   - SUPABASE: 3 keys
   - CURSOR: 3 keys
   - JUPYTER: 3 keys

✅ Stripe products created
   - Created: 16 products

✅ Bundles created
   - SaaS Starter Stack: Created
   - SaaS Operator Stack: Created
```

---

## Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY not set"
- Get from: GitHub Secrets → `SUPABASE_SERVICE_ROLE_KEY`
- Or: Supabase Dashboard → Settings → API → service_role key

### "Migration not run"
- Run migration SQL in Supabase SQL Editor first
- See: `MIGRATION_020_SQL.md`

### "Key ingestion fails"
- Ensure migration 020 was run first
- Check key.json files are valid JSON
- Verify SUPABASE_SERVICE_ROLE_KEY is correct

---

## Verification

After deployment, test:

```bash
# Check keys via API
curl "http://localhost:3001/api/marketplace/keys?tool=stripe" | jq

# Check bundles
curl "http://localhost:3001/api/marketplace/bundles" | jq
```

---

**Ready to deploy!** Follow steps above.
