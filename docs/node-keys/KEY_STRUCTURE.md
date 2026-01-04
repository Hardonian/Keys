# Canonical Node / Next.js KEY Structure

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Universal folder structure (no deviations allowed)  
**Purpose**: Enforce consistent, predictable KEY organization

---

## Absolute Requirement

**Every Node / Next.js KEY MUST follow this exact structure. No deviations allowed.**

This structure ensures:
- Predictable integration
- Easy removal
- Clear documentation
- Consistent tooling
- Marketplace compatibility

---

## Standard Structure

```
/node-keys/<key-slug>/
├── README.md              # User-facing documentation
├── quickstart.md          # Quick integration guide
├── key.json               # Marketplace metadata
├── src/
│   ├── index.ts          # Main entry point
│   ├── handlers/         # Route handlers, job functions
│   ├── validators/       # Input validation, data validators
│   └── utils/            # Shared utilities (optional)
├── tests/
│   ├── unit.test.ts      # Unit tests
│   ├── integration.test.ts # Integration tests (optional)
│   └── fixtures/         # Test fixtures (optional)
├── assets/
│   └── diagram.svg       # Architecture diagram (optional)
├── CHANGELOG.md          # Version history
└── LICENSE.txt           # License file
```

---

## File Descriptions

### README.md

**Purpose**: Primary user-facing documentation

**Required Sections**:
1. **What This KEY Unlocks**: Clear outcome statement
2. **Installation**: Step-by-step integration
3. **Usage**: Code examples
4. **Configuration**: Environment variables, options
5. **Removal**: How to safely remove the KEY
6. **Troubleshooting**: Common issues and solutions

**Format**: Markdown

**Example**:
```markdown
# Stripe Webhook Entitlement Key

## What This KEY Unlocks

Unlocks Stripe webhook verification and entitlement checking for subscription-based features.

## Installation

1. Copy this KEY to your project
2. Install dependencies: `npm install stripe`
3. Mount the route handler
4. Configure environment variables

## Usage

[Code examples]

## Configuration

[Environment variables]

## Removal

[Removal steps]
```

---

### quickstart.md

**Purpose**: Fast integration guide for experienced developers

**Required Sections**:
1. **Prerequisites**: What you need
2. **Quick Install**: Minimal steps
3. **Basic Usage**: Minimal example
4. **Next Steps**: Links to full docs

**Format**: Markdown

**Example**:
```markdown
# Quick Start

## Prerequisites

- Node.js 18+
- Stripe account
- Existing Next.js app

## Quick Install

```bash
npm install stripe
```

Copy `src/index.ts` to your project.

## Basic Usage

```typescript
import { stripeWebhookHandler } from './node-keys/stripe-webhook-entitlement/src';

export default stripeWebhookHandler;
```

## Next Steps

See [README.md](./README.md) for full documentation.
```

---

### key.json

**Purpose**: Marketplace metadata and KEY configuration

**Required Fields**:
- `slug`: Unique identifier
- `title`: Display name
- `description`: Brief description
- `tool`: "node" | "next"
- `key_type`: Array of types (route, job, data, ui, integration)
- `runtime`: "node" | "edge"
- `version`: Semantic version
- `side_effects`: Explicit list of side effects
- `required_env`: Array of required environment variables
- `exposed_routes`: Array of route paths (if route key)
- `tenant_scope`: How tenant isolation is enforced
- `compatibility`: Compatibility requirements

**Format**: JSON

**Example**:
```json
{
  "slug": "stripe-webhook-entitlement",
  "title": "Stripe Webhook Entitlement Key",
  "description": "Unlocks Stripe webhook verification and entitlement checking",
  "tool": "next",
  "key_type": ["route", "integration"],
  "runtime": "node",
  "version": "1.0.0",
  "side_effects": [
    "Creates POST /api/webhooks/stripe route",
    "Verifies Stripe webhook signatures",
    "Checks user entitlements"
  ],
  "required_env": [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET"
  ],
  "exposed_routes": [
    "/api/webhooks/stripe"
  ],
  "tenant_scope": "per-request-tenant-id",
  "compatibility": {
    "next": ">=13.0.0",
    "node": ">=18.0.0"
  }
}
```

---

### src/index.ts

**Purpose**: Main entry point that exports KEY functionality

**Required Exports**:
- Primary function or component
- Type definitions
- Configuration types

**Format**: TypeScript

**Example**:
```typescript
import { stripeWebhookHandler } from './handlers/webhook';
import { verifyEntitlement } from './validators/entitlement';

export { stripeWebhookHandler, verifyEntitlement };
export type { StripeWebhookConfig, EntitlementResult } from './types';
```

---

### src/handlers/

**Purpose**: Route handlers, job functions, or main logic

**Structure**: One file per handler/function

**Example Files**:
- `webhook.ts`: Webhook handler
- `cron.ts`: Cron job function
- `queue.ts`: Queue processor

---

### src/validators/

**Purpose**: Input validation, data validation, security checks

**Structure**: One file per validator

**Example Files**:
- `entitlement.ts`: Entitlement validation
- `input.ts`: Input validation
- `auth.ts`: Authentication checks

---

### tests/

**Purpose**: Test suite for the KEY

**Required**:
- `unit.test.ts`: Unit tests for all functions

**Optional**:
- `integration.test.ts`: Integration tests
- `fixtures/`: Test data

**Format**: TypeScript with test framework (Jest, Vitest, etc.)

---

### assets/

**Purpose**: Visual assets (diagrams, screenshots)

**Optional**: Only include if it adds value

**Example**: `diagram.svg` showing architecture

---

### CHANGELOG.md

**Purpose**: Version history and migration notes

**Format**: Markdown following Keep a Changelog format

**Example**:
```markdown
# Changelog

## [1.0.0] - 2024-12-30

### Added
- Initial release
- Stripe webhook verification
- Entitlement checking

## [1.1.0] - 2024-12-31

### Added
- Support for multiple subscription tiers

### Changed
- Updated Stripe API version
```

---

### LICENSE.txt

**Purpose**: License file

**Format**: Plain text with license text

**Example**: MIT, Apache 2.0, or custom license

---

## Structure Validation

Every KEY must pass structure validation:

```typescript
interface KeyStructure {
  'README.md': string;
  'quickstart.md': string;
  'key.json': object;
  'src/index.ts': string;
  'CHANGELOG.md': string;
  'LICENSE.txt': string;
}
```

Validation checks:
- All required files exist
- `key.json` is valid JSON
- `src/index.ts` exports at least one function
- Structure matches canonical format

---

## Deviations

**No deviations allowed.**

If a KEY needs a different structure, it must:
1. Propose the change to the canonical structure
2. Get approval before implementation
3. Update this document if approved

**Rationale**: Consistency enables tooling, automation, and user trust.

---

## Version History

- **1.0.0** (2024-12-30): Initial canonical structure definition
