# Stripe Webhook Entitlement Key

## What This KEY Unlocks

Unlocks Stripe webhook verification and entitlement checking for subscription-based features in Next.js applications.

This KEY provides:
- Secure Stripe webhook signature verification
- Server-side entitlement checking from Stripe subscriptions
- Tenant-isolated webhook processing
- Graceful error handling

## Installation

### Step 1: Copy KEY to Your Project

```bash
cp -r node-keys/stripe-webhook-entitlement ./node-keys/
```

### Step 2: Install Dependencies

```bash
npm install stripe
```

### Step 3: Configure Environment Variables

Add to your `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 4: Mount the Route Handler

**Next.js App Router** (`app/api/webhooks/stripe/route.ts`):

```typescript
import { stripeWebhookHandler } from '@/node-keys/stripe-webhook-entitlement/src';

export const POST = stripeWebhookHandler;
```

**Next.js Pages Router** (`pages/api/webhooks/stripe.ts`):

```typescript
import { stripeWebhookHandler } from '@/node-keys/stripe-webhook-entitlement/src';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Convert Next.js API route to Next.js App Router format
  const response = await stripeWebhookHandler(req as any);
  return res.status(response.status).json(await response.json());
}
```

## Usage

### Webhook Handler

The webhook handler automatically:
1. Verifies Stripe webhook signatures
2. Extracts tenant_id from event metadata
3. Processes subscription events
4. Returns appropriate responses

### Check Entitlements

```typescript
import { checkStripeEntitlement } from '@/node-keys/stripe-webhook-entitlement/src';

const result = await checkStripeEntitlement({
  customerId: 'cus_...',
  feature: 'premium',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
});

if (result.hasAccess) {
  // User has access to premium features
  console.log('Features:', result.features);
}
```

## Configuration

### Required Environment Variables

- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret

### Optional Environment Variables

- `STRIPE_API_VERSION`: Stripe API version (default: '2023-10-16')

## Security

This KEY enforces:
- ✅ Webhook signature verification (server-side)
- ✅ Tenant isolation (per-request tenant_id)
- ✅ Fail-closed entitlement checks
- ✅ Input validation
- ✅ Error handling without leaking sensitive information

## Removal

### Step 1: Remove Route File

Delete `app/api/webhooks/stripe/route.ts` (or `pages/api/webhooks/stripe.ts`)

### Step 2: Remove Imports

Remove all imports of this KEY from your codebase.

### Step 3: Remove Environment Variables

Remove `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` from `.env.local` (if KEY-specific)

### Step 4: Remove KEY Directory

```bash
rm -rf ./node-keys/stripe-webhook-entitlement
```

### Step 5: Verify

```bash
npm run build
npm run test
```

Your app should continue to function normally.

## Troubleshooting

### Error: "STRIPE_SECRET_KEY is not configured"

**Solution**: Add `STRIPE_SECRET_KEY` to your `.env.local` file.

### Error: "Invalid signature"

**Solution**: 
1. Verify `STRIPE_WEBHOOK_SECRET` matches your Stripe webhook endpoint secret
2. Ensure you're sending the raw request body (not parsed JSON)
3. Check that the signature header is included in the request

### Error: "Missing tenant_id in webhook event"

**Solution**: Ensure your Stripe events include `tenant_id` in metadata:

```typescript
// When creating subscriptions, include tenant_id
await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  metadata: {
    tenant_id: 'your-tenant-id',
  },
});
```

## License

MIT
