# Pricing & Entitlements

**Last Updated:** 2024-12-30

## Pricing Tiers

### Free Tier
- **Price:** $0/month
- **Features:**
  - Basic AI companion chat
  - Limited prompt generations (TBD: exact limit)
  - Access to public templates
  - Community support

### Pro Tier
- **Price:** TBD (e.g., $29/month)
- **Features:**
  - Everything in Free
  - Unlimited prompt generations
  - Custom templates
  - Template sharing
  - Priority support
  - Advanced analytics

### Enterprise Tier
- **Price:** Custom pricing
- **Features:**
  - Everything in Pro
  - Multi-user organizations
  - SSO (planned, not yet implemented)
  - Custom integrations
  - Dedicated support
  - SLA (planned, not yet implemented)

## Enforcement Points

### Where Limits Are Enforced

1. **Usage Metering**
   - **Location:** `backend/src/services/usageMetering.ts`
   - **Checks:** Before agent orchestration, template creation
   - **Response:** Returns `{ allowed: false, reason: 'limit_exceeded' }`

2. **Entitlement Middleware**
   - **Location:** `backend/src/middleware/entitlements.ts`
   - **Checks:** Subscription status, premium features flag
   - **Response:** HTTP 403 with upgrade URL

3. **Feature Gates (Frontend)**
   - **Location:** `frontend/src/components/Upsell/FeatureGate.tsx`
   - **Checks:** User subscription tier
   - **Response:** Shows upgrade prompt

4. **Stripe Integration**
   - **Location:** `backend/src/routes/billing.ts`
   - **Webhook:** Updates `user_profiles.subscription_status`
   - **Events:** `checkout.session.completed`, `customer.subscription.updated`

## Database Schema

### Subscription Status Values
- `free` — Default for new users
- `active` — Paid subscription active
- `inactive` — Subscription canceled or expired
- `canceled` — Explicitly canceled
- `past_due` — Payment failed

### Subscription Tier Values
- `free` — Free tier
- `pro` — Pro tier
- `enterprise` — Enterprise tier

### Usage Metrics
Stored in `usage_metrics` table:
- `metric_type`: `runs`, `tokens`, `templates`, `exports`
- `metric_value`: Count for the period
- `period_start`, `period_end`: Time window

## Current Limitations

### What's Not Yet Implemented
- ⚠️ **Exact usage limits** — Limits exist in code but not documented
- ⚠️ **Pricing page** — No `/pricing` route yet
- ⚠️ **Usage dashboard** — Users can't see their current usage
- ⚠️ **Soft limits** — All limits are hard (blocking)

### What's Implemented
- ✅ Subscription creation via Stripe Checkout
- ✅ Subscription status updates via webhooks
- ✅ Entitlement checks in middleware
- ✅ Feature gates in UI
- ✅ Usage metering service

## Future Enhancements

1. **Usage Dashboard**
   - Show current usage vs. limits
   - Visual progress bars
   - Upgrade prompts when near limit

2. **Soft Limits**
   - Allow over-limit usage with warnings
   - Grace period for upgrades

3. **Trial Periods**
   - 14-day free trial for Pro tier
   - Automatic conversion to paid

4. **Annual Billing**
   - Discount for annual subscriptions
   - Prorated upgrades/downgrades

---

**Note:** Pricing tiers and limits are subject to change. This document reflects current implementation, not future plans.
