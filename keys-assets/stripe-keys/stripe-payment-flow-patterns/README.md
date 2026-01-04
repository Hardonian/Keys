# Stripe Keys: Payment Flow Patterns

**Version**: 1.0.0  
**Tool**: Stripe  
**Maturity**: Starter  
**Outcome**: Monetization

---

## What This Key Unlocks

One-time payment flows for Stripe. This key unlocks:

- **Payment Intent Creation**: Create payment intents for one-time payments
- **Payment Confirmation**: Confirm payments server-side
- **Payment Status Checking**: Check payment intent status
- **Webhook Handling**: Process payment webhooks with signature verification
- **Error Handling**: Handle payment failures gracefully

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
     createPaymentIntent,
     confirmPaymentIntent,
     handlePaymentWebhook,
   } from './stripe-payment-flow-patterns';
   ```

---

## Usage

### Creating a Payment Intent

```typescript
import { createPaymentIntent } from './stripe-payment-flow-patterns';

const { clientSecret, paymentIntent } = await createPaymentIntent({
  amount: 999, // $9.99 in cents
  currency: 'usd',
  description: 'One-time payment',
  metadata: {
    orderId: 'order_123',
  },
});

// Send clientSecret to frontend for Stripe.js
```

### Confirming a Payment (Server-Side)

```typescript
import { confirmPaymentIntent } from './stripe-payment-flow-patterns';

const paymentIntent = await confirmPaymentIntent(
  'pi_1234567890',
  'pm_1234567890' // Payment method ID
);
```

### Handling Webhooks

```typescript
import { webhookMiddleware } from './stripe-payment-flow-patterns';
import express from 'express';

const app = express();

app.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  webhookMiddleware({
    onPaymentSucceeded: async (paymentIntent) => {
      // Handle successful payment
      console.log('Payment succeeded:', paymentIntent.id);
      // Update order status, send confirmation email, etc.
    },
    onPaymentFailed: async (paymentIntent) => {
      // Handle failed payment
      console.log('Payment failed:', paymentIntent.id);
      // Notify user, log error, etc.
    },
  })
);
```

### Frontend Integration (Stripe.js)

```typescript
// Frontend code (React example)
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

## Key Features

### Payment Intent Creation
- Automatic payment methods enabled
- Support for customer association
- Metadata support for order tracking
- Flexible confirmation options

### Webhook Handling
- Signature verification for security
- Event type filtering
- Error handling

### Error Handling
- Descriptive error messages
- Proper HTTP status codes
- Error logging support

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
