# KEYS Discovery Surfaces

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Discovery surface implementations  
**Purpose**: Define where and how discovery happens in the KEYS platform

---

## Core Principle

**Discovery happens where users are, when they need it.**

Surfaces must be:
- **Contextual**: Relevant to user's current task
- **Non-intrusive**: Don't interrupt workflow
- **Actionable**: User can act immediately
- **Dismissible**: User can dismiss if not relevant

---

## Discovery Surfaces

### 1. Onboarding Flows

**When**: User first signs up

**Purpose**: Guide user to first KEY

**Implementation**:

```typescript
interface OnboardingFlow {
  steps: OnboardingStep[];
}

interface OnboardingStep {
  id: string;
  type: 'question' | 'recommendation' | 'completion';
  question?: string;
  options?: string[];
  recommendations?: Recommendation[];
}

// Example flow
const onboardingFlow: OnboardingFlow = {
  steps: [
    {
      id: 'tools',
      type: 'question',
      question: 'What tools do you use?',
      options: ['Cursor', 'Jupyter', 'Next.js', 'Stripe', 'Supabase']
    },
    {
      id: 'outcomes',
      type: 'question',
      question: 'What are you building?',
      options: ['SaaS application', 'Data analysis', 'API backend', 'Other']
    },
    {
      id: 'recommendations',
      type: 'recommendation',
      recommendations: [
        {
          keySlug: 'stripe-webhook-entitlement',
          reason: 'You use Next.js and Stripe. This KEY unlocks webhook verification.',
          confidence: 0.9
        }
      ]
    },
    {
      id: 'completion',
      type: 'completion',
      message: 'Welcome to KEYS! Here are KEYS recommended for you.'
    }
  ]
};
```

**UI Example**:
```
Welcome to KEYS!

Step 1 of 3: What tools do you use?
[ ] Cursor
[ ] Jupyter
[ ] Next.js
[ ] Stripe
[ ] Supabase

[Next]
```

---

### 2. Contextual Nudges

**When**: User is in relevant context

**Purpose**: Suggest KEYS when relevant

**Implementation**:

```typescript
interface ContextualNudge {
  id: string;
  trigger: NudgeTrigger;
  recommendation: Recommendation;
  placement: 'inline' | 'sidebar' | 'banner' | 'modal';
  dismissible: boolean;
}

interface NudgeTrigger {
  type: 'error' | 'tool_usage' | 'documentation' | 'marketplace';
  condition: Condition;
}

// Example: Error-based nudge
const errorNudge: ContextualNudge = {
  id: 'stripe-webhook-error-nudge',
  trigger: {
    type: 'error',
    condition: {
      errorType: 'stripe_webhook_verification_failed',
      tools: ['stripe']
    }
  },
  recommendation: {
    keySlug: 'stripe-webhook-entitlement',
    reason: 'This KEY can help fix Stripe webhook verification errors.',
    confidence: 0.95
  },
  placement: 'inline',
  dismissible: true
};
```

**UI Example**:
```
⚠️ Stripe webhook verification failed

💡 The "Stripe Webhook Entitlement Key" can help:
   - Verify webhook signatures
   - Check user entitlements
   - Update subscription status

[Learn More] [Dismiss]
```

---

### 3. Marketplace Filters

**When**: User is browsing marketplace

**Purpose**: Help user find relevant KEYS

**Implementation**:

```typescript
interface MarketplaceFilters {
  tool: string[]; // ["nextjs", "stripe"]
  outcome: string[]; // ["billing", "security"]
  maturity: string[]; // ["starter", "operator", "scale"]
  priceRange: [number, number]; // [0, 299]
  owned: 'all' | 'owned' | 'not_owned';
}

interface MarketplaceView {
  filters: MarketplaceFilters;
  recommendations: Recommendation[];
  results: Key[];
  sortBy: 'relevance' | 'price' | 'popularity' | 'newest';
}
```

**UI Example**:
```
Marketplace

Filters:
- Tool: [Next.js ▼] [Stripe ▼]
- Outcome: [Billing ▼]
- Maturity: [Operator ▼]
- Price: $0 - $299
- Show: [All KEYS ▼]

Sort by: [Relevance ▼]

Recommended for you:
1. Stripe Webhook Entitlement Key ($99)
   You use Next.js and Stripe. This KEY unlocks webhook verification.

Results: 5 KEYS
1. Stripe Webhook Entitlement Key
2. Subscription Status Component Key
3. Usage Metering Key
...
```

---

### 4. Upgrade Prompts

**When**: User needs multiple KEYS

**Purpose**: Suggest bundles or tiers

**Implementation**:

```typescript
interface UpgradePrompt {
  id: string;
  trigger: UpgradeTrigger;
  suggestion: BundleSuggestion | TierSuggestion;
  placement: 'cart' | 'checkout' | 'marketplace' | 'dashboard';
  dismissible: boolean;
}

interface UpgradeTrigger {
  type: 'multiple_keys' | 'bundle_opportunity' | 'tier_opportunity';
  condition: Condition;
}

// Example: Bundle suggestion
const bundleSuggestion: UpgradePrompt = {
  id: 'billing-bundle-suggestion',
  trigger: {
    type: 'bundle_opportunity',
    condition: {
      cartKeys: ['stripe-webhook-entitlement', 'subscription-status-component'],
      bundleKeys: ['stripe-webhook-entitlement', 'subscription-status-component', 'usage-metering', 'billing-dashboard']
    }
  },
  suggestion: {
    type: 'bundle',
    bundleSlug: 'billing-entitlements-bundle',
    savings: 0.4, // 40% discount
    reason: 'You\'re viewing multiple billing KEYS. This bundle completes your billing system and saves 40%.'
  },
  placement: 'cart',
  dismissible: true
};
```

**UI Example**:
```
Your Cart (2 items)
- Stripe Webhook Entitlement Key ($99)
- Subscription Status Component Key ($49)

💡 The "Billing & Entitlements Bundle" includes:
   - Stripe Webhook Entitlement Key
   - Subscription Status Component Key
   - Usage Metering Key
   - Billing Dashboard Key

   Save 40% vs buying individually ($299 vs $296)

[View Bundle] [Continue Shopping]
```

---

### 5. Documentation Cross-Links

**When**: User is reading documentation

**Purpose**: Suggest related KEYS

**Implementation**:

```typescript
interface DocumentationCrossLink {
  docPath: string;
  relatedKeys: RelatedKey[];
}

interface RelatedKey {
  keySlug: string;
  relationship: 'complements' | 'extends' | 'replaces' | 'similar';
  reason: string;
}

// Example: Stripe Webhook Key docs
const stripeWebhookDocs: DocumentationCrossLink = {
  docPath: '/docs/keys/stripe-webhook-entitlement',
  relatedKeys: [
    {
      keySlug: 'subscription-status-component',
      relationship: 'complements',
      reason: 'Display subscription status in your UI'
    },
    {
      keySlug: 'usage-metering',
      relationship: 'extends',
      reason: 'Track feature usage alongside subscriptions'
    }
  ]
};
```

**UI Example**:
```
Stripe Webhook Entitlement Key Documentation

This KEY works well with:
- Subscription Status Component Key (display subscription status)
- Usage Metering Key (track feature usage)
- Billing Dashboard Key (admin dashboard)

[View Related KEYS]
```

---

## Surface Placement Strategy

### Inline Placement

**When**: Contextual to current content

**Examples**:
- Error messages (show KEY that fixes error)
- Documentation (show related KEYS)
- Code examples (show KEY that implements pattern)

**Guidelines**:
- Non-intrusive
- Dismissible
- Relevant to context

---

### Sidebar Placement

**When**: Persistent recommendations

**Examples**:
- Marketplace sidebar (recommended KEYS)
- Dashboard sidebar (suggested KEYS)
- Documentation sidebar (related KEYS)

**Guidelines**:
- Always visible
- Collapsible
- Context-aware

---

### Banner Placement

**When**: Important announcements

**Examples**:
- New KEY releases
- Bundle promotions
- Tier upgrades

**Guidelines**:
- Dismissible
- Time-limited
- Not too frequent

---

### Modal Placement

**When**: Critical recommendations

**Examples**:
- Onboarding completion
- First KEY purchase
- Tier upgrade opportunity

**Guidelines**:
- Rarely used
- High value
- User-initiated (when possible)

---

## Surface Behavior

### Dismissal

**All surfaces are dismissible**:
- User can dismiss nudge
- System remembers dismissal
- User can re-enable in settings

**Implementation**:
```typescript
interface Dismissal {
  userId: string;
  surfaceId: string;
  dismissedAt: Date;
  expiresAt?: Date; // Optional: re-show after expiration
}

// User dismisses nudge
await dismissSurface(userId, 'stripe-webhook-error-nudge');

// System respects dismissal
if (await isDismissed(userId, 'stripe-webhook-error-nudge')) {
  return; // Don't show nudge
}
```

---

### Frequency Limits

**Don't overwhelm users**:
- Max 3 nudges per session
- Max 1 nudge per page
- Cooldown between similar nudges (24 hours)

**Implementation**:
```typescript
interface FrequencyLimit {
  maxPerSession: number;
  maxPerPage: number;
  cooldownHours: number;
}

const frequencyLimits: FrequencyLimit = {
  maxPerSession: 3,
  maxPerPage: 1,
  cooldownHours: 24
};
```

---

## Surface Analytics

### Track Performance

**Measure**:
- Click-through rate
- Purchase rate
- Dismissal rate
- Time to action

**Example**:
```typescript
interface SurfaceAnalytics {
  surfaceId: string;
  impressions: number;
  clicks: number;
  purchases: number;
  dismissals: number;
  ctr: number; // Click-through rate
  conversionRate: number; // Purchase rate
}
```

---

## Version History

- **1.0.0** (2024-12-30): Initial discovery surfaces definition
