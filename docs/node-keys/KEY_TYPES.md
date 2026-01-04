# Node / Next.js KEY Types

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Defines atomic Node/Next KEY types  
**Purpose**: Absolute definition of allowed Node/Next KEY categories

---

## Core Principle

**Node / Next KEYS are runtime-executable capability modules that unlock specific backend or frontend capabilities inside existing Node.js or Next.js applications.**

They are NOT applications. They are NOT SaaS features. They are NOT starter templates.

They are **composable, auditable, removable capability units** that respect tenant boundaries and never assume ownership of the host app.

---

## Allowed KEY Types

### 1. ROUTE KEYS

**Purpose**: Unlock API routes, webhooks, or edge functions

**What They Unlock**:
- REST API endpoints
- Webhook handlers
- Edge function implementations
- API middleware patterns

**Examples**:
- Stripe Webhook Entitlement Route Key
- Supabase RLS Guard Route Key
- Audit Log Capture Route Key
- Rate Limiting Route Key

**Characteristics**:
- Exports route handlers or middleware
- Explicitly declares HTTP methods and paths
- Can be mounted at any path prefix
- Never assumes global route ownership
- Respects existing route structure

**Metadata**: `key_type = "route"`, `runtime = "node" | "edge"`

---

### 2. JOB KEYS

**Purpose**: Unlock background workers, cron jobs, or queue processors

**What They Unlock**:
- Scheduled background tasks
- Cron job implementations
- Queue processing workers
- Batch processing workflows

**Examples**:
- Background Reconciliation Job Key
- Safe Cron Execution Key
- Email Queue Processor Key
- Data Sync Job Key

**Characteristics**:
- Exports job functions or schedulers
- Explicitly declares schedule or trigger
- Can be registered with any job runner
- Never assumes global job ownership
- Respects existing job infrastructure

**Metadata**: `key_type = "job"`, `runtime = "node"`

---

### 3. DATA KEYS

**Purpose**: Unlock schema migrations, RLS policies, data validators, or reconciliation logic

**What They Unlock**:
- Database schema changes
- Row-Level Security (RLS) policies
- Data validation patterns
- Data reconciliation workflows
- Migration scripts

**Examples**:
- Supabase RLS Policy Key
- Data Validation Schema Key
- Migration Pattern Key
- Reconciliation Logic Key

**Characteristics**:
- Exports migration functions or validators
- Explicitly declares database dependencies
- Can be run independently or as part of migrations
- Never assumes database ownership
- Respects existing schema structure

**Metadata**: `key_type = "data"`, `runtime = "node"`

---

### 4. UI KEYS

**Purpose**: Unlock isolated components, pages, or dashboard widgets

**What They Unlock**:
- React/Next.js components
- Page implementations
- Dashboard widgets
- UI patterns

**Examples**:
- Audit Log Dashboard Widget Key
- Subscription Status Component Key
- Analytics Chart Component Key
- User Profile Widget Key

**Characteristics**:
- Exports React components or pages
- Explicitly declares dependencies
- Can be imported into any page or layout
- Never assumes global UI ownership
- Respects existing design system

**Metadata**: `key_type = "ui"`, `runtime = "next" | "react"`

---

### 5. INTEGRATION KEYS

**Purpose**: Unlock integrations with external services (Stripe, Supabase, webhooks, APIs)

**What They Unlock**:
- Third-party service integrations
- Webhook verification patterns
- API client wrappers
- Service-specific utilities

**Examples**:
- Stripe Webhook Entitlement Key
- Supabase RLS Guard Key
- External API Client Key
- Webhook Verification Key

**Characteristics**:
- Exports integration functions or clients
- Explicitly declares service dependencies
- Can be used alongside other integrations
- Never assumes service ownership
- Respects existing integration patterns

**Metadata**: `key_type = "integration"`, `runtime = "node" | "next"`

---

## KEY Type Selection Guide

### When to Use ROUTE KEYS
- You need to add API endpoints
- You need webhook handlers
- You need edge functions
- You need route-level middleware

### When to Use JOB KEYS
- You need scheduled tasks
- You need background workers
- You need queue processors
- You need batch operations

### When to Use DATA KEYS
- You need database migrations
- You need RLS policies
- You need data validators
- You need reconciliation logic

### When to Use UI KEYS
- You need React components
- You need Next.js pages
- You need dashboard widgets
- You need UI patterns

### When to Use INTEGRATION KEYS
- You need third-party service clients
- You need webhook verification
- You need API wrappers
- You need service utilities

---

## KEY Type Combinations

A single KEY can combine multiple types if they are logically related:

**Example**: Stripe Webhook Entitlement Key
- **Route Key**: Webhook handler endpoint
- **Integration Key**: Stripe API client
- **Data Key**: Entitlement validation logic

**Metadata**: `key_type = ["route", "integration", "data"]`

---

## Forbidden KEY Types

### ❌ APPLICATION KEYS
A KEY cannot be a full application. It must be a composable module.

### ❌ FRAMEWORK KEYS
A KEY cannot require rewriting the host app. It must integrate into existing structure.

### ❌ MONOLITH KEYS
A KEY cannot assume ownership of the entire app. It must be removable.

### ❌ MAGIC KEYS
A KEY cannot hide behavior. All execution paths must be explicit and inspectable.

---

## Version History

- **1.0.0** (2024-12-30): Initial canonical definition of Node/Next KEY types
