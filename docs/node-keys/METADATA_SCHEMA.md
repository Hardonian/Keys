# Node / Next.js KEY Metadata Schema

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Defines key.json schema for Node/Next KEYS  
**Purpose**: Ensure consistent marketplace metadata and KEY configuration

---

## Core Principle

**Every Node / Next.js KEY must have a valid `key.json` file that declares all capabilities, requirements, and side effects.**

No surprises. Everything explicit.

---

## Required Schema

```typescript
interface NodeKeyMetadata {
  // Core identification
  slug: string;                    // Unique identifier (kebab-case)
  title: string;                   // Display name
  description: string;              // Brief description (1-2 sentences)
  
  // Tool and type classification
  tool: "node" | "next";            // Target tool
  key_type: KeyType[];              // Array of KEY types
  runtime: "node" | "edge";         // Runtime environment
  
  // Versioning
  version: string;                  // Semantic version (e.g., "1.0.0")
  
  // Side effects (explicit declaration)
  side_effects: string[];           // List of all side effects
  
  // Environment requirements
  required_env: string[];           // Required environment variables
  optional_env?: string[];          // Optional environment variables
  
  // Route exposure (if route key)
  exposed_routes?: RouteDefinition[]; // Routes exposed by this KEY
  
  // Tenant isolation
  tenant_scope: TenantScope;        // How tenant isolation is enforced
  
  // Compatibility
  compatibility: Compatibility;      // Compatibility requirements
  
  // Dependencies
  dependencies?: Dependency[];       // NPM dependencies
  
  // Marketplace metadata
  outcome?: string;                 // Outcome category (automation, monetization, etc.)
  maturity?: "starter" | "operator" | "scale" | "enterprise";
  tags?: string[];                   // Search tags
  
  // License
  license_spdx: string;             // SPDX license identifier
  
  // Author information
  author?: {
    name: string;
    email?: string;
    url?: string;
  };
  
  // Documentation links
  documentation?: {
    readme?: string;
    quickstart?: string;
    changelog?: string;
  };
}
```

---

## Type Definitions

### KeyType

```typescript
type KeyType = 
  | "route"        // API routes, webhooks, edge functions
  | "job"          // Background workers, cron jobs, queue processors
  | "data"         // Schema migrations, RLS policies, validators
  | "ui"           // React components, pages, widgets
  | "integration"; // Third-party service integrations
```

---

### RouteDefinition

```typescript
interface RouteDefinition {
  path: string;                     // Route path (e.g., "/api/webhooks/stripe")
  method: HttpMethod[];             // HTTP methods (GET, POST, etc.)
  description?: string;             // Route description
  auth_required?: boolean;           // Whether auth is required
  tenant_scope?: TenantScope;       // Tenant isolation for this route
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
```

---

### TenantScope

```typescript
type TenantScope =
  | "per-request-tenant-id"    // Tenant ID from request headers/params
  | "per-user-tenant-id"        // Tenant ID from authenticated user
  | "per-session-tenant-id"     // Tenant ID from session
  | "global";                   // No tenant isolation (must be documented)
```

---

### Compatibility

```typescript
interface Compatibility {
  node?: string;                   // Node.js version requirement (e.g., ">=18.0.0")
  next?: string;                   // Next.js version requirement (e.g., ">=13.0.0")
  react?: string;                  // React version requirement (if UI key)
  typescript?: string;             // TypeScript version requirement
}
```

---

### Dependency

```typescript
interface Dependency {
  name: string;                    // Package name (e.g., "stripe")
  version: string;                 // Version requirement (e.g., "^12.0.0")
  required: boolean;               // Whether dependency is required
  description?: string;            // Why this dependency is needed
}
```

---

## Example: Route KEY

```json
{
  "slug": "stripe-webhook-entitlement",
  "title": "Stripe Webhook Entitlement Key",
  "description": "Unlocks Stripe webhook verification and entitlement checking for subscription-based features",
  "tool": "next",
  "key_type": ["route", "integration"],
  "runtime": "node",
  "version": "1.0.0",
  "side_effects": [
    "Creates POST /api/webhooks/stripe route handler",
    "Verifies Stripe webhook signatures",
    "Checks user entitlements from Stripe subscriptions",
    "Updates local database with subscription status"
  ],
  "required_env": [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET"
  ],
  "optional_env": [
    "STRIPE_API_VERSION"
  ],
  "exposed_routes": [
    {
      "path": "/api/webhooks/stripe",
      "method": ["POST"],
      "description": "Stripe webhook handler for subscription events",
      "auth_required": false,
      "tenant_scope": "per-request-tenant-id"
    }
  ],
  "tenant_scope": "per-request-tenant-id",
  "compatibility": {
    "node": ">=18.0.0",
    "next": ">=13.0.0",
    "typescript": ">=5.0.0"
  },
  "dependencies": [
    {
      "name": "stripe",
      "version": "^12.0.0",
      "required": true,
      "description": "Stripe SDK for webhook verification and API calls"
    }
  ],
  "outcome": "monetization",
  "maturity": "operator",
  "tags": ["stripe", "webhook", "subscription", "entitlement"],
  "license_spdx": "MIT",
  "author": {
    "name": "KEYS Team",
    "email": "keys@example.com"
  },
  "documentation": {
    "readme": "README.md",
    "quickstart": "quickstart.md",
    "changelog": "CHANGELOG.md"
  }
}
```

---

## Example: Job KEY

```json
{
  "slug": "background-reconciliation",
  "title": "Background Reconciliation Job Key",
  "description": "Unlocks automated background reconciliation of subscription data with Stripe",
  "tool": "node",
  "key_type": ["job"],
  "runtime": "node",
  "version": "1.0.0",
  "side_effects": [
    "Runs scheduled background job",
    "Queries Stripe API for subscription data",
    "Updates local database with reconciliation results",
    "Sends email notifications on discrepancies"
  ],
  "required_env": [
    "STRIPE_SECRET_KEY",
    "DATABASE_URL"
  ],
  "optional_env": [
    "RECONCILIATION_SCHEDULE",
    "EMAIL_NOTIFICATION_ENABLED"
  ],
  "tenant_scope": "per-user-tenant-id",
  "compatibility": {
    "node": ">=18.0.0"
  },
  "dependencies": [
    {
      "name": "stripe",
      "version": "^12.0.0",
      "required": true
    },
    {
      "name": "node-cron",
      "version": "^3.0.0",
      "required": false,
      "description": "Optional cron scheduler (can use any job runner)"
    }
  ],
  "outcome": "automation",
  "maturity": "scale",
  "tags": ["stripe", "reconciliation", "background-job", "cron"],
  "license_spdx": "MIT"
}
```

---

## Example: Data KEY

```json
{
  "slug": "supabase-rls-guard",
  "title": "Supabase RLS Guard Key",
  "description": "Unlocks Row-Level Security (RLS) policies for tenant isolation in Supabase",
  "tool": "node",
  "key_type": ["data"],
  "runtime": "node",
  "version": "1.0.0",
  "side_effects": [
    "Creates RLS policies on subscriptions table",
    "Creates RLS policies on users table",
    "Enables RLS on tables",
    "Creates database functions for tenant isolation"
  ],
  "required_env": [
    "DATABASE_URL"
  ],
  "tenant_scope": "per-user-tenant-id",
  "compatibility": {
    "node": ">=18.0.0"
  },
  "dependencies": [
    {
      "name": "@supabase/supabase-js",
      "version": "^2.0.0",
      "required": true,
      "description": "Supabase client for database operations"
    }
  ],
  "outcome": "compliance",
  "maturity": "operator",
  "tags": ["supabase", "rls", "security", "tenant-isolation"],
  "license_spdx": "MIT"
}
```

---

## Example: UI KEY

```json
{
  "slug": "audit-log-capture",
  "title": "Audit Log Capture Key",
  "description": "Unlocks audit log dashboard widget for tracking user actions",
  "tool": "next",
  "key_type": ["ui"],
  "runtime": "next",
  "version": "1.0.0",
  "side_effects": [
    "Exports React component for audit log display",
    "Queries database for audit log entries",
    "Renders audit log UI"
  ],
  "required_env": [
    "DATABASE_URL"
  ],
  "optional_env": [
    "AUDIT_LOG_RETENTION_DAYS"
  ],
  "tenant_scope": "per-user-tenant-id",
  "compatibility": {
    "node": ">=18.0.0",
    "next": ">=13.0.0",
    "react": ">=18.0.0",
    "typescript": ">=5.0.0"
  },
  "dependencies": [
    {
      "name": "react",
      "version": "^18.0.0",
      "required": true
    }
  ],
  "outcome": "compliance",
  "maturity": "operator",
  "tags": ["audit-log", "dashboard", "compliance", "ui"],
  "license_spdx": "MIT"
}
```

---

## Validation Rules

### Required Fields

All fields except `optional_env`, `exposed_routes`, `dependencies`, `outcome`, `maturity`, `tags`, `author`, and `documentation` are required.

### Field Validation

- `slug`: Must be kebab-case, unique within marketplace
- `version`: Must be valid semantic version
- `tool`: Must be "node" or "next"
- `key_type`: Must be non-empty array of valid KeyType values
- `runtime`: Must be "node" or "edge"
- `required_env`: Must be array of strings (env var names)
- `tenant_scope`: Must be valid TenantScope value
- `license_spdx`: Must be valid SPDX license identifier

### Side Effects Validation

- All side effects must be explicitly declared
- Side effects must be accurate and complete
- No hidden side effects allowed

### Route Validation

- If `key_type` includes "route", `exposed_routes` must be provided
- All routes must have valid paths and methods
- Route paths must be absolute (start with `/`)

### Compatibility Validation

- At least one compatibility requirement must be specified
- Version strings must be valid semver ranges

---

## Marketplace Integration

The `key.json` file is used by:

1. **Marketplace UI**: Display KEY information, filtering, search
2. **Installation Scripts**: Validate requirements, check compatibility
3. **Documentation Generation**: Auto-generate docs from metadata
4. **Analytics**: Track KEY usage, compatibility, outcomes
5. **Bundling Logic**: Group compatible KEYS together

---

## Version History

- **1.0.0** (2024-12-30): Initial metadata schema definition
