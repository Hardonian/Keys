# Node / Next.js KEYS

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Runtime-executable capability KEYS for Node.js and Next.js  
**Purpose**: Define Node/Next KEYS as first-class asset category in KEYS marketplace

---

## What Are Node / Next.js KEYS?

**Node / Next.js KEYS are runtime-executable capability modules that unlock specific backend or frontend capabilities inside existing Node.js or Next.js applications.**

They are NOT applications. They are NOT SaaS features. They are NOT starter templates.

They are **composable, auditable, removable capability units** that respect tenant boundaries and never assume ownership of the host app.

---

## Core Principles

### 1. Host App Sovereignty

The host app remains sovereign. The KEY provides leverage.

- Host app controls routing
- Host app controls job scheduling
- Host app controls component usage
- Host app controls data access
- Host app can remove any KEY at any time

### 2. Explicit Integration

No magic. Everything explicit.

- Explicit imports
- Explicit route mounting
- Explicit environment requirements
- Explicit teardown / removal

### 3. Security First

Every KEY enforces security boundaries.

- Tenant isolation enforced
- Auth validated server-side
- Input validation on all inputs
- Never trusts client claims
- Fails closed on uncertainty

### 4. Graceful Degradation

No KEY may crash the host app.

- Missing env vars → Clear error
- Database error → Graceful error response
- External API error → Fail closed or graceful error
- Invalid input → 400 error
- Host app never crashes

---

## KEY Types

1. **ROUTE KEYS**: API routes, webhooks, edge functions
2. **JOB KEYS**: Background workers, cron jobs, queue processors
3. **DATA KEYS**: Schema migrations, RLS policies, data validators
4. **UI KEYS**: React components, pages, dashboard widgets
5. **INTEGRATION KEYS**: Third-party service integrations

See [KEY_TYPES.md](./KEY_TYPES.md) for detailed definitions.

---

## Documentation

- **[KEY_TYPES.md](./KEY_TYPES.md)**: Allowed KEY types and selection guide
- **[KEY_STRUCTURE.md](./KEY_STRUCTURE.md)**: Canonical folder structure (no deviations)
- **[INTEGRATION_CONTRACT.md](./INTEGRATION_CONTRACT.md)**: How KEYS integrate into host apps
- **[SECURITY_MODEL.md](./SECURITY_MODEL.md)**: Security requirements and patterns
- **[FAILURE_MODES.md](./FAILURE_MODES.md)**: Failure handling and graceful degradation
- **[METADATA_SCHEMA.md](./METADATA_SCHEMA.md)**: key.json schema definition
- **[QA_PROCESS.md](./QA_PROCESS.md)**: QA requirements and validation
- **[COHESION.md](./COHESION.md)**: Alignment with Jupyter KEYS and product consistency

---

## Example KEYS

Five production-ready KEYS are provided as examples:

1. **Stripe Webhook Entitlement Key** (`stripe-webhook-entitlement`)
   - Route + Integration KEY
   - Stripe webhook verification and entitlement checking

2. **Supabase RLS Guard Key** (`supabase-rls-guard`)
   - Data KEY
   - RLS policy creation for tenant isolation

3. **Background Reconciliation Job Key** (`background-reconciliation`)
   - Job KEY
   - Automated subscription data reconciliation

4. **Safe Cron Execution Key** (`safe-cron-execution`)
   - Job KEY
   - Safe, idempotent cron job execution with locking

5. **Audit Log Capture Key** (`audit-log-capture`)
   - UI KEY
   - Audit log dashboard widget

See `/node-keys/` directory for implementations.

---

## Quick Start

### Install a KEY

```bash
# 1. Copy KEY to your project
cp -r node-keys/stripe-webhook-entitlement ./node-keys/

# 2. Install dependencies
npm install stripe

# 3. Configure environment
# Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env.local

# 4. Mount route handler
# app/api/webhooks/stripe/route.ts
import { stripeWebhookHandler } from '@/node-keys/stripe-webhook-entitlement/src';
export const POST = stripeWebhookHandler;
```

### Remove a KEY

```bash
# 1. Remove route mounts and imports
# 2. Remove KEY directory
rm -rf ./node-keys/stripe-webhook-entitlement
# 3. Verify app still works
npm run build
```

---

## The Moat

Node / Next.js KEYS create a moat by:

1. **Runtime-Executable Assets**: Not templates, not docs—actual code that runs
2. **Composable Architecture**: KEYS integrate without framework lock-in
3. **Security Hardening**: Built-in tenant isolation, auth, and fail-closed patterns
4. **Marketplace Network Effects**: More KEYS = more value = more buyers = more KEYS
5. **Developer Trust**: Explicit, auditable, removable—developers trust what they can see

---

## The Rule That Prevents Framework Lock-In

**"No KEY may assume ownership of the host app. Every KEY must be explicitly imported, explicitly mounted, and explicitly removable."**

This rule ensures:
- KEYS don't become a framework
- Host apps remain sovereign
- Developers maintain control
- Integration is explicit, not magic

---

## Minimum Viable Library

The minimum viable Node / Next.js library consists of:

1. **Documentation**: All 8 canonical documents
2. **Structure**: Canonical folder structure enforced
3. **Metadata**: key.json schema for marketplace integration
4. **Examples**: 5 production-ready KEYS
5. **Validation**: QA process and validation scripts

---

## Quality Bar

**If a senior engineer reviews a Node / Next.js KEY, they should say:**

*"This is clean, explicit, and safe to drop into a real system."*

This reaction is mandatory.

Every KEY must:
- Be inspectable (no hidden behavior)
- Be removable (no side effects)
- Be secure (tenant isolation, auth, fail-closed)
- Be reliable (graceful degradation)
- Be documented (clear README, quickstart, examples)

---

## Version History

- **1.0.0** (2024-12-30): Initial Node/Next KEYS system definition
