# Stripe Keys: Subscription Management

**Version**: 1.0.0  
**Tool**: Stripe  
**Maturity**: Operator  
**Outcome**: Monetization

---

## What This Key Unlocks

Complete subscription lifecycle management for Stripe. This key unlocks:

- **Subscription Management**: Create, update, cancel subscriptions with proration support
- **Plan Management**: Create and manage subscription plans (prices)
- **Customer Management**: Create and manage customers
- **Webhook Handling**: Process Stripe webhooks with signature verification and idempotency
- **Upgrades/Downgrades**: Handle subscription changes with automatic proration

---

## Installation

1. **Install the key**:
   ```bash
   npm install stripe
   ```

2. **Set environment variables**:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...  # Optional, required for webhooks
   STRIPE_API_VERSION=2024-11-20.acacia  # Optional
   ```

3. **Import the key**:
   ```typescript
   import {
     createSubscription,
     updateSubscription,
     cancelSubscription,
     createPlan,
     createCustomer,
     handleWebhook,
   } from './stripe-subscription-management';
   ```

---

## Usage

### Creating a Subscription

```typescript
import { createSubscription } from './stripe-subscription-management';

const subscription = await createSubscription({
  customerId: 'cus_123',
  priceId: 'price_123',
  quantity: 1,
  metadata: {
    userId: 'user_123',
  },
});
```

### Updating a Subscription

```typescript
import { updateSubscription } from './stripe-subscription-management';

// Upgrade to new plan
const updated = await updateSubscription({
  subscriptionId: 'sub_123',
  priceId: 'price_456', // New plan
  prorationBehavior: 'create_prorations', // Prorate the difference
});
```

### Creating a Plan

```typescript
import { createPlan } from './stripe-subscription-management';

const plan = await createPlan({
  amount: 999, // $9.99 in cents
  currency: 'usd',
  interval: 'month',
  productName: 'Pro Plan',
  productDescription: 'Professional subscription plan',
});
```

### Handling Webhooks

```typescript
import { webhookMiddleware } from './stripe-subscription-management';
import express from 'express';

const app = express();

// Important: Use raw body for webhook signature verification
app.post('/webhooks/stripe', 
  express.raw({ type: 'application/json' }),
  webhookMiddleware({
    'customer.subscription.created': async (event) => {
      const subscription = event.data.object as Stripe.Subscription;
      // Handle subscription created
      console.log('Subscription created:', subscription.id);
    },
    'customer.subscription.updated': async (event) => {
      const subscription = event.data.object as Stripe.Subscription;
      // Handle subscription updated
      console.log('Subscription updated:', subscription.id);
    },
    'invoice.payment_succeeded': async (event) => {
      const invoice = event.data.object as Stripe.Invoice;
      // Handle successful payment
      console.log('Payment succeeded:', invoice.id);
    },
  })
);
```

---

## Key Features

### Idempotency

Webhook handlers automatically check for duplicate events using idempotency keys. Events are stored for 24 hours to prevent reprocessing.

### Signature Verification

All webhooks are verified using Stripe's signature verification to ensure authenticity.

### Proration

Automatic proration when upgrading/downgrading subscriptions. Control proration behavior with `prorationBehavior` option.

### Error Handling

All functions throw errors that can be caught and handled appropriately. Webhook signature verification failures throw descriptive errors.

---

## Removal

To remove this key:

1. **Remove imports** from your code
2. **Remove webhook endpoints** if using webhook middleware
3. **Uninstall dependencies** (if not used elsewhere):
   ```bash
   npm uninstall stripe
   ```

---

## Requirements

- Node.js 18+
- Stripe account with API keys
- `STRIPE_SECRET_KEY` environment variable

---

## License

MIT
