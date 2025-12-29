# Deployment Guide

## Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Dependencies installed
- [ ] Type checks passing
- [ ] Tests passing
- [ ] Build successful

## Step 1: Environment Variables

### Frontend (Vercel/Next.js)
Set these in your Vercel project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
```

### Backend
Set these in your hosting environment:

```bash
NODE_ENV=production
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REDIS_URL=your_redis_url
STRIPE_SECRET_KEY=your_stripe_secret_key  # Optional
STRIPE_WEBHOOK_SECRET=your_webhook_secret  # Optional
```

## Step 2: Database Migrations

### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order:
   - `backend/supabase/migrations/012_add_rls_core_tables.sql`
   - `backend/supabase/migrations/013_add_billing_and_orgs.sql`

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
./scripts/run-migrations.sh
```

### Option C: Using psql

```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
./scripts/run-migrations.sh
```

## Step 3: Verify Setup

Run the verification script:

```bash
./scripts/verify-setup.sh
```

## Step 4: Build and Deploy

### Frontend (Vercel)

```bash
cd frontend
npm run build
```

If using Vercel, push to your connected GitHub branch and Vercel will auto-deploy.

### Backend

```bash
cd backend
npm run build
npm start
```

Or use your preferred hosting (Railway, Render, Fly.io, etc.)

## Step 5: Post-Deployment Verification

1. **Test Sign Up Flow**
   - Navigate to `/signup`
   - Create a test account
   - Verify redirect to `/onboarding`

2. **Test Sign In Flow**
   - Sign out
   - Navigate to `/signin`
   - Sign in with test account
   - Verify redirect to `/dashboard`

3. **Test Protected Routes**
   - Sign out
   - Try to access `/dashboard`
   - Verify redirect to `/signin`

4. **Test API Endpoints**
   ```bash
   # Get auth token from browser DevTools
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-api-domain.com/profiles/YOUR_USER_ID
   ```

5. **Verify RLS Policies**
   - Try to access another user's data
   - Should return 403 Forbidden

## Troubleshooting

### Migration Errors

If migrations fail with "already exists" errors, the migrations may have already been applied. Check your database:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'vibe_configs', 'agent_runs', 'background_events');

-- Check if billing columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('stripe_customer_id', 'subscription_status', 'subscription_tier');
```

### Build Errors

- **Type errors**: Run `npm run type-check` in both frontend and backend
- **Missing dependencies**: Run `npm install` in both directories
- **Environment variables**: Verify all required vars are set

### Runtime Errors

- **Auth errors**: Check Supabase URL and keys are correct
- **Database errors**: Verify migrations have been run
- **CORS errors**: Check CORS_ORIGINS includes your frontend URL

## Monitoring

After deployment, monitor:

- Error rates (Sentry)
- API response times
- Database query performance
- User signup/signin success rates

## Rollback Plan

If issues occur:

1. **Frontend**: Revert to previous Vercel deployment
2. **Backend**: Revert to previous deployment version
3. **Database**: Migrations are designed to be safe (IF NOT EXISTS clauses)

## Support

For issues, check:
- `PROOF.md` for verification steps
- `STATUS.md` for current status
- `CHANGELOG.md` for recent changes
