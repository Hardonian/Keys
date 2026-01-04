# Node / Next.js KEY Security Model

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Security requirements for all Node/Next KEYS  
**Purpose**: Ensure tenant isolation, auth enforcement, and secure defaults

---

## Core Principle

**Every Node / Next.js KEY must enforce security boundaries, respect tenant isolation, and fail closed—never open.**

Security is not optional. It is mandatory.

---

## Mandatory Security Requirements

### 1. Tenant Isolation

**Requirement**: Every KEY must respect `tenant_id` boundaries.

**✅ Correct**:
```typescript
// KEY validates tenant_id on every request
export async function stripeWebhookHandler(req: Request) {
  const tenantId = req.headers['x-tenant-id'];
  
  if (!tenantId) {
    return new Response('Missing tenant_id', { status: 401 });
  }
  
  // All operations scoped to tenant_id
  const subscription = await getSubscription(tenantId, subscriptionId);
}
```

**❌ Wrong**:
```typescript
// KEY ignores tenant_id or assumes single tenant
export async function stripeWebhookHandler(req: Request) {
  // No tenant validation - security hole!
  const subscription = await getSubscription(subscriptionId);
}
```

**Tenant Scope Types**:
- `per-request-tenant-id`: Tenant ID from request headers/params
- `per-user-tenant-id`: Tenant ID from authenticated user
- `per-session-tenant-id`: Tenant ID from session
- `global`: No tenant isolation (must be explicitly documented)

**Metadata**: `tenant_scope` field in `key.json`

---

### 2. Authentication Enforcement

**Requirement**: Every KEY must enforce authentication server-side.

**✅ Correct**:
```typescript
// KEY validates auth before processing
export async function stripeWebhookHandler(req: Request) {
  // Verify webhook signature (server-side)
  const signature = req.headers['stripe-signature'];
  if (!verifyStripeSignature(signature, req.body)) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  // Process request
}
```

**✅ Correct** (User Auth):
```typescript
// KEY validates user auth
export async function auditLogHandler(req: Request) {
  const session = await getSession(req);
  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // All operations scoped to authenticated user
  const logs = await getAuditLogs(session.user.id);
}
```

**❌ Wrong**:
```typescript
// KEY trusts client claims or skips auth
export async function auditLogHandler(req: Request) {
  // No auth check - security hole!
  const userId = req.body.userId; // Trusting client - NO!
  const logs = await getAuditLogs(userId);
}
```

**Auth Patterns**:
- **Webhook Auth**: Signature verification (Stripe, GitHub, etc.)
- **Session Auth**: Session validation (NextAuth, custom)
- **JWT Auth**: Token validation
- **API Key Auth**: Key validation

---

### 3. Input Validation

**Requirement**: Every KEY must validate all inputs aggressively.

**✅ Correct**:
```typescript
import { z } from 'zod';

const webhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.object({
      id: z.string(),
      customer: z.string(),
    }),
  }),
});

export async function stripeWebhookHandler(req: Request) {
  const body = await req.json();
  
  // Validate input
  const result = webhookSchema.safeParse(body);
  if (!result.success) {
    return new Response('Invalid input', { status: 400 });
  }
  
  // Process validated input
  const { type, data } = result.data;
}
```

**❌ Wrong**:
```typescript
// KEY trusts input without validation
export async function stripeWebhookHandler(req: Request) {
  const body = await req.json();
  
  // No validation - security hole!
  const subscriptionId = body.data.object.id; // Could be anything!
}
```

**Validation Requirements**:
- Validate all request bodies
- Validate all query parameters
- Validate all path parameters
- Validate all headers (when used for auth)
- Use schema validation (Zod, Yup, etc.)

---

### 4. Never Trust Client Claims

**Requirement**: Every KEY must verify server-side, never trust client claims.

**✅ Correct**:
```typescript
// KEY verifies entitlement server-side
export async function checkEntitlement(userId: string, feature: string) {
  // Verify from database, not client
  const subscription = await db.subscriptions.findFirst({
    where: { userId, status: 'active' },
  });
  
  return subscription?.features.includes(feature) ?? false;
}
```

**❌ Wrong**:
```typescript
// KEY trusts client claims
export async function checkEntitlement(req: Request) {
  // Trusting client - security hole!
  const hasFeature = req.body.hasFeature; // Client says so - NO!
  return hasFeature;
}
```

**Server-Side Verification**:
- Database queries
- API calls to external services
- Session validation
- Token validation

---

### 5. Fail Closed, Not Open

**Requirement**: Every KEY must fail closed (deny access) when uncertain.

**✅ Correct**:
```typescript
// KEY fails closed on uncertainty
export async function checkEntitlement(userId: string, feature: string) {
  try {
    const subscription = await db.subscriptions.findFirst({
      where: { userId, status: 'active' },
    });
    
    // Fail closed: if subscription not found, deny access
    if (!subscription) {
      return false;
    }
    
    return subscription.features.includes(feature);
  } catch (error) {
    // Fail closed: on error, deny access
    console.error('Entitlement check failed:', error);
    return false;
  }
}
```

**❌ Wrong**:
```typescript
// KEY fails open on uncertainty
export async function checkEntitlement(userId: string, feature: string) {
  try {
    const subscription = await db.subscriptions.findFirst({
      where: { userId, status: 'active' },
    });
    
    // Fail open: if subscription not found, allow access - NO!
    return subscription?.features.includes(feature) ?? true;
  } catch (error) {
    // Fail open: on error, allow access - NO!
    return true;
  }
}
```

**Fail Closed Rules**:
- Missing auth → deny access
- Invalid input → deny access
- Database error → deny access
- Service error → deny access
- Uncertainty → deny access

---

## Security Patterns by KEY Type

### Route KEYS

**Required**:
- Auth validation (webhook signature, session, JWT)
- Input validation (request body, params, query)
- Tenant isolation (per-request or per-user)
- Rate limiting (if applicable)

**Example**:
```typescript
export async function stripeWebhookHandler(req: Request) {
  // 1. Verify webhook signature
  const signature = req.headers['stripe-signature'];
  if (!verifyStripeSignature(signature, req.body)) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  // 2. Validate input
  const body = await req.json();
  const result = webhookSchema.safeParse(body);
  if (!result.success) {
    return new Response('Invalid input', { status: 400 });
  }
  
  // 3. Extract tenant_id
  const tenantId = extractTenantId(result.data);
  if (!tenantId) {
    return new Response('Missing tenant_id', { status: 400 });
  }
  
  // 4. Process request (scoped to tenant_id)
  await processWebhook(tenantId, result.data);
  
  return new Response('OK', { status: 200 });
}
```

---

### Job KEYS

**Required**:
- Service account auth (if calling external APIs)
- Tenant isolation (if processing tenant data)
- Error handling (fail closed on errors)
- Idempotency (prevent duplicate processing)

**Example**:
```typescript
export async function reconciliationJob() {
  // 1. Authenticate with service account
  const serviceAccount = await getServiceAccount();
  
  // 2. Process each tenant separately
  const tenants = await getActiveTenants();
  
  for (const tenant of tenants) {
    try {
      // 3. Process tenant data (isolated)
      await reconcileTenantData(tenant.id);
    } catch (error) {
      // 4. Fail closed: log error, continue to next tenant
      console.error(`Reconciliation failed for tenant ${tenant.id}:`, error);
      // Don't throw - continue processing other tenants
    }
  }
}
```

---

### Data KEYS

**Required**:
- RLS policy enforcement (if using Supabase/Postgres)
- Input validation (migration inputs)
- Rollback safety (reversible migrations)
- Tenant isolation (if applicable)

**Example**:
```typescript
export async function createRLSPolicies() {
  // 1. Validate inputs
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  
  // 2. Create RLS policies with tenant isolation
  await db.query(`
    CREATE POLICY tenant_isolation ON subscriptions
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
  `);
  
  // 3. Enable RLS
  await db.query('ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY');
}
```

---

### UI KEYS

**Required**:
- Server-side data fetching (never trust client)
- Auth checks (validate user session)
- Tenant isolation (filter data by tenant)
- Input validation (if accepting user input)

**Example**:
```typescript
export async function AuditLogWidget() {
  // 1. Get session server-side
  const session = await getServerSession();
  if (!session) {
    return <div>Unauthorized</div>;
  }
  
  // 2. Fetch data server-side (scoped to tenant)
  const logs = await db.auditLogs.findMany({
    where: {
      tenantId: session.user.tenantId, // Tenant isolation
      userId: session.user.id, // User isolation
    },
  });
  
  // 3. Render UI
  return <div>{/* Render logs */}</div>;
}
```

---

### Integration KEYS

**Required**:
- API key security (never expose keys client-side)
- Webhook verification (verify signatures)
- Rate limiting (respect API limits)
- Error handling (fail closed)

**Example**:
```typescript
export async function verifyStripeWebhook(
  signature: string,
  body: string
): Promise<boolean> {
  // 1. Get webhook secret from env (server-side only)
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required');
  }
  
  // 2. Verify signature
  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    return true;
  } catch (error) {
    // 3. Fail closed: invalid signature
    return false;
  }
}
```

---

## Stripe Entitlement Checks

**Requirement**: KEYS that check Stripe entitlements must verify server-side.

**✅ Correct**:
```typescript
export async function checkStripeEntitlement(
  userId: string,
  feature: string
): Promise<boolean> {
  // 1. Get user's Stripe customer ID from database
  const user = await db.users.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) {
    return false; // Fail closed
  }
  
  // 2. Query Stripe API server-side
  const subscription = await stripe.subscriptions.retrieve(
    user.stripeSubscriptionId
  );
  
  // 3. Check entitlement from Stripe data
  return subscription.items.data.some(
    item => item.price.metadata.features?.includes(feature)
  );
}
```

**❌ Wrong**:
```typescript
// Trusting client claims about Stripe entitlements
export async function checkStripeEntitlement(req: Request) {
  const hasFeature = req.body.hasStripeFeature; // Client says so - NO!
  return hasFeature;
}
```

---

## RLS Policy Assumptions

**Requirement**: KEYS that use Supabase/Postgres RLS must document RLS assumptions.

**✅ Correct**:
```typescript
// KEY documents RLS assumptions
/**
 * This KEY assumes:
 * - RLS is enabled on the subscriptions table
 * - A policy exists that filters by tenant_id
 * - The app.tenant_id setting is set per request
 */
export async function getSubscriptions() {
  // RLS automatically filters by tenant_id
  return await db.subscriptions.findMany();
}
```

**Documentation Required**:
- Which tables use RLS
- What policies are assumed
- How tenant_id is set
- What happens if RLS is not configured

---

## Webhook Verification Rules

**Requirement**: All webhook handlers must verify signatures.

**Stripe Webhooks**:
```typescript
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**GitHub Webhooks**:
```typescript
const signature = req.headers['x-hub-signature-256'];
const isValid = verifyGitHubSignature(
  req.body,
  signature,
  process.env.GITHUB_WEBHOOK_SECRET
);
```

**Generic Webhooks**:
```typescript
const signature = req.headers['x-webhook-signature'];
const isValid = verifyWebhookSignature(
  req.body,
  signature,
  process.env.WEBHOOK_SECRET
);
```

---

## Security Checklist

Every KEY must satisfy:

- [ ] Tenant isolation enforced
- [ ] Authentication validated server-side
- [ ] Input validation on all inputs
- [ ] Never trusts client claims
- [ ] Fails closed on uncertainty
- [ ] Webhook signatures verified (if applicable)
- [ ] RLS policies documented (if applicable)
- [ ] Stripe entitlements verified server-side (if applicable)
- [ ] API keys never exposed client-side
- [ ] Errors don't leak sensitive information

---

## Version History

- **1.0.0** (2024-12-30): Initial security model definition
