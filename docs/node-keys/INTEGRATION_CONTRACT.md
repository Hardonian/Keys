# Node / Next.js KEY Integration Contract

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Defines how KEYS integrate into host apps  
**Purpose**: Ensure safe, explicit, reversible integration

---

## Core Principle

**Every Node / Next.js KEY must integrate explicitly, remove cleanly, and never hide behavior.**

The host app remains sovereign. The KEY provides leverage.

---

## Integration Requirements

### 1. Explicit Imports

**Requirement**: All KEY functionality must be imported explicitly.

**✅ Correct**:
```typescript
import { stripeWebhookHandler } from './node-keys/stripe-webhook-entitlement/src';
```

**❌ Wrong**:
```typescript
// Magic auto-import or side-effect registration
import './node-keys/stripe-webhook-entitlement'; // No!
```

**Rationale**: Explicit imports make dependencies clear and enable tree-shaking.

---

### 2. Explicit Route Mounting

**Requirement**: Route KEYS must be mounted explicitly by the host app.

**✅ Correct** (Next.js App Router):
```typescript
// app/api/webhooks/stripe/route.ts
import { stripeWebhookHandler } from '@/node-keys/stripe-webhook-entitlement/src';

export const POST = stripeWebhookHandler;
```

**✅ Correct** (Next.js Pages Router):
```typescript
// pages/api/webhooks/stripe.ts
import { stripeWebhookHandler } from '@/node-keys/stripe-webhook-entitlement/src';

export default stripeWebhookHandler;
```

**✅ Correct** (Express):
```typescript
import { stripeWebhookHandler } from './node-keys/stripe-webhook-entitlement/src';

app.post('/api/webhooks/stripe', stripeWebhookHandler);
```

**❌ Wrong**:
```typescript
// Auto-registration or magic mounting
import './node-keys/stripe-webhook-entitlement'; // Registers routes automatically - NO!
```

**Rationale**: Explicit mounting gives the host app control over routing.

---

### 3. Explicit Environment Requirements

**Requirement**: All environment variables must be declared in `key.json` and validated at runtime.

**✅ Correct**:
```typescript
// KEY validates env vars on import
import { stripeWebhookHandler } from './node-keys/stripe-webhook-entitlement/src';

// If STRIPE_SECRET_KEY is missing, throws clear error
```

**❌ Wrong**:
```typescript
// Silent failure or undefined behavior
import { stripeWebhookHandler } from './node-keys/stripe-webhook-entitlement/src';
// Missing env vars cause mysterious failures later
```

**Rationale**: Fail fast with clear errors, not silently.

---

### 4. Explicit Teardown / Removal

**Requirement**: Every KEY must be removable without breaking the host app.

**Removal Steps**:
1. Remove imports
2. Remove route mounts
3. Remove environment variables (if KEY-specific)
4. Remove KEY directory
5. Host app continues to function

**✅ Correct**:
```typescript
// Before removal, host app has:
import { stripeWebhookHandler } from './node-keys/stripe-webhook-entitlement/src';
export const POST = stripeWebhookHandler;

// After removal, host app has:
// (nothing - route simply doesn't exist)
// App continues to function normally
```

**❌ Wrong**:
```typescript
// KEY leaves behind global state, side effects, or dependencies
// Removing KEY breaks the app
```

**Rationale**: Removability ensures the host app remains sovereign.

---

## Installation Process

### Step 1: Copy KEY to Project

```bash
# Copy KEY directory to project
cp -r node-keys/stripe-webhook-entitlement ./node-keys/
```

### Step 2: Install Dependencies

```bash
# Install KEY dependencies (if any)
npm install stripe
```

### Step 3: Configure Environment

```bash
# Add required environment variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 4: Import and Mount

```typescript
// Explicitly import and mount
import { stripeWebhookHandler } from './node-keys/stripe-webhook-entitlement/src';

export const POST = stripeWebhookHandler;
```

### Step 5: Verify

```bash
# Run verification script
npm run verify-key stripe-webhook-entitlement
```

---

## Removal Process

### Step 1: Remove Imports

```typescript
// Remove all imports of the KEY
// Before:
import { stripeWebhookHandler } from './node-keys/stripe-webhook-entitlement/src';

// After:
// (removed)
```

### Step 2: Remove Route Mounts

```typescript
// Remove route files that mount the KEY
// Delete: app/api/webhooks/stripe/route.ts
```

### Step 3: Remove Environment Variables

```bash
# Remove KEY-specific environment variables
# Remove from .env:
# STRIPE_SECRET_KEY=...
# STRIPE_WEBHOOK_SECRET=...
```

### Step 4: Remove KEY Directory

```bash
# Remove KEY directory
rm -rf ./node-keys/stripe-webhook-entitlement
```

### Step 5: Verify Removal

```bash
# Verify app still works
npm run build
npm run test
```

---

## Verification Process

### Automated Verification

Every KEY must provide a verification script:

```typescript
// node-keys/stripe-webhook-entitlement/verify.ts
export function verifyKey(): {
  success: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    errors.push('STRIPE_SECRET_KEY is missing');
  }
  
  // Check dependencies
  try {
    require('stripe');
  } catch {
    errors.push('stripe package not installed');
  }
  
  return {
    success: errors.length === 0,
    errors
  };
}
```

### Manual Verification

1. **Build Check**: Host app builds successfully
2. **Test Check**: Host app tests pass
3. **Runtime Check**: KEY functionality works as expected
4. **Removal Check**: KEY can be removed without breaking app

---

## Rollback Process

### Version Rollback

If a KEY update breaks the host app:

```bash
# 1. Check CHANGELOG.md for breaking changes
cat node-keys/stripe-webhook-entitlement/CHANGELOG.md

# 2. Revert to previous version
cd node-keys/stripe-webhook-entitlement
git checkout v1.0.0

# 3. Verify app works
npm run build
npm run test
```

### Complete Rollback

If a KEY needs to be completely removed:

1. Follow removal process (above)
2. Restore from git if needed
3. Verify app functionality

---

## Integration Patterns

### Pattern 1: Route KEY (Next.js App Router)

```typescript
// app/api/webhooks/stripe/route.ts
import { stripeWebhookHandler } from '@/node-keys/stripe-webhook-entitlement/src';

export const POST = stripeWebhookHandler;
```

### Pattern 2: Route KEY (Next.js Pages Router)

```typescript
// pages/api/webhooks/stripe.ts
import { stripeWebhookHandler } from '@/node-keys/stripe-webhook-entitlement/src';

export default stripeWebhookHandler;
```

### Pattern 3: Job KEY (Node.js)

```typescript
// jobs/reconciliation.ts
import { reconciliationJob } from '@/node-keys/background-reconciliation/src';

// Register with your job runner
cron.schedule('0 2 * * *', reconciliationJob);
```

### Pattern 4: UI KEY (Next.js)

```typescript
// app/dashboard/audit-log/page.tsx
import { AuditLogWidget } from '@/node-keys/audit-log-capture/src';

export default function AuditLogPage() {
  return <AuditLogWidget />;
}
```

### Pattern 5: Data KEY (Migration)

```typescript
// migrations/001_add_rls_policies.ts
import { createRLSPolicies } from '@/node-keys/supabase-rls-guard/src';

export async function up() {
  await createRLSPolicies();
}
```

---

## Integration Constraints

### ❌ Forbidden Patterns

1. **Global Side Effects**: No automatic registration
2. **Magic Imports**: No hidden behavior
3. **Global State**: No shared mutable state
4. **Path Assumptions**: No hardcoded paths
5. **Framework Assumptions**: No framework-specific magic

### ✅ Required Patterns

1. **Explicit Exports**: All functionality exported from `src/index.ts`
2. **Explicit Configuration**: All config via parameters or env vars
3. **Explicit Dependencies**: All dependencies declared
4. **Explicit Errors**: All errors are clear and actionable
5. **Explicit Removal**: All integration points are removable

---

## Host App Sovereignty

**The host app remains sovereign.**

- Host app controls routing
- Host app controls job scheduling
- Host app controls component usage
- Host app controls data access
- Host app can remove any KEY at any time

**The KEY provides leverage, not control.**

---

## Version History

- **1.0.0** (2024-12-30): Initial integration contract definition
