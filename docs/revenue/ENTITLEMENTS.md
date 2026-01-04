# KEYS Revenue Engine — Entitlement System

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Production — Entitlement rules and access enforcement  
**Purpose**: Document entitlement logic, access enforcement, and revocation

---

## Overview

KEYS entitlement system enforces access based on payment state. Entitlements are:
- **Additive**: Multiple entitlements grant cumulative access
- **Server-verified**: Never trust client claims
- **Revocable**: Access can be revoked on payment failure/refund

---

## Entitlement Types

### 1. Individual KEY Entitlements

**Source**: One-time purchase

**Scope**: 
- User-level: Purchased by individual
- Tenant-level: Purchased by organization

**Duration**: Perpetual (no expiration) unless revoked

**Storage**: `marketplace_entitlements` table

**Fields**:
- `tenant_id`: User ID or org ID
- `tenant_type`: `'user'` or `'org'`
- `key_id`: KEY ID
- `source`: `'stripe'` or `'manual'`
- `status`: `'active'` or `'inactive'`
- `ends_at`: `null` (perpetual) or expiration date
- `stripe_price_id`: Stripe price ID (for tracking)

---

### 2. Bundle Entitlements

**Source**: Bundle purchase

**Scope**: Same as individual KEY entitlements

**Duration**: Perpetual (no expiration) unless revoked

**Storage**: 
- `marketplace_bundle_entitlements`: Bundle purchase record
- `marketplace_entitlements`: Individual KEY entitlements (one per KEY in bundle)

**Logic**: Bundle purchase grants individual entitlements for all KEYS in bundle

---

### 3. Subscription Entitlements

**Source**: Catalog access subscription

**Scope**: User-level only (subscriptions are per-user)

**Duration**: Active subscription period (expires on cancellation)

**Storage**: `marketplace_entitlements` with `stripe_subscription_id`

**Logic**: 
- Subscription grants access to all current KEYS
- New KEYS automatically accessible during subscription period
- Access expires at subscription end date

---

## Entitlement Rules

### Rule 1: Entitlements Are Additive

If user has:
- Individual KEY entitlement for `key-A`
- Bundle entitlement that includes `key-A` and `key-B`
- Subscription entitlement

Then user has access to:
- `key-A` (from individual + bundle + subscription)
- `key-B` (from bundle + subscription)
- All other KEYS (from subscription)

**No double-checking**: If any entitlement grants access, access is granted.

---

### Rule 2: Perpetual KEYS Never Revoked

Individual KEY purchases are perpetual. They are only revoked if:
- Refund issued (`charge.refunded` event)
- Manual revocation (admin action)

**Not revoked on**:
- Subscription cancellation
- Payment failure
- Account closure (unless manual revocation)

---

### Rule 3: Subscription-Derived Access Expires Cleanly

Subscription entitlements expire at subscription end date:
- `ends_at` set to `subscription.current_period_end`
- Access revoked automatically after expiration
- No grace period (access ends exactly at period end)

---

### Rule 4: Partial Bundle Ownership

If user owns some KEYS in a bundle:
- Bundle price reduced by owned KEY prices
- User still gets entitlements for all KEYS in bundle
- No duplicate entitlements (upsert logic prevents duplicates)

---

## Access Enforcement

### Server-Side Only

**Rule**: All access checks happen server-side. Client UI reflects entitlement but never defines it.

### Enforcement Points

1. **Download Endpoint**: `GET /marketplace/keys/:slug/download`
   - Checks entitlement before generating signed URL
   - Returns `403` if no entitlement

2. **Signed URL Generation**: Server-side only
   - Time-bound (1 hour expiration)
   - Requires valid entitlement

3. **API Endpoints**: All KEY-related endpoints check entitlement
   - `GET /marketplace/keys/:slug` → Shows locked/unlocked status
   - `GET /marketplace/entitlements` → Lists user entitlements

---

## Entitlement Check Logic

```typescript
async function hasEntitlement(
  tenantId: string,
  tenantType: 'org' | 'user',
  keyIdOrSlug: string
): Promise<EntitlementCheck> {
  // 1. Resolve key_id if slug provided
  const keyId = await resolveKeyId(keyIdOrSlug);
  
  // 2. Check for active entitlement
  const entitlement = await db.query(`
    SELECT id, ends_at, status
    FROM marketplace_entitlements
    WHERE tenant_id = $1
      AND tenant_type = $2
      AND key_id = $3
      AND status = 'active'
  `, [tenantId, tenantType, keyId]);
  
  if (!entitlement) {
    return { hasAccess: false };
  }
  
  // 3. Check expiration
  if (entitlement.ends_at) {
    const expiresAt = new Date(entitlement.ends_at);
    if (expiresAt < new Date()) {
      return { hasAccess: false };
    }
    return {
      hasAccess: true,
      entitlementId: entitlement.id,
      expiresAt,
    };
  }
  
  // 4. Perpetual entitlement
  return {
    hasAccess: true,
    entitlementId: entitlement.id,
  };
}
```

---

## Revocation Logic

### When Entitlements Are Revoked

1. **Refund Issued** (`charge.refunded` event)
   - Revoke entitlement immediately
   - Mark status as `'inactive'`

2. **Subscription Cancellation** (`customer.subscription.deleted`)
   - Set `ends_at` to subscription end date
   - Access continues until period end
   - Revoked automatically after period end

3. **Payment Failure** (`invoice.payment_failed` after grace period)
   - Revoke subscription-derived entitlements
   - Individual KEY entitlements NOT revoked

4. **Manual Revocation** (admin action)
   - Revoke specific entitlement
   - Log reason for audit

---

## Revocation Implementation

```typescript
async function revokeEntitlement(
  tenantId: string,
  keyId: string,
  tenantType: 'org' | 'user'
): Promise<void> {
  await db.query(`
    UPDATE marketplace_entitlements
    SET status = 'inactive',
        updated_at = NOW()
    WHERE tenant_id = $1
      AND tenant_type = $2
      AND key_id = $3
      AND status = 'active'
  `, [tenantId, tenantType, keyId]);
}
```

---

## Expiration Handling

### Time-Bound Entitlements

Subscription entitlements have `ends_at` set:

```typescript
// On subscription purchase
await grantEntitlement(tenantId, tenantType, keyId, 'stripe', {
  stripeSubscriptionId: subscription.id,
  endsAt: new Date(subscription.current_period_end * 1000),
});
```

### Expiration Check

Entitlement check automatically filters expired entitlements:

```typescript
// Expired entitlements are filtered out
WHERE (ends_at IS NULL OR ends_at > NOW())
```

---

## Bundle Entitlement Logic

### Granting Bundle Entitlements

```typescript
async function grantBundleEntitlements(
  tenantId: string,
  tenantType: 'org' | 'user',
  bundleId: string,
  source: 'stripe' | 'manual',
  options?: { stripePriceId?: string }
): Promise<void> {
  // 1. Get bundle keys
  const bundle = await getBundle(bundleId);
  const keyIds = bundle.key_ids as string[];
  
  // 2. Grant entitlement for each key
  for (const keyId of keyIds) {
    await grantEntitlement(tenantId, tenantType, keyId, source, options);
  }
  
  // 3. Record bundle purchase
  await db.insert('marketplace_bundle_entitlements', {
    tenant_id: tenantId,
    tenant_type: tenantType,
    bundle_id: bundleId,
    source,
    status: 'active',
    stripe_price_id: options?.stripePriceId,
  });
}
```

---

## Subscription Entitlement Logic

### Granting Subscription Access

When subscription is active, user has access to all KEYS:

```typescript
async function checkSubscriptionAccess(
  userId: string,
  keyId: string
): Promise<boolean> {
  // 1. Check if user has active subscription
  const profile = await getUserProfile(userId);
  if (profile.subscription_status !== 'active') {
    return false;
  }
  
  // 2. Check for subscription-derived entitlement
  const entitlement = await db.query(`
    SELECT id
    FROM marketplace_entitlements
    WHERE tenant_id = $1
      AND tenant_type = 'user'
      AND key_id = $2
      AND stripe_subscription_id IS NOT NULL
      AND status = 'active'
      AND (ends_at IS NULL OR ends_at > NOW())
  `, [userId, keyId]);
  
  return entitlement !== null;
}
```

### Auto-Granting New KEYS

When new KEY is published:
- Users with active subscriptions automatically get entitlement
- Background job grants entitlements for all active subscribers

---

## Access Enforcement Examples

### Example 1: Download Without Entitlement

```
GET /marketplace/keys/stripe-webhook-entitlement/download

Response: 403 Forbidden
{
  "error": "Access denied",
  "reason": "No active entitlement",
  "upgrade_url": "/pricing"
}
```

### Example 2: Download With Entitlement

```
GET /marketplace/keys/stripe-webhook-entitlement/download

Response: 200 OK
{
  "download_url": "https://storage.example.com/signed-url?...",
  "expires_at": "2024-12-30T13:00:00Z"
}
```

### Example 3: Expired Subscription

```
GET /marketplace/keys/stripe-webhook-entitlement/download

Response: 403 Forbidden
{
  "error": "Access denied",
  "reason": "Subscription expired",
  "expires_at": "2024-12-23T00:00:00Z",
  "renew_url": "/billing/portal"
}
```

---

## Security Considerations

### No Enumeration

Cannot list KEYS without entitlement:
- `GET /marketplace/keys` → Returns public metadata only
- Download URLs require entitlement check

### No IDOR

Cannot access KEYS by guessing IDs:
- Entitlement check uses tenant context
- Signed URLs are time-bound and tenant-scoped

### Time-Bound Signed URLs

Download URLs expire after 1 hour:
- Prevents URL sharing
- Requires re-authentication for new URL

---

## Version History

- **1.0.0** (2024-12-30): Initial entitlement system documentation
