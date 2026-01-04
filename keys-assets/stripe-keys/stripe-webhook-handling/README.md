# Stripe Keys: Webhook Handling

**Version**: 1.0.0  
**Tool**: Stripe  
**Maturity**: Operator  
**Outcome**: Automation

---

## What This Key Unlocks

Advanced webhook handling for Stripe. This key unlocks:

- **Signature Verification**: Secure webhook signature verification
- **Event Processing**: Type-safe event handling
- **Idempotency**: Prevent duplicate event processing
- **Retry Logic**: Automatic retry with exponential backoff
- **Error Handling**: Comprehensive error handling and logging

---

## Installation

```bash
npm install stripe
```

---

## Usage

```typescript
import { createWebhookHandler } from './stripe-webhook-handling';
import express from 'express';

const app = express();

const handler = createWebhookHandler({
  handlers: {
    'payment_intent.succeeded': async (event) => {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // Handle successful payment
    },
    'customer.subscription.created': async (event) => {
      const subscription = event.data.object as Stripe.Subscription;
      // Handle new subscription
    },
  },
  allowedEvents: [
    'payment_intent.succeeded',
    'customer.subscription.created',
  ],
  maxRetries: 3,
});

app.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const result = await handler(req.body, signature!);
    res.json(result);
  }
);
```

---

## Features

- ✅ Signature verification
- ✅ Idempotency (memory or Redis)
- ✅ Retry logic with exponential backoff
- ✅ Event filtering
- ✅ Error handling

---

## License

MIT
