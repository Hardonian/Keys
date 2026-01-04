# Deployment Instructions - KEYS 90-Day Roadmap

## Prerequisites

You need the following environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `DATABASE_URL` - Direct PostgreSQL connection string (for migrations)
- `STRIPE_SECRET_KEY` - (Optional) For creating Stripe products

---

## Step 1: Run Migration 020

**Option A: Via Supabase SQL Editor (Recommended)**

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the contents of: `backend/supabase/migrations/020_extend_marketplace_new_tool_types.sql`
3. Paste and execute in SQL Editor

**Option B: Via Command Line**

```bash
cd backend
export DATABASE_URL="your_database_url_here"
npx tsx scripts/run-migration-020.ts
```

**Note**: If you have the database URL with brackets in password, you may need to URL-encode them:
- `[` becomes `%5B`
- `]` becomes `%5D`

---

## Step 2: Ingest All Keys

```bash
cd backend
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
npx tsx scripts/ingest-all-keys.ts
```

This will ingest all 16 new keys from:
- `/keys-assets/stripe-keys/`
- `/keys-assets/github-keys/`
- `/keys-assets/supabase-keys/`
- `/keys-assets/cursor-keys/`
- `/keys-assets/jupyter-keys/`

---

## Step 3: Verify Keys

```bash
cd backend
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
npx tsx scripts/verify-keys.ts
```

This will show all keys grouped by tool type.

---

## Step 4: Create Stripe Products (Optional)

```bash
cd backend
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export STRIPE_SECRET_KEY="your_stripe_secret_key"
npx tsx scripts/create-stripe-products.ts
```

This creates Stripe products and prices for all paid keys.

---

## Step 5: Create Bundles

```bash
cd backend
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export STRIPE_SECRET_KEY="your_stripe_secret_key"  # Optional
npx tsx scripts/create-bundles.ts
```

This creates:
- SaaS Starter Stack bundle ($199)
- SaaS Operator Stack bundle ($299)

---

## All-in-One Script

```bash
cd backend
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export DATABASE_URL="your_database_url"  # For migration
export STRIPE_SECRET_KEY="your_stripe_key"  # Optional

# Run complete deployment
bash scripts/deploy-roadmap-complete.sh
```

---

## Troubleshooting

### Migration Fails
- Check database URL format
- Ensure SSL is enabled for Supabase pooler
- Try running migration via Supabase SQL Editor instead

### Ingestion Fails
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Check that keys-assets directories exist
- Ensure key.json files are valid JSON

### Stripe Products Fail
- Verify STRIPE_SECRET_KEY is set
- Check Stripe API access
- Products will be skipped if key not set (optional)

---

## Verification

After deployment, verify:

1. **Keys in Marketplace**:
   ```bash
   curl "http://localhost:3001/api/marketplace/keys?tool=stripe"
   ```

2. **Database Schema**:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'marketplace_keys' 
   AND column_name IN ('tool', 'webhook_event_types', 'stripe_integration_level');
   ```

3. **Bundles**:
   ```sql
   SELECT slug, title, bundle_type, price_cents FROM marketplace_bundles;
   ```

---

## Next Steps

After successful deployment:
1. Test key downloads
2. Test Stripe checkout flows
3. Test bundle purchases
4. Monitor ingestion logs
