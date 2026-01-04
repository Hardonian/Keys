# Node / Next.js KEY Failure Modes

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Defines failure handling for all Node/Next KEYS  
**Purpose**: Ensure graceful degradation and prevent host app crashes

---

## Core Principle

**No Node / Next.js KEY may crash the host app. Ever.**

Every KEY must handle failures gracefully, degrade gracefully, and never introduce fragility.

---

## Mandatory Failure Handling

### 1. Missing Environment Variables

**Requirement**: KEY must fail fast with clear error if required env vars are missing.

**✅ Correct**:
```typescript
// KEY validates env vars on import
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error(
    'STRIPE_SECRET_KEY is required. ' +
    'Please set it in your environment variables. ' +
    'See README.md for configuration instructions.'
  );
}

export function stripeWebhookHandler(req: Request) {
  // Use STRIPE_SECRET_KEY safely
}
```

**❌ Wrong**:
```typescript
// KEY silently fails or crashes later
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export function stripeWebhookHandler(req: Request) {
  // Crashes with "Cannot read property of undefined" - NO!
  const stripe = new Stripe(STRIPE_SECRET_KEY);
}
```

**Failure Mode**: Missing env var → Clear error on import/initialization

**Host App Impact**: Build fails with clear error (preferred) or runtime fails fast with clear error

---

### 2. Database Unreachable

**Requirement**: KEY must handle database errors gracefully.

**✅ Correct**:
```typescript
export async function auditLogHandler(req: Request) {
  try {
    const logs = await db.auditLogs.findMany();
    return Response.json({ logs });
  } catch (error) {
    // Log error for debugging
    console.error('Database error:', error);
    
    // Return graceful error response
    return Response.json(
      { error: 'Unable to fetch audit logs. Please try again later.' },
      { status: 503 }
    );
  }
}
```

**❌ Wrong**:
```typescript
// KEY crashes on database error
export async function auditLogHandler(req: Request) {
  // Throws unhandled error - crashes host app - NO!
  const logs = await db.auditLogs.findMany();
  return Response.json({ logs });
}
```

**Failure Mode**: Database unreachable → Graceful error response (503)

**Host App Impact**: Route returns error response, app continues to function

---

### 3. External Service Failure (Stripe, APIs, etc.)

**Requirement**: KEY must handle external service failures gracefully.

**✅ Correct**:
```typescript
export async function checkStripeEntitlement(
  userId: string,
  feature: string
): Promise<boolean> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription.items.data.some(
      item => item.price.metadata.features?.includes(feature)
    );
  } catch (error) {
    // Log error for debugging
    console.error('Stripe API error:', error);
    
    // Fail closed: deny access on uncertainty
    return false;
  }
}
```

**❌ Wrong**:
```typescript
// KEY crashes on external service failure
export async function checkStripeEntitlement(
  userId: string,
  feature: string
): Promise<boolean> {
  // Throws unhandled error - crashes host app - NO!
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription.items.data.some(
    item => item.price.metadata.features?.includes(feature)
  );
}
```

**Failure Mode**: External service unreachable → Fail closed (deny access)

**Host App Impact**: Feature unavailable, app continues to function

---

### 4. Missing Dependencies

**Requirement**: KEY must fail fast with clear error if dependencies are missing.

**✅ Correct**:
```typescript
// KEY checks for dependencies on import
try {
  require('stripe');
} catch {
  throw new Error(
    'stripe package is required. ' +
    'Please install it: npm install stripe'
  );
}

export function stripeWebhookHandler(req: Request) {
  // Use stripe safely
}
```

**❌ Wrong**:
```typescript
// KEY crashes when dependency is used
import Stripe from 'stripe'; // Crashes if not installed - NO!

export function stripeWebhookHandler(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}
```

**Failure Mode**: Missing dependency → Clear error on import

**Host App Impact**: Build fails with clear error

---

### 5. Invalid Configuration

**Requirement**: KEY must validate configuration and fail fast with clear error.

**✅ Correct**:
```typescript
export function initializeKey(config: KeyConfig) {
  // Validate configuration
  if (!config.apiKey || typeof config.apiKey !== 'string') {
    throw new Error(
      'Invalid configuration: apiKey is required and must be a string. ' +
      'See README.md for configuration instructions.'
    );
  }
  
  // Use config safely
  return new KeyClient(config);
}
```

**❌ Wrong**:
```typescript
// KEY uses invalid config silently
export function initializeKey(config: KeyConfig) {
  // Uses undefined apiKey - fails mysteriously later - NO!
  return new KeyClient(config);
}
```

**Failure Mode**: Invalid config → Clear error on initialization

**Host App Impact**: Initialization fails with clear error

---

## Failure Mode Patterns by KEY Type

### Route KEYS

**Failure Modes**:
1. Missing env vars → 500 error with clear message
2. Database error → 503 error (service unavailable)
3. External API error → 503 error or fail closed
4. Invalid input → 400 error (bad request)
5. Auth failure → 401 error (unauthorized)

**Example**:
```typescript
export async function stripeWebhookHandler(req: Request) {
  try {
    // Validate env vars
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return Response.json(
        { error: 'STRIPE_WEBHOOK_SECRET is not configured' },
        { status: 500 }
      );
    }
    
    // Verify signature
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return Response.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }
    
    // Validate input
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Process webhook
    await processWebhook(event);
    
    return Response.json({ received: true });
  } catch (error) {
    // Handle all errors gracefully
    if (error.type === 'StripeSignatureVerificationError') {
      return Response.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Log error for debugging
    console.error('Webhook processing error:', error);
    
    // Return graceful error
    return Response.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

---

### Job KEYS

**Failure Modes**:
1. Missing env vars → Log error, skip job execution
2. Database error → Log error, continue to next item
3. External API error → Log error, retry or skip
4. Timeout → Log error, continue

**Example**:
```typescript
export async function reconciliationJob() {
  // Validate env vars
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not configured. Skipping job.');
    return;
  }
  
  try {
    const tenants = await getActiveTenants();
    
    for (const tenant of tenants) {
      try {
        await reconcileTenantData(tenant.id);
      } catch (error) {
        // Log error, continue to next tenant
        console.error(
          `Reconciliation failed for tenant ${tenant.id}:`,
          error
        );
        // Don't throw - continue processing other tenants
      }
    }
  } catch (error) {
    // Log error, don't crash
    console.error('Reconciliation job failed:', error);
    // Don't throw - job runner handles retries
  }
}
```

---

### Data KEYS

**Failure Modes**:
1. Missing env vars → Throw error (migrations must be explicit)
2. Database error → Throw error (migrations must succeed or fail)
3. Invalid schema → Throw error with clear message
4. Migration conflict → Throw error with resolution steps

**Example**:
```typescript
export async function createRLSPolicies() {
  // Validate env vars
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is required for migrations. ' +
      'Please set it in your environment variables.'
    );
  }
  
  try {
    await db.query(`
      CREATE POLICY tenant_isolation ON subscriptions
      FOR ALL
      USING (tenant_id = current_setting('app.tenant_id')::uuid);
    `);
  } catch (error) {
    // Check if policy already exists
    if (error.code === '42P07') {
      console.warn('RLS policy already exists. Skipping.');
      return;
    }
    
    // Re-throw other errors (migrations must be explicit)
    throw new Error(
      `Failed to create RLS policies: ${error.message}. ` +
      'See CHANGELOG.md for migration instructions.'
    );
  }
}
```

---

### UI KEYS

**Failure Modes**:
1. Missing data → Show empty state or error message
2. API error → Show error message, don't crash
3. Loading state → Show loading indicator
4. Invalid props → Show error message

**Example**:
```typescript
export async function AuditLogWidget() {
  try {
    const logs = await db.auditLogs.findMany();
    return <AuditLogList logs={logs} />;
  } catch (error) {
    // Log error for debugging
    console.error('Failed to load audit logs:', error);
    
    // Show error UI, don't crash
    return (
      <div className="error">
        <p>Unable to load audit logs. Please try again later.</p>
      </div>
    );
  }
}
```

---

### Integration KEYS

**Failure Modes**:
1. Missing API keys → Throw error on initialization
2. API error → Return error or fail closed
3. Rate limit → Return error or queue request
4. Timeout → Return error or retry

**Example**:
```typescript
export async function verifyStripeWebhook(
  signature: string,
  body: string
): Promise<boolean> {
  // Validate env vars
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is required. ' +
      'Please set it in your environment variables.'
    );
  }
  
  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    return true;
  } catch (error) {
    // Log error for debugging
    console.error('Webhook verification failed:', error);
    
    // Fail closed: invalid signature
    return false;
  }
}
```

---

## Graceful Degradation Strategies

### Strategy 1: Fail Fast with Clear Errors

**When**: Missing configuration, invalid setup

**How**: Throw error on initialization with clear message

**Example**: Missing env vars → Error on import/initialization

---

### Strategy 2: Fail Closed (Deny Access)

**When**: Uncertainty about authorization, external service failure

**How**: Return false/deny access, log error

**Example**: Stripe API error → Deny entitlement, log error

---

### Strategy 3: Fail Gracefully (Return Error Response)

**When**: Request processing failure

**How**: Return error response (400, 401, 500, 503), don't throw

**Example**: Database error → 503 response, app continues

---

### Strategy 4: Skip and Continue

**When**: Batch processing, non-critical failures

**How**: Log error, skip item, continue processing

**Example**: Job processing → Skip failed tenant, continue others

---

### Strategy 5: Show Error UI

**When**: UI component failure

**How**: Show error message, don't crash

**Example**: Component data fetch fails → Show error message

---

## Error Message Standards

**All error messages must**:
1. Be clear and actionable
2. Include context (what failed, why)
3. Provide next steps (how to fix)
4. Reference documentation (README.md, etc.)

**✅ Good Error Messages**:
```
"STRIPE_SECRET_KEY is required. Please set it in your environment variables. See README.md for configuration instructions."
```

```
"Database connection failed. Please check your DATABASE_URL and ensure the database is accessible. See troubleshooting.md for common issues."
```

**❌ Bad Error Messages**:
```
"Error"
```

```
"undefined is not a function"
```

```
"Failed"
```

---

## Host App Protection

**No KEY may**:
- Crash the host app
- Break the build silently
- Introduce unhandled promise rejections
- Cause memory leaks
- Block the event loop
- Break existing functionality

**Every KEY must**:
- Handle all errors
- Fail gracefully
- Log errors for debugging
- Provide clear error messages
- Not interfere with host app

---

## Testing Failure Modes

**Every KEY must test**:
- Missing env vars
- Database errors
- External service failures
- Invalid inputs
- Missing dependencies
- Timeout scenarios

**Example Test**:
```typescript
describe('stripeWebhookHandler', () => {
  it('should fail gracefully when STRIPE_WEBHOOK_SECRET is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    
    const response = await stripeWebhookHandler(request);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining('STRIPE_WEBHOOK_SECRET')
    });
  });
  
  it('should handle database errors gracefully', async () => {
    // Mock database error
    db.auditLogs.findMany.mockRejectedValue(new Error('Database error'));
    
    const response = await auditLogHandler(request);
    
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining('Unable to fetch')
    });
  });
});
```

---

## Version History

- **1.0.0** (2024-12-30): Initial failure modes definition
