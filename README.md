# KEYS
A marketplace and distribution system for structured “keys” (prompts, notebooks, workflows, runbooks) that unlock repeatable capability in existing tools.

## Landing Strip
- Curates structured assets (“keys”) that make tools like Cursor, Jupyter, and Stripe usable in repeatable, team-safe ways.
- Ships a web app + API for discovery, entitlement, and delivery of keys.
- Enforces metadata contracts so keys can be validated, indexed, and surfaced consistently.
- Supports multi-tenant organizations with authenticated access controls.

**Who this is for:** teams and developers who want reusable, validated workflows for modern developer and data tools.

**Quick start:** install dependencies with `pnpm install`, then run `pnpm dev` to start the frontend and backend locally.

## Why This Exists
- Teams collect prompts, notebooks, and playbooks, but they decay without metadata, validation, and distribution.
- Tool power is fragmented across vendors; practical leverage comes from repeatable, documented assets.
- Without a contract-driven system, sharing and monetizing these assets is inconsistent and fragile.

## What This Project Is
- A marketplace web application and API for publishing, validating, and delivering “keys.”
- A contract-driven indexing pipeline that turns structured assets into searchable, entitlement-aware catalog entries.
- A developer workflow for adding new keys with schema validation and indexing scripts.

## What This Project Is NOT
- An AI assistant or model host.
- A replacement for tools like Cursor, Jupyter, GitHub, or Stripe.
- A generic marketplace for unstructured content.

## Where This Fits (If Part of a Larger System)
- **Frontend (Next.js)** consumes the API and Supabase auth for discovery and delivery.
- **Backend (Express)** exposes APIs, enforces ownership/entitlements, and integrates billing.
- **Supabase** provides auth, Postgres, and RLS enforcement.
- **Stripe** handles commercial entitlements and billing workflows.

## Core Capabilities
- Metadata-driven validation and indexing of keys.
- Multi-tenant organization support with authenticated access control.
- API + UI for discovery and retrieval of keys.
- Integration scaffolding for billing (Stripe) and auth (Supabase).

## Quick Start

```bash
pnpm install
pnpm dev
```

Success looks like:
- Frontend running on `http://localhost:3000`
- Backend running on `http://localhost:3001`

Environment configuration:
- Copy values from `.env.example` into your local environment.
- Supabase credentials are required for authenticated flows.
- Stripe keys are required for billing and entitlement flows.

## Architecture Overview
- `frontend/`: Next.js App Router UI.
- `backend/`: Express API with Supabase + Stripe integration.
- `contracts/`: Schemas for metadata and validation.
- `docs/library/`: Structured assets and metadata for keys.
- `scripts/`: Validation, indexing, and verification tooling.

High-level flow:
1. Contributors add assets + metadata to `docs/library/`.
2. `pnpm keys:validate` enforces the metadata contract.
3. `pnpm keys:index` builds searchable indexes consumed by the UI.

## Extending the Project
- Add new keys in `docs/library/` with matching `*.metadata.json` files.
- Validate against `contracts/artifact_metadata.schema.json` before indexing.
- Keep metadata fields authoritative; do not add frontmatter to markdown assets.
- Prefer adding new scripts to `scripts/` and wiring them into `package.json`.

## Failure & Degradation Model
- API failures return structured JSON errors; clients should surface them to users.
- Indexing/validation failures fail fast and stop CI from publishing invalid assets.
- Authentication failures should not expose protected assets or tenant data.

## Security & Safety Considerations
- Supabase RLS policies enforce tenant isolation at the database layer.
- Secrets and API keys must be supplied via environment variables (see `.env.example`).
- Report security issues privately (see `SECURITY.md`).

## Contributing
- Documentation, new keys, and validation improvements are welcome.
- Run `pnpm verify` before opening a PR to match CI expectations.
- Use GitHub Discussions for questions and design feedback (see `CONTRIBUTING.md`).

## License & Governance
- Licensed under the MIT License with a commercial licensing note for marketplace assets. See `LICENSE`.
- Project decisions and governance details are documented in `GOVERNANCE.md`.
