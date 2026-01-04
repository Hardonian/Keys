# THREAT MODEL
**Date**: 2025-01-04  
**Scope**: KEYS Marketplace + Discovery MVP

## Assets

### High-Value Assets
1. **User Data**
   - Email addresses, user IDs
   - Organization memberships
   - Entitlement records (what users/orgs own)

2. **Marketplace Keys**
   - Key metadata (titles, descriptions, pricing)
   - Key assets (ZIP files, previews)
   - Download URLs (signed, time-limited)

3. **Financial Data**
   - Stripe customer IDs
   - Purchase records
   - Subscription status

4. **System Integrity**
   - Entitlement enforcement (access control)
   - Webhook processing (idempotency)
   - Ingestion pipeline (admin-only)

## Actors

1. **Anonymous Users**
   - Can browse marketplace
   - Cannot download keys
   - Cannot access admin functions

2. **Authenticated Users**
   - Can purchase keys
   - Can download owned keys
   - Can view own entitlements

3. **Organization Members**
   - Share entitlements at org level
   - Admin can manage members

4. **Admins**
   - Can ingest keys
   - Can view analytics
   - Can manage marketplace

5. **Attackers**
   - External attackers (no auth)
   - Authenticated attackers (IDOR attempts)
   - Malicious webhook senders

## Entry Points

1. **Frontend (Next.js)**
   - `/marketplace/*` - Public listing
   - `/marketplace/keys/:slug` - Key details
   - `/marketplace/keys/:slug/download` - Download (auth required)
   - `/account/billing` - Billing portal

2. **Backend API (Express)**
   - `POST /billing/webhook` - Stripe webhooks
   - `POST /marketplace/admin/ingest` - Admin ingestion
   - `GET /marketplace/keys` - Public listing
   - `POST /marketplace/keys/:slug/download` - Download gating

3. **Database (Supabase PostgreSQL)**
   - RLS policies enforce tenant isolation
   - Service role key (backend only)

4. **Storage (Supabase Storage)**
   - Signed URLs for downloads
   - Bucket: `marketplace`

## Trust Boundaries

1. **Browser ↔ Frontend**
   - HTTPS required
   - JWT tokens in cookies (httpOnly)
   - Public routes accessible without auth

2. **Frontend ↔ Backend**
   - API calls authenticated via Bearer token
   - CORS configured
   - Rate limiting

3. **Backend ↔ Supabase**
   - Service role key (high privilege)
   - RLS policies enforce tenant isolation
   - Server-side checks double-check RLS

4. **Stripe ↔ Backend**
   - Webhook signature verification (HMAC)
   - Raw body required for verification
   - Idempotency keys prevent replay

5. **Admin ↔ Ingestion**
   - Role-based access control (admin/superadmin)
   - Request signing (optional, for sensitive ops)

## Abuse Cases

### 1. Entitlement Bypass
**Scenario**: Attacker tries to download key without purchase
- **Mitigation**: 
  - Server-side entitlement check (`hasEntitlement`)
  - RLS policies on `marketplace_entitlements`
  - Signed URLs expire after 1 hour
- **Status**: ✅ Protected

### 2. IDOR (Insecure Direct Object Reference)
**Scenario**: User A tries to access User B's entitlements
- **Mitigation**:
  - RLS policies filter by `tenant_id`
  - Server checks `tenant_id` matches authenticated user
  - `resolveTenantContext` ensures correct tenant
- **Status**: ✅ Protected

### 3. Webhook Spoofing/Replay
**Scenario**: Attacker sends fake Stripe webhook or replays old event
- **Mitigation**:
  - Signature verification (HMAC-SHA256)
  - Idempotency check (`stripe_webhook_events` table)
  - Raw body required for signature
- **Status**: ✅ Protected

### 4. RLS Misconfiguration
**Scenario**: RLS policy allows cross-tenant access
- **Mitigation**:
  - Server-side checks always verify `tenant_id`
  - RLS is defense-in-depth, not sole protection
  - Regular RLS policy audits
- **Status**: ✅ Protected (defense-in-depth)

### 5. SSRF via Ingestion
**Scenario**: Admin ingestion endpoint reads arbitrary files
- **Mitigation**:
  - Ingestion only reads from `KEYS_ASSETS_ROOT`
  - Path validation prevents directory traversal
  - Admin-only access
- **Status**: ✅ Protected

### 6. XSS via Previews/Markdown
**Scenario**: Malicious markdown in key previews renders script tags
- **Mitigation**:
  - Markdown sanitization (if rendering markdown)
  - CSP headers prevent script execution
  - Preview HTML stored in storage, not rendered inline
- **Status**: ⚠️ Needs verification (check markdown rendering)

### 7. Supply Chain Attacks
**Scenario**: Malicious package in dependencies
- **Mitigation**:
  - Regular `npm audit`
  - Pin dependencies
  - SCA checks in CI (planned)
- **Status**: ⚠️ Needs CI integration

### 8. Storage Signed URL Abuse
**Scenario**: Attacker guesses signed URL or URL doesn't expire
- **Mitigation**:
  - Signed URLs expire after 1 hour
  - URLs are cryptographically signed
  - Path includes key ID for validation
- **Status**: ✅ Protected

### 9. Rate Limiting Bypass
**Scenario**: Attacker bypasses rate limits via IP rotation
- **Mitigation**:
  - Rate limiting by user (authenticated)
  - IP-based rate limiting (anonymous)
  - Redis-backed rate limiting
- **Status**: ✅ Protected

### 10. Secrets in Logs
**Scenario**: Secrets logged accidentally
- **Mitigation**:
  - Structured logger doesn't log request bodies by default
  - No secrets in error messages
  - Log redaction (if needed)
- **Status**: ✅ Protected (review logs)

## Security Controls

### Authentication
- ✅ Supabase Auth (JWT)
- ✅ Token verification in middleware
- ✅ Optional auth for public routes

### Authorization
- ✅ Role-based access control (`requireRole`)
- ✅ Tenant-level isolation (RLS + server checks)
- ✅ Entitlement checks on all downloads

### Input Validation
- ✅ Zod schemas on all inputs
- ✅ Query param validation (some missing)
- ✅ File path validation in ingestion

### Output Encoding
- ✅ JSON responses (automatic encoding)
- ⚠️ Markdown rendering (needs verification)

### Error Handling
- ✅ Structured error responses
- ✅ No stack traces in production
- ✅ Request ID correlation

### Logging
- ✅ Structured logging
- ✅ Request ID tracking
- ✅ No PII in logs (review needed)

### Monitoring
- ✅ Error tracking (Sentry)
- ✅ Request logging
- ⚠️ Security event alerts (needs implementation)

## Residual Risks

1. **CSP 'unsafe-inline'** - Medium risk, acceptable for Next.js
2. **Markdown XSS** - Low risk if previews are static HTML
3. **Supply Chain** - Medium risk, mitigated by audits
4. **Request Signing** - Low risk, optional for non-Stripe endpoints

## Next Steps

1. Verify markdown rendering is safe
2. Add security event alerts
3. Implement CSP nonces (future)
4. Add SCA checks to CI
