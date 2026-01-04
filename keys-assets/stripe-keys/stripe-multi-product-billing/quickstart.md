# Quick Start: Multi-Product Billing

Get multi-product billing working in 3 minutes.

---

## Step 1: Install

```bash
npm install stripe
```

---

## Step 2: Create Subscription

```typescript
import { createMultiProductSubscription } from './stripe-multi-product-billing';

const subscription = await createMultiProductSubscription({
  customerId: 'cus_123',
  products: [
    { priceId: 'price_base' },
    { priceId: 'price_addon', quantity: 2 },
  ],
});
```

---

**That's it!** Multi-product billing is ready.
