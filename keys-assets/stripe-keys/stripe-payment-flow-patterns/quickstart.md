# Quick Start: Stripe Payment Flow Patterns

Get one-time payments working in 5 minutes.

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

## Step 3: Create Payment Intent

```typescript
import { createPaymentIntent } from './stripe-payment-flow-patterns';

const { clientSecret } = await createPaymentIntent({
  amount: 999, // $9.99
  currency: 'usd',
  description: 'Product purchase',
});
```

---

## Step 4: Frontend Integration

```typescript
// In your frontend (React example)
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...');

const { error } = await stripe.confirmPayment({
  clientSecret: clientSecret,
  confirmParams: {
    return_url: 'https://yoursite.com/success',
  },
});
```

---

## Step 5: Handle Webhooks (Optional)

```typescript
import express from 'express';
import { webhookMiddleware } from './stripe-payment-flow-patterns';

const app = express();

app.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  webhookMiddleware({
    onPaymentSucceeded: async (paymentIntent) => {
      // Your success logic
      console.log('Payment succeeded:', paymentIntent.id);
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

**That's it!** You're ready to accept one-time payments.
