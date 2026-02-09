# Quick Start Deployment Guide

## 🚀 Fastest Path to Production

### Step 1: Run Database Migrations (5 minutes)

**Option A: Supabase Dashboard (Easiest)**
1. Go to your Supabase project → SQL Editor
2. Copy contents of `backend/supabase/migrations/012_add_rls_core_tables.sql`
3. Paste and run
4. Repeat for `013_add_billing_and_orgs.sql`

**Option B: Supabase CLI**
```bash
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_REF
./scripts/run-migrations.sh
```

### Step 2: Set Environment Variables (5 minutes)

**Frontend (Vercel)**
- Go to Vercel project → Settings → Environment Variables
- Add:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_API_BASE_URL`

**Backend (Your hosting)**
- Add:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `REDIS_URL` (if using Redis)
  - `STRIPE_SECRET_KEY` (optional, for billing)
  - `STRIPE_WEBHOOK_SECRET` (optional)

### Step 3: Deploy (10 minutes)

**Frontend**
```bash
git push origin main  # Vercel auto-deploys
```

**Backend**
```bash
cd backend
npm run build
npm start  # Or deploy to your hosting platform
```

### Step 4: Verify (5 minutes)

1. Visit your frontend URL
2. Sign up a test account
3. Verify redirect to onboarding
4. Complete onboarding
5. Verify dashboard loads

## ✅ That's It!

Your app is now live. See `DEPLOYMENT.md` for detailed troubleshooting.
