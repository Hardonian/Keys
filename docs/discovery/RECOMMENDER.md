# KEYS Discovery Recommender Logic

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Deterministic recommendation rules  
**Purpose**: Define transparent, explainable recommendation logic (no black-box AI)

---

## Core Principle

**Recommendations are deterministic, transparent, and explainable.**

No black-box AI. No opaque algorithms. Users can understand why KEY was recommended.

---

## Recommendation Rules

### Rule Format

**Format**: "If user does X → recommend Y"

**Structure**:
```typescript
interface RecommendationRule {
  id: string;
  condition: Condition; // When to apply rule
  recommendation: Recommendation; // What to recommend
  reason: string; // Why KEY was recommended
  confidence: number; // 0-1 confidence score
}
```

---

## Rule Categories

### 1. Tool-Based Rules

**Rule**: If user uses Tool X → recommend KEYS for Tool X

**Examples**:

```typescript
// Rule: Next.js + Stripe → Stripe Webhook Entitlement Key
{
  id: 'nextjs-stripe-billing',
  condition: {
    tools: ['nextjs', 'stripe'],
    outcomes: ['billing', 'subscription']
  },
  recommendation: {
    keySlug: 'stripe-webhook-entitlement',
    reason: 'You use Next.js and Stripe. This KEY unlocks webhook verification and entitlement checking.',
    confidence: 0.9
  }
}

// Rule: Jupyter + Data Validation → Data Validation Harness Key
{
  id: 'jupyter-data-validation',
  condition: {
    tools: ['jupyter'],
    outcomes: ['data_validation', 'ml_validation']
  },
  recommendation: {
    keySlug: 'jupyter-data-validation-harness',
    reason: 'You use Jupyter for data analysis. This KEY unlocks data validation patterns for ML models.',
    confidence: 0.85
  }
}
```

---

### 2. Error-Based Rules

**Rule**: If user encounters Error X → recommend KEY that solves Error X

**Examples**:

```typescript
// Rule: Stripe webhook verification failed → Stripe Webhook Entitlement Key
{
  id: 'stripe-webhook-error',
  condition: {
    errors: ['stripe_webhook_verification_failed'],
    tools: ['stripe']
  },
  recommendation: {
    keySlug: 'stripe-webhook-entitlement',
    reason: 'You encountered a Stripe webhook verification error. This KEY unlocks proper webhook verification.',
    confidence: 0.95
  }
}

// Rule: RLS policy not found → Supabase RLS Guard Key
{
  id: 'supabase-rls-error',
  condition: {
    errors: ['rls_policy_not_found', 'tenant_isolation_error'],
    tools: ['supabase']
  },
  recommendation: {
    keySlug: 'supabase-rls-guard',
    reason: 'You encountered RLS policy errors. This KEY unlocks tenant isolation with RLS policies.',
    confidence: 0.9
  }
}
```

---

### 3. Lifecycle-Based Rules

**Rule**: If user is at Stage X → recommend KEYS for Stage X

**Examples**:

```typescript
// Rule: Starting project → Starter KEYS
{
  id: 'starting-project-starter-keys',
  condition: {
    lifecycleStage: 'starting',
    maturity: 'starter'
  },
  recommendation: {
    keySlug: 'nextjs-basic-auth',
    reason: 'You\'re starting a new project. This starter KEY unlocks basic authentication.',
    confidence: 0.8
  }
}

// Rule: Scaling project → Operator KEYS
{
  id: 'scaling-project-operator-keys',
  condition: {
    lifecycleStage: 'scaling',
    maturity: 'operator'
  },
  recommendation: {
    keySlug: 'stripe-webhook-entitlement',
    reason: 'You\'re scaling your project. This operator KEY unlocks production-ready billing.',
    confidence: 0.85
  }
}

// Rule: Maintaining project → Scale KEYS
{
  id: 'maintaining-project-scale-keys',
  condition: {
    lifecycleStage: 'maintaining',
    maturity: 'scale'
  },
  recommendation: {
    keySlug: 'enterprise-audit-log-capture',
    reason: 'You\'re maintaining a production system. This scale KEY unlocks compliance and audit capabilities.',
    confidence: 0.8
  }
}
```

---

### 4. Complementary Rules

**Rule**: If user owns KEY X → recommend complementary KEY Y

**Examples**:

```typescript
// Rule: Owns Stripe Webhook Key → Recommend Subscription Status Component
{
  id: 'stripe-webhook-complement',
  condition: {
    ownedKeys: ['stripe-webhook-entitlement'],
    gaps: ['subscription_ui']
  },
  recommendation: {
    keySlug: 'subscription-status-component',
    reason: 'You own the Stripe Webhook Entitlement Key. This complementary KEY unlocks subscription status UI.',
    confidence: 0.75
  }
}

// Rule: Owns multiple billing KEYS → Recommend Billing Bundle
{
  id: 'billing-bundle-upsell',
  condition: {
    ownedKeys: ['stripe-webhook-entitlement', 'subscription-status-component'],
    gaps: ['billing_dashboard', 'usage_metering']
  },
  recommendation: {
    keySlug: 'billing-entitlements-bundle',
    reason: 'You own multiple billing KEYS. This bundle completes your billing system and saves 40%.',
    confidence: 0.8
  }
}
```

---

### 5. Industry/Role-Based Rules

**Rule**: If user is in Industry X / Role Y → recommend relevant KEYS

**Examples**:

```typescript
// Rule: Healthcare industry → Compliance KEYS
{
  id: 'healthcare-compliance',
  condition: {
    industry: 'healthcare',
    outcomes: ['compliance', 'audit']
  },
  recommendation: {
    keySlug: 'enterprise-audit-log-capture',
    reason: 'You\'re in healthcare. This KEY unlocks HIPAA-compliant audit logging.',
    confidence: 0.7
  }
}

// Rule: Founder role → Monetization KEYS
{
  id: 'founder-monetization',
  condition: {
    role: 'founder',
    outcomes: ['monetization', 'billing']
  },
  recommendation: {
    keySlug: 'billing-entitlements-bundle',
    reason: 'You\'re a founder building a SaaS. This bundle unlocks complete subscription billing.',
    confidence: 0.75
  }
}
```

---

## Recommendation Engine

### Rule Evaluation

```typescript
class RecommendationEngine {
  private rules: RecommendationRule[] = [];
  
  async recommend(
    userId: string,
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const signals = await getSignals(userId);
    const recommendations: Recommendation[] = [];
    
    // Evaluate all rules
    for (const rule of this.rules) {
      if (this.evaluateCondition(rule.condition, signals, context)) {
        recommendations.push({
          keySlug: rule.recommendation.keySlug,
          reason: rule.recommendation.reason,
          confidence: rule.recommendation.confidence,
          source: rule.id
        });
      }
    }
    
    // Sort by confidence (highest first)
    recommendations.sort((a, b) => b.confidence - a.confidence);
    
    // Return top 5 recommendations
    return recommendations.slice(0, 5);
  }
  
  private evaluateCondition(
    condition: Condition,
    signals: SignalData,
    context: RecommendationContext
  ): boolean {
    // Check tool usage
    if (condition.tools) {
      const hasAllTools = condition.tools.every(
        tool => signals.toolUsage.data[tool] === true
      );
      if (!hasAllTools) return false;
    }
    
    // Check errors
    if (condition.errors) {
      const hasMatchingError = signals.errors.data.some(
        error => condition.errors.includes(error.type)
      );
      if (!hasMatchingError) return false;
    }
    
    // Check lifecycle stage
    if (condition.lifecycleStage) {
      if (signals.lifecycleStage.data.stage !== condition.lifecycleStage) {
        return false;
      }
    }
    
    // Check owned KEYS
    if (condition.ownedKeys) {
      const hasAllKeys = condition.ownedKeys.every(
        keySlug => signals.ownedKeys.data.some(k => k.keySlug === keySlug)
      );
      if (!hasAllKeys) return false;
    }
    
    return true;
  }
}
```

---

## Recommendation Explanation

### Transparent Reasoning

**Every recommendation includes**:
- **Reason**: Why KEY was recommended
- **Source**: Which rule triggered recommendation
- **Confidence**: How confident we are (0-1)

**Example**:
```
Recommended for you:

1. Stripe Webhook Entitlement Key
   Reason: You use Next.js and Stripe. This KEY unlocks webhook verification and entitlement checking.
   Source: nextjs-stripe-billing rule
   Confidence: 90%

2. Subscription Status Component Key
   Reason: You own the Stripe Webhook Entitlement Key. This complementary KEY unlocks subscription status UI.
   Source: stripe-webhook-complement rule
   Confidence: 75%
```

---

## Recommendation Overrides

### User Preferences

**User can override recommendations**:
- "Don't show me billing KEYS"
- "Only show me security KEYS"
- "Hide recommendations for tools I don't use"

**Implementation**:
```typescript
interface UserPreferences {
  userId: string;
  hiddenCategories: string[]; // ["billing", "ui"]
  preferredOutcomes: string[]; // ["security", "compliance"]
  toolFilters: string[]; // Only show KEYS for these tools
}
```

---

## Recommendation Testing

### Unit Testing Rules

**Rules are testable**:

```typescript
describe('Recommendation Rules', () => {
  it('should recommend Stripe KEY for Next.js + Stripe users', () => {
    const signals: SignalData = {
      toolUsage: {
        data: { nextjs: true, stripe: true }
      },
      // ... other signals
    };
    
    const recommendations = engine.recommend(userId, { signals });
    
    expect(recommendations).toContainEqual(
      expect.objectContaining({
        keySlug: 'stripe-webhook-entitlement',
        confidence: expect.any(Number)
      })
    );
  });
});
```

---

## Version History

- **1.0.0** (2024-12-30): Initial recommender logic definition
