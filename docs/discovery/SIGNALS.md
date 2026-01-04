# KEYS Discovery Signals

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Signal inputs for discovery engine  
**Purpose**: Define signals KEYS may use for discovery (no invasive tracking, no dark patterns)

---

## Core Principle

**No invasive tracking. No dark patterns.**

Signals must be:
- **Explicit**: User knows what's being tracked
- **Opt-in**: User can opt out
- **Transparent**: User can see what's tracked
- **Respectful**: No dark patterns or manipulation

---

## Signal Categories

### 1. Tool Usage Signals

**What**: What tools does user use?

**Sources**:
- User profile (explicitly provided)
- Integration connections (Stripe, Supabase)
- Project files (package.json, requirements.txt)
- User declarations (onboarding survey)

**Examples**:
- User uses Next.js (from package.json)
- User has Stripe integration (from API key connection)
- User uses Jupyter (from notebook files)

**Privacy**:
- ✅ User explicitly provides (profile, survey)
- ✅ User connects integration (Stripe, Supabase)
- ✅ User uploads project files (with permission)
- ❌ Never track without permission
- ❌ Never track browser history
- ❌ Never track external sites

---

### 2. Error Signals

**What**: What errors are users encountering?

**Sources**:
- Error logs (with user permission)
- Support tickets (explicitly submitted)
- User reports (explicitly provided)

**Examples**:
- User reports "Stripe webhook verification failed"
- User logs error: "RLS policy not found"
- User submits support ticket: "Need help with billing"

**Privacy**:
- ✅ User explicitly reports error
- ✅ User submits support ticket
- ✅ User opts into error logging
- ❌ Never track errors without permission
- ❌ Never track errors from other tools
- ❌ Never track sensitive error data

---

### 3. Lifecycle Stage Signals

**What**: What stage is user's project in?

**Sources**:
- User declarations (onboarding survey)
- Project metadata (git commits, file structure)
- User behavior (first KEY purchase, multiple KEY purchases)

**Examples**:
- User is "starting a project" (onboarding survey)
- User has "many commits" (project metadata)
- User purchased "first KEY" (purchase behavior)

**Privacy**:
- ✅ User explicitly declares (survey)
- ✅ User shares project metadata (with permission)
- ✅ User's purchase behavior (public data)
- ❌ Never infer without user input
- ❌ Never track without permission

---

### 4. Industry / Role Signals

**What**: What industry and role is user in?

**Sources**:
- User profile (explicitly provided)
- Company domain (from email, with permission)
- User declarations (onboarding survey)

**Examples**:
- User is "developer" (profile)
- User works at "healthcare company" (domain inference)
- User is "founder" (survey)

**Privacy**:
- ✅ User explicitly provides (profile, survey)
- ✅ User's email domain (public data, with permission)
- ❌ Never infer without user input
- ❌ Never track without permission

---

### 5. Previously Owned KEYS Signals

**What**: What KEYS does user already own?

**Sources**:
- Purchase history (user's own purchases)
- KEY usage (which KEYS user actually uses)

**Examples**:
- User owns "Stripe Webhook Entitlement Key"
- User uses "Supabase RLS Guard Key" frequently
- User purchased "Billing Bundle"

**Privacy**:
- ✅ User's own purchase history (user data)
- ✅ User's KEY usage (user data)
- ❌ Never track other users' purchases
- ❌ Never track without permission

---

## Signal Collection

### Explicit Opt-In

**User must explicitly opt in**:

```typescript
interface SignalConsent {
  userId: string;
  toolUsage: boolean; // User opts into tool usage tracking
  errorLogging: boolean; // User opts into error logging
  projectMetadata: boolean; // User opts into project metadata
  industryRole: boolean; // User opts into industry/role tracking
  keyUsage: boolean; // User opts into KEY usage tracking
  updatedAt: Date;
}
```

**User can opt out anytime**:
- Settings page: "Privacy & Data"
- Per-signal opt-out
- Complete opt-out (all signals)

---

### Transparent Collection

**User can see what's collected**:

```typescript
interface SignalData {
  userId: string;
  signals: {
    toolUsage: {
      sources: string[]; // ["profile", "package.json"]
      data: Record<string, any>; // { "nextjs": true, "stripe": true }
    };
    errors: {
      sources: string[]; // ["support_ticket", "error_log"]
      data: Array<{
        type: string;
        message: string;
        timestamp: Date;
      }>;
    };
    lifecycleStage: {
      sources: string[]; // ["survey", "project_metadata"]
      data: {
        stage: string; // "starting", "scaling", "maintaining"
      };
    };
    industryRole: {
      sources: string[]; // ["profile", "email_domain"]
      data: {
        industry: string;
        role: string;
      };
    };
    ownedKeys: {
      sources: string[]; // ["purchase_history"]
      data: Array<{
        keySlug: string;
        purchasedAt: Date;
      }>;
    };
  };
}
```

**User can export their data**:
- API: `/api/user/signals/export`
- Dashboard: "Export My Data"
- Format: JSON

---

## Signal Usage

### Recommendation Logic

**Signals used for recommendations**:

```typescript
interface RecommendationInput {
  userId: string;
  signals: SignalData;
  context: {
    currentPage: string; // "marketplace", "dashboard", "docs"
    currentAction: string; // "browsing", "error", "onboarding"
  };
}

interface Recommendation {
  keySlug: string;
  reason: string; // "You use Next.js and Stripe"
  confidence: number; // 0-1
  source: string; // Which signal led to this recommendation
}
```

**Example**:
```typescript
// User uses Next.js + Stripe
// Signal: toolUsage = { nextjs: true, stripe: true }
// Recommendation: "Stripe Webhook Entitlement Key"
// Reason: "You use Next.js and Stripe"
// Confidence: 0.9
```

---

### Signal Weighting

**Not all signals are equal**:

```typescript
interface SignalWeights {
  toolUsage: 0.4; // High weight (explicit, reliable)
  errors: 0.3; // Medium weight (explicit, but may be one-off)
  lifecycleStage: 0.2; // Medium weight (may change)
  industryRole: 0.05; // Low weight (less reliable)
  ownedKeys: 0.05; // Low weight (complementary, not primary)
}
```

**Rationale**:
- Tool usage is most reliable (explicit, stable)
- Errors are reliable but may be one-off
- Lifecycle stage may change
- Industry/role is less reliable (inferred)
- Owned KEYS are complementary (suggest related KEYS)

---

## Signal Privacy

### Data Minimization

**Collect only what's needed**:
- Don't collect unnecessary data
- Don't collect sensitive data
- Don't collect data without purpose

**Example**:
- ✅ Collect: "User uses Next.js" (needed for recommendations)
- ❌ Don't collect: "User's exact file contents" (not needed)

---

### Data Retention

**Retain only as long as needed**:
- Active signals: 90 days
- Historical signals: 1 year (for trend analysis)
- Deleted user signals: 30 days (for recovery)

---

### Data Security

**Protect signal data**:
- Encrypt at rest
- Encrypt in transit
- Access controls (user can only see their own)
- Audit logs (who accessed what, when)

---

## Signal Opt-Out

### Per-Signal Opt-Out

**User can opt out of specific signals**:

```typescript
// User opts out of error logging
await updateSignalConsent(userId, {
  errorLogging: false
});

// Recommendations no longer use error signals
// But still use other signals (tool usage, etc.)
```

---

### Complete Opt-Out

**User can opt out of all signals**:

```typescript
// User opts out of all signals
await updateSignalConsent(userId, {
  toolUsage: false,
  errorLogging: false,
  projectMetadata: false,
  industryRole: false,
  keyUsage: false
});

// Recommendations use only public data (popular KEYS, etc.)
```

---

## Signal Transparency

### User Dashboard

**User can see their signals**:

```
Your Discovery Signals

Tool Usage: ✅ Enabled
- Next.js: Detected from package.json
- Stripe: Detected from API connection

Error Logging: ✅ Enabled
- Last error: "Stripe webhook verification failed" (2 days ago)

Lifecycle Stage: ✅ Enabled
- Stage: "Scaling" (from survey)

Industry/Role: ✅ Enabled
- Industry: "SaaS" (from email domain)
- Role: "Developer" (from profile)

Owned KEYS: ✅ Enabled
- Stripe Webhook Entitlement Key (purchased 1 week ago)

[Edit Settings] [Export Data] [Opt Out]
```

---

## Signal Ethics

### No Dark Patterns

**Don't do this**:
- ❌ Track without permission
- ❌ Hide tracking in terms
- ❌ Make opt-out difficult
- ❌ Use tracking for manipulation

---

### Respect User Privacy

**Do this**:
- ✅ Ask for permission
- ✅ Make opt-out easy
- ✅ Be transparent
- ✅ Respect user choices

---

## Version History

- **1.0.0** (2024-12-30): Initial signal definition
