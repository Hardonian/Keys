# Quick Start: Stripe Subscription Management

Get started with Stripe subscription management in 5 minutes.

---

## Step 1: Install

```bash
npm install stripe
```

---

## Step 2: Set Environment Variables

```bash
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_...  # Get from Stripe Dashboard > Webhooks
```

---

## Step 3: Create Your First Subscription

```typescript
import { createCustomer, createPlan, createSubscription } from './stripe-subscription-management';

// 1. Create a customer
const customer = await createCustomer({
  email: 'customer@example.com',
  name: 'John Doe',
});

// 2. Create a plan
const plan = await createPlan({
  amount: 999, // $9.99
  currency: 'usd',
  interval: 'month',
  productName: 'Basic Plan',
});

// 3. Create a subscription
const subscription = await createSubscription({
  customerId: customer.id,
  priceId: plan.id,
});
```

---

## Step 4: Handle Webhooks (Optional)

```typescript
import express from 'express';
import { webhookMiddleware } from './stripe-subscription-management';

const app = express();

app.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  webhookMiddleware({
    'customer.subscription.created': async (event) => {
      // Your logic here
      console.log('New subscription:', event.data.object);
    },
  })
);
```

---

## Next Steps

- Read the full [README.md](./README.md) for detailed API documentation
- Check [CHANGELOG.md](./CHANGELOG.md) for version history
- Visit [Stripe Docs](https://stripe.com/docs) for Stripe-specific details

---

**That's it!** You're ready to manage subscriptions with Stripe.
