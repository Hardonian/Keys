# Reality Environment Check

## Purpose
This document ensures the KEYS application is configured correctly for live demos and production use.

## Pre-Demo Checklist

### Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` - Points to correct backend (preview/production)
- [ ] `NEXT_PUBLIC_SITE_URL` - Correct site URL for preview/production
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] Backend has all required environment variables set

### Stripe Configuration
- [ ] Stripe is in **test mode** for demos (unless explicitly demoing live payments)
- [ ] Test card numbers available: `4242 4242 4242 4242`
- [ ] Webhook endpoint configured for preview/production
- [ ] Webhook signing secret set in backend

### Demo-Safe Data
- [ ] At least 3-5 Keys available in marketplace
- [ ] Mix of key types (jupyter, node, runbook)
- [ ] At least one Key has preview available
- [ ] Test user account exists with sample entitlements
- [ ] Test user account has no sensitive data

### No Dev-Only Flags
- [ ] No `NODE_ENV=development` flags leaking to UI
- [ ] No debug/console.log statements visible
- [ ] No "dev mode" banners or indicators
- [ ] Error messages don't expose stack traces

### Performance
- [ ] Images optimized and loading quickly
- [ ] API responses < 500ms for key endpoints
- [ ] No obvious lag in navigation
- [ ] Preview iframes load within 2 seconds

### Security
- [ ] No hardcoded credentials in frontend
- [ ] API endpoints properly authenticated
- [ ] CORS configured correctly
- [ ] No sensitive data in client-side code

## Verification Commands

```bash
# Check environment variables are set
echo $NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_SITE_URL

# Verify backend is running
curl $NEXT_PUBLIC_API_URL/health

# Test Stripe webhook (if configured)
# Use Stripe CLI: stripe listen --forward-to localhost:3001/webhooks/stripe
```

## Demo-Specific Notes

### Test Mode Indicators
- Stripe checkout will show "TEST MODE" banner (expected for demos)
- This is acceptable and should be mentioned: "We're in test mode for this demo"

### Preview URLs
- Preview URLs should work without authentication (if preview_public=true)
- Preview URLs should load quickly (< 2 seconds)

### Purchase Flow
- After Stripe checkout, user should be redirected back with `?purchased=true`
- Entitlement should appear immediately (no manual refresh needed)
- Download button should become available immediately

## Common Issues

### Issue: API returns 500
- Check backend logs
- Verify database connection
- Check environment variables

### Issue: Stripe checkout fails
- Verify Stripe keys are set
- Check webhook endpoint is accessible
- Verify return URLs are correct

### Issue: Entitlement doesn't appear after purchase
- Check webhook was received
- Verify webhook processing succeeded
- Check browser console for errors
- May need to refresh (but should be automatic)

### Issue: Preview doesn't load
- Check preview_public flag
- Verify preview URL is accessible
- Check CORS if loading from different domain

## Post-Demo Reset

After a demo, consider:
- [ ] Clearing test purchases (if needed)
- [ ] Resetting demo account state
- [ ] Verifying no test data leaked to production
