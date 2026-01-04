# Node / Next.js KEYS Pricing Model

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Pricing strategy for runtime-executable KEYS  
**Purpose**: Define how Node/Next KEYS are priced and justified

---

## Core Principle

**KEYS price by outcome unlocked, not code volume.**

Pricing must justify itself against:
- Engineer-hours saved
- Risk avoided
- Operational leverage gained

---

## Pricing Philosophy

### Outcome-Based Pricing

Node/Next KEYS are priced by the **value of the outcome they unlock**, not by:
- Lines of code
- Complexity
- Development time
- Feature count

### Value Justification

Every KEY price must be justifiable against:

1. **Engineer-Hours Saved**
   - How many hours would it take to build this from scratch?
   - What's the hourly rate of the engineer who would build it?
   - KEY price should be 10-50x cheaper than building it

2. **Risk Avoided**
   - What's the cost of a security vulnerability?
   - What's the cost of a compliance violation?
   - What's the cost of a production outage?
   - KEY price should be 100-1000x cheaper than the risk

3. **Operational Leverage**
   - How many projects will use this KEY?
   - How many times will it be reused?
   - What's the cumulative value across all uses?
   - KEY price should reflect reusability value

---

## Price Bands

### Single Runtime Key

**Price Range**: $49 - $299

**Tier Breakdown**:

#### Starter Tier ($49 - $99)
- **Target**: Individual developers, small projects
- **Outcome Value**: Saves 2-4 hours of development
- **Risk Level**: Low (non-critical features)
- **Examples**:
  - UI component keys
  - Simple integration keys
  - Basic utility keys

**Justification**:
- Engineer rate: $50-100/hour
- Time saved: 2-4 hours
- Value: $100-400
- KEY price: $49-99
- **ROI**: 2-8x return

#### Operator Tier ($99 - $199)
- **Target**: Production applications, teams
- **Outcome Value**: Saves 4-8 hours, prevents critical bugs
- **Risk Level**: Medium (production features)
- **Examples**:
  - Stripe webhook entitlement key
  - Supabase RLS guard key
  - Background job keys

**Justification**:
- Engineer rate: $100-150/hour
- Time saved: 4-8 hours
- Risk avoided: $500-2,000 (security/compliance)
- Value: $900-3,200
- KEY price: $99-199
- **ROI**: 4-32x return

#### Scale Tier ($199 - $299)
- **Target**: Enterprise applications, critical systems
- **Outcome Value**: Saves 8-16 hours, prevents major incidents
- **Risk Level**: High (critical infrastructure)
- **Examples**:
  - Audit log capture key
  - Policy enforcement keys
  - Compliance validation keys

**Justification**:
- Engineer rate: $150-200/hour
- Time saved: 8-16 hours
- Risk avoided: $2,000-10,000 (security/compliance/outage)
- Value: $3,200-13,200
- KEY price: $199-299
- **ROI**: 10-66x return

---

### Capability Bundle (Multiple Keys)

**Price Range**: $199 - $599

**Bundle Types**:

#### Billing & Entitlements Bundle ($299)
- **Keys Included**:
  - Stripe webhook entitlement key
  - Subscription status component key
  - Usage metering key
  - Billing dashboard key
- **Outcome**: Complete subscription billing system
- **Value**: Saves 20-40 hours, prevents billing errors
- **Individual Price**: $99 + $49 + $99 + $49 = $296
- **Bundle Price**: $299 (1% discount, but removes decision friction)
- **ROI**: 15-30x return

#### Data Integrity Bundle ($399)
- **Keys Included**:
  - Supabase RLS guard key
  - Data validation schema key
  - Background reconciliation key
  - Audit log capture key
- **Outcome**: Complete data security and integrity system
- **Value**: Saves 30-60 hours, prevents data breaches
- **Individual Price**: $199 + $99 + $199 + $199 = $696
- **Bundle Price**: $399 (43% discount, removes buyer risk)
- **ROI**: 20-40x return

#### Compliance & Audit Bundle ($499)
- **Keys Included**:
  - Audit log capture key
  - Policy enforcement key
  - Compliance validation key
  - Evidence generation key
- **Outcome**: Complete compliance and audit system
- **Value**: Saves 40-80 hours, prevents compliance violations
- **Individual Price**: $199 + $299 + $299 + $199 = $996
- **Bundle Price**: $499 (50% discount, removes buyer risk)
- **ROI**: 25-50x return

#### Automation & Jobs Bundle ($399)
- **Keys Included**:
  - Safe cron execution key
  - Background reconciliation key
  - Queue processor key
  - Job monitoring key
- **Outcome**: Complete background job system
- **Value**: Saves 30-60 hours, prevents job failures
- **Individual Price**: $199 + $199 + $199 + $99 = $696
- **Bundle Price**: $399 (43% discount, removes buyer risk)
- **ROI**: 20-40x return

**Bundle Pricing Logic**:
- **Discount**: 30-50% off individual prices
- **Purpose**: Reduce buyer risk, simplify decisions
- **Value**: Complete capability unlock vs partial
- **Trust**: Proven combinations vs individual selection

---

### Execution Tier (All Runtime Keys)

**Price Range**: $999 - $2,999/year

**Tier Breakdown**:

#### Developer Tier ($999/year)
- **Access**: All Node/Next KEYS (current + future)
- **Updates**: Lifetime updates to all purchased keys
- **Support**: Community support
- **Value**: Unlimited runtime capability unlocks
- **Target**: Individual developers, small teams

**Justification**:
- Average KEY price: $149
- Keys per year: 10-15 keys
- Individual cost: $1,490-2,235
- Tier price: $999/year
- **Savings**: $491-1,236/year (33-55% discount)

#### Team Tier ($1,999/year)
- **Access**: All Node/Next KEYS (current + future)
- **Updates**: Lifetime updates + priority support
- **Support**: Priority support, team onboarding
- **Value**: Unlimited runtime capability unlocks for team
- **Target**: Teams of 5-20 developers

**Justification**:
- Team size: 10 developers
- Keys per developer: 10-15 keys/year
- Individual cost: $14,900-22,350
- Tier price: $1,999/year
- **Savings**: $12,901-20,351/year (87-91% discount)

#### Enterprise Tier ($2,999/year)
- **Access**: All Node/Next KEYS + Enterprise KEYS
- **Updates**: Lifetime updates + dedicated support
- **Support**: Dedicated support, custom keys, SLA
- **Value**: Complete runtime + enterprise capability unlocks
- **Target**: Enterprise organizations

**Justification**:
- Enterprise value: Compliance, audit, policy keys
- Risk avoided: $50,000-500,000/year
- Tier price: $2,999/year
- **ROI**: 16-166x return on risk avoidance alone

---

## Pricing Comparison Matrix

| Alternative | Cost | Time | Risk | KEYS Advantage |
|------------|------|------|------|----------------|
| **Build from Scratch** | $1,000-5,000 | 20-40 hours | High (untested) | 10-50x cheaper, proven |
| **Hire Consultant** | $2,000-10,000 | 10-20 hours | Medium | 20-100x cheaper, reusable |
| **Use Open Source** | $0 | 10-30 hours | High (no support) | Proven, supported, maintained |
| **KEYS Single Key** | $49-299 | 1-2 hours | Low (proven) | **Best ROI** |
| **KEYS Bundle** | $199-599 | 2-4 hours | Low (proven) | **Complete solution** |
| **KEYS Tier** | $999-2,999/year | Unlimited | Low (proven) | **Unlimited unlocks** |

---

## Pricing Psychology

### Reduce Buyer Risk

**Bundles reduce risk by**:
- Proving complete solutions work together
- Removing decision fatigue (which keys to buy?)
- Providing volume discount (perceived value)
- Creating upgrade gravity (start with bundle, upgrade to tier)

### Create Upgrade Gravity

**Upgrade Path**:
1. **Single Key** ($49-299) → Try one capability
2. **Bundle** ($199-599) → Get complete solution
3. **Tier** ($999-2,999/year) → Get everything + future

**Upgrade Triggers**:
- Need multiple keys → Buy bundle (saves money)
- Need many keys → Buy tier (saves more money)
- Need enterprise features → Buy enterprise tier

### Justify Premium Pricing

**Premium pricing justified by**:
- **Proven patterns**: Keys encode years of experience
- **Risk reduction**: Prevents costly mistakes
- **Time savings**: Saves hours of development
- **Reusability**: Use across multiple projects
- **Support**: Ongoing updates and maintenance

---

## Pricing Enforcement

### Server-Side Only

**Entitlement checks**:
- Server-side validation only
- Never trust client claims
- API key or JWT token required
- Database lookup for entitlements

### Auditable

**Audit trail**:
- All purchases logged
- All usage tracked
- All entitlements recorded
- Exportable for compliance

### Revocable

**Revocation scenarios**:
- Subscription expired → Revoke access
- Payment failed → Revoke access
- Terms violation → Revoke access
- Refund issued → Revoke access

---

## Pricing Transparency

### Clear Value Proposition

**Every KEY must show**:
- Outcome unlocked (what you get)
- Time saved (hours of development)
- Risk avoided (what could go wrong)
- ROI calculation (value vs price)

### No Hidden Costs

**All costs disclosed**:
- KEY price (one-time or subscription)
- Dependencies (npm packages, services)
- Infrastructure (hosting, databases)
- Maintenance (updates, support)

---

## Version History

- **1.0.0** (2024-12-30): Initial pricing model definition
