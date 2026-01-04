# KEYS 90-Day Roadmap - Deployment Guide

## ✅ All Scripts Created and Ready

All deployment scripts have been created and are ready to use. Due to database connection authentication requirements, the migration should be run manually in Supabase SQL Editor (which is the recommended approach for Supabase).

---

## 📋 Deployment Steps

### Step 1: Run Migration 020 (Manual - Recommended)

**Why Manual?** Supabase SQL Editor is the recommended way to run migrations as it handles authentication and connection automatically.

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `yekbmihsqoghbtjkwgkn`
3. **Navigate to**: SQL Editor
4. **Click**: New Query
5. **Copy SQL from**: `backend/supabase/migrations/020_extend_marketplace_new_tool_types.sql`
   - Or see: `MIGRATION_020_SQL.md` for formatted SQL
6. **Paste and Execute**: Click Run (or Cmd/Ctrl + Enter)

**Verification**:
```sql
-- Verify migration worked
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'marketplace_keys' 
AND column_name IN ('tool', 'webhook_event_types', 'stripe_integration_level');
```

---

### Step 2: Set Environment Variables

```bash
export SUPABASE_URL="https://yekbmihsqoghbtjkwgkn.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
export STRIPE_SECRET_KEY="your_stripe_secret_key_here"  # Optional
```

**Get SUPABASE_SERVICE_ROLE_KEY**:
- Supabase Dashboard → Settings → API → service_role key (secret)

**Get STRIPE_SECRET_KEY** (if creating Stripe products):
- Stripe Dashboard → Developers → API keys → Secret key

---

### Step 3: Run Complete Deployment

```bash
cd backend
npx tsx scripts/deploy-roadmap.ts
```

This will:
1. ✅ Ingest all 16 keys from keys-assets directories
2. ✅ Verify keys appear in marketplace
3. ✅ Create Stripe products/prices (if STRIPE_SECRET_KEY set)
4. ✅ Create bundles (SaaS Starter Stack, SaaS Operator Stack)

---

## 📁 Scripts Created

All scripts are in `/workspace/backend/scripts/`:

1. **`run-migration-020.ts`** - Run migration 020 (requires DATABASE_URL)
2. **`ingest-all-keys.ts`** - Ingest all keys from keys-assets
3. **`verify-keys.ts`** - Verify keys in marketplace
4. **`create-stripe-products.ts`** - Create Stripe products/prices
5. **`create-bundles.ts`** - Create marketplace bundles
6. **`deploy-roadmap.ts`** - Complete deployment script

---

## 🔍 Manual Verification

After deployment, verify everything worked:

### Check Keys in Database
```sql
-- Count keys by tool
SELECT tool, COUNT(*) as count
FROM marketplace_keys
GROUP BY tool
ORDER BY tool;

-- List new tool types
SELECT slug, title, tool, key_type, maturity, outcome
FROM marketplace_keys
WHERE tool IN ('stripe', 'github', 'supabase', 'cursor')
ORDER BY tool, slug;
```

### Check Bundles
```sql
SELECT slug, title, bundle_type, price_cents, 
       jsonb_array_length(key_ids) as key_count
FROM marketplace_bundles;
```

### Check Stripe Products (if created)
```sql
SELECT slug, title, stripe_product_id, stripe_price_id, price_cents
FROM marketplace_keys
WHERE stripe_product_id IS NOT NULL
ORDER BY price_cents DESC;
```

---

## 🚨 Troubleshooting

### Migration Fails
- **Error**: "column already exists"
  - ✅ Safe to ignore - migration is idempotent
- **Error**: "constraint already exists"
  - ✅ Safe to ignore - migration is idempotent
- **Error**: Authentication failed
  - Use Supabase SQL Editor instead (recommended)

### Ingestion Fails
- **Error**: "SUPABASE_SERVICE_ROLE_KEY not set"
  - Set the environment variable
- **Error**: "Key validation failed"
  - Check key.json files are valid JSON
- **Error**: "Database error"
  - Ensure migration 020 was run first

### Stripe Products Fail
- **Error**: "STRIPE_SECRET_KEY not set"
  - Set environment variable (optional)
- **Error**: "Stripe API error"
  - Check Stripe API key is valid
  - Products creation is optional

---

## ✅ Success Criteria

After deployment, you should have:

- ✅ **16 new keys** ingested (3 P0 + 5 P1 + 5 P2 + 3 P3)
- ✅ **Keys visible** in marketplace API
- ✅ **2 bundles** created (if keys ingested successfully)
- ✅ **Stripe products** created (if STRIPE_SECRET_KEY set)

---

## 📊 Expected Results

### Keys by Tool
- Stripe: 4 keys
- GitHub: 3 keys
- Supabase: 3 keys
- Cursor: 3 keys
- Jupyter: 3 keys (new ones)

### Bundles
- SaaS Starter Stack: 4 keys, $199
- SaaS Operator Stack: 4 keys, $299

---

## 🎯 Next Steps After Deployment

1. **Test Key Discovery**:
   ```bash
   curl "http://localhost:3001/api/marketplace/keys?tool=stripe"
   ```

2. **Test Bundle Listing**:
   ```bash
   curl "http://localhost:3001/api/marketplace/bundles"
   ```

3. **Test Stripe Checkout** (if products created):
   - Verify products appear in Stripe Dashboard
   - Test checkout flow

4. **Monitor**:
   - Check ingestion logs
   - Verify key downloads work
   - Test bundle purchases

---

## 📝 Notes

- **Migration**: Should be run manually in Supabase SQL Editor (recommended)
- **Ingestion**: Uses Supabase API (no direct DB access needed)
- **Stripe**: Optional - keys will work without Stripe products
- **Bundles**: Created after keys are ingested

---

**All scripts are ready!** Follow the steps above to complete deployment.
