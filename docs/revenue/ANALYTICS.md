# KEYS Revenue Engine — Analytics

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Production — Revenue tracking documentation  
**Purpose**: Document revenue analytics and tracking

---

## Overview

KEYS tracks revenue events server-side only. No spoofable client events.

**Principle**: Server-side events only. Client UI reflects data but never defines it.

---

## Tracked Events

### 1. Checkout Started

**When**: User clicks "Purchase" and checkout session created

**Tracked**:
- `event_type`: `'checkout_started'`
- `key_id` or `bundle_id`: What user is purchasing
- `user_id`: User ID
- `tenant_id`, `tenant_type`: Tenant context
- `stripe_session_id`: Stripe checkout session ID

**Purpose**: Measure conversion funnel (checkout started → completed)

---

### 2. Checkout Completed

**When**: Webhook `checkout.session.completed` fires

**Tracked**:
- `event_type`: `'purchase'` or `'bundle_upgrade'` or `'subscription_start'`
- `key_id` or `bundle_id`: What was purchased
- `user_id`: User ID
- `tenant_id`, `tenant_type`: Tenant context
- `stripe_session_id`: Stripe checkout session ID
- `amount`: Purchase amount (cents)

**Purpose**: Measure conversion rate and revenue

---

### 3. Conversion by KEY

**When**: Purchase completed

**Tracked**:
- `key_id`: KEY purchased
- `purchase_count`: Number of purchases
- `revenue`: Total revenue from KEY
- `conversion_rate`: Checkout started → Completed

**Purpose**: Identify best-selling KEYS

---

### 4. Bundle Attach Rate

**When**: Bundle purchase completed

**Tracked**:
- `bundle_id`: Bundle purchased
- `purchase_count`: Number of bundle purchases
- `revenue`: Total revenue from bundles
- `attach_rate`: Bundle purchases / Total purchases

**Purpose**: Measure bundle adoption

---

### 5. Upgrade Rate

**When**: Upgrade purchase completed

**Tracked**:
- `upgrade_type`: `'key_to_bundle'` or `'bundle_to_subscription'`
- `from_sku`: Original SKU
- `to_sku`: Upgraded SKU
- `credits_applied`: Credits applied
- `final_price`: Final upgrade price

**Purpose**: Measure upgrade adoption

---

### 6. Churn Events

**When**: Subscription canceled or payment failed

**Tracked**:
- `event_type`: `'subscription_canceled'` or `'payment_failed'`
- `user_id`: User ID
- `subscription_id`: Stripe subscription ID
- `reason`: Cancellation reason (if available)
- `revenue_lost`: Monthly recurring revenue lost

**Purpose**: Measure churn and identify at-risk customers

---

## Analytics Storage

### Database Table

```sql
CREATE TABLE marketplace_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'checkout_started',
    'purchase',
    'bundle_upgrade',
    'subscription_start',
    'subscription_canceled',
    'payment_failed',
    'upgrade'
  )),
  key_id UUID REFERENCES marketplace_keys(id) ON DELETE SET NULL,
  bundle_id UUID REFERENCES marketplace_bundles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID,
  tenant_type TEXT CHECK (tenant_type IN ('org', 'user')),
  stripe_session_id TEXT,
  amount INT, -- Amount in cents
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Analytics Implementation

### Checkout Started

```typescript
// When checkout session created
await supabase.from('marketplace_analytics').insert({
  event_type: 'checkout_started',
  key_id: keyId || null,
  bundle_id: bundleId || null,
  user_id: userId,
  tenant_id: tenant.tenantId,
  tenant_type: tenant.tenantType,
  stripe_session_id: session.id,
});
```

### Purchase Completed

```typescript
// In webhook handler: checkout.session.completed
await supabase.from('marketplace_analytics').insert({
  event_type: purchaseType === 'key' ? 'purchase' : 
               purchaseType === 'bundle' ? 'bundle_upgrade' : 
               'subscription_start',
  key_id: keyId || null,
  bundle_id: bundleId || null,
  user_id: userId,
  tenant_id: tenant.tenantId,
  tenant_type: tenant.tenantType,
  stripe_session_id: session.id,
  amount: session.amount_total || 0,
});
```

---

## Key Metrics

### Revenue Metrics

1. **Total Revenue**: Sum of all `amount` values
2. **Monthly Recurring Revenue (MRR)**: Sum of subscription revenue
3. **Average Order Value (AOV)**: Total revenue / Number of purchases
4. **Revenue per User**: Total revenue / Number of paying users

### Conversion Metrics

1. **Checkout Conversion Rate**: Completed / Started
2. **KEY Conversion Rate**: KEY purchases / KEY views
3. **Bundle Attach Rate**: Bundle purchases / Total purchases
4. **Upgrade Rate**: Upgrades / Eligible users

### Churn Metrics

1. **Churn Rate**: Canceled subscriptions / Total subscriptions
2. **Revenue Churn**: Lost MRR / Total MRR
3. **Payment Failure Rate**: Failed payments / Total payments

---

## Analytics Queries

### Total Revenue

```sql
SELECT SUM(amount) as total_revenue
FROM marketplace_analytics
WHERE event_type IN ('purchase', 'bundle_upgrade', 'subscription_start')
  AND created_at >= NOW() - INTERVAL '30 days';
```

### Conversion Rate

```sql
SELECT 
  COUNT(*) FILTER (WHERE event_type = 'checkout_started') as started,
  COUNT(*) FILTER (WHERE event_type = 'purchase') as completed,
  COUNT(*) FILTER (WHERE event_type = 'purchase')::float / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'checkout_started'), 0) as conversion_rate
FROM marketplace_analytics
WHERE created_at >= NOW() - INTERVAL '30 days';
```

### Top Selling KEYS

```sql
SELECT 
  k.slug,
  k.title,
  COUNT(*) as purchase_count,
  SUM(a.amount) as revenue
FROM marketplace_analytics a
JOIN marketplace_keys k ON a.key_id = k.id
WHERE a.event_type = 'purchase'
  AND a.created_at >= NOW() - INTERVAL '30 days'
GROUP BY k.id, k.slug, k.title
ORDER BY revenue DESC
LIMIT 10;
```

---

## Privacy Considerations

### No PII Tracking

Analytics track:
- User IDs (for aggregation)
- Tenant IDs (for org-level analytics)
- Event types and amounts

**Not tracked**:
- Email addresses
- Names
- IP addresses (hashed only)
- User agents (truncated only)

### Data Retention

- **Raw events**: Retained for 2 years
- **Aggregated metrics**: Retained indefinitely
- **User-level data**: Deleted on user deletion

---

## Reporting

### Daily Reports

- Revenue by day
- Purchases by day
- Conversion rate by day
- Churn events by day

### Weekly Reports

- Revenue trends
- Top selling KEYS
- Bundle adoption
- Upgrade rates

### Monthly Reports

- MRR growth
- Churn rate
- Customer lifetime value
- Revenue by KEY category

---

## Version History

- **1.0.0** (2024-12-30): Initial analytics documentation
