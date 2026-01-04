# KEYS Revenue Engine — Webhook Flow

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Production — Webhook event handling documentation  
**Purpose**: Document Stripe webhook processing, idempotency, and event handling

---

## Overview

KEYS processes Stripe webhooks to:
- Grant entitlements on successful payment
- Revoke entitlements on cancellation/refund
- Update subscription status
- Handle payment failures

**Rule**: Webhooks are the source of truth for payment events. Never trust client-side payment claims.

---

## Webhook Endpoint

**URL**: `POST /billing/webhook`

**Authentication**: Stripe signature verification

**Middleware**: `express.raw({ type: 'application/json' })` (required for signature verification)

---

## Event Allowlist

Only these events are processed:

- `checkout.session.completed` — Payment successful, grant entitlement
- `invoice.paid` — Subscription invoice paid
- `invoice.payment_failed` — Payment failed, handle grace period
- `customer.subscription.updated` — Subscription changed (upgrade/downgrade)
- `customer.subscription.deleted` — Subscription canceled
- `charge.refunded` — Refund issued, revoke entitlement

**All other events**: Logged but not processed.

---

## Event Processing

### 1. checkout.session.completed

**When**: Customer completes checkout

**Processing**:
1. Extract `userId` from `client_reference_id` or `metadata.userId`
2. Check `metadata.purchaseType`:
   - `key` → Grant individual KEY entitlement
   - `bundle` → Grant bundle entitlements (all KEYS in bundle)
   - `subscription` → Activate subscription, grant catalog access
3. Create entitlement record(s) in database
4. Track analytics event

**Idempotency**: Check if entitlement already exists (upsert logic)

**Example**:
```typescript
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.client_reference_id || session.metadata?.userId;
  const purchaseType = session.metadata?.purchaseType;
  
  if (purchaseType === 'key') {
    const keyId = session.metadata?.keyId;
    await grantEntitlement(tenantId, tenantType, keyId, 'stripe');
  } else if (purchaseType === 'bundle') {
    const bundleId = session.metadata?.bundleId;
    // Grant entitlements for all keys in bundle
    await grantBundleEntitlements(tenantId, tenantType, bundleId);
  } else if (purchaseType === 'subscription') {
    await activateSubscription(userId, session.customer as string);
  }
  break;
}
```

---

### 2. invoice.paid

**When**: Subscription invoice successfully paid

**Processing**:
1. Find subscription from invoice
2. Update subscription status to `active`
3. Extend entitlement end dates (if time-bound)
4. Track analytics event

**Idempotency**: Check invoice ID to prevent duplicate processing

**Example**:
```typescript
case 'invoice.paid': {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.subscription as string;
  
  // Update subscription status
  await updateSubscriptionStatus(subscriptionId, 'active');
  
  // Extend entitlements if needed
  await extendSubscriptionEntitlements(subscriptionId);
  break;
}
```

---

### 3. invoice.payment_failed

**When**: Subscription payment fails

**Processing**:
1. Find subscription from invoice
2. Check payment retry count:
   - First failure → Mark subscription `past_due`, start grace period
   - After grace period → Revoke entitlements, mark subscription `inactive`
3. Send notification to user (optional)
4. Track analytics event

**Grace Period**: 7 days from first failure

**Example**:
```typescript
case 'invoice.payment_failed': {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.subscription as string;
  
  // Check if first failure or after grace period
  const daysSinceFailure = calculateDaysSinceFailure(invoice);
  
  if (daysSinceFailure <= 7) {
    // Grace period: Keep access, mark past_due
    await updateSubscriptionStatus(subscriptionId, 'past_due');
  } else {
    // After grace period: Revoke access
    await revokeSubscriptionEntitlements(subscriptionId);
    await updateSubscriptionStatus(subscriptionId, 'inactive');
  }
  break;
}
```

---

### 4. customer.subscription.updated

**When**: Subscription changed (upgrade, downgrade, plan change)

**Processing**:
1. Extract subscription status
2. Update subscription status in database
3. If upgraded → Grant new entitlements
4. If downgraded → Revoke entitlements not in new plan
5. Track analytics event

**Example**:
```typescript
case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription;
  const isActive = subscription.status === 'active';
  
  // Update subscription status
  await updateSubscriptionStatus(subscription.id, isActive ? 'active' : 'inactive');
  
  // Handle entitlement changes based on plan
  if (isActive) {
    await syncSubscriptionEntitlements(subscription);
  } else {
    await revokeSubscriptionEntitlements(subscription.id);
  }
  break;
}
```

---

### 5. customer.subscription.deleted

**When**: Subscription canceled

**Processing**:
1. Mark subscription `canceled` in database
2. Revoke all subscription-derived entitlements
3. Set entitlement end dates to subscription end date
4. Track analytics event

**Note**: Access continues until end of billing period (Stripe behavior)

**Example**:
```typescript
case 'customer.subscription.deleted': {
  const subscription = event.data.object as Stripe.Subscription;
  
  // Mark subscription canceled
  await updateSubscriptionStatus(subscription.id, 'canceled');
  
  // Revoke entitlements at end of period
  const periodEnd = new Date(subscription.current_period_end * 1000);
  await revokeSubscriptionEntitlements(subscription.id, periodEnd);
  break;
}
```

---

### 6. charge.refunded

**When**: Payment refunded (full or partial)

**Processing**:
1. Find checkout session or subscription from charge
2. Determine refund type:
   - Full refund → Revoke all entitlements
   - Partial refund → Revoke proportional entitlements (if applicable)
3. Mark entitlements as `refunded`
4. Track analytics event

**Example**:
```typescript
case 'charge.refunded': {
  const charge = event.data.object as Stripe.Charge;
  
  // Find related entitlements
  const entitlements = await findEntitlementsByCharge(charge.id);
  
  // Revoke entitlements
  for (const entitlement of entitlements) {
    await revokeEntitlement(
      entitlement.tenant_id,
      entitlement.key_id,
      entitlement.tenant_type
    );
    
    // Mark as refunded
    await markEntitlementRefunded(entitlement.id);
  }
  break;
}
```

---

## Idempotency

### Event ID Tracking

All processed events are tracked:

```sql
CREATE TABLE stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'duplicate'))
);
```

### Duplicate Detection

Before processing:

```typescript
const { data: existing } = await supabase
  .from('stripe_webhook_events')
  .select('id')
  .eq('stripe_event_id', event.id)
  .single();

if (existing) {
  return res.json({ received: true, duplicate: true });
}
```

### Atomic Processing

Use database transactions:

```typescript
// Start transaction
const { data, error } = await supabase.rpc('process_webhook_event', {
  event_id: event.id,
  event_type: event.type,
  event_data: event.data.object,
});

if (error) {
  // Rollback, return 500 for retry
  return res.status(500).json({ error: 'Processing failed' });
}
```

---

## Error Handling

### Signature Verification Failure

**Response**: `400 Bad Request`

```typescript
try {
  event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
} catch (err) {
  console.error('Webhook signature verification failed:', err);
  return res.status(400).json({ error: 'Invalid signature' });
}
```

### Processing Error

**Response**: `500 Internal Server Error` (Stripe will retry)

```typescript
try {
  await processEvent(event);
} catch (error) {
  console.error('Webhook processing error:', error);
  // Log to error tracking service
  return res.status(500).json({ error: 'Processing failed' });
}
```

### Duplicate Event

**Response**: `200 OK` (already processed)

```typescript
if (isDuplicate(event.id)) {
  return res.json({ received: true, duplicate: true });
}
```

---

## Webhook Replay Safety

### Idempotent Operations

All operations are idempotent:

- **Entitlement grants**: Upsert logic (create or update)
- **Entitlement revocations**: Safe to call multiple times
- **Status updates**: Idempotent (same status = no-op)

### Replay Scenarios

**Stripe replays webhook**:
1. Event ID already processed → Skip, return 200
2. Event ID not processed → Process normally

**Manual replay** (Stripe Dashboard):
1. Same event ID → Detected as duplicate
2. Different event ID → Process as new event

---

## Testing

### Stripe CLI

Test webhooks locally:

```bash
stripe listen --forward-to localhost:3000/billing/webhook
stripe trigger checkout.session.completed
```

### Test Events

Use Stripe test mode:
- Test cards: `4242 4242 4242 4242`
- Test webhook events: Stripe Dashboard → Developers → Webhooks → Send test webhook

---

## Monitoring

### Key Metrics

- Webhook delivery rate
- Webhook processing time
- Failed webhook events
- Duplicate events detected

### Alerts

- Webhook failure rate > 5%
- Webhook processing time > 5s
- Duplicate event rate > 1%

---

## Version History

- **1.0.0** (2024-12-30): Initial webhook flow documentation
