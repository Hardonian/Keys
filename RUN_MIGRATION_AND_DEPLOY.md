# 🚀 Run Migration and Deploy - Quick Guide

## Step 1: Run Combined Migration

**Copy this SQL and run in Supabase SQL Editor**:

```bash
cat backend/supabase/migrations/019_020_combined_marketplace_setup.sql
```

**Or see the file**: `backend/supabase/migrations/019_020_combined_marketplace_setup.sql`

This creates the `marketplace_keys` table (if needed) and extends it for new tool types.

---

## Step 2: Run Deployment

After migration is complete:

```bash
cd backend
export SUPABASE_URL="https://yekbmihsqoghbtjkwgkn.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlla2JtaWhzcW9naGJ0amt3Z2tuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njg4OTkxNiwiZXhwIjoyMDgyNDY1OTE2fQ.h60dZoMbBT4a5nJq-S2x29Crt8QAqqz89Lm_F8njbPc"
export STRIPE_SECRET_KEY="your_stripe_key"  # Optional

npx tsx scripts/execute-migration-and-deploy.ts
```

---

## What This Will Do

1. ✅ Check migration status
2. ✅ Ingest all 16 keys
3. ✅ Verify keys appear
4. ✅ Create Stripe products (if key set)
5. ✅ Create bundles

---

**Ready to deploy!**
