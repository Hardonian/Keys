# Current Reality - Keys Repo Marketplace Host Implementation

**Date**: 2024-12-19  
**Purpose**: Document the existing Keys repo architecture before implementing marketplace hosting for Notebook Pack Library

## Architecture Overview

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Auth**: Supabase Auth via `@supabase/ssr`
- **Middleware**: Route protection in `/frontend/src/middleware.ts`
- **Protected Routes**: `/dashboard`, `/chat`, `/profile`, `/templates`, `/admin`
- **Server Components**: Uses `createClient()` from `@/utils/supabase/server.ts`

### Backend
- **Framework**: Express.js with TypeScript
- **Port**: 3001 (default)
- **Auth Middleware**: JWT verification via Supabase Auth (`Bearer` token)
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage (to be configured for marketplace bucket)

### Authentication System
- **Provider**: Supabase Auth
- **User ID Format**: UUID stored as TEXT in `user_profiles.user_id`
- **Token Flow**: Frontend gets JWT → Backend verifies via `supabase.auth.getUser(token)`
- **Middleware**: `authMiddleware` (required) and `optionalAuthMiddleware` (optional)
- **Tenant Model**: Organizations table with `org_id` FK in `user_profiles`

### Stripe Integration (Existing)
- **Location**: `/backend/src/routes/billing.ts`
- **Webhook Endpoint**: `POST /billing/webhook` (raw body for signature verification)
- **Checkout**: `POST /billing/checkout` creates Stripe Checkout Session
- **Portal**: `GET /billing/portal` returns billing portal URL
- **Events Handled**:
  - `checkout.session.completed` → Updates `user_profiles` subscription status
  - `customer.subscription.updated` → Updates subscription tier
  - `customer.subscription.deleted` → Revokes subscription
- **Customer Storage**: `user_profiles.stripe_customer_id` (TEXT)
- **Tier Mapping**: `getTierFromPriceId()` maps Stripe price IDs to tiers (`free`, `pro`, `pro+`, `enterprise`)

### Database Schema (Current)
- **Migrations**: Located in `/backend/supabase/migrations/`
- **RLS**: Enabled on user-owned tables (`user_profiles`, `vibe_configs`, `agent_runs`, `background_events`)
- **Organizations**: Multi-tenant support via `organizations` table + `organization_members`
- **User Profiles**: Contains `org_id`, `stripe_customer_id`, `subscription_status`, `subscription_tier`

### Storage (To Be Configured)
- **Provider**: Supabase Storage
- **Bucket**: `marketplace` (to be created)
- **Structure**: `packs/<slug>/<version>/` for ZIPs, preview HTML, covers

### Key Constraints
1. **Build Safety**: Must pass `pnpm lint`, `pnpm typecheck`, `pnpm build` (Vercel deployment)
2. **No Hard 500s**: All routes must handle errors gracefully
3. **Security**: RLS enforced, server-side entitlement checks, no client trust
4. **Tenant Isolation**: Entitlements scoped to `org_id` (or `user_id` for individual purchases)
5. **License Safety**: Notebook code stays external; Keys only stores metadata + serves downloads

## Integration Points

### Frontend → Backend API
- Uses `axios` for API calls (see `/frontend/src/services/api.ts`)
- Auth token passed via `Authorization: Bearer <token>` header
- Base URL: `process.env.NEXT_PUBLIC_API_URL` or defaults

### Backend → Supabase
- Service role key: `process.env.SUPABASE_SERVICE_ROLE_KEY`
- Anon key: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend)
- Direct Postgres access via Supabase client

### Stripe Webhooks
- Raw body required for signature verification
- Mounted at `/billing/webhook` with `express.raw({ type: 'application/json' })`
- Webhook secret: `process.env.STRIPE_WEBHOOK_SECRET`

## Missing Primitives (To Be Built)
- ❌ Marketplace tables (packs, entitlements, download_events)
- ❌ Storage bucket configuration
- ❌ Pack ingestion workflow
- ❌ Download endpoint with entitlement checks
- ❌ Marketplace UI pages
- ❌ Admin publishing interface

## Next Steps
1. Create database migration for marketplace tables
2. Configure Supabase Storage bucket
3. Implement server utilities (entitlements, storage, schema validation)
4. Build ingestion route for `library.json`
5. Create download endpoint with signed URLs
6. Extend Stripe webhooks for pack entitlements
7. Build marketplace UI (list, detail, preview)
8. Add admin upload interface
