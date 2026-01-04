# KEYS Revenue Engine — Stripe Setup

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Production — Stripe configuration guide  
**Purpose**: Document Stripe products, prices, checkout configuration

---

## Overview

KEYS uses Stripe for payment processing. This document describes:
- Stripe product/price creation
- Checkout session configuration
- Customer management
- Test vs live mode handling

---

## Stripe Account Setup

### Environment Variables

```bash
# Test mode
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Live mode (production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Mode Detection

Stripe automatically detects mode from secret key:
- `sk_test_*` → Test mode
- `sk_live_*` → Live mode

**Rule**: Never hardcode price IDs client-side. Always fetch from server.

---

## Product Creation

### Individual KEYS

Each KEY gets a Stripe product:

```typescript
const product = await stripe.products.create({
  name: key.title,
  description: key.description || undefined,
  metadata: {
    key_id: key.id,
    key_slug: key.slug,
    key_type: 'marketplace_key',
  },
});
```

### Bundles

Each bundle gets a Stripe product:

```typescript
const product = await stripe.products.create({
  name: bundle.title,
  description: bundle.description || undefined,
  metadata: {
    bundle_id: bundle.id,
    bundle_slug: bundle.slug,
    bundle_type: 'marketplace_bundle',
  },
});
```

### Subscriptions

Catalog access subscription:

```typescript
const product = await stripe.products.create({
  name: 'KEYS Catalog Access',
  description: 'Access to all current and future KEYS',
  metadata: {
    subscription_type: 'catalog_access',
  },
});
```

---

## Price Creation

### One-Time Payments (KEYS & Bundles)

```typescript
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: key.price_cents, // Price in cents
  currency: 'usd',
  metadata: {
    key_id: key.id,
    key_slug: key.slug,
  },
});
```

### Recurring Payments (Subscriptions)

```typescript
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 99900, // $999/year in cents
  currency: 'usd',
  recurring: {
    interval: 'year',
  },
  metadata: {
    subscription_type: 'catalog_access',
  },
});
```

---

## Checkout Session Creation

### Individual KEY Purchase

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'payment', // One-time payment
  payment_method_types: ['card'],
  line_items: [
    {
      price: key.stripe_price_id,
      quantity: 1,
    },
  ],
  success_url: successUrl,
  cancel_url: cancelUrl,
  client_reference_id: userId,
  metadata: {
    userId,
    keyId: key.id,
    keySlug: key.slug,
    purchaseType: 'key',
  },
});
```

### Bundle Purchase

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card'],
  line_items: [
    {
      price: bundle.stripe_price_id,
      quantity: 1,
    },
  ],
  success_url: successUrl,
  cancel_url: cancelUrl,
  client_reference_id: userId,
  metadata: {
    userId,
    bundleId: bundle.id,
    bundleSlug: bundle.slug,
    purchaseType: 'bundle',
  },
});
```

### Subscription Purchase

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [
    {
      price: subscriptionPriceId,
      quantity: 1,
    },
  ],
  success_url: successUrl,
  cancel_url: cancelUrl,
  client_reference_id: userId,
  metadata: {
    userId,
    purchaseType: 'subscription',
    subscriptionType: 'catalog_access',
  },
});
```

---

## Customer Management

### Customer Creation

Customers are created on-demand:

```typescript
// Find or create customer
let customerId = profile?.stripe_customer_id;

if (!customerId) {
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId },
  });
  customerId = customer.id;
  
  // Store in database
  await supabase
    .from('user_profiles')
    .update({ stripe_customer_id: customerId })
    .eq('user_id', userId);
}
```

### Customer Portal

Billing portal for subscription management:

```typescript
const session = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: returnUrl,
});
```

---

## SKU Mapping

### Internal SKU → Stripe Price ID

Mapping stored in database:

- `marketplace_keys.stripe_price_id` → Stripe price ID
- `marketplace_bundles.stripe_price_id` → Stripe price ID
- Subscription price ID → Environment variable or database

### Reverse Lookup

From Stripe price ID → Internal SKU:

1. Query Stripe API for price metadata
2. Extract `key_id` or `bundle_id` from metadata
3. Lookup in database

---

## Idempotency

### Checkout Session Creation

Use idempotency keys:

```typescript
const session = await stripe.checkout.sessions.create(
  {
    // ... session config
  },
  {
    idempotencyKey: `checkout-${userId}-${keyId}-${Date.now()}`,
  }
);
```

### Webhook Processing

Use Stripe event ID for idempotency:

```typescript
// Check if event already processed
const { data: existing } = await supabase
  .from('stripe_webhook_events')
  .select('id')
  .eq('stripe_event_id', event.id)
  .single();

if (existing) {
  return res.json({ received: true, duplicate: true });
}

// Process event
// ...

// Record event
await supabase.from('stripe_webhook_events').insert({
  stripe_event_id: event.id,
  event_type: event.type,
  processed_at: new Date().toISOString(),
});
```

---

## Test Mode vs Live Mode

### Configuration

- **Test mode**: Use test keys (`sk_test_*`, `whsec_test_*`)
- **Live mode**: Use live keys (`sk_live_*`, `whsec_live_*`)

### Price IDs

- Test mode prices: `price_test_*`
- Live mode prices: `price_*`

**Rule**: Never mix test and live price IDs. Always use matching mode.

### Webhook Endpoints

- Test mode: `https://api.keys.example.com/billing/webhook` (test endpoint)
- Live mode: `https://api.keys.example.com/billing/webhook` (live endpoint)

Stripe automatically routes based on event source (test vs live).

---

## Error Handling

### Checkout Failures

- Payment declined → User sees Stripe error page
- Network error → Retry checkout session creation
- Invalid price ID → Return 400 error before checkout

### Webhook Failures

- Signature verification fails → Return 400, log error
- Processing error → Return 500, Stripe will retry
- Duplicate event → Return 200, skip processing

---

## Security

### Webhook Signature Verification

```typescript
const sig = req.headers['stripe-signature'] as string;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

try {
  event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
} catch (err) {
  return res.status(400).json({ error: 'Invalid signature' });
}
```

### Raw Body Requirement

Express must use `express.raw()` middleware for webhook endpoint:

```typescript
app.post('/billing/webhook', express.raw({ type: 'application/json' }), webhookHandler);
```

---

## Monitoring

### Key Metrics

- Checkout sessions created
- Checkout sessions completed
- Payment failures
- Webhook delivery failures
- Refund rate

### Stripe Dashboard

Monitor in Stripe Dashboard:
- Payments → Overview
- Developers → Webhooks → Delivery logs
- Customers → Customer list

---

## Version History

- **1.0.0** (2024-12-30): Initial Stripe setup documentation
