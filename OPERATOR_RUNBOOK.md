# Operator Runbook
**For: Cursor Venture Companion**

This document provides step-by-step procedures for common operational tasks and troubleshooting.

---

## Table of Contents

1. [Pre-Launch Verification](#pre-launch-verification)
2. [Monitoring & Health Checks](#monitoring--health-checks)
3. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
4. [Database Operations](#database-operations)
5. [Billing & Stripe](#billing--stripe)
6. [User Management](#user-management)
7. [Emergency Procedures](#emergency-procedures)

---

## Pre-Launch Verification

### Checklist

Run this before launching to production:

```bash
# 1. Verify environment variables
./scripts/verify-env.sh

# 2. Test database connection
npm run test:db-connection

# 3. Verify migrations are applied
# Check Supabase dashboard → Database → Migrations

# 4. Test authentication flow
# - Sign up new user
# - Sign in
# - Access protected routes

# 5. Test billing webhook
# - Create test checkout session
# - Verify webhook receives event
# - Check subscription_status updates

# 6. Verify RLS policies
# - Test user can only access own data
# - Test admin can access all data
```

---

## Monitoring & Health Checks

### Health Check Endpoint

```bash
curl https://your-backend.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

### Key Metrics to Monitor

1. **Error Rates**
   - Check Sentry dashboard
   - Alert threshold: > 5% error rate
   - Action: Investigate error patterns

2. **Authentication Failures**
   - Check Supabase Auth logs
   - Alert threshold: > 10% failure rate
   - Action: Check Supabase status, verify credentials

3. **API Response Times**
   - Monitor p95 latency
   - Alert threshold: > 2s p95
   - Action: Check database queries, external API calls

4. **Usage Metrics**
   - Monitor `usage_metrics` table
   - Check for users hitting limits
   - Action: Review tier limits, consider upgrades

5. **Billing Webhook Failures**
   - Check Stripe dashboard → Webhooks
   - Alert threshold: Any failures
   - Action: Verify webhook URL, check logs

### Sentry Dashboard

1. Go to Sentry dashboard
2. Check "Issues" for new errors
3. Review "Performance" for slow queries
4. Set up alerts for:
   - New error types
   - Error rate spikes
   - Performance degradation

---

## Common Issues & Troubleshooting

### Issue: Users Can't Sign In

**Symptoms:**
- 401 errors on auth endpoints
- Users redirected to signin repeatedly

**Diagnosis:**
```bash
# Check Supabase Auth status
curl https://your-project.supabase.co/auth/v1/health

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Solutions:**
1. Verify Supabase project is active
2. Check environment variables are set correctly
3. Verify CORS origins include your frontend URL
4. Check browser console for specific error messages

---

### Issue: Database Connection Errors

**Symptoms:**
- 500 errors on database queries
- "Connection refused" errors

**Diagnosis:**
```bash
# Check Supabase connection
curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  https://your-project.supabase.co/rest/v1/

# Check database status in Supabase dashboard
```

**Solutions:**
1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
2. Check Supabase project status
3. Verify RLS policies aren't blocking queries
4. Check for connection pool exhaustion

---

### Issue: Billing Webhook Not Working

**Symptoms:**
- Subscription status not updating
- Users can't access premium features

**Diagnosis:**
```bash
# Check Stripe webhook logs
# Go to Stripe Dashboard → Developers → Webhooks

# Check backend logs for webhook events
grep "webhook" /var/log/backend.log
```

**Solutions:**
1. Verify webhook URL is correct in Stripe dashboard
2. Check `STRIPE_WEBHOOK_SECRET` matches Stripe
3. Verify webhook endpoint is accessible (not blocked by firewall)
4. Check webhook signature verification is working
5. Manually trigger webhook test event in Stripe

---

### Issue: Rate Limiting Too Aggressive

**Symptoms:**
- Legitimate users getting 429 errors
- High bounce rate

**Diagnosis:**
```bash
# Check rate limit configuration
echo $RATE_LIMIT_WINDOW_MS
echo $RATE_LIMIT_MAX_REQUESTS

# Review rate limit logs
grep "rate limit" /var/log/backend.log
```

**Solutions:**
1. Adjust `RATE_LIMIT_MAX_REQUESTS` in environment
2. Increase `RATE_LIMIT_WINDOW_MS` for longer windows
3. Consider user-based rate limiting instead of IP-based
4. Review usage patterns to set appropriate limits

---

### Issue: Usage Limits Not Enforcing

**Symptoms:**
- Free users exceeding limits
- Premium features accessible without subscription

**Diagnosis:**
```sql
-- Check user subscription status
SELECT user_id, subscription_status, subscription_tier 
FROM user_profiles 
WHERE subscription_status != 'active';

-- Check usage metrics
SELECT user_id, metric_type, metric_value, period_start
FROM usage_metrics
ORDER BY metric_value DESC
LIMIT 10;
```

**Solutions:**
1. Verify `checkLimit()` is called in routes
2. Check subscription_status is being updated by webhooks
3. Verify tier limits in `usageMetering.ts`
4. Manually update subscription_status if needed

---

## Database Operations

### Run Migrations

```bash
# Apply migrations via Supabase dashboard
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy migration file content
# 3. Run migration
# 4. Verify no errors

# Or use Supabase CLI (if configured)
supabase db push
```

### Check RLS Policies

```sql
-- List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Reset User Usage

```sql
-- Reset usage for a specific user
DELETE FROM usage_metrics 
WHERE user_id = 'user-uuid-here';

-- Reset usage for all free tier users
DELETE FROM usage_metrics um
USING user_profiles up
WHERE um.user_id = up.user_id::text
AND up.subscription_tier = 'free';
```

### Find Orphaned Data

```sql
-- Find agent_runs without user_profiles
SELECT ar.*
FROM agent_runs ar
LEFT JOIN user_profiles up ON ar.user_id = up.user_id::text
WHERE up.user_id IS NULL;

-- Find background_events without user_profiles
SELECT be.*
FROM background_events be
LEFT JOIN user_profiles up ON be.user_id = up.user_id::text
WHERE up.user_id IS NULL;
```

---

## Billing & Stripe

### Verify Stripe Configuration

```bash
# Check Stripe keys are set
echo $STRIPE_SECRET_KEY | cut -c1-20
echo $STRIPE_WEBHOOK_SECRET | cut -c1-20

# Test Stripe connection
curl https://api.stripe.com/v1/charges \
  -u $STRIPE_SECRET_KEY:
```

### Manual Subscription Update

```sql
-- Update user subscription status
UPDATE user_profiles
SET subscription_status = 'active',
    subscription_tier = 'pro',
    stripe_customer_id = 'cus_xxxxx'
WHERE user_id = 'user-uuid-here';
```

### Check Billing Webhook Events

1. Go to Stripe Dashboard → Developers → Webhooks
2. Select your webhook endpoint
3. View "Events" tab
4. Check for failed events
5. Review event payloads

### Common Stripe Issues

**Issue: Webhook signature verification fails**
- Solution: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe
- Check webhook endpoint receives raw body (not parsed JSON)

**Issue: Customer not found**
- Solution: Verify `stripe_customer_id` is stored in `user_profiles`
- Create customer if missing: `stripe.customers.create()`

---

## User Management

### Create Admin User

```sql
-- First, get user UUID from Supabase Auth
-- Then update user_profiles
UPDATE user_profiles
SET premium_features = jsonb_set(
  premium_features,
  '{admin}',
  'true'
)
WHERE user_id = 'user-uuid-here';

-- Or set role in auth.users metadata (if configured)
```

### Reset User Password

```bash
# Use Supabase Dashboard → Authentication → Users
# Or Supabase CLI
supabase auth reset-password user@example.com
```

### Delete User Data

```sql
-- Delete user and all associated data (cascading)
-- This will delete:
-- - user_profiles
-- - agent_runs
-- - background_events
-- - vibe_configs
-- - user_template_customizations
-- - etc.

DELETE FROM auth.users WHERE id = 'user-uuid-here';
```

---

## Emergency Procedures

### Rollback Deployment

**Vercel:**
1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

**Database:**
- ⚠️ **Warning**: No rollback scripts exist
- Migrations are additive only
- Manual data fixes may be required

### Disable Feature

**Disable billing:**
```bash
# Remove STRIPE_SECRET_KEY from environment
# Billing routes will return 503
```

**Disable specific route:**
```typescript
// Comment out route in backend/src/index.ts
// app.use('/route-name', routeRouter);
```

### Emergency Maintenance Mode

```typescript
// Add to backend/src/index.ts
app.use((req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.status(503).json({
      error: 'Service temporarily unavailable for maintenance',
      retryAfter: 3600, // 1 hour
    });
  }
  next();
});
```

---

## Contact & Escalation

### Internal Contacts

- **Technical Lead**: [Your contact]
- **DevOps**: [Your contact]
- **Support**: [Your contact]

### External Services

- **Supabase Support**: https://supabase.com/support
- **Stripe Support**: https://support.stripe.com
- **Vercel Support**: https://vercel.com/support

### Emergency Contacts

- **On-Call Engineer**: [Phone/Email]
- **Escalation**: [Contact]

---

## Appendix

### Useful Commands

```bash
# Check backend logs
tail -f /var/log/backend.log

# Check frontend build
cd frontend && npm run build

# Run tests
cd backend && npm test
cd frontend && npm test

# Type check
cd backend && npm run type-check
cd frontend && npm run type-check
```

### Environment Variables Reference

See `.env.example` for complete list.

**Critical:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `FRONTEND_URL` (for billing redirects)

**Optional but Recommended:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SENTRY_DSN`
- `REDIS_URL`

---

*Last Updated: $(date)*
*Version: 1.0.0*
