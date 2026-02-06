# Reality Map

## Stack & Entry Points
- **Frontend**: Next.js App Router (`frontend/src/app`), React 18, Tailwind CSS. Entry points are the app router pages and API routes under `frontend/src/app/api`.
- **Backend**: Express + TypeScript (`backend/src/index.ts`) with REST routes, WebSocket server, and Stripe webhook handler.
- **Package manager**: npm for local dev (root `package.json` with workspaces); CI uses pnpm.
- **Tests**: Vitest (unit/integration), Playwright (frontend E2E + visual/audit).

## Service Entry Points
- **Backend HTTP**: `backend/src/index.ts` mounts routes for profiles, marketplace, billing, webhooks, admin, integrations, and health.
- **Frontend UI**: Next.js App Router pages under `frontend/src/app`.
- **WebSocket**: `backend/src/websocket/server.ts` initialized from backend entrypoint.

## User-Facing Flows (Critical)
1. **Authentication**
   - Frontend: `/signin`, `/signup`.
   - Backend: `/auth/signin`, `/auth/signup`, `/auth/me`.
2. **Marketplace discovery + download**
   - Frontend: `/library`, `/marketplace/*`.
   - Backend: `/marketplace` listing, `/marketplace/packs/:slug/preview`, `/marketplace/packs/:slug/download`.
3. **Billing / subscription**
   - Backend: `/billing/checkout`, `/billing/portal`, `/billing/webhook` (Stripe).
4. **Profiles & personalization**
   - Backend: `/profiles` CRUD.

## Critical APIs / Webhooks
- **Stripe Webhook**: `POST /billing/webhook` (raw body, signature verification, replay protection).
- **Generic Webhooks**: `POST /webhooks/*`.
- **Public UI Config**: `/ui-config`.

## Data Stores & Auth Boundaries
- **Supabase (Postgres)**: Primary data store for user profiles, marketplace assets, entitlements, and webhook event tracking.
- **Auth**: Supabase Auth, with backend middleware (`authMiddleware`, `optionalAuthMiddleware`).
- **Rate Limiting**: Global API limiter and auth-specific limiter in backend middleware; user-specific limiter for authenticated routes.

## Observability
- **Request ID**: Middleware adds `X-Request-ID` to all requests.
- **Structured logging**: Request start/finish and security events logged via shared logger.

## CI/Automation Touchpoints
- **Lint/Typecheck/Test/Build**: Automated via GitHub Actions (`.github/workflows/ci.yml`).
- **Security scan**: `npm audit --audit-level=high` + secrets scanning.

