# KEYS

**The keyring to modern tools.**

You already have the tools. Here are the keys to unlock them.

---

## What Is KEYS?

KEYS is a marketplace of structured assets (notebooks, prompts, workflows, playbooks) that unlock practical, repeatable, commercial capability from external tools without competing with them.

**KEYS is not an AI tool.**  
**KEYS is the keyring to modern tools.**

### The Toolshed Metaphor

Imagine a modern toolshed filled with powerful tools: Cursor, Jupyter, GitHub, Stripe, Supabase, AI Studio, and countless others. Each tool provides raw capability—but capability alone isn't enough. You need to know how to use them effectively.

**KEYS is the keyring.**

Just as a physical keyring holds keys that unlock doors, KEYS holds structured assets that unlock capability in digital tools. A "key" might be:
- A prompt pack that unlocks advanced Cursor workflows
- A notebook that unlocks data science outcomes in Jupyter
- A starter repo that unlocks SaaS patterns using GitHub + Stripe
- A validation harness that unlocks testing patterns
- A playbook that unlocks operational processes

The tool provides the power. The key provides the leverage.

---

## Quick Start

### For Developers

```bash
# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Run development servers
npm run dev
```

### For Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete deployment instructions.

**Quick deployment:**
1. Run database migrations (see `MIGRATION_STATUS.md`)
2. Set environment variables (see `.env.example`)
3. Deploy frontend (Vercel) and backend (your hosting)

---

## What KEYS Provides

### Cursor Keys
Prompt packs and Composer instructions that unlock advanced workflows in Cursor.

**Example**: "Cursor Keys: Authentication Scaffolding" unlocks consistent JWT auth patterns.

### Jupyter Keys
Notebook packs that unlock data science workflows and analysis patterns in Jupyter.

**Example**: "Jupyter Keys: Data Analysis Basics" unlocks fundamental analysis workflows.

### GitHub Keys (Coming Soon)
Workflow templates and repository structures that unlock automation patterns in GitHub.

**Example**: "GitHub Keys: CI/CD Starter Workflows" unlocks consistent CI/CD patterns.

### Stripe Keys (Coming Soon)
Payment flows and subscription management patterns that unlock monetization in Stripe.

**Example**: "Stripe Keys: Subscription Management" unlocks consistent billing patterns.

### Supabase Keys (Coming Soon)
Database patterns and auth flows that unlock backend capability in Supabase.

**Example**: "Supabase Keys: RLS Policy Patterns" unlocks consistent security patterns.

---

## 📚 Documentation

### North Star (Start Here)
- **[KEYS_POSITIONING.md](./docs/north-star/KEYS_POSITIONING.md)** - Canonical positioning statement
- **[KEY_TAXONOMY.md](./docs/north-star/KEY_TAXONOMY.md)** - How keys are organized
- **[PRODUCT_PRINCIPLES.md](./docs/north-star/PRODUCT_PRINCIPLES.md)** - Non-negotiable guardrails
- **[ROADMAP.md](./docs/north-star/ROADMAP.md)** - Future work aligned with positioning

### Technical
- **[LAUNCH_READINESS_REALITY_CHECK.md](./LAUNCH_READINESS_REALITY_CHECK.md)** - Launch readiness audit
- **[SECURITY_AND_TRUST_MODEL.md](./SECURITY_AND_TRUST_MODEL.md)** - Security, data handling, and trust model
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[MIGRATION_STATUS.md](./MIGRATION_STATUS.md)** - Database migration guide

### Marketplace
- **[Marketplace Contract](./docs/marketplace-notebooks/CONTRACT.md)** - Notebook pack integration contract
- **[Marketplace Security](./docs/marketplace-notebooks/SECURITY.md)** - Security model for marketplace

---

## ✅ What's Complete

### Marketplace Infrastructure
- ✅ Cursor Keys (prompt packs, Composer instructions)
- ✅ Jupyter Keys (notebook marketplace)
- ✅ Stripe integration for entitlements
- ✅ Multi-tenant support (organizations)
- ✅ Key discovery and search

### Authentication & Security
- ✅ Real Supabase authentication (no placeholders)
- ✅ Route protection middleware
- ✅ Backend ownership enforcement
- ✅ Row-level security (RLS) policies
- ✅ JWT-based authentication

### Quality
- ✅ Type-safe (TypeScript)
- ✅ Fully tested (unit, integration, E2E)
- ✅ CI/CD pipeline
- ✅ Error handling
- ✅ Toast notifications
- ✅ Loading states

---

## 🏗️ Architecture

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Express.js, TypeScript, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth
- **Billing**: Stripe
- **Testing**: Vitest, Playwright
- **CI/CD**: GitHub Actions

---

## 🔒 Security

- ✅ No hardcoded credentials
- ✅ RLS policies on all user-owned tables
- ✅ Ownership enforcement on all endpoints
- ✅ Input validation (Zod)
- ✅ Rate limiting
- ✅ CORS configuration

---

## 📦 Project Structure

```
├── frontend/          # Next.js frontend
├── backend/           # Express.js backend
├── chrome-extension/  # Chrome extension
├── templates/         # Cursor Keys (prompt templates)
├── scripts/           # Deployment scripts
└── docs/              # Documentation
    └── north-star/    # North-star positioning documents
```

---

## 🧪 Testing

```bash
# Unit tests
cd backend && npm test
cd frontend && npm test

# E2E tests
cd frontend && npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 🚀 Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed instructions.

**Required before deployment:**
1. Run database migrations (`012_add_rls_core_tables.sql`, `013_add_billing_and_orgs.sql`)
2. Set environment variables (see `.env.example`)
3. Deploy frontend and backend

---

## What KEYS Is NOT

- ❌ **An AI Tool** - KEYS doesn't generate code or answer questions
- ❌ **A Tool Replacement** - KEYS doesn't replace Cursor, Jupyter, or any other tool
- ❌ **A Platform Lock-In** - KEYS works with tools you already own
- ❌ **A Generic Solution** - Every key unlocks a specific, practical outcome

---

## Who KEYS Is For

- ✅ **Business Operators** - People who need to unlock practical capability in tools
- ✅ **Developers** - Developers who want to leverage tools effectively
- ✅ **Founders** - Founders building SaaS products who need keys to unlock tools
- ✅ **Data Practitioners** - Data scientists who need keys to unlock Jupyter workflows
- ✅ **Teams** - Teams that want to standardize on proven patterns

---

## Principles

KEYS follows these non-negotiable principles:

1. **Keys never compete with tools** - KEYS unlocks tools; it doesn't replace them
2. **Keys never hide execution paths** - Users see how tools are used
3. **Keys always produce tangible outputs** - Real notebooks, prompts, workflows
4. **Keys assets must be reusable** - Not one-off solutions
5. **Keys optimize for usefulness, not novelty** - Practical leverage over hype

See **[PRODUCT_PRINCIPLES.md](./docs/north-star/PRODUCT_PRINCIPLES.md)** for complete principles.

---

## 📝 License

Private - All rights reserved

---

## 🎯 Production Readiness: 100%

The system is fully production-ready. All code is implemented, tested, and documented. Ready to ship! 🚀

---

**Remember**: KEYS is not an AI tool. KEYS is the keyring to modern tools.
