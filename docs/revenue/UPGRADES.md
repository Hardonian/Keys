# KEYS Revenue Engine — Upgrades & Credits

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Production — Upgrade paths and credit calculation  
**Purpose**: Document upgrade logic, credit calculation, and fairness rules

---

## Overview

KEYS supports upgrade paths:
1. **Individual KEY → Bundle**: Owned KEYS reduce bundle price
2. **Bundle → Subscription**: Owned bundles reduce subscription price (up to 50%)
3. **Lower Tier → Higher Tier**: Subscription tier upgrades

**Principle**: No double charging. Owned purchases reduce upgrade cost.

---

## Upgrade Path 1: Individual KEY → Bundle

### Logic

When user purchases bundle but already owns some KEYS in bundle:
1. Calculate sum of owned KEY prices
2. Subtract from bundle price
3. Charge only the difference

### Example

**Bundle**: Operator Bundle ($399)
- `stripe-webhook-entitlement` ($149)
- `subscription-status-component` ($49)
- `usage-metering` ($99)
- `billing-dashboard` ($49)
- **Total**: $346

**User owns**:
- `stripe-webhook-entitlement` ($149)
- `subscription-status-component` ($49)
- **Owned total**: $198

**Upgrade cost**: $399 - $198 = $201

**Result**: User pays $201, gets entitlements for all 4 KEYS (no duplicates).

---

## Upgrade Path 2: Bundle → Subscription

### Logic

When user upgrades to subscription but already owns bundles:
1. Calculate sum of owned bundle prices
2. Credit up to 50% of subscription price
3. Charge subscription price minus credit

**Why 50% cap**: Prevents abuse (buying cheap bundles to get free subscription).

### Example

**Subscription**: Catalog Access ($999/year)

**User owns**:
- Starter Bundle ($199)
- Operator Bundle ($399)
- **Owned total**: $598

**Credit calculation**:
- Max credit: $999 × 0.5 = $499.50
- Owned bundles: $598
- Applied credit: $499.50 (capped at 50%)

**Upgrade cost**: $999 - $499.50 = $499.50

**Result**: User pays $499.50/year, gets subscription access.

---

## Upgrade Path 3: Subscription Tier Upgrades

### Logic

When user upgrades subscription tier:
1. Prorate remaining time in current period
2. Charge difference between tiers
3. Upgrade immediately (no waiting for period end)

### Example

**Current**: Developer Tier ($999/year)
**Upgrade to**: Team Tier ($1,999/year)
**Time remaining**: 6 months (50% of year)

**Calculation**:
- Remaining value: $999 × 0.5 = $499.50
- New tier cost: $1,999
- Prorated cost: $1,999 × 0.5 = $999.50
- Upgrade cost: $999.50 - $499.50 = $500

**Result**: User pays $500, immediately upgraded to Team Tier.

---

## Credit Calculation Implementation

### Individual KEY Credits

```typescript
async function calculateKeyToBundleUpgrade(
  userId: string,
  bundleId: string
): Promise<UpgradeCalculation> {
  // 1. Get user's entitlements
  const entitlements = await getTenantEntitlements(userId);
  const ownedKeySlugs = entitlements.map(e => e.packSlug);
  
  // 2. Get bundle and its keys
  const bundle = await getBundle(bundleId);
  const bundleKeys = await getKeys(bundle.key_ids);
  
  // 3. Calculate credits
  let credits = 0;
  for (const key of bundleKeys) {
    if (ownedKeySlugs.includes(key.slug)) {
      credits += key.price_cents;
    }
  }
  
  // 4. Calculate final price
  const finalPrice = Math.max(0, bundle.price_cents - credits);
  
  return {
    originalBundlePrice: bundle.price_cents,
    ownedKeyCredits: credits,
    finalPrice,
    upgradeCost: finalPrice,
  };
}
```

### Bundle Credits

```typescript
async function calculateBundleToSubscriptionUpgrade(
  userId: string,
  subscriptionPriceId: string
): Promise<UpgradeCalculation> {
  // 1. Get subscription price
  const price = await stripe.prices.retrieve(subscriptionPriceId);
  const subscriptionPrice = price.unit_amount || 0;
  
  // 2. Get user's bundle entitlements
  const bundleEntitlements = await getBundleEntitlements(userId);
  
  // 3. Calculate credits
  let credits = 0;
  for (const entitlement of bundleEntitlements) {
    credits += entitlement.bundle.price_cents;
  }
  
  // 4. Apply 50% cap
  const maxCredit = subscriptionPrice * 0.5;
  const appliedCredit = Math.min(credits, maxCredit);
  
  // 5. Calculate final price
  const finalPrice = Math.max(0, subscriptionPrice - appliedCredit);
  
  return {
    subscriptionPrice,
    ownedBundleCredits: credits,
    finalPrice,
    upgradeCost: finalPrice,
  };
}
```

---

## Fairness Rules

### Rule 1: No Double Charging

User never pays twice for the same KEY:
- Owned KEY reduces bundle price
- Owned bundle reduces subscription price

### Rule 2: Credits Are Additive

Multiple owned purchases combine:
- Own 2 KEYS worth $100 each → $200 credit
- Own 2 bundles worth $200 each → $400 credit (capped at 50% of subscription)

### Rule 3: Credits Never Exceed Purchase Price

Bundle credit never exceeds bundle price:
- Bundle price: $399
- Credit: $399 max (even if owned KEYS sum to more)

### Rule 4: Upgrades Are Atomic

Upgrade either succeeds completely or fails:
- Payment succeeds → All entitlements granted
- Payment fails → No entitlements granted
- No partial states

---

## Upgrade Checkout Flow

### Step 1: Calculate Upgrade Cost

```typescript
// User clicks "Upgrade to Bundle"
const upgrade = await calculateKeyToBundleUpgrade(userId, bundleId);

// Show user:
// - Original bundle price: $399
// - Your credits: -$198
// - Final price: $201
```

### Step 2: Create Checkout Session

```typescript
const session = await createKeyToBundleUpgradeSession(
  userId,
  bundleId,
  successUrl,
  cancelUrl
);

// Redirect to Stripe Checkout
redirect(session.url);
```

### Step 3: Process Payment

```typescript
// Webhook: checkout.session.completed
// Metadata includes:
// - upgradeType: 'key_to_bundle'
// - ownedKeyCredits: '198'

// Grant bundle entitlements
// (Already handled by webhook handler)
```

---

## Upgrade Scenarios

### Scenario 1: Free Upgrade

**User owns all KEYS in bundle**:
- Bundle price: $399
- Owned KEYS: $399
- Credits: $399
- Final price: $0

**Result**: Grant bundle entitlements immediately, no payment required.

### Scenario 2: Partial Credit

**User owns some KEYS**:
- Bundle price: $399
- Owned KEYS: $198
- Credits: $198
- Final price: $201

**Result**: Charge $201, grant all bundle entitlements.

### Scenario 3: No Credits

**User owns no KEYS**:
- Bundle price: $399
- Owned KEYS: $0
- Credits: $0
- Final price: $399

**Result**: Charge full bundle price.

---

## Audit Trail

### Upgrade Records

All upgrades are logged:

```sql
CREATE TABLE upgrade_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  upgrade_type TEXT NOT NULL,
  from_sku TEXT,
  to_sku TEXT NOT NULL,
  original_price INT NOT NULL,
  credits_applied INT NOT NULL,
  final_price INT NOT NULL,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Audit Fields

- `upgrade_type`: `'key_to_bundle'`, `'bundle_to_subscription'`, `'tier_upgrade'`
- `credits_applied`: Amount of credit applied
- `stripe_session_id`: Stripe checkout session ID

---

## Testing

### Test Cases

1. **Free upgrade**: User owns all KEYS → $0 charge
2. **Partial credit**: User owns some KEYS → Partial charge
3. **No credit**: User owns no KEYS → Full charge
4. **Bundle credit cap**: User owns $600 in bundles → $500 credit (50% cap)
5. **Multiple credits**: User owns multiple KEYS → Credits sum correctly

---

## Version History

- **1.0.0** (2024-12-30): Initial upgrade logic documentation
