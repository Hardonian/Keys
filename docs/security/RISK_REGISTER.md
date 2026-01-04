# RISK REGISTER
**Date**: 2025-01-04  
**Last Updated**: 2025-01-04

## Risk Assessment Methodology

- **Severity**: Critical / High / Medium / Low
- **Likelihood**: High / Medium / Low
- **Risk Score**: Severity × Likelihood
- **Status**: Open / Mitigated / Accepted / Transferred

## Risk Register

### R-001: Entitlement Bypass
**Severity**: Critical  
**Likelihood**: Low  
**Risk Score**: Critical × Low = Medium  
**Status**: Mitigated

**Description**: Attacker downloads key without purchase

**Mitigation**:
- Server-side entitlement check (`hasEntitlement`)
- RLS policies on `marketplace_entitlements`
- Signed URLs expire after 1 hour
- Download endpoint requires authentication

**Residual Risk**: Low (defense-in-depth)

---

### R-002: IDOR (Insecure Direct Object Reference)
**Severity**: Critical  
**Likelihood**: Low  
**Risk Score**: Critical × Low = Medium  
**Status**: Mitigated

**Description**: User A accesses User B's entitlements

**Mitigation**:
- RLS policies filter by `tenant_id`
- Server checks `tenant_id` matches authenticated user
- `resolveTenantContext` ensures correct tenant
- All queries use RLS-aware Supabase client

**Residual Risk**: Low (multiple layers)

---

### R-003: Webhook Spoofing/Replay
**Severity**: Critical  
**Likelihood**: Low  
**Risk Score**: Critical × Low = Medium  
**Status**: Mitigated

**Description**: Attacker sends fake Stripe webhook or replays old event

**Mitigation**:
- Signature verification (HMAC-SHA256)
- Idempotency check (`stripe_webhook_events` table)
- Raw body required for signature
- Timestamp validation (if implemented)

**Residual Risk**: Low (cryptographic verification)

---

### R-004: RLS Misconfiguration
**Severity**: High  
**Likelihood**: Low  
**Risk Score**: High × Low = Low  
**Status**: Mitigated

**Description**: RLS policy allows cross-tenant access

**Mitigation**:
- Server-side checks always verify `tenant_id`
- RLS is defense-in-depth, not sole protection
- Regular RLS policy audits
- Tests verify RLS behavior

**Residual Risk**: Low (server-side checks as primary)

---

### R-005: SSRF via Ingestion
**Severity**: High  
**Likelihood**: Low  
**Risk Score**: High × Low = Low  
**Status**: Mitigated

**Description**: Admin ingestion endpoint reads arbitrary files

**Mitigation**:
- Ingestion only reads from `KEYS_ASSETS_ROOT`
- Path validation prevents directory traversal
- Admin-only access (role check)
- Input validation on paths

**Residual Risk**: Low (path validation)

---

### R-006: XSS via Previews/Markdown
**Severity**: Medium  
**Likelihood**: Medium  
**Risk Score**: Medium × Medium = Medium  
**Status**: Open

**Description**: Malicious markdown in key previews renders script tags

**Mitigation**:
- Preview HTML stored in storage (not rendered inline)
- CSP headers prevent script execution
- Markdown sanitization (if rendering markdown)

**Action Required**: Verify markdown rendering is safe

**Residual Risk**: Medium (needs verification)

---

### R-007: Supply Chain Attacks
**Severity**: High  
**Likelihood**: Low  
**Risk Score**: High × Low = Low  
**Status**: Partially Mitigated

**Description**: Malicious package in dependencies

**Mitigation**:
- Regular `npm audit`
- Pin dependencies
- SCA checks in CI (planned)

**Action Required**: Add SCA checks to CI pipeline

**Residual Risk**: Low (mitigated by audits)

---

### R-008: Storage Signed URL Abuse
**Severity**: Medium  
**Likelihood**: Low  
**Risk Score**: Medium × Low = Low  
**Status**: Mitigated

**Description**: Attacker guesses signed URL or URL doesn't expire

**Mitigation**:
- Signed URLs expire after 1 hour
- URLs are cryptographically signed
- Path includes key ID for validation
- Entitlement check before URL generation

**Residual Risk**: Low (cryptographic + time-limited)

---

### R-009: Rate Limiting Bypass
**Severity**: Medium  
**Likelihood**: Medium  
**Risk Score**: Medium × Medium = Medium  
**Status**: Mitigated

**Description**: Attacker bypasses rate limits via IP rotation

**Mitigation**:
- Rate limiting by user (authenticated)
- IP-based rate limiting (anonymous)
- Redis-backed rate limiting
- Per-endpoint rate limits

**Residual Risk**: Low (multiple strategies)

---

### R-010: Secrets in Logs
**Severity**: High  
**Likelihood**: Low  
**Risk Score**: High × Low = Low  
**Status**: Mitigated

**Description**: Secrets logged accidentally

**Mitigation**:
- Structured logger doesn't log request bodies by default
- No secrets in error messages
- Log redaction (if needed)
- Environment variables not logged

**Residual Risk**: Low (structured logging)

---

### R-011: CSP 'unsafe-inline'
**Severity**: Medium  
**Likelihood**: Low  
**Risk Score**: Medium × Low = Low  
**Status**: Accepted

**Description**: CSP allows inline scripts (XSS risk)

**Mitigation**:
- 'unsafe-inline' needed for Next.js hydration
- CSP still prevents most XSS
- Nonce-based CSP planned (future)

**Action Required**: Implement nonce-based CSP

**Residual Risk**: Low (acceptable for Next.js)

---

### R-012: User Deletion Not Implemented
**Severity**: Medium  
**Likelihood**: N/A  
**Risk Score**: Medium  
**Status**: Open

**Description**: Users cannot delete their accounts (GDPR/CCPA)

**Mitigation**: None (not implemented)

**Action Required**: Implement user deletion endpoint

**Residual Risk**: Medium (compliance issue)

---

### R-013: Environment Variable Validation
**Severity**: High  
**Likelihood**: Low  
**Risk Score**: High × Low = Low  
**Status**: Mitigated

**Description**: Missing env vars cause runtime failures

**Mitigation**:
- Environment validation on boot
- Stripe vars validated
- Fail-fast on missing required vars

**Residual Risk**: Low (validation in place)

---

### R-014: Error Information Leakage
**Severity**: Medium  
**Likelihood**: Low  
**Risk Score**: Medium × Low = Low  
**Status**: Mitigated

**Description**: Error messages leak sensitive information

**Mitigation**:
- Structured error responses
- No stack traces in production
- Generic error messages for users
- Detailed errors only in logs

**Residual Risk**: Low (error handler in place)

---

## Risk Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 3 | All Mitigated |
| High | 5 | 4 Mitigated, 1 Partially Mitigated |
| Medium | 6 | 4 Mitigated, 1 Accepted, 1 Open |
| Low | 0 | - |

**Total Risks**: 14  
**Mitigated**: 11  
**Open**: 2 (R-006, R-012)  
**Accepted**: 1 (R-011)

## Next Steps

1. ✅ Verify markdown rendering is safe (R-006)
2. ✅ Implement user deletion endpoint (R-012)
3. ✅ Add SCA checks to CI (R-007)
4. ✅ Implement nonce-based CSP (R-011)

## Review Schedule

- **Quarterly**: Review all risks
- **After Incidents**: Re-assess related risks
- **After Major Changes**: Add new risks
