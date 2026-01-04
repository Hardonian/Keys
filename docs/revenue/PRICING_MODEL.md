# KEYS Pricing Model

**Version**: 1.0.0  
**Last Updated**: 2025-01-XX  
**Status**: Pre-Hardening — Commercial Operational  
**Purpose**: Complete pricing structure for KEYS marketplace

---

## Pricing Philosophy

KEYS pricing is based on **value delivered**, not cost to produce. Each KEY solves a specific problem that would otherwise require:
- Time investment (hours of research, trial-and-error)
- Risk exposure (security vulnerabilities, compliance gaps)
- Opportunity cost (delayed features, missed deadlines)

**Fair pricing** means:
- Individual KEYS priced at fraction of consultant cost
- Bundles provide clear value (discount vs. sum of parts)
- Upgrades credit owned KEYS (no double charging)
- Subscription provides unlimited access for power users

---

## SKU Structure

### A) Individual KEYS (One-Time Purchase)

#### Pricing Tiers by Maturity

| Maturity | Price Range | Rationale |
|----------|-------------|-----------|
| **Starter** | $29 - $49 | Basic patterns, quick wins. Replaces 2-4 hours of research. |
| **Operator** | $79 - $149 | Production-ready patterns. Replaces 4-8 hours of implementation + testing. |
| **Scale** | $199 - $299 | Enterprise patterns with compliance. Replaces 8-16 hours + security review. |
| **Enterprise** | $399 - $599 | Complex, multi-system patterns. Replaces 16+ hours + architecture review. |

#### Pricing by Key Type

| Key Type | Base Price | Adjustment Factor |
|----------|------------|-------------------|
| **Runbook KEYS** | $99 | +$50 for P0/P1 severity (incident response value) |
| **Node/Next KEYS** | $79 | +$30 for integration type (complexity) |
| **Jupyter KEYS** | $49 | +$20 for enterprise maturity (compliance value) |

#### Example SKUs

**Runbook: Stripe Webhook Failure**
- **Slug**: `stripe-webhook-failure`
- **Maturity**: `operator`
- **Severity**: P2
- **Price**: $99
- **Problem Solved**: Diagnose and resolve webhook delivery failures
- **Time Saved**: 4-6 hours of debugging + documentation
- **Risk Avoided**: Payment processing failures, customer churn
- **Buyer Persona**: SRE, DevOps engineer, backend lead
- **Why Fair**: Consultant would charge $500-800 for same analysis

**Node Key: Audit Log Capture**
- **Slug**: `audit-log-capture`
- **Maturity**: `operator`
- **Key Type**: `ui`
- **Price**: $79
- **Problem Solved**: Compliance-ready audit log dashboard widget
- **Time Saved**: 3-4 hours of implementation + testing
- **Risk Avoided**: Compliance gaps, audit failures
- **Buyer Persona**: Full-stack developer, compliance officer
- **Why Fair**: Component library equivalent costs $200-400/year

**Jupyter Key: Webhook Event Analysis**
- **Slug**: `jupyter-webhook-event-analysis`
- **Maturity**: `operator`
- **Price**: $49
- **Problem Solved**: Analysis notebook for webhook delivery patterns
- **Time Saved**: 2-3 hours of notebook creation + validation
- **Risk Avoided**: Missing failure patterns, incomplete analysis
- **Buyer Persona**: Data analyst, SRE with analysis needs
- **Why Fair**: Custom analysis notebook development costs $150-300

---

### B) Bundles (One-Time Purchase)

Bundles provide **discounts** and **curated collections** for common use cases.

#### Starter Bundle
- **Slug**: `starter-bundle`
- **Price**: $199 (vs. $247 individual)
- **Discount**: 19% off
- **Contents**:
  - 3 Starter KEYS ($29 each = $87)
  - 2 Operator KEYS ($79 each = $158)
  - **Total Individual**: $247
  - **Bundle Price**: $199
- **Problem Solved**: Get started with essential patterns
- **Time Saved**: 10-15 hours total
- **Buyer Persona**: New team, solo developer, startup
- **Why Fair**: Bulk discount reflects commitment

#### Operator Bundle
- **Slug**: `operator-bundle`
- **Price**: $499 (vs. $647 individual)
- **Discount**: 23% off
- **Contents**:
  - 5 Operator KEYS ($79-149 each)
  - 2 Runbook KEYS ($99 each)
  - **Total Individual**: $647
  - **Bundle Price**: $499
- **Problem Solved**: Production-ready operational patterns
- **Time Saved**: 20-30 hours total
- **Buyer Persona**: SRE team, operations lead, scaling startup
- **Why Fair**: Operational excellence requires multiple patterns

#### Pro Bundle
- **Slug**: `pro-bundle`
- **Price**: $1,299 (vs. $1,797 individual)
- **Discount**: 28% off
- **Contents**:
  - All Starter KEYS (5 keys)
  - All Operator KEYS (8 keys)
  - All Runbook KEYS (6 keys)
  - **Total Individual**: $1,797
  - **Bundle Price**: $1,299
- **Problem Solved**: Complete pattern library
- **Time Saved**: 50-70 hours total
- **Buyer Persona**: Engineering team, established company
- **Why Fair**: Maximum value for comprehensive coverage

---

### C) Subscription Tier (Catalog Access)

**Pro Subscription**
- **Price**: $99/month or $999/year (17% annual discount)
- **Access**: All KEYS (current + future)
- **Problem Solved**: Unlimited access for power users
- **Time Saved**: Unlimited (access all patterns)
- **Buyer Persona**: Agency, consulting firm, large team
- **Why Fair**: 
  - Monthly: Break-even at 2-3 KEY purchases/month
  - Annual: Break-even at 10 KEY purchases/year
  - Future KEYS included (ongoing value)

**Enterprise Subscription**
- **Price**: Custom (contact sales)
- **Access**: All KEYS + priority support + custom patterns
- **Problem Solved**: Enterprise-wide access + support
- **Buyer Persona**: Large organization, multiple teams
- **Why Fair**: Volume discount + support value

---

## Upgrade Paths & Credits

### Individual KEY → Bundle

**Rule**: Owned KEYS reduce bundle price by their individual price.

**Example**:
- User owns: `audit-log-capture` ($79), `stripe-webhook-entitlement` ($99)
- Wants: Operator Bundle ($499)
- Credit: $79 + $99 = $178
- **Final Price**: $499 - $178 = $321

**Fairness**: No double charging. User pays only for new KEYS.

### Bundle → Subscription

**Rule**: Bundle purchase credits up to 50% of first-year subscription.

**Example**:
- User owns: Pro Bundle ($1,299)
- Wants: Pro Subscription ($999/year)
- Credit: min($1,299, $999 * 0.5) = $499.50
- **First Year Price**: $999 - $499.50 = $499.50

**Fairness**: Prevents abuse (max 50% credit) while rewarding commitment.

---

## Pricing Rationale by Problem Type

### Security & Compliance KEYS
- **Higher Price**: $149-299
- **Rationale**: Security gaps cost $10k+ in breaches, compliance failures cost $50k+ in fines
- **Value Prop**: "Prevent a $50k compliance fine for $199"

### Operational KEYS (Runbooks)
- **Higher Price**: $99-199
- **Rationale**: Incident response time = customer trust + revenue
- **Value Prop**: "Resolve incidents 4x faster, prevent customer churn"

### Development KEYS
- **Standard Price**: $79-149
- **Rationale**: Developer time = $100-200/hour
- **Value Prop**: "Save 4-8 hours of implementation time"

### Analysis KEYS (Jupyter)
- **Lower Price**: $49-99
- **Rationale**: Analysis notebooks are reusable but less critical
- **Value Prop**: "Reusable analysis patterns for consistent insights"

---

## Buyer Personas & Pricing Sensitivity

### Solo Developer / Startup Founder
- **Price Sensitivity**: High
- **Preferred**: Starter Bundle ($199) or individual Starter KEYS ($29-49)
- **Value Frame**: "Time saved = feature shipped faster"

### SRE / DevOps Engineer
- **Price Sensitivity**: Medium
- **Preferred**: Operator Bundle ($499) or individual Operator KEYS ($79-149)
- **Value Frame**: "Operational excellence = reliability = job security"

### Engineering Team Lead
- **Price Sensitivity**: Low
- **Preferred**: Pro Bundle ($1,299) or Pro Subscription ($99/month)
- **Value Frame**: "Team productivity = faster delivery = competitive advantage"

### Enterprise / Compliance Officer
- **Price Sensitivity**: Very Low
- **Preferred**: Enterprise Subscription (custom)
- **Value Frame**: "Compliance coverage = risk mitigation = legal protection"

---

## Fairness Guarantees

1. **No Double Charging**: Owned KEYS always credit upgrades
2. **Transparent Pricing**: All prices visible before purchase
3. **Refund Policy**: 30-day refund for unused KEYS (no questions asked)
4. **Perpetual Access**: One-time purchases = lifetime access
5. **Fair Upgrades**: Upgrade paths always credit previous purchases

---

## Competitive Positioning

### vs. Hiring Consultants
- **Consultant**: $150-300/hour × 8 hours = $1,200-2,400
- **KEYS**: $79-299 one-time
- **Savings**: 90-95% cost reduction

### vs. Building In-House
- **In-House**: 8-16 hours × $100/hour = $800-1,600
- **KEYS**: $79-299 one-time
- **Savings**: 70-85% cost reduction + proven patterns

### vs. Component Libraries
- **Library Subscription**: $200-500/year (limited patterns)
- **KEYS Bundle**: $199-1,299 one-time (perpetual access)
- **Savings**: Break-even in 1-2 years, then free

---

## Revenue Projections (Conservative)

### Assumptions
- 100 new users/month
- 20% purchase rate (20 purchases/month)
- Average order value: $99 (mix of individual + bundles)
- Monthly recurring revenue (subscriptions): $99 × 10 subscribers = $990

### Monthly Revenue
- One-time purchases: 20 × $99 = $1,980
- Subscriptions: $990
- **Total**: $2,970/month

### Annual Revenue (Year 1)
- One-time purchases: $1,980 × 12 = $23,760
- Subscriptions: $990 × 12 = $11,880
- **Total**: $35,640/year

**Note**: These are conservative estimates. Actual revenue depends on:
- Marketing effectiveness
- Product-market fit
- Customer retention
- Bundle adoption

---

## Pricing Updates Policy

- **Price Changes**: Existing customers keep purchased KEYS at purchase price
- **New KEYS**: Priced according to maturity/type matrix
- **Bundle Updates**: New KEYS added to bundles don't change bundle price
- **Subscription**: Price locked for annual subscribers during subscription period

---

## Conclusion

KEYS pricing is designed to be:
- **Fair**: Fraction of consultant/in-house cost
- **Transparent**: Clear value proposition for each SKU
- **Flexible**: Multiple purchase options (individual, bundle, subscription)
- **Upgrade-Friendly**: Credits for owned KEYS

The model prioritizes **customer value** over maximum revenue extraction, building trust and long-term relationships.
