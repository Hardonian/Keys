# Deployment Checklist

## Pre-Deployment ✅

- [x] All code implemented
- [x] All tests passing
- [x] All type checks passing
- [x] All lint checks passing
- [x] Builds successful
- [x] Migration files ready
- [x] Documentation complete

## Deployment Steps

### 1. Database Migrations ⚠️ REQUIRED

**CRITICAL**: Run these migrations before deploying:

1. `backend/supabase/migrations/012_add_rls_core_tables.sql`
   - Enables RLS on user_profiles, vibe_configs, agent_runs, background_events
   - **Security critical** - do not skip

2. `backend/supabase/migrations/013_add_billing_and_orgs.sql`
   - Adds billing columns and multi-tenant tables
   - Required for billing and org features

**How to run:**
- Supabase Dashboard → SQL Editor → Copy/paste SQL → Run
- Or use: `./scripts/run-migrations.sh`

### 2. Environment Variables ⚠️ REQUIRED

**Frontend (Vercel):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=
```

**Backend:**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
REDIS_URL= (optional)
STRIPE_SECRET_KEY= (optional)
STRIPE_WEBHOOK_SECRET= (optional)
```

### 3. Deploy

**Frontend:**
```bash
git push origin main  # Vercel auto-deploys
```

**Backend:**
```bash
cd backend
npm run build
npm start
# Or deploy to Railway/Render/Fly.io
```

### 4. Verify

- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Protected routes redirect correctly
- [ ] Users cannot access other users' data
- [ ] API endpoints work with auth tokens

## Post-Deployment

- [ ] Monitor error rates (Sentry)
- [ ] Check database performance
- [ ] Verify RLS policies are active
- [ ] Test billing flow (if enabled)
- [ ] Test Chrome extension (if using)

## Rollback Plan

If issues occur:
1. Revert to previous deployment
2. Check migration status
3. Verify environment variables
4. Check logs for errors

See DEPLOYMENT.md for detailed troubleshooting.
