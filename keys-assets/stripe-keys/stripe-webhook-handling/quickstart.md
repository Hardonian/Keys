# Quick Start: Stripe Webhook Handling

Get webhooks working in 3 minutes.

---

## Step 1: Install

```bash
npm install stripe
```

---

## Step 2: Set Environment Variables

```bash
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Step 3: Create Handler

```typescript
import { createWebhookHandler } from './stripe-webhook-handling';

const handler = createWebhookHandler({
  handlers: {
    'payment_intent.succeeded': async (event) => {
      console.log('Payment succeeded:', event.data.object);
    },
  },
});
```

---

## Step 4: Use in Express

```typescript
app.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const result = await handler(req.body, req.headers['stripe-signature']!);
    res.json(result);
  }
);
```

---

**That's it!** Webhooks are now handled securely.
