# Marketplace Security Model

**Version**: 1.0.0  
**Last Updated**: 2024-12-19

This document outlines the security architecture for the Notebook Pack Library marketplace hosted in Keys.

## Principles

1. **Never trust the client** - All entitlement checks are server-side
2. **Least privilege** - RLS policies enforce tenant isolation
3. **Defense in depth** - Multiple layers of security checks
4. **Privacy by design** - IP addresses hashed, user agents truncated

## Row-Level Security (RLS) Policies

### marketplace_packs

- **Public Read**: Anyone can read pack metadata (title, description, etc.)
- **Service Role Write**: Only service role can insert/update/delete packs
- **Rationale**: Pack metadata is public; only admins can publish

### marketplace_entitlements

- **Tenant Read**: Users can view entitlements for their org or themselves
- **Service Role Write**: Only service role can grant/revoke entitlements
- **Tenant Isolation**: Users cannot see entitlements for other orgs/users

**Policy Logic**:
```sql
-- User-level entitlements
tenant_type = 'user' AND tenant_id = auth.uid()
OR
-- Org-level entitlements (user is member)
tenant_type = 'org' AND EXISTS (
  SELECT 1 FROM organization_members
  WHERE org_id = marketplace_entitlements.tenant_id
  AND user_id = auth.uid()
)
```

### marketplace_download_events

- **Tenant Admin Read**: Org admins/owners can view download events for their org
- **Service Role Write**: Only service role can insert events
- **Privacy**: IP addresses are SHA256 hashed, user agents truncated to 500 chars

## Entitlement Verification

### Download Flow

1. **Authentication Check**: User must be authenticated (JWT token)
2. **Tenant Resolution**: Resolve user's primary tenant (org or user)
3. **Entitlement Check**: Query `marketplace_entitlements` with RLS
4. **Expiration Check**: Verify `ends_at` is not in the past
5. **Signed URL Generation**: Generate time-limited signed URL (1 hour expiry)
6. **Download Logging**: Log event with hashed IP and truncated user agent

### Preview Flow

- If `preview_public: true`: No auth required
- If `preview_public: false`: Same entitlement check as download

### Server-Side Enforcement

All entitlement checks happen server-side in `/marketplace/packs/:slug/download`:

```typescript
// Never trust client claims
const entitlementCheck = await hasEntitlement(
  tenant.tenantId,
  tenant.tenantType,
  pack.id
);

if (!entitlementCheck.hasAccess) {
  return res.status(403).json({ error: 'Access denied' });
}
```

## Signed URLs

### Storage Access

- ZIP files are **never** publicly accessible
- Signed URLs generated server-side after entitlement check
- Expiry: 1 hour (3600 seconds)
- Format: Supabase Storage signed URL

### Security Properties

- Time-limited (prevents link sharing)
- Single-use intent (though Supabase doesn't enforce single-use)
- Server-verified (entitlement checked before URL generation)

## Stripe Webhook Security

### Signature Verification

```typescript
const sig = req.headers['stripe-signature'];
const rawBody = req.body; // Must be raw Buffer
event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
```

### Idempotency

- Webhook handlers are idempotent (upsert operations)
- Duplicate events are safe to process
- Entitlements use `ON CONFLICT` upsert

### Event Handling

1. **checkout.session.completed**:
   - Verify signature
   - Extract `packSlug`/`packId` from metadata
   - Grant entitlement to tenant
   - Link Stripe subscription ID (if applicable)

2. **customer.subscription.updated/deleted**:
   - Update entitlement status based on subscription status
   - Set `ends_at` if subscription canceled

## Admin Publishing Security

### Authentication

- Admin routes require `authMiddleware` (JWT verification)
- TODO: Add role-based check (`requireRole('admin')`)

### Validation

- `library.json` validated with Zod schema
- Asset paths validated (must match expected structure)
- SHA256 hashes validated (64 hex characters)

### Transaction Safety

- Each pack processed independently
- Failures don't corrupt other packs
- Results returned per-pack (success/error)

## Privacy

### IP Address Hashing

```typescript
const ipHash = createHash('sha256').update(ip).digest('hex');
```

- Original IP never stored
- Hash used for analytics/abuse detection
- Cannot reverse to original IP

### User Agent Truncation

```typescript
const truncated = userAgent.substring(0, 500);
```

- Prevents storage bloat
- Preserves essential info (browser, OS)
- Truncated with "..." if exceeds limit

## Threat Model

### Threat: Unauthorized Downloads

**Mitigation**:
- Server-side entitlement checks
- Signed URLs with expiry
- RLS prevents entitlement bypass

### Threat: Webhook Replay Attacks

**Mitigation**:
- Stripe signature verification
- Idempotent handlers (safe to replay)
- Event deduplication (Stripe handles)

### Threat: Client-Side Bypass

**Mitigation**:
- All checks server-side
- No client-side entitlement flags trusted
- API requires authentication token

### Threat: Storage Link Sharing

**Mitigation**:
- Signed URLs expire after 1 hour
- URLs generated per-request (not cached)
- Entitlement checked before each URL generation

## Audit Trail

### Download Events

Every download is logged with:
- Tenant ID and type
- User ID
- Pack ID and version
- Hashed IP
- Truncated user agent
- Timestamp

### Admin Actions

Admin publishing actions should be logged (TODO: integrate with audit log service).

## Compliance

### GDPR

- IP addresses hashed (not personally identifiable)
- User agents truncated
- Download events can be deleted per user request

### Data Retention

- Download events: Retain for 90 days (configurable)
- Entitlements: Retain while active, archive on revocation

## Security Checklist

- [x] RLS policies on all tables
- [x] Server-side entitlement checks
- [x] Signed URLs with expiry
- [x] Stripe webhook signature verification
- [x] IP address hashing
- [x] User agent truncation
- [x] Idempotent webhook handlers
- [ ] Admin role-based access control
- [ ] Rate limiting on download endpoints
- [ ] Audit logging for admin actions
