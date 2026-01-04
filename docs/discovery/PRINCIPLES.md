# KEYS Discovery Principles

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Discovery engine principles  
**Purpose**: Define how users discover the RIGHT KEY at the RIGHT TIME

---

## Core Principle

**Discovery is NOT search. Discovery is guidance.**

Discovery must:
- Reduce cognitive load
- Surface relevance early
- Respect user maturity
- Avoid upsell noise

---

## Discovery Philosophy

### Guidance, Not Search

**Search**:
- User knows what they want
- User types query
- System returns results
- User selects from results

**Discovery**:
- User may not know what they need
- System observes context
- System suggests relevant KEYS
- User discovers capability

### Right KEY, Right Time

**Right KEY**:
- Matches user's actual need
- Fits user's skill level
- Works with user's tools
- Solves user's problem

**Right Time**:
- When user needs it
- When user is ready
- When user has context
- When user can act

---

## Discovery Principles

### 1. Reduce Cognitive Load

**Principle**: Don't make users think

**Application**:
- Show fewer, better options
- Use clear, simple language
- Provide context for recommendations
- Explain why KEY is relevant

**Example**:
- ❌ **Bad**: "Here are 50 KEYS. Good luck!"
- ✅ **Good**: "Based on your Stripe integration, here are 3 KEYS that unlock billing capabilities."

---

### 2. Surface Relevance Early

**Principle**: Most relevant KEYS first

**Application**:
- Rank by relevance, not popularity
- Show relevant KEYS prominently
- Hide irrelevant KEYS
- Update relevance in real-time

**Example**:
- ❌ **Bad**: "Popular KEYS" (may not be relevant)
- ✅ **Good**: "KEYS for your Next.js + Stripe stack" (relevant)

---

### 3. Respect User Maturity

**Principle**: Match user's skill level

**Application**:
- Beginners → Starter KEYS
- Operators → Operator KEYS
- Scale users → Scale KEYS
- Don't overwhelm beginners with advanced KEYS

**Example**:
- ❌ **Bad**: Show enterprise audit KEY to beginner
- ✅ **Good**: Show starter billing KEY to beginner

---

### 4. Avoid Upsell Noise

**Principle**: Don't push irrelevant upsells

**Application**:
- Only suggest relevant upgrades
- Explain value, don't push
- Respect user's current needs
- Don't interrupt workflow

**Example**:
- ❌ **Bad**: "Upgrade to Enterprise!" (user just wants billing KEY)
- ✅ **Good**: "This KEY is part of the Billing Bundle. Save 40%." (relevant)

---

## Discovery Signals

### Signal Types

**1. Tool Usage**:
- What tools does user use? (Cursor, Jupyter, Node)
- What integrations do they have? (Stripe, Supabase)
- What frameworks do they use? (Next.js, React)

**2. Errors Encountered**:
- What errors are they seeing?
- What problems are they solving?
- What gaps exist in their setup?

**3. Lifecycle Stage**:
- Are they starting a project?
- Are they scaling a project?
- Are they maintaining a project?

**4. Industry / Role**:
- What industry are they in?
- What's their role? (developer, founder, operator)
- What compliance needs do they have?

**5. Previously Owned KEYS**:
- What KEYS do they already own?
- What patterns do they follow?
- What gaps exist in their KEY collection?

---

## Discovery Surfaces

### 1. Onboarding Flows

**When**: User first signs up

**Purpose**: Guide user to first KEY

**Approach**:
- Ask about tools they use
- Ask about problems they're solving
- Suggest 3-5 relevant KEYS
- Let user choose

**Example**:
```
Welcome to KEYS!

What tools do you use?
[ ] Cursor
[ ] Jupyter
[ ] Next.js
[ ] Stripe

What are you building?
[ ] SaaS application
[ ] Data analysis
[ ] API backend
[ ] Other

Based on your answers, here are KEYS for you:
1. Stripe Webhook Entitlement Key (Next.js + Stripe)
2. Supabase RLS Guard Key (Multi-tenant security)
3. Audit Log Capture Key (Compliance)
```

---

### 2. Contextual Nudges

**When**: User is in relevant context

**Purpose**: Suggest KEYS when relevant

**Approach**:
- Detect context (error, tool usage, etc.)
- Show relevant KEY suggestion
- Non-intrusive (dismissible)
- Explain why KEY is relevant

**Example**:
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

**Approach**:
- Filter by tool, outcome, maturity
- Show filtered results
- Update filters based on user behavior
- Remember user preferences

**Example**:
```
Marketplace Filters:
- Tool: [Next.js ▼]
- Outcome: [Billing ▼]
- Maturity: [Operator ▼]

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

**Approach**:
- Detect when user needs multiple KEYS
- Suggest relevant bundle
- Explain value (save money, complete solution)
- Don't push if not relevant

**Example**:
```
You're viewing multiple billing KEYS.

💡 The "Billing & Entitlements Bundle" includes:
   - Stripe Webhook Entitlement Key
   - Subscription Status Component Key
   - Usage Metering Key
   - Billing Dashboard Key

   Save 40% vs buying individually.

[View Bundle] [Continue Shopping]
```

---

### 5. Documentation Cross-Links

**When**: User is reading documentation

**Purpose**: Suggest related KEYS

**Approach**:
- Link to related KEYS in docs
- Explain how KEYS work together
- Show complementary KEYS
- Provide context

**Example**:
```
Stripe Webhook Entitlement Key Documentation

This KEY works well with:
- Subscription Status Component Key (display subscription status)
- Usage Metering Key (track feature usage)
- Billing Dashboard Key (admin dashboard)

[View Related KEYS]
```

---

## Discovery Quality Metrics

### Relevance

**Measure**:
- Click-through rate on recommendations
- Purchase rate from recommendations
- User satisfaction with recommendations
- Time to find relevant KEY

**Target**:
- Click-through rate > 20%
- Purchase rate > 5%
- User satisfaction > 4/5
- Time to find KEY < 2 minutes

---

### Cognitive Load

**Measure**:
- Number of options shown
- Time to understand options
- User confusion (support tickets)
- Abandonment rate

**Target**:
- Options shown: 3-5 (not 50)
- Time to understand: < 30 seconds
- Confusion rate: < 5%
- Abandonment rate: < 10%

---

### User Maturity Match

**Measure**:
- KEY maturity vs user maturity
- User success rate with recommended KEYS
- User feedback on KEY difficulty
- Upgrade rate (starter → operator → scale)

**Target**:
- Maturity match: > 80%
- Success rate: > 90%
- Difficulty feedback: Appropriate
- Upgrade rate: Natural progression

---

## Discovery Anti-Patterns

### ❌ Don't Do This

**1. Show Everything**:
- Don't show 50 KEYS and hope user finds the right one
- Don't overwhelm with options

**2. Push Irrelevant Upsells**:
- Don't suggest Enterprise KEY to beginner
- Don't push bundles when not relevant

**3. Ignore Context**:
- Don't suggest Jupyter KEYS to Node.js user
- Don't suggest advanced KEYS to beginner

**4. Make Users Search**:
- Don't make users type queries
- Don't make users filter through 100s of KEYS

---

## Version History

- **1.0.0** (2024-12-30): Initial discovery principles definition
