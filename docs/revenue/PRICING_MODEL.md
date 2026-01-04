# KEYS Revenue Engine — Pricing Model

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Production — Canonical pricing model for KEYS marketplace  
**Purpose**: Define SKUs, bundles, subscriptions, and value justification

---

## Core Revenue Principles

1. **Access is granted only by server-verified entitlement**
2. **UI reflects entitlement; it never defines it**
3. **Stripe is the source of truth for payment events**
4. **KEYS is the source of truth for access state**
5. **Revocation must work as reliably as granting**
6. **Pricing must be explainable to a buyer in one sentence**

---

## Pricing Structure Overview

KEYS revenue model supports three purchase types:

1. **Individual KEY purchases** — One-time, perpetual access
2. **Bundles** — Multiple KEYS at discounted price
3. **Subscription Tier** — Access to all current + future KEYS

---

## A) Individual KEYS

### Pricing Tiers

#### Starter Tier ($49 - $99)
- **Target**: Individual developers, small projects
- **Problem Solved**: Common development tasks (UI components, simple integrations)
- **Time Saved**: 2-4 hours of development
- **Risk Avoided**: Low (non-critical features)
- **Who Buys**: Solo developers, side projects
- **Why Fair**: Engineer rate ($50-100/hr) × time saved (2-4hr) = $100-400 value. KEY price ($49-99) = 2-8x ROI.

**Example KEYS**:
- `node-ui-component` ($49)
- `next-auth-integration` ($79)
- `jupyter-data-viz` ($99)

#### Operator Tier ($99 - $199)
- **Target**: Production applications, teams
- **Problem Solved**: Production-critical features (webhooks, RLS, background jobs)
- **Time Saved**: 4-8 hours + prevents critical bugs
- **Risk Avoided**: Medium ($500-2,000 in security/compliance risk)
- **Who Buys**: Engineering teams, production apps
- **Why Fair**: Engineer rate ($100-150/hr) × time saved (4-8hr) + risk avoided ($500-2k) = $900-3,200 value. KEY price ($99-199) = 4-32x ROI.

**Example KEYS**:
- `stripe-webhook-entitlement` ($149)
- `supabase-rls-guard` ($179)
- `background-reconciliation` ($199)

#### Scale Tier ($199 - $299)
- **Target**: Enterprise applications, critical systems
- **Problem Solved**: Compliance, audit, policy enforcement
- **Time Saved**: 8-16 hours + prevents major incidents
- **Risk Avoided**: High ($2,000-10,000 in security/compliance/outage risk)
- **Who Buys**: Enterprise teams, regulated industries
- **Why Fair**: Engineer rate ($150-200/hr) × time saved (8-16hr) + risk avoided ($2k-10k) = $3,200-13,200 value. KEY price ($199-299) = 10-66x ROI.

**Example KEYS**:
- `audit-log-capture` ($249)
- `policy-enforcement` ($279)
- `compliance-validation` ($299)

### Update Policy

**Perpetual KEYS**:
- One-time purchase grants lifetime access
- Updates included for purchased version
- Major version upgrades may require repurchase (clearly communicated)

**Scope**:
- **User scope**: Purchased by individual, accessible to that user
- **Tenant scope**: Purchased by organization, accessible to all org members

---

## B) Bundles

Bundles group related KEYS at a discount. Bundle price < sum of individual prices.

### Bundle Types

#### Starter Bundle ($199)
- **KEYS Included**: 3-4 starter-tier KEYS
- **Individual Price**: $147-396
- **Bundle Price**: $199
- **Discount**: 0-49% (depends on KEYS included)
- **Problem Solved**: Complete starter capability set
- **Time Saved**: 6-16 hours
- **Who Buys**: New developers, small projects
- **Why Fair**: Removes decision fatigue, proves complete solution works together

#### Operator Bundle ($399)
- **KEYS Included**: 4-5 operator-tier KEYS
- **Individual Price**: $396-995
- **Bundle Price**: $399
- **Discount**: 0-60% (depends on KEYS included)
- **Problem Solved**: Complete production-ready capability set
- **Time Saved**: 16-40 hours + prevents production incidents
- **Who Buys**: Engineering teams building production apps
- **Why Fair**: Complete solution reduces integration risk, saves 20-40 hours

**Example**: Billing & Entitlements Bundle
- `stripe-webhook-entitlement` ($149)
- `subscription-status-component` ($49)
- `usage-metering` ($99)
- `billing-dashboard` ($49)
- **Individual Total**: $346
- **Bundle Price**: $399 (15% premium for complete solution, removes buyer risk)

#### Pro Bundle ($599)
- **KEYS Included**: 5-7 scale-tier KEYS
- **Individual Price**: $995-2,093
- **Bundle Price**: $599
- **Discount**: 40-71%
- **Problem Solved**: Complete enterprise capability set
- **Time Saved**: 40-112 hours + prevents compliance violations
- **Who Buys**: Enterprise teams, regulated industries
- **Why Fair**: Massive discount removes buyer risk, unlocks complete compliance stack

**Example**: Compliance & Audit Bundle
- `audit-log-capture` ($249)
- `policy-enforcement` ($279)
- `compliance-validation` ($299)
- `evidence-generation` ($199)
- **Individual Total**: $1,026
- **Bundle Price**: $599 (42% discount, removes buyer risk)

### Bundle Ownership Credit

**Rule**: Owned KEYS reduce bundle price.

**Calculation**:
1. Sum individual prices of KEYS in bundle
2. Subtract prices of already-owned KEYS
3. Bundle price = max(0, original bundle price - owned KEY credits)

**Example**:
- Bundle price: $399
- Owned KEYS in bundle: $149 + $49 = $198
- Final price: $399 - $198 = $201

**Why Fair**: Customer already paid for those KEYS. No double charging.

---

## C) Subscription Tier

### Catalog Access Subscription ($999/year)

- **Access**: All current KEYS (all types: Node, Next, Jupyter, Runbook)
- **Future KEYS**: Access to all new KEYS released during subscription period
- **Updates**: Lifetime updates to all KEYS accessed during subscription
- **Support**: Community support
- **Target**: Individual developers, small teams

**Problem Solved**: Unlimited capability unlocks without per-KEY decisions

**Time Saved**: Unlimited (no per-KEY purchase decisions)

**Who Buys**: Developers who need multiple KEYS, teams building multiple projects

**Why Fair**:
- Average KEY price: $149
- Keys per year: 10-15 keys
- Individual cost: $1,490-2,235
- Subscription price: $999/year
- **Savings**: $491-1,236/year (33-55% discount)

**Cancellation Policy**:
- Cancel anytime
- Access continues until end of billing period
- No refunds for partial periods (standard SaaS practice)
- Future KEYS not accessible after cancellation

**Grace Period**:
- 7-day grace period after payment failure
- Access continues during grace period
- After grace period: Access revoked, subscription marked `past_due`

---

## SKU Catalog

### Individual KEYS

| SKU | Type | Price | Tier | Problem Solved | Time Saved | Risk Avoided |
|-----|------|-------|------|----------------|------------|--------------|
| `node-ui-component` | Node | $49 | Starter | UI component library | 2-3 hours | Low |
| `next-auth-integration` | Next | $79 | Starter | Auth integration | 3-4 hours | Low |
| `jupyter-data-viz` | Jupyter | $99 | Starter | Data visualization | 4 hours | Low |
| `stripe-webhook-entitlement` | Node | $149 | Operator | Webhook verification | 4-6 hours | $500-1k |
| `supabase-rls-guard` | Node | $179 | Operator | RLS enforcement | 6-8 hours | $1k-2k |
| `background-reconciliation` | Node | $199 | Operator | Data reconciliation | 8 hours | $1k-2k |
| `audit-log-capture` | Node | $249 | Scale | Audit logging | 8-12 hours | $2k-5k |
| `policy-enforcement` | Node | $279 | Scale | Policy enforcement | 12-16 hours | $5k-10k |
| `compliance-validation` | Node | $299 | Scale | Compliance checks | 12-16 hours | $5k-10k |

### Bundles

| SKU | Price | KEYS Included | Individual Total | Discount |
|-----|-------|---------------|------------------|----------|
| `starter-bundle` | $199 | 3-4 starter KEYS | $147-396 | 0-49% |
| `operator-bundle` | $399 | 4-5 operator KEYS | $396-995 | 0-60% |
| `pro-bundle` | $599 | 5-7 scale KEYS | $995-2,093 | 40-71% |

### Subscriptions

| SKU | Price | Period | Access |
|-----|-------|--------|--------|
| `catalog-access` | $999 | Year | All current + future KEYS |

---

## Value Justification Framework

Every SKU must answer:

1. **What problem does this solve?**
   - Clear, specific problem statement
   - Who has this problem?

2. **How much time does this save?**
   - Conservative estimate (hours)
   - Engineer rate assumption ($50-200/hr)

3. **What risk does this avoid?**
   - Security vulnerabilities
   - Compliance violations
   - Production outages
   - Dollar value estimate

4. **Who buys this?**
   - Buyer persona
   - Use case

5. **Why is this price fair?**
   - Value calculation: (Time saved × rate) + Risk avoided
   - ROI: Value / Price
   - Must be 2x+ ROI minimum

---

## Pricing Enforcement

### Server-Side Only

- Entitlement checks: Server-side validation only
- Never trust client claims
- Database lookup required for all access

### Stripe Integration

- Stripe products created for each SKU
- Stripe prices linked to internal SKUs
- Webhooks update entitlements
- No client-side price IDs

### Idempotency

- Checkout sessions: Idempotent creation
- Webhook events: Idempotent processing
- Entitlement grants: Upsert logic prevents duplicates

---

## Revenue Leakage Prevention

### Rules

1. **No client-only access path**: All downloads require server-side entitlement check
2. **No enumeration**: Cannot list KEYS without entitlement
3. **No IDOR**: Cannot access KEYS by guessing IDs
4. **Time-bound signed URLs**: Download URLs expire after 1 hour
5. **Audit trail**: All access attempts logged

### Enforcement Points

- Download endpoint: `GET /marketplace/keys/:slug/download`
- Signed URL generation: Server-side only
- Entitlement check: Before signed URL generation
- Analytics: All access attempts tracked

---

## Version History

- **1.0.0** (2024-12-30): Initial pricing model definition
