# TRIPLE PASS BASELINE REPORT
**Date**: 2025-01-04  
**Scope**: KEYS Enterprise Hardening - Discovery & Baseline

## Executive Summary

This baseline report documents the current state of the KEYS codebase before the triple-pass hardening cycle. The codebase is a Next.js + Express.js monorepo with:
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Express.js, TypeScript, Supabase
- **Database**: PostgreSQL (via Supabase) with RLS
- **Billing**: Stripe integration
- **Auth**: Supabase Auth with JWT

### Architecture Overview

**Critical User Journeys:**
1. Anonymous browse marketplace
2. Sign up / Sign in
3. Discovery/recommendations
4. Purchase key/bundle → Stripe checkout → entitlement grant
5. Download key (entitlement-gated)
6. Admin ingestion of keys from assets

**Data Boundaries:**
- `tenant_id` / `tenant_type` (org vs user) for multi-tenant isolation
- `user_id` for user-level data
- `key_id` for marketplace keys
- Entitlements enforced via RLS + server-side checks

**Critical Paths:**
- `/marketplace/*` - Public listing, auth-required downloads
- `/billing/webhook` - Stripe webhook (raw body, idempotent)
- `/marketplace/admin/ingest` - Admin key ingestion
- `/marketplace/keys/:slug/download` - Entitlement-gated downloads

## Baseline Checks

### Commands Attempted

```bash
# Frontend lint
cd frontend && npm run lint
# Result: Dependencies not fully accessible (PATH issue)

# Backend lint  
cd backend && npm run lint
# Result: ESLint config issue (v9 migration needed)

# TypeScript checks
cd frontend && npm run type-check
cd backend && npm run type-check
# Result: TypeScript not accessible via PATH

# Build
npm run build
# Not attempted (dependencies issue)
```

**Note**: Due to dependency installation/PATH issues in the remote environment, baseline checks were performed via code review rather than execution. All findings are based on static analysis.

## Initial Risk Hotspots

### 🔴 CRITICAL (Must Fix)

1. **Stripe Webhook Security** (`backend/src/routes/billing.ts`)
   - Uses `express.raw()` correctly ✅
   - Has idempotency check ✅
   - BUT: Signature verification may fail silently
   - Risk: Webhook spoofing if secret compromised

2. **Environment Variable Validation** (`backend/src/utils/env.ts`)
   - Validates core vars ✅
   - BUT: Missing `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` validation
   - Risk: Runtime failures if Stripe vars missing in production

3. **Console Logging** (141 instances across 31 files)
   - Many `console.log/error/warn` calls instead of structured logger
   - Risk: Logs may expose secrets/PII, not structured for observability

4. **CSP Headers** (`backend/src/middleware/securityHardening.ts`)
   - Has `'unsafe-eval'` and `'unsafe-inline'` in scriptSrc
   - Risk: XSS vulnerabilities

5. **Request Signing** (`backend/src/middleware/securityHardening.ts`)
   - Middleware exists but signature verification incomplete
   - Comment says "For now, we'll just check it exists"
   - Risk: Admin/billing endpoints not fully protected

### 🟡 HIGH (Should Fix)

6. **Direct process.env Access** (201 instances)
   - Many direct accesses without validation
   - Risk: Runtime failures, undefined behavior

7. **Error Handling** 
   - Some routes may return 500 without graceful degradation
   - Risk: User-facing errors, poor UX

8. **RLS Enforcement**
   - Server-side checks exist ✅
   - BUT: Need to verify all queries use RLS-aware client
   - Risk: IDOR if RLS misconfigured

9. **Input Validation**
   - Zod schemas used ✅
   - BUT: Some query params not validated
   - Risk: SQL injection (mitigated by Supabase), XSS

10. **Accessibility**
    - No WCAG audit performed yet
    - Risk: Legal/compliance issues

### 🟢 MEDIUM (Nice to Fix)

11. **TODO/FIXME Comments** (16 files)
    - Various incomplete implementations
    - Risk: Technical debt

12. **Test Coverage**
    - Tests exist but coverage unknown
    - Risk: Regressions

## Top 10 Highest-Risk Files/Paths

1. `backend/src/routes/billing.ts` - Stripe webhook, entitlement grants
2. `backend/src/lib/marketplace/entitlements.ts` - Access control logic
3. `backend/src/middleware/auth.ts` - Authentication
4. `backend/src/middleware/securityHardening.ts` - Security headers
5. `backend/src/routes/marketplace-v2.ts` - Download gating
6. `backend/src/lib/marketplace/storage.ts` - Signed URL generation
7. `backend/src/lib/marketplace/ingestion.ts` - Admin ingestion
8. `frontend/src/middleware.ts` - Route protection
9. `backend/src/utils/env.ts` - Environment validation
10. `backend/src/index.ts` - Server setup, middleware order

## Next Steps

Proceed with:
- **PASS 1**: Code Quality & Build Flawlessness
- **PASS 2**: Security, Privacy, OWASP/WASP
- **PASS 3**: Accessibility (WCAG 2.2 AA) + UX Reliability
