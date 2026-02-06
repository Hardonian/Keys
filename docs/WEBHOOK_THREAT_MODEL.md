# Webhook Security Threat Model

## Overview

This document outlines the threat model for webhook endpoints in the Keys application. Webhooks are critical security boundaries that accept external requests and trigger internal actions. This threat model identifies potential attack vectors and the security controls implemented to mitigate them.

## System Context

```
External Providers              Keys Application
┌─────────────────┐            ┌─────────────────────┐
│ GitHub/GitLab   │───POST──▶│ /webhooks/code-repo │
│ Bitbucket       │            └─────────────────────┘
│ Stripe          │───POST──▶│ /billing/webhook    │
│ Supabase        │───POST──▶│ /webhooks/supabase  │
└─────────────────┘            └─────────────────────┘
```

## Trust Boundaries

| Boundary | Description | Trust Level |
|----------|-------------|-------------|
| External → Webhook Endpoints | Untrusted internet requests | Zero trust |
| Webhook → Internal Services | Processed, validated requests | Medium trust |
| Database → Event Storage | Verified, idempotent records | High trust |

## Identified Threats

### 1. Unauthorized Execution (T-ID-001)

**Description**: Attacker sends crafted requests to trigger unintended actions without proper authorization.

**Attack Vector**:
- Forge webhook payloads without valid signature
- Replay captured legitimate requests
- Inject malicious data in payload

**Mitigation Controls**:
- ✅ HMAC-SHA256 signature verification (GitHub, Stripe, Bitbucket)
- ✅ Timing-safe signature comparison
- ✅ Token-based verification (GitLab)
- ✅ Required signature headers
- ✅ 401 Unauthorized response on invalid/missing signature

**Residual Risk**: Low - Strong cryptographic verification

**Severity**: Critical

### 2. Replay Attacks (T-ID-002)

**Description**: Attacker captures valid webhook delivery and re-submits it to trigger duplicate actions.

**Attack Vector**:
- Capture legitimate webhook delivery
- Resend identical request multiple times
- Exploit timing windows

**Mitigation Controls**:
- ✅ Unique delivery IDs per event (GitHub X-GitHub-Delivery)
- ✅ Idempotency database table (`webhook_events`)
- ✅ Status tracking: processing/processed/failed/duplicate
- ✅ UPSERT operations prevent race conditions
- ✅ 5-minute replay window validation
- ✅ Stale event detection

**Residual Risk**: Very Low - Idempotency prevents duplicate side effects

**Severity**: High

### 3. Duplicate Processing (T-ID-003)

**Description**: Multiple simultaneous deliveries of the same event cause race conditions or duplicate side effects.

**Attack Vector**:
- Provider retries webhook delivery
- Network conditions cause retries
- High-frequency event sources

**Mitigation Controls**:
- ✅ Database-level idempotency (unique constraint on webhook_id)
- ✅ Status tracking prevents re-processing
- ✅ Processing status prevents concurrent execution
- ✅ Duplicate detection returns 200 with duplicate flag
- ✅ Logging of all duplicate attempts

**Residual Risk**: Very Low - Database transactions ensure single processing

**Severity**: Medium

### 4. Payload Tampering (T-ID-004)

**Description**: Attacker modifies webhook payload in transit to change event data.

**Attack Vector**:
- Man-in-the-middle attack
- Proxy modification
- Network-level tampering

**Mitigation Controls**:
- ✅ HTTPS enforcement
- ✅ Raw body signature verification (not JSON-parsed)
- ✅ HMAC-SHA256 cryptographic integrity
- ✅ Timing-safe comparison prevents timing attacks

**Residual Risk**: Very Low - Cryptographic integrity verification

**Severity**: High

### 5. Denial of Service (T-ID-005)

**Description**: Attacker floods webhook endpoints to exhaust resources or trigger rate limits.

**Attack Vector**:
- High-volume automated requests
- Large payload sizes
- Expensive processing operations

**Mitigation Controls**:
- ✅ Rate limiting middleware
- ✅ Request size limits (10MB)
- ✅ Timeout middleware (30s)
- ✅ Async processing (immediate 200 response)
- ✅ Background job queue limits

**Residual Risk**: Low - Multiple layers of protection

**Severity**: Medium

### 6. Information Disclosure (T-ID-006)

**Description**: Webhook responses leak sensitive information about internal systems.

**Attack Vector**:
- Error messages reveal system details
- Stack traces in responses
- Sensitive data in logs

**Mitigation Controls**:
- ✅ Generic error responses ("Invalid signature", "Internal error")
- ✅ Structured logging with redaction
- ✅ Sensitive data patterns redacted automatically
- ✅ No internal details in webhook responses

**Residual Risk**: Low - Generic error messages, no details leaked

**Severity**: Low

### 7. Timestamp Manipulation (T-ID-007)

**Description**: Attacker uses old webhook events to trigger past actions.

**Attack Vector**:
- Store and replay captured events
- Use events from different time periods
- Exploit event expiration logic

**Mitigation Controls**:
- ✅ Replay window validation (5-minute tolerance)
- ✅ Timestamp extraction from multiple sources
- ✅ Event deduplication based on delivery ID
- ✅ Processed events tracked with timestamps

**Residual Risk**: Very Low - Time-bounded validation

**Severity**: Medium

## Security Controls Summary

| Control | Implementation | Coverage |
|---------|----------------|----------|
| Signature Verification | HMAC-SHA256 with timing-safe comparison | All endpoints |
| Raw Body Signing | Buffer-based verification before parsing | GitHub, Stripe |
| Idempotency | `webhook_events` table with unique webhook_id | All endpoints |
| Replay Protection | 5-minute window + delivery ID tracking | All endpoints |
| Rate Limiting | Express middleware with configurable limits | All endpoints |
| Request Validation | Schema validation + type checking | All endpoints |
| Error Handling | Generic messages + structured logging | All endpoints |
| Async Processing | Background job queue prevents blocking | All endpoints |

## Database Schema

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id TEXT UNIQUE NOT NULL,     -- Provider's unique event ID
  source TEXT NOT NULL,                -- github, gitlab, stripe, supabase
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'processed',     -- processing, processed, failed, duplicate
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  result_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_webhook_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX idx_webhook_events_source ON webhook_events(source);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
```

## Configuration Requirements

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_WEBHOOK_SECRET` | Yes | GitHub webhook HMAC secret |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `CODE_REPO_WEBHOOK_SECRET` | Yes | Generic code repo webhook secret |
| `SUPABASE_WEBHOOK_SECRET` | No | Supabase webhook verification (optional) |
| `WEBHOOK_REPLAY_WINDOW_MINUTES` | No | Replay window (default: 5) |

### Secrets Management

- Webhook secrets must be stored securely (not in code)
- Use environment variables or secret management service
- Rotate secrets periodically (recommended: quarterly)
- Monitor for secret exposure in logs

## Monitoring & Alerting

### Key Metrics

| Metric | Alert Threshold | Severity |
|--------|-----------------|----------|
| Invalid signature rate | > 1% of requests | High |
| Duplicate webhook rate | > 10% of requests | Medium |
| Webhook processing time | > 5 seconds | Medium |
| Failed webhook events | > 0.1% of requests | High |
| Replay attack attempts | Any detection | Critical |

### Logging Fields

All webhook requests log:
- `webhook_id`: Unique event identifier
- `source`: Provider (github, stripe, etc.)
- `event_type`: Type of event
- `status`: processing/processed/failed/duplicate
- `latency_ms`: Processing duration
- `error_message`: Error details (sanitized)

## Testing Strategy

### Unit Tests
- Signature verification (valid/invalid/missing)
- Idempotency checks (duplicate detection)
- Replay protection (timestamp validation)
- Token comparison (timing-safe)

### Integration Tests
- End-to-end webhook flow
- Database idempotency
- Race condition handling
- Error scenarios

### Security Tests
- Signature forgery attempts
- Replay attack simulation
- Payload tampering
- Rate limit bypass

## Incident Response

### Detected Attack Scenarios

1. **Invalid Signature Spike**
   - Alert immediately
   - Review source IPs
   - Consider temporary blocklist

2. **Replay Detection**
   - Log event details
   - Alert for investigation
   - Review access logs

3. **High Duplicate Rate**
   - Investigate provider configuration
   - Check for provider-side issues
   - Review processing latency

## Compliance Considerations

- **PCI-DSS**: Stripe webhooks handle payment events (encrypted, authenticated)
- **SOC 2**: Webhook processing is logged and auditable
- **GDPR**: Webhook data processing documented in privacy policy

## References

- [GitHub Webhook Security](https://docs.github.com/en/webhooks/using-webhooks/validating-webhooks)
- [Stripe Webhook Signatures](https://stripe.com/docs/webhooks/signatures)
- [OWASP WebHook Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Webhook_Security_cheat_sheet.html)
