# Operations Runbook

**Last Updated:** 2024-12-30  
**Purpose:** Deployment, monitoring, and incident response

## Deployment

### Prerequisites
1. **Environment Variables:** Set all vars from `.env.example`
2. **Database Migrations:** Run migrations (see below)
3. **Stripe:** Configure webhook endpoint
4. **Supabase:** Set up project and RLS policies

### Database Migrations

**Run Order:**
```bash
# From backend directory
cd backend
npm run migrate
```

**Migration Files:**
- `001_create_user_profiles.sql`
- `002_create_prompt_atoms.sql`
- `003_create_vibe_configs.sql`
- `004_create_agent_runs.sql`
- `005_create_background_events.sql`
- `006_add_indexes.sql`
- `007_add_constraints.sql`
- `008_add_premium_features.sql`
- `010_create_user_template_customizations.sql`
- `011_enhance_template_system.sql`
- `012_add_rls_core_tables.sql` ⚠️ **Critical for security**
- `013_add_billing_and_orgs.sql`

**Verification:**
```bash
npm run verify-migrations
```

### Frontend Deployment (Vercel)

**Automatic (via GitHub):**
- Push to `main` → Auto-deploy to production
- Push to branch → Preview deployment

**Manual:**
```bash
cd frontend
vercel --prod
```

**Environment Variables (Vercel):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL`

### Backend Deployment

**Options:**
1. **Vercel** (serverless functions)
2. **Railway** (containerized)
3. **AWS/GCP** (custom setup)

**Build:**
```bash
cd backend
npm run build
npm start
```

**Environment Variables:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY` (or other LLM keys)
- `REDIS_URL` (optional)
- `SENTRY_DSN` (optional)

### Webhook Configuration

**Stripe Webhook:**
- **URL:** `https://your-backend.com/billing/webhook`
- **Events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- **Secret:** Set `STRIPE_WEBHOOK_SECRET` in backend env

**GitHub Webhook (if using):**
- **URL:** `https://your-backend.com/webhooks/code-repo`
- **Secret:** Set `CODE_REPO_WEBHOOK_SECRET`

## Monitoring

### Health Checks

**Backend:**
```bash
curl https://your-backend.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-30T...",
  "environment": "production",
  "version": "1.0.0"
}
```

### Logs

**Backend Logs:**
- Structured JSON logs via `logger.ts`
- Sentry for error tracking (if configured)
- Check hosting provider logs (Vercel, Railway, etc.)

**Frontend Logs:**
- Browser console (development)
- Sentry (production, if configured)
- Vercel logs (deployment issues)

### Key Metrics to Monitor

1. **API Response Times**
   - Check `metricsMiddleware` output
   - Alert if p95 > 2s

2. **Error Rates**
   - Check Sentry dashboard
   - Alert if error rate > 1%

3. **Database Connections**
   - Supabase dashboard
   - Alert if connection pool exhausted

4. **Stripe Webhook Failures**
   - Check Stripe dashboard
   - Alert on webhook failures

5. **Usage Metrics**
   - Check `usage_metrics` table
   - Monitor for unusual spikes

## Incident Response

### Severity Levels

**P0 — Critical (Site Down)**
- Site completely unavailable
- **Response:** Immediate (within 15 min)
- **Actions:** Check hosting, database, DNS

**P1 — High (Major Feature Broken)**
- Core feature not working (auth, billing)
- **Response:** Within 1 hour
- **Actions:** Check error logs, rollback if needed

**P2 — Medium (Minor Feature Broken)**
- Non-critical feature broken
- **Response:** Within 4 hours
- **Actions:** Create issue, investigate

**P3 — Low (Cosmetic Issue)**
- UI bug, typo
- **Response:** Next business day
- **Actions:** Create issue, fix in next release

### Common Issues

#### Issue: Site Returns 500 Error

**Diagnosis:**
1. Check backend logs
2. Check database connectivity
3. Check environment variables

**Fix:**
```bash
# Check backend health
curl https://your-backend.com/health

# Check database (via Supabase dashboard)
# Verify env vars are set correctly
```

#### Issue: Stripe Webhooks Failing

**Diagnosis:**
1. Check Stripe dashboard → Webhooks → Recent events
2. Check backend logs for webhook errors
3. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe

**Fix:**
- Ensure webhook URL is correct
- Verify signature verification (check raw body handling)
- Check webhook secret matches

#### Issue: Database Connection Errors

**Diagnosis:**
1. Check Supabase dashboard → Status
2. Check connection pool usage
3. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

**Fix:**
- Verify Supabase project is active
- Check for connection pool exhaustion
- Restart backend if needed

#### Issue: Authentication Not Working

**Diagnosis:**
1. Check Supabase Auth dashboard
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Check browser console for errors

**Fix:**
- Verify Supabase project settings
- Check CORS configuration
- Verify environment variables in Vercel

### Rollback Procedure

**Frontend (Vercel):**
1. Go to Vercel dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

**Backend:**
1. Revert code to last working commit
2. Rebuild and redeploy
3. Or use hosting provider's rollback feature

**Database:**
- ⚠️ **Never rollback migrations** without careful consideration
- If needed, create new migration to fix issues

## Maintenance

### Regular Tasks

**Weekly:**
- Review error logs
- Check usage metrics
- Review security alerts

**Monthly:**
- Update dependencies (`npm audit`)
- Review and rotate API keys
- Check database performance

**Quarterly:**
- Review and update RLS policies
- Security audit
- Performance optimization

### Dependency Updates

**Check for Updates:**
```bash
npm outdated
```

**Update Safely:**
```bash
# Test in development first
npm update

# Run tests
npm test

# Check for breaking changes
npm audit
```

### Database Maintenance

**Vacuum (if needed):**
- Supabase handles this automatically
- Monitor via Supabase dashboard

**Index Optimization:**
- Check slow queries via Supabase dashboard
- Add indexes if needed (create new migration)

---

## Emergency Contacts

- **Hosting:** Vercel support (if using Vercel)
- **Database:** Supabase support
- **Billing:** Stripe support
- **Security Issues:** Create GitHub issue with "security" label

---

**Note:** This runbook is a living document. Update it as you learn from incidents and improve processes.
