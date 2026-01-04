# KEYS 90-Day Roadmap Execution Plan

**Version**: 1.0.0  
**Created**: 2025-01-XX  
**Status**: Active Implementation  
**Source**: `/docs/roadmap/NEW_KEYS_ROADMAP.md`

---

## Executive Summary

This document translates the 90-day roadmap (`NEW_KEYS_ROADMAP.md`) into an executable implementation plan. It maps roadmap milestones to concrete code changes, database updates, and acceptance criteria.

**Roadmap Scope**: P0 (30 days) → P1 (60 days) → P2 (90 days) + Strategic Bundles

---

## Day 0 Baseline Assessment

### Current State

**Marketplace Infrastructure**: ✅ Complete
- Database tables: `marketplace_keys`, `marketplace_bundles`, `marketplace_entitlements`
- API routes: `/marketplace/keys`, `/marketplace/discover`, `/marketplace/checkout`
- Ingestion system: Supports jupyter, node, next, runbook keys
- Stripe integration: Checkout sessions, webhook handling, entitlements

**Existing Key Types**: ✅ Operational
- Jupyter Keys (notebooks)
- Node/Next Keys (runtime code)
- Runbook Keys (operational playbooks)

**Missing Key Types**: ❌ Need Implementation
- Stripe Keys (workflow patterns)
- GitHub Keys (workflow/template patterns)
- Supabase Keys (template/workflow patterns)
- Cursor Keys (prompt/composer patterns)

**Database Schema**: ⚠️ Needs Extension
- Current: `key_type IN ('jupyter', 'node', 'next', 'runbook')`
- Required: Add support for `tool` field with values: `'stripe'`, `'github'`, `'supabase'`, `'cursor'`
- Current: `key_type` field is tool-specific
- Required: Unified `tool` + `key_type` taxonomy

---

## Architecture Decisions

### Decision 1: Key Type Taxonomy Extension

**Problem**: Roadmap requires new tool-specific keys (Stripe, GitHub, Supabase, Cursor) but current schema only supports jupyter/node/next/runbook.

**Solution**: Extend schema to support `tool` field as primary classifier:
- `tool`: `'stripe'` | `'github'` | `'supabase'` | `'cursor'` | `'jupyter'` | `'node'` | `'next'` | `'runbook'`
- `key_type`: Tool-specific type (e.g., `'workflow'` for Stripe/GitHub, `'template'` for Supabase, `'prompt'` for Cursor)

**Migration**: Add `tool` column to `marketplace_keys`, update constraints, migrate existing keys.

### Decision 2: Key Asset Structure

**Stripe Keys**: Node.js workflow code (similar to node-next-keys structure)
- Location: `/keys-assets/stripe-keys/`
- Structure: `src/`, `key.json`, `README.md`, `quickstart.md`, `CHANGELOG.md`
- Type: `tool: 'stripe'`, `key_type: ['workflow']`

**GitHub Keys**: GitHub Actions workflow files + repository templates
- Location: `/keys-assets/github-keys/`
- Structure: `.github/workflows/`, `templates/`, `key.json`, `README.md`
- Type: `tool: 'github'`, `key_type: ['workflow']` or `['template']`

**Supabase Keys**: SQL templates + Node.js integration code
- Location: `/keys-assets/supabase-keys/`
- Structure: `migrations/`, `src/`, `key.json`, `README.md`
- Type: `tool: 'supabase'`, `key_type: ['template']` or `['workflow']`

**Cursor Keys**: Prompt pack YAML files + Composer instructions
- Location: `/keys-assets/cursor-keys/`
- Structure: `prompts/`, `composer/`, `key.json`, `README.md`
- Type: `tool: 'cursor'`, `key_type: ['prompt']` or `['composer']`

### Decision 3: Ingestion Pipeline Extension

**Current**: Ingests from `/keys-assets/node-next-keys/`, `/keys-assets/runbook-keys/`, `/keys-assets/jupyter-keys-md/`

**Required**: Extend ingestion to support:
- `/keys-assets/stripe-keys/`
- `/keys-assets/github-keys/`
- `/keys-assets/supabase-keys/`
- `/keys-assets/cursor-keys/`

**Schema Validation**: Create schemas for each new tool type (or extend existing).

---

## Milestone Breakdown

### Milestone 1: Foundation (Week 1)

**Goal**: Extend infrastructure to support new tool types

**Tasks**:
1. Database migration: Add `tool` column, update constraints
2. Schema extension: Add Stripe/GitHub/Supabase/Cursor key schemas
3. Ingestion extension: Support new asset directories
4. API updates: Filter/search by `tool` field

**Acceptance Criteria**:
- ✅ Database supports all tool types
- ✅ Ingestion can process new key types
- ✅ API can filter by tool
- ✅ No breaking changes to existing keys

**Risk**: Low (additive changes)

---

### Milestone 2: P0 Keys - Critical Priority (Weeks 1-4)

#### P0-1: Stripe Keys - Subscription Management (Operator)
**Target**: Week 1-2  
**Effort**: 40 hours  
**Price**: $99

**Deliverables**:
- Key asset: `/keys-assets/stripe-keys/stripe-subscription-management/`
- Code: Subscription lifecycle management, plan management, customer management
- Webhook handlers: Subscription events (created, updated, canceled)
- Tests: Unit tests for subscription logic
- Documentation: README, quickstart, changelog

**Acceptance Criteria**:
- ✅ Key ingests successfully
- ✅ Code is production-ready (no placeholders)
- ✅ Webhook handlers verify signatures and handle idempotency
- ✅ Tests pass
- ✅ Documentation complete

**Risk**: Medium (Stripe integration complexity)

---

#### P0-2: GitHub Keys - CI/CD Starter Workflows (Starter)
**Target**: Week 2-3  
**Effort**: 30 hours  
**Price**: $49

**Deliverables**:
- Key asset: `/keys-assets/github-keys/github-cicd-starter-workflows/`
- Workflows: 5+ GitHub Actions workflow templates (Node.js, Python, etc.)
- Documentation: README, quickstart, examples

**Acceptance Criteria**:
- ✅ Key ingests successfully
- ✅ Workflows are valid GitHub Actions YAML
- ✅ Workflows work with GitHub API
- ✅ Documentation complete

**Risk**: Low (YAML templates)

---

#### P0-3: Supabase Keys - RLS Policy Patterns (Operator)
**Target**: Week 3-4  
**Effort**: 35 hours  
**Price**: $79

**Deliverables**:
- Key asset: `/keys-assets/supabase-keys/supabase-rls-policy-patterns/`
- SQL: 10+ RLS policy templates
- Patterns: Multi-tenant, user-based, org-based access control
- Documentation: README, quickstart, security guide

**Acceptance Criteria**:
- ✅ Key ingests successfully
- ✅ SQL policies are valid and tested
- ✅ Patterns cover common use cases
- ✅ Documentation includes security best practices

**Risk**: Medium (RLS complexity)

---

### Milestone 3: P1 Keys - High Priority (Weeks 5-10)

#### P1-1: Cursor Keys - API Route Generation (Operator)
**Target**: Week 5-6  
**Effort**: 25 hours  
**Price**: $59

**Deliverables**:
- Key asset: `/keys-assets/cursor-keys/cursor-api-route-generation/`
- Prompts: REST API route generation prompt pack
- Composer: Composer instructions for API scaffolding
- Examples: Example API routes

**Acceptance Criteria**:
- ✅ Key ingests successfully
- ✅ Prompts produce valid API routes
- ✅ Composer instructions work in Cursor
- ✅ Examples demonstrate patterns

**Risk**: Low (prompt templates)

---

#### P1-2: Stripe Keys - Payment Flow Patterns (Starter)
**Target**: Week 6-7  
**Effort**: 20 hours  
**Price**: $49

**Deliverables**:
- Key asset: `/keys-assets/stripe-keys/stripe-payment-flow-patterns/`
- Code: One-time payment flows, payment intent creation
- Webhook handlers: Payment confirmation handling
- Documentation: README, quickstart

**Acceptance Criteria**:
- ✅ Key ingests successfully
- ✅ Code handles payment intents correctly
- ✅ Webhook handlers verify signatures
- ✅ Documentation complete

**Risk**: Low (simpler than subscriptions)

---

#### P1-3: Jupyter Keys - Model Validation Patterns (Operator)
**Target**: Week 7-8  
**Effort**: 30 hours  
**Price**: $69

**Deliverables**:
- Key asset: `/keys-assets/jupyter-keys/jupyter-model-validation-patterns/`
- Notebooks: Model validation workflow templates
- Patterns: Cross-validation, performance metrics, overfitting detection
- Documentation: README, quickstart

**Acceptance Criteria**:
- ✅ Key ingests successfully
- ✅ Notebooks are valid .ipynb files
- ✅ Patterns work with common ML libraries
- ✅ Documentation complete

**Risk**: Low (notebook templates)

---

#### P1-4: GitHub Keys - Repository Templates (Starter)
**Target**: Week 8-9  
**Effort**: 20 hours  
**Price**: $39

**Deliverables**:
- Key asset: `/keys-assets/github-keys/github-repository-templates/`
- Templates: 5+ repository structure templates (SaaS, API, CLI, etc.)
- Documentation: README, quickstart

**Acceptance Criteria**:
- ✅ Key ingests successfully
- ✅ Templates include best practices
- ✅ CI/CD setup included
- ✅ Documentation complete

**Risk**: Low (file templates)

---

#### P1-5: Supabase Keys - Auth Flow Templates (Starter)
**Target**: Week 9-10  
**Effort**: 25 hours  
**Price**: $49

**Deliverables**:
- Key asset: `/keys-assets/supabase-keys/supabase-auth-flow-templates/`
- Templates: Auth flow templates (sign up, sign in, password reset)
- Code: Frontend/backend integration examples
- Documentation: README, quickstart

**Acceptance Criteria**:
- ✅ Key ingests successfully
- ✅ Templates work with Supabase Auth
- ✅ Integration examples are complete
- ✅ Documentation complete

**Risk**: Low (auth templates)

---

### Milestone 4: Strategic Bundles (Weeks 10-11)

#### Bundle-1: SaaS Starter Stack (Starter)
**Target**: Week 10-11  
**Price**: $199 (vs $216 individual)

**Keys Included**:
- Stripe Keys: Payment Flow Patterns (Starter)
- Supabase Keys: Auth Flow Templates (Starter)
- GitHub Keys: Repository Templates (Starter)
- Cursor Keys: API Route Generation (Operator)

**Deliverables**:
- Bundle entry in database
- Stripe product/price creation
- Bundle checkout flow
- Documentation

**Acceptance Criteria**:
- ✅ Bundle appears in marketplace
- ✅ Checkout works
- ✅ Entitlements grant all keys
- ✅ Discount applied correctly

**Risk**: Low (bundle infrastructure exists)

---

#### Bundle-2: SaaS Operator Stack (Operator)
**Target**: Week 16-17 (after P2 keys complete)  
**Price**: $299 (vs $346 individual)

**Keys Included**:
- Stripe Keys: Subscription Management (Operator)
- Supabase Keys: RLS Policy Patterns (Operator)
- GitHub Keys: CI/CD Starter Workflows (Starter)
- Cursor Keys: Database Migration Patterns (Operator)

**Deliverables**: Same as Bundle-1

**Acceptance Criteria**: Same as Bundle-1

**Risk**: Low

---

## Implementation Sequence

### Phase 0: Foundation (Week 1)
1. Database migration (add `tool` column)
2. Schema extensions
3. Ingestion pipeline updates
4. API updates

### Phase 1: P0 Keys (Weeks 1-4)
1. P0-1: Stripe Subscription Management
2. P0-2: GitHub CI/CD Workflows
3. P0-3: Supabase RLS Patterns

### Phase 2: P1 Keys (Weeks 5-10)
1. P1-1: Cursor API Route Generation
2. P1-2: Stripe Payment Flows
3. P1-3: Jupyter Model Validation
4. P1-4: GitHub Repository Templates
5. P1-5: Supabase Auth Flows

### Phase 3: Bundles (Weeks 10-11, 16-17)
1. Bundle-1: SaaS Starter Stack
2. Bundle-2: SaaS Operator Stack

---

## Risk Assessment

### High Risk
- **Stripe webhook handling**: Must verify signatures, handle idempotency correctly
- **Database migration**: Must not break existing keys

### Medium Risk
- **RLS policy patterns**: Complex security patterns, must be correct
- **Ingestion pipeline**: New tool types may expose edge cases

### Low Risk
- **YAML templates**: GitHub workflows, Cursor prompts
- **File templates**: Repository structures, auth flows

---

## Acceptance Gates

### Per-Key Gate
- ✅ Key ingests successfully
- ✅ Code/templates are production-ready (no placeholders)
- ✅ Tests pass (where applicable)
- ✅ Documentation complete
- ✅ Stripe product/price created (if paid)
- ✅ Key appears in marketplace
- ✅ Discovery works (filter by tool/outcome/maturity)

### Milestone Gate
- ✅ All keys in milestone complete
- ✅ No regressions (existing keys still work)
- ✅ Lint/type/build clean
- ✅ Tests pass

### Final Gate
- ✅ All P0 keys complete
- ✅ All P1 keys complete
- ✅ Both bundles created
- ✅ Documentation updated
- ✅ Final report generated

---

## Rollout Notes

### Database Migration
- **Timing**: Week 1, before any new keys
- **Strategy**: Additive (add `tool` column, don't remove existing)
- **Rollback**: Can drop `tool` column if needed (existing keys use `key_type`)

### Key Ingestion
- **Timing**: After migration, before P0 keys
- **Strategy**: Support both old and new key types during transition
- **Rollback**: Ingestion can fall back to old logic

### API Updates
- **Timing**: Week 1, with migration
- **Strategy**: Add `tool` filter, keep existing filters
- **Rollback**: Remove `tool` filter, existing filters still work

---

## Success Metrics

### P0 Keys (30 Days)
- ✅ 3 keys completed
- ✅ 190+ purchases total (50+ Stripe, 100+ GitHub, 40+ Supabase)
- ✅ 4.5+ star ratings
- ✅ No regressions

### P1 Keys (60 Days)
- ✅ 5 keys completed
- ✅ 300+ purchases total
- ✅ 4.5+ star ratings
- ✅ Bundle-1 launched

### P2 Keys (90 Days)
- ✅ 5 keys completed (if implemented)
- ✅ Bundle-2 launched
- ✅ Total 500+ purchases across all new keys

---

## Next Steps

1. **Review this plan** with team
2. **Approve architecture decisions**
3. **Begin Phase 0** (Foundation)
4. **Execute milestone by milestone**
5. **Update roadmap** as keys complete

---

**Last Updated**: 2025-01-XX  
**Next Review**: After Milestone 1 completion
