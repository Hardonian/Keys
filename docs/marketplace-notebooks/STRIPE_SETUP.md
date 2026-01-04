# Stripe Product Configuration Guide

**Purpose**: Configure Stripe products and prices for marketplace pack purchases

## Overview

Each notebook pack needs a corresponding Stripe Product and Price. The webhook handler automatically grants entitlements when purchases complete.

## Product Setup

### Option 1: Single Pack Purchase (One-Time)

1. **Create Product**:
   ```
   Name: "Data Analysis Basics Pack"
   Description: "Premium notebook pack for data analysis"
   ```

2. **Set Product Metadata**:
   ```
   type: "marketplace_pack"
   packSlug: "data-analysis-basics"
   ```

3. **Create Price**:
   ```
   Type: One-time
   Amount: $29.00 (or your price)
   Currency: USD
   ```

4. **Set Price Metadata** (optional):
   ```
   packSlug: "data-analysis-basics"
   ```

### Option 2: Pack Subscription (Recurring)

1. **Create Product** (same as above)

2. **Create Price**:
   ```
   Type: Recurring
   Billing period: Monthly or Yearly
   Amount: $9.99/month (or your price)
   ```

3. **Set Price Metadata**:
   ```
   packSlug: "data-analysis-basics"
   ```

### Option 3: Bundle (Multiple Packs)

1. **Create Product**:
   ```
   Name: "Data Science Bundle"
   Description: "Includes: Data Analysis, ML Basics, Visualization"
   ```

2. **Set Product Metadata**:
   ```
   type: "marketplace_pack"
   bundle: "true"
   packSlugs: "data-analysis-basics,ml-basics,visualization"
   ```

3. **Create Price** (one-time or recurring)

## Webhook Integration

The webhook handler (`/billing/webhook`) automatically:

1. **On `checkout.session.completed`**:
   - Checks for `packSlug` or `packId` in session metadata
   - Resolves pack ID from slug if needed
   - Grants entitlement to user's tenant (org or user)
   - Links Stripe subscription ID if recurring

2. **On `customer.subscription.updated/deleted`**:
   - Updates entitlement status based on subscription status
   - Sets `ends_at` if subscription canceled

## Checkout Session Setup

When creating a checkout session for a pack purchase:

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'payment', // or 'subscription' for recurring
  payment_method_types: ['card'],
  line_items: [
    {
      price: priceId, // Stripe Price ID
      quantity: 1,
    },
  ],
  success_url: 'https://keys.app/marketplace/data-analysis-basics?purchased=true',
  cancel_url: 'https://keys.app/marketplace/data-analysis-basics',
  client_reference_id: userId,
  metadata: {
    userId: userId,
    packSlug: 'data-analysis-basics', // Required for marketplace entitlement
    // OR
    packId: '<pack-uuid>', // Alternative to packSlug
  },
});
```

## Frontend Integration

Update the pack detail page to create checkout sessions:

```typescript
const handlePurchase = async () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await fetch(`${apiUrl}/billing/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      priceId: pack.stripePriceId, // From pack metadata
      successUrl: `${window.location.origin}/marketplace/${pack.slug}?purchased=true`,
      cancelUrl: `${window.location.origin}/marketplace/${pack.slug}`,
      metadata: {
        packSlug: pack.slug,
      },
    }),
  });

  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe Checkout
};
```

## Testing

### Test Mode

1. Use Stripe test mode API keys
2. Create test products/prices
3. Use test card: `4242 4242 4242 4242`
4. Verify webhook receives `checkout.session.completed`
5. Check `marketplace_entitlements` table for new row

### Webhook Testing

Use Stripe CLI to forward webhooks locally:

```bash
stripe listen --forward-to localhost:3001/billing/webhook
```

Then trigger test events:

```bash
stripe trigger checkout.session.completed
```

## Production Checklist

- [ ] Create Stripe products for all packs
- [ ] Set product metadata: `type: "marketplace_pack"`
- [ ] Set pack slug in metadata or price metadata
- [ ] Configure webhook endpoint: `https://your-domain.com/billing/webhook`
- [ ] Set webhook secret in environment: `STRIPE_WEBHOOK_SECRET`
- [ ] Test checkout flow end-to-end
- [ ] Verify entitlements are granted on purchase
- [ ] Verify entitlements are revoked on subscription cancel

## Environment Variables

Required in backend `.env`:

```bash
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Troubleshooting

### Entitlement Not Granted

1. **Check Webhook Logs**: Stripe Dashboard → Webhooks → Events
2. **Verify Metadata**: Ensure `packSlug` or `packId` in checkout session metadata
3. **Check Database**: Query `marketplace_entitlements` after webhook fires
4. **Verify Pack Exists**: Check `marketplace_packs` table for slug

### Subscription Not Updating Entitlements

1. **Check Product Metadata**: Ensure `type: "marketplace_pack"` is set
2. **Verify Webhook**: Check that `customer.subscription.updated` events are received
3. **Check Subscription Items**: Verify price ID matches expected pack

## Example: Complete Setup

```bash
# 1. Create product via Stripe CLI
stripe products create \
  --name="Data Analysis Basics" \
  --description="Premium notebook pack" \
  --metadata[type]=marketplace_pack \
  --metadata[packSlug]=data-analysis-basics

# 2. Create price
stripe prices create \
  --product=prod_xxx \
  --unit-amount=2900 \
  --currency=usd \
  --metadata[packSlug]=data-analysis-basics

# 3. Store price ID in pack metadata (optional)
# Update marketplace_packs table with stripe_price_id
```

## Next Steps

After configuring Stripe products:

1. Update pack detail pages to use Stripe checkout
2. Test purchase flow end-to-end
3. Monitor webhook events for errors
4. Set up alerts for failed webhook deliveries
