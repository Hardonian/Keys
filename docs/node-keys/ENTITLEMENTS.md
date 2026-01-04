# Node / Next.js KEYS Entitlement Enforcement

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Entitlement enforcement model  
**Purpose**: Define how KEYS entitlements are enforced, audited, and revoked

---

## Core Principle

**Entitlements are enforced server-side only, never client-trusted.**

All entitlement checks:
- Happen on the server
- Are auditable
- Are revocable
- Never trust client claims

---

## Entitlement Types

### 1. One-Time Keys

**Definition**: Purchase once, own forever

**Characteristics**:
- **Purchase**: Single payment
- **Access**: Lifetime access to purchased key
- **Updates**: 1 year of updates included
- **Revocation**: Only on terms violation or refund

**Use Cases**:
- Individual developers
- Small projects
- One-off needs

**Enforcement**:
```typescript
// Server-side check
async function checkOneTimeEntitlement(
  userId: string,
  keySlug: string
): Promise<boolean> {
  const purchase = await db.oneTimePurchases.findOne({
    userId,
    keySlug,
    status: 'active'
  });
  
  return purchase !== null;
}
```

---

### 2. Subscription-Based Keys

**Definition**: Pay monthly/yearly, access while subscribed

**Characteristics**:
- **Purchase**: Recurring payment
- **Access**: Access while subscription active
- **Updates**: Ongoing updates while subscribed
- **Revocation**: On subscription cancellation or payment failure

**Use Cases**:
- Teams
- Ongoing projects
- Regular updates needed

**Enforcement**:
```typescript
// Server-side check
async function checkSubscriptionEntitlement(
  userId: string,
  keySlug: string
): Promise<boolean> {
  const subscription = await db.subscriptions.findOne({
    userId,
    keySlug,
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
  
  return subscription !== null;
}
```

---

### 3. Enterprise Licenses

**Definition**: Custom pricing, organizational access

**Characteristics**:
- **Purchase**: Custom contract
- **Access**: Organizational access (SSO, team management)
- **Updates**: Lifetime updates + priority support
- **Revocation**: On contract violation or expiration

**Use Cases**:
- Enterprise organizations
- Multi-user teams
- Custom requirements

**Enforcement**:
```typescript
// Server-side check
async function checkEnterpriseEntitlement(
  userId: string,
  keySlug: string
): Promise<boolean> {
  // Check user's organization
  const org = await db.organizations.findOne({
    members: userId,
    status: 'active'
  });
  
  if (!org) return false;
  
  // Check organization's enterprise license
  const license = await db.enterpriseLicenses.findOne({
    organizationId: org.id,
    keySlug,
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
  
  return license !== null;
}
```

---

## Enforcement Architecture

### Server-Side Only

**All checks happen on the server**:

```typescript
// ✅ CORRECT: Server-side check
export async function GET(request: Request) {
  const userId = await authenticate(request);
  const keySlug = request.params.keySlug;
  
  // Server-side entitlement check
  const hasAccess = await checkEntitlement(userId, keySlug);
  
  if (!hasAccess) {
    return new Response('Unauthorized', { status: 403 });
  }
  
  // Serve key content
  return serveKeyContent(keySlug);
}
```

```typescript
// ❌ WRONG: Client-side check
export async function GET(request: Request) {
  // Never trust client claims
  const clientClaimsAccess = request.headers.get('X-Has-Access');
  if (clientClaimsAccess === 'true') {
    // ❌ This is insecure!
    return serveKeyContent(keySlug);
  }
}
```

### Never Trust Client Claims

**Client claims are never trusted**:

- ❌ **Don't trust**: JWT claims without server validation
- ❌ **Don't trust**: Client-side flags
- ❌ **Don't trust**: URL parameters
- ✅ **Always validate**: Server-side database lookup

---

## Entitlement Check Flow

### Standard Check Flow

```
1. User requests key content
   ↓
2. Server authenticates user (JWT, API key)
   ↓
3. Server looks up entitlement in database
   ↓
4. Server validates entitlement status
   ↓
5. Server serves content OR returns 403
```

### Caching Strategy

**Cache entitlements for performance**:

```typescript
// Cache entitlements for 5 minutes
const entitlementCache = new Map<string, { 
  hasAccess: boolean; 
  expiresAt: number 
}>();

async function checkEntitlementCached(
  userId: string,
  keySlug: string
): Promise<boolean> {
  const cacheKey = `${userId}:${keySlug}`;
  const cached = entitlementCache.get(cacheKey);
  
  // Return cached if valid
  if (cached && cached.expiresAt > Date.now()) {
    return cached.hasAccess;
  }
  
  // Check database
  const hasAccess = await checkEntitlement(userId, keySlug);
  
  // Cache result
  entitlementCache.set(cacheKey, {
    hasAccess,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
  
  return hasAccess;
}
```

**Cache invalidation**:
- On purchase → Invalidate cache
- On subscription update → Invalidate cache
- On revocation → Invalidate cache
- On expiration → Cache expires naturally

---

## Audit Trail

### All Entitlement Actions Logged

**Log the following**:
1. **Purchase**: Who bought what, when, how much
2. **Access**: Who accessed what key, when
3. **Revocation**: Who revoked what, when, why
4. **Updates**: Who received updates, when

**Audit Log Schema**:
```typescript
interface EntitlementAuditLog {
  id: string;
  userId: string;
  keySlug: string;
  action: 'purchase' | 'access' | 'revoke' | 'update';
  timestamp: Date;
  metadata: {
    purchaseId?: string;
    subscriptionId?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}
```

### Audit Log Access

**Audit logs accessible via**:
1. **API**: `/api/audit/entitlements`
2. **Dashboard**: Enterprise dashboard
3. **Export**: CSV/JSON export for compliance
4. **Retention**: 7 years for compliance

---

## Revocation Scenarios

### 1. Subscription Expired

**Scenario**: User's subscription expires

**Action**:
1. Mark subscription as expired
2. Invalidate entitlement cache
3. Return 403 on next access
4. Send expiration notification

**Recovery**: User renews subscription

---

### 2. Payment Failed

**Scenario**: User's payment fails

**Action**:
1. Mark subscription as past_due
2. Grace period: 7 days
3. After grace period: Revoke access
4. Send payment failure notification

**Recovery**: User updates payment method

---

### 3. Terms Violation

**Scenario**: User violates terms of service

**Action**:
1. Review violation
2. Issue warning (first offense)
3. Revoke access (repeat offense)
4. Log revocation reason

**Recovery**: Appeal process, terms compliance

---

### 4. Refund Issued

**Scenario**: User requests and receives refund

**Action**:
1. Process refund
2. Revoke access immediately
3. Log refund reason
4. Send refund confirmation

**Recovery**: User repurchases

---

### 5. Enterprise Contract Expired

**Scenario**: Enterprise contract expires

**Action**:
1. Mark license as expired
2. Grace period: 30 days
3. After grace period: Revoke organizational access
4. Notify organization admin

**Recovery**: Organization renews contract

---

## Revocation Implementation

### Immediate Revocation

```typescript
async function revokeEntitlement(
  userId: string,
  keySlug: string,
  reason: string
): Promise<void> {
  // 1. Update database
  await db.entitlements.updateOne(
    { userId, keySlug },
    { 
      status: 'revoked',
      revokedAt: new Date(),
      revocationReason: reason
    }
  );
  
  // 2. Invalidate cache
  entitlementCache.delete(`${userId}:${keySlug}`);
  
  // 3. Log audit trail
  await db.auditLogs.insertOne({
    userId,
    keySlug,
    action: 'revoke',
    timestamp: new Date(),
    metadata: { reason }
  });
  
  // 4. Notify user (optional)
  await sendNotification(userId, {
    type: 'entitlement_revoked',
    keySlug,
    reason
  });
}
```

### Grace Period Revocation

```typescript
async function revokeWithGracePeriod(
  userId: string,
  keySlug: string,
  gracePeriodDays: number
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + gracePeriodDays);
  
  await db.entitlements.updateOne(
    { userId, keySlug },
    { 
      status: 'grace_period',
      expiresAt,
      notifiedAt: new Date()
    }
  );
  
  // Schedule revocation job
  await scheduleJob('revoke-entitlement', {
    userId,
    keySlug,
    executeAt: expiresAt
  });
}
```

---

## Entitlement API

### Check Entitlement

```typescript
// GET /api/entitlements/:keySlug
export async function GET(request: Request) {
  const userId = await authenticate(request);
  const keySlug = request.params.keySlug;
  
  const hasAccess = await checkEntitlement(userId, keySlug);
  
  return Response.json({
    hasAccess,
    keySlug,
    userId
  });
}
```

### List Entitlements

```typescript
// GET /api/entitlements
export async function GET(request: Request) {
  const userId = await authenticate(request);
  
  const entitlements = await db.entitlements.find({
    userId,
    status: 'active'
  });
  
  return Response.json({
    entitlements: entitlements.map(e => ({
      keySlug: e.keySlug,
      type: e.type,
      expiresAt: e.expiresAt,
      purchasedAt: e.purchasedAt
    }))
  });
}
```

---

## Security Considerations

### API Key Security

**API keys must**:
- Be stored securely (encrypted at rest)
- Be rotated regularly (90 days)
- Be revoked on compromise
- Never be logged or exposed

### JWT Security

**JWT tokens must**:
- Be signed with secret key
- Have expiration (1 hour)
- Be validated on every request
- Never contain sensitive data

### Database Security

**Database must**:
- Use RLS (Row-Level Security)
- Encrypt sensitive fields
- Audit all access
- Backup regularly

---

## Compliance

### GDPR Compliance

**Entitlement data**:
- User can export their entitlement data
- User can request deletion (with retention requirements)
- Data is encrypted at rest and in transit
- Access is logged and auditable

### SOC 2 Compliance

**Entitlement controls**:
- Access controls enforced
- Audit logs maintained
- Change management documented
- Security monitoring active

---

## Version History

- **1.0.0** (2024-12-30): Initial entitlement enforcement model
