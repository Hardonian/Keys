# Quick Start

## Prerequisites

- Next.js 13+ (App Router or Pages Router)
- Node.js 18+
- Stripe account
- Stripe webhook endpoint configured

## Quick Install

```bash
npm install stripe
```

Copy `node-keys/stripe-webhook-entitlement` to your project.

## Basic Usage

### 1. Configure Environment

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Mount Route Handler

**App Router** (`app/api/webhooks/stripe/route.ts`):

```typescript
import { stripeWebhookHandler } from '@/node-keys/stripe-webhook-entitlement/src';

export const POST = stripeWebhookHandler;
```

**Pages Router** (`pages/api/webhooks/stripe.ts`):

```typescript
import { stripeWebhookHandler } from '@/node-keys/stripe-webhook-entitlement/src';

export default stripeWebhookHandler;
```

### 3. Configure Stripe Webhook

In Stripe Dashboard:
- Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
- Events: `customer.subscription.*`

## Next Steps

See [README.md](./README.md) for full documentation.
