# Keys Repository - Mechanics Map

**Purpose**: Complete mapping of every user-facing interaction to its code, API endpoints, database tables, and integrations.

**Last Updated**: 2024-12-19
**Status**: Comprehensive mapping of all mechanics

---

## Table of Contents

1. [Authentication & Session Management](#authentication--session-management)
2. [Multi-Tenant / Organization Management](#multi-tenant--organization-management)
3. [Template Management](#template-management)
4. [Agent Orchestration](#agent-orchestration)
5. [Usage Metering & Billing](#usage-metering--billing)
6. [Background Events & Event Loop](#background-events--event-loop)
7. [Chrome Extension](#chrome-extension)
8. [Error Handling & Resilience](#error-handling--resilience)

---

## Authentication & Session Management

### Sign Up Flow

**UI Components:**
- `frontend/src/app/signup/page.tsx` - Sign up page component
- `frontend/src/contexts/AuthContext.tsx` - Auth context provider

**API Endpoints:**
- `POST /auth/signup` - Backend signup endpoint
  - Route: `backend/src/routes/auth.ts:61-96`
  - Middleware: `authRateLimiter` (rate limiting), `validateBody` (Zod validation)
  - Service: Supabase Auth (`supabase.auth.signUp()`)

**Database Tables:**
- `auth.users` (Supabase managed) - User account created
- `user_profiles` - Profile record created (via trigger or backend logic)

**RLS Policies:**
- `user_profiles`: Users can only view/update their own profile (`auth.uid()::text = user_id`)

**Environment Variables:**
- `SUPABASE_URL` (backend)
- `SUPABASE_SERVICE_ROLE_KEY` (backend)
- `NEXT_PUBLIC_SUPABASE_URL` (frontend)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend)

**Flow:**
1. User fills form → `signUp()` called in AuthContext
2. Frontend calls Supabase client `signUp()` directly
3. Supabase creates user in `auth.users`
4. Session returned, stored in cookies (via `@supabase/ssr`)
5. User redirected to `/onboarding` (or `/dashboard` if already onboarded)

**Error Handling:**
- Frontend: Error toast displayed (`ErrorToast` component)
- Backend: Returns `AuthenticationError` (401) with message
- Rate limiting: `authRateLimiter` prevents brute force (config in `backend/src/middleware/rateLimit.ts`)

---

### Sign In Flow

**UI Components:**
- `frontend/src/app/signin/page.tsx` - Sign in page
- `frontend/src/middleware.ts` - Route protection middleware

**API Endpoints:**
- `POST /auth/signin` - Backend signin endpoint
  - Route: `backend/src/routes/auth.ts:28-58`
  - Middleware: `authRateLimiter`, `validateBody`
  - Service: Supabase Auth (`supabase.auth.signInWithPassword()`)

**Database Tables:**
- `auth.users` - User lookup
- `user_profiles` - Profile fetched for entitlements

**Flow:**
1. User submits credentials → `signIn()` in AuthContext
2. Frontend calls Supabase client `signInWithPassword()`
3. Session created, stored in cookies
4. Middleware checks auth on protected routes (`/dashboard`, `/templates`, etc.)
5. Redirect to `returnUrl` query param or `/dashboard`

**Session Persistence:**
- Cookies managed by `@supabase/ssr` (server-side rendering compatible)
- Session refresh handled automatically by Supabase client
- Middleware validates session on each request

**Error Handling:**
- Invalid credentials: `AuthenticationError` (401)
- Rate limit exceeded: 429 with `Retry-After` header
- Network errors: Frontend shows "Network error" toast

---

### Sign Out Flow

**UI Components:**
- Sign out button (various pages)
- `frontend/src/contexts/AuthContext.tsx` - `signOut()` method

**API Endpoints:**
- `POST /auth/signout` - Backend signout endpoint
  - Route: `backend/src/routes/auth.ts:98-113`
  - Clears Supabase session

**Flow:**
1. User clicks sign out → `signOut()` in AuthContext
2. Frontend calls `supabase.auth.signOut()`
3. Backend endpoint also called (optional, for server-side cleanup)
4. Cookies cleared
5. User redirected to `/signin`

---

### Session Refresh & Token Management

**Components:**
- `frontend/src/contexts/AuthContext.tsx` - `refreshSession()` method
- `frontend/src/middleware.ts` - Middleware checks session on each request

**Flow:**
- Supabase client automatically refreshes tokens when expired
- `onAuthStateChange` listener updates context
- Backend validates tokens via `authMiddleware` (`backend/src/middleware/auth.ts`)

**Token Validation:**
- Backend: `supabase.auth.getUser(token)` validates JWT
- Frontend: Session stored in cookies, validated on each request

---

## Multi-Tenant / Organization Management

### Organization Creation

**UI Components:**
- Organization creation UI (if exists in frontend)
- Admin dashboard (`frontend/src/app/admin/dashboard/page.tsx`)

**API Endpoints:**
- Organization endpoints (if implemented)
  - Likely in `backend/src/routes/admin.ts` or separate org route

**Database Tables:**
- `organizations` - Organization records
  - Columns: `id`, `name`, `slug`, `owner_id`, `created_at`, `updated_at`
- `organization_members` - Membership records
  - Columns: `id`, `org_id`, `user_id`, `role`, `created_at`
- `user_profiles.org_id` - Links user to organization

**RLS Policies:**
- `organizations`: Users can view orgs they own or are members of
- `organization_members`: Members can view members of their orgs; admins can manage
- `invitations`: Admins can manage invitations

**Isolation:**
- Data queries should filter by `org_id` or check membership
- Backend routes enforce org membership before returning data
- RLS policies prevent cross-org access at DB level

**Status**: Organization tables exist in migration `013_add_billing_and_orgs.sql`, but frontend UI and backend routes may need verification.

---

## Template Management

### Template Browsing

**UI Components:**
- `frontend/src/app/templates/page.tsx` - Template list page
- `frontend/src/components/TemplateManager/TemplateBrowser.tsx` - Browser component
- `frontend/src/services/templateService.ts` - Template API client

**API Endpoints:**
- `GET /user-templates/milestone/:milestone` - Get templates for milestone
  - Route: `backend/src/routes/user-templates.ts:17-32`
  - Auth: Required (`authMiddleware`)
  - Service: `userTemplateService.getMilestoneTemplates()`

**Database Tables:**
- `scaffold_templates` (in-memory/service, not DB) - Base templates
- `user_template_customizations` - User customizations
  - Columns: `id`, `user_id`, `template_id`, `milestone`, `custom_variables`, `custom_instructions`, `enabled`, `created_at`, `updated_at`

**Flow:**
1. User navigates to `/templates`
2. Frontend calls `templateService.getMilestoneTemplates(milestone)`
3. Backend fetches base templates from `scaffoldTemplateService`
4. Backend fetches user customizations from `user_template_customizations`
5. Returns combined preview (base + customized)

**RLS Policies:**
- `user_template_customizations`: Users can only view/update their own customizations (`auth.uid()::text = user_id`)

---

### Template Customization

**UI Components:**
- `frontend/src/app/templates/[id]/customize/page.tsx` - Customization page
- `frontend/src/components/TemplateManager/TemplateEditor.tsx` - Editor component

**API Endpoints:**
- `POST /user-templates/:templateId/customize` - Save customization
  - Route: `backend/src/routes/user-templates.ts:60-84`
  - Auth: Required
  - Service: `userTemplateService.saveCustomization()`
- `PATCH /user-templates/:templateId/customize` - Update customization
  - Route: `backend/src/routes/user-templates.ts:96-123`
- `DELETE /user-templates/:templateId/customize` - Delete customization
  - Route: `backend/src/routes/user-templates.ts:129-146`

**Database Tables:**
- `user_template_customizations` - Stores customizations
- `template_customization_history` (if exists) - History tracking

**Flow:**
1. User opens template → `getTemplatePreview()` called
2. User edits variables/instructions → `saveCustomization()` called
3. Backend validates customization (via `templateValidationService`)
4. Backend saves to `user_template_customizations`
5. Returns updated preview

**Validation:**
- `templateValidationService.validateCustomization()` checks:
  - Variable types match template schema
  - Required variables present
  - Instructions don't contain unsafe content

---

### Template Generation

**UI Components:**
- Template generation UI (chat interface or form)
- `frontend/src/hooks/useTemplates.ts` - Template hooks

**API Endpoints:**
- `POST /user-templates/:templateId/generate` - Generate prompt from template
  - Route: `backend/src/routes/user-templates.ts:198-223`
  - Auth: Required
  - Service: `userTemplateService.getUserTemplatePrompt()`

**Flow:**
1. User provides `taskDescription` and optional `inputFilter`
2. Backend loads template (base or customized)
3. Backend applies user profile defaults
4. Backend applies custom variables/instructions
5. Returns rendered prompt string

---

## Agent Orchestration

### Agent Run Trigger

**UI Components:**
- `frontend/src/app/chat/page.tsx` - Chat interface
- `frontend/src/components/CompanionChat/ChatInterface.tsx` - Chat UI
- `frontend/src/hooks/useAgentOrchestration.ts` - Orchestration hook
- `frontend/src/services/api.ts` - API client

**API Endpoints:**
- `POST /orchestrate-agent` - Trigger agent run
  - Route: `backend/src/routes/orchestrate-agent.ts:33-184`
  - Auth: Required (`authMiddleware`)
  - Entitlements: `entitlementsMiddleware({ checkUsageLimit: true })`
  - Validation: `validateBody(orchestrateAgentSchema)`

**Database Tables:**
- `agent_runs` - Run records
  - Columns: `id`, `user_id`, `trigger`, `assembled_prompt`, `selected_atoms`, `vibe_config_snapshot`, `agent_type`, `model_used`, `generated_content`, `tokens_used`, `latency_ms`, `cost_usd`, `safety_checks_passed`, `safety_check_results`, `created_at`
- `usage_metrics` - Usage tracking
  - Columns: `id`, `user_id`, `metric_type`, `metric_value`, `period_start`, `period_end`

**Flow:**
1. User submits input → Frontend calls `apiService.orchestrateAgent()`
2. Frontend first calls `assemblePrompt()` (or uses cached prompt)
3. Frontend sends `assembledPrompt` + `naturalLanguageInput` to `/orchestrate-agent`
4. Backend checks usage limits (`checkLimit(userId, 'runs', 1)`)
5. Backend applies failure prevention rules (`failurePatternService`)
6. Backend enhances system prompt with prevention rules
7. Backend calls `orchestrateAgent()` service
8. Backend applies safety checks (`safetyEnforcementService`)
9. Backend logs run to `agent_runs`
10. Backend tracks usage (`trackUsage(userId, 'runs', 1)`)
11. Returns `AgentOutput` with content, warnings, metadata

**Usage Limits:**
- Free: 50 runs/month
- Pro: 1000 runs/month
- Pro+: 5000 runs/month
- Enterprise: Unlimited
- Enforced in `usageMetering.ts:checkLimit()`

**Safety Checks:**
- `safetyEnforcementService.checkOutput()` validates:
  - Security vulnerabilities
  - Compliance issues
  - Quality standards
- Critical issues block output (400 response)
- Warnings added to output metadata

**Error Handling:**
- Usage limit exceeded: `RateLimitError` (429) with context
- Safety check failed: 400 with warnings
- LLM error: `ExternalAPIError` (502)
- All errors return structured JSON with `error.code`, `error.message`, `requestId`

---

### Prompt Assembly

**UI Components:**
- Prompt assembly happens before orchestration (orchestration calls it)

**API Endpoints:**
- `POST /assemble-prompt` - Assemble prompt from atoms
  - Route: `backend/src/routes/assemble-prompt.ts:47-80`
  - Auth: Required
  - Service: `promptAssembly.assemblePrompt()`

**Database Tables:**
- `prompt_atoms` - Prompt building blocks
  - Columns: `id`, `name`, `content`, `category`, `tags`, `created_at`
- `user_profiles` - User profile for defaults
- `vibe_configs` - User vibe preferences
  - Columns: `id`, `user_id`, `playfulness`, `revenue_focus`, `investor_perspective`, `created_at`, `updated_at`

**Flow:**
1. User provides `taskDescription`, `vibeConfig`, optional `inputFilter`
2. Backend loads user profile
3. Backend loads vibe config (or uses defaults)
4. Backend determines if task is "scaffold" task (scaffolding detection)
5. Backend selects prompt atoms based on vibe config sliders
6. Backend assembles system prompt + user prompt
7. Returns `PromptAssemblyResult` with `systemPrompt`, `userPrompt`, `selectedAtomIds`

**Caching:**
- Redis cache key: `prompt:${userId}:${hash(inputs)}`
- Cache used if no complex input filter

---

## Usage Metering & Billing

### Usage Tracking

**Services:**
- `backend/src/services/usageMetering.ts` - Usage tracking service

**Database Tables:**
- `usage_metrics` - Monthly usage records
  - Unique constraint: `(user_id, metric_type, period_start)`
  - Upsert logic updates existing records

**Flow:**
- `trackUsage(userId, metricType, value)` called after:
  - Agent runs (`metricType: 'runs'`)
  - Token usage (`metricType: 'tokens'`)
  - Template usage (`metricType: 'templates'`)
  - Exports (`metricType: 'exports'`)
- Usage aggregated monthly (period_start = first day of month)

**Limit Checking:**
- `checkLimit(userId, metricType, requestedAmount)` checks:
  - Current period usage from `usage_metrics`
  - User tier from `user_profiles.subscription_tier`
  - Tier limits from `TIER_LIMITS` constant
- Returns `{ allowed: boolean, current: number, limit: number, remaining: number }`

---

### Billing Status Gates

**Middleware:**
- `backend/src/middleware/entitlements.ts` - Entitlements middleware

**Database Tables:**
- `user_profiles` - Subscription status
  - Columns: `subscription_status` ('free' | 'active' | 'inactive' | 'canceled' | 'past_due')
  - Columns: `subscription_tier` ('free' | 'pro' | 'pro+' | 'enterprise')
  - Columns: `stripe_customer_id`, `subscription_current_period_end`

**Flow:**
- `entitlementsMiddleware({ requireActiveSubscription: true })` checks:
  - Fetches `user_profiles.subscription_status`
  - Returns 403 if status !== 'active'
- `entitlementsMiddleware({ requirePremium: true })` checks:
  - Fetches `user_profiles.premium_features.enabled`
  - Returns 403 if not enabled

**Feature Gates:**
- Free tier: Limited runs (50), tokens (50k), templates (5)
- Pro tier: Higher limits (1000 runs, 1M tokens, 100 templates)
- Pro+ tier: IDE/CI/CD integrations, unlimited templates/exports
- Enterprise: Unlimited everything

---

### Stripe Integration

**API Endpoints:**
- `POST /billing/checkout` - Create checkout session
  - Route: `backend/src/routes/billing.ts:68-101`
  - Auth: Required
  - Service: Stripe Checkout Sessions API
- `GET /billing/portal` - Get customer portal URL
  - Route: `backend/src/routes/billing.ts:107-158`
  - Auth: Required
  - Service: Stripe Billing Portal API
- `POST /billing/webhook` - Stripe webhook handler
  - Route: `backend/src/routes/billing.ts:164-259`
  - Auth: None (webhook signature verification)
  - Middleware: `express.raw()` for signature verification

**Database Tables:**
- `user_profiles` - Updated via webhook
  - `stripe_customer_id` - Customer ID
  - `subscription_status` - Updated from webhook events
  - `subscription_tier` - Updated from price ID mapping

**Webhook Events Handled:**
- `checkout.session.completed` - New subscription created
  - Updates `subscription_status` to 'active'
  - Updates `subscription_tier` from price ID
  - Sets `guarantee_coverage` and `integration_access` arrays
- `customer.subscription.updated` - Subscription updated
  - Updates status/tier based on subscription state
- `customer.subscription.deleted` - Subscription canceled
  - Updates `subscription_status` to 'inactive'
  - Resets tier to 'free'

**Security:**
- Webhook signature verification via `stripe.webhooks.constructEvent()`
- Raw body required (not JSON parsed) for signature validation
- Webhook secret from `STRIPE_WEBHOOK_SECRET` env var

**Environment Variables:**
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `FRONTEND_URL` - For redirect URLs

---

## Background Events & Event Loop

### Background Event Loop

**Service:**
- `backend/src/services/backgroundEventLoop.ts` - Event loop service

**Database Tables:**
- `background_events` - Event queue
  - Columns: `id`, `user_id`, `event_type`, `payload`, `status`, `processed_at`, `created_at`

**Flow:**
- Event loop processes `background_events` table
- Events processed asynchronously (not blocking user requests)
- Status updated: 'pending' → 'processing' → 'completed' / 'failed'

**RLS Policies:**
- `background_events`: Users can only view their own events (`auth.uid()::text = user_id`)

**Status**: Event loop implementation needs verification (file exists but may not be running).

---

## Chrome Extension

### Extension Authentication

**Files:**
- `chrome-extension/auth.js` - Extension auth logic
- `chrome-extension/popup-auth.js` - Popup auth UI
- `chrome-extension/background.js` - Background script

**API Endpoints:**
- `POST /extension-auth/token` - Exchange extension token for session
  - Route: `backend/src/routes/extension-auth.ts` (if exists)

**Flow:**
1. Extension loads → Checks for stored auth token
2. If no token → Shows auth popup
3. User signs in via popup → Token stored in extension storage
4. Extension sends token to backend → Backend validates → Returns session
5. Extension uses session for API calls

**CORS:**
- Backend CORS must allow extension origin
- Config in `backend/src/middleware/security.ts:corsMiddleware()`

**Status**: Extension files exist but integration needs verification.

---

## Error Handling & Resilience

### Frontend Error Boundaries

**Components:**
- `frontend/src/app/error.tsx` - Route-level error boundary
- `frontend/src/app/global-error.tsx` - Global error boundary
- `frontend/src/components/ErrorBoundary/ErrorBoundary.tsx` - Component error boundary

**Flow:**
- React error boundaries catch component errors
- `error.tsx` shows user-friendly error page with "Try Again" button
- `global-error.tsx` catches root-level errors
- Errors logged to console (and Sentry if configured)

---

### Backend Error Handling

**Middleware:**
- `backend/src/middleware/errorHandler.ts` - Global error handler
- `backend/src/middleware/errorHandler.ts:notFoundHandler` - 404 handler

**Error Types:**
- `AppError` - Base error class with `code`, `message`, `statusCode`, `context`
- `ValidationError` (400) - Invalid input
- `AuthenticationError` (401) - Auth required
- `AuthorizationError` (403) - Insufficient permissions
- `NotFoundError` (404) - Resource not found
- `RateLimitError` (429) - Rate limit exceeded
- `ExternalAPIError` (502) - External service error
- `DatabaseError` (500) - Database error

**Flow:**
1. Route handler throws error → `asyncHandler` catches
2. Error passed to `errorHandler` middleware
3. Error logged (with `requestId`, `userId`, context)
4. Error tracked (via `errorTrackingService`)
5. Structured JSON response returned:
   ```json
   {
     "error": {
       "code": "ERROR_CODE",
       "message": "User-friendly message",
       "context": { ... }
     },
     "requestId": "req_..."
   }
   ```
6. Stack trace included in development mode only

**No Hard-500 Guarantee:**
- All routes wrapped in `asyncHandler` (catches async errors)
- All errors return structured JSON (never raw stack traces)
- Unknown routes return 404 JSON (not HTML)
- Validation errors return 400 with details

---

### API Client Error Handling

**Service:**
- `frontend/src/services/api.ts` - Axios client with interceptors

**Flow:**
1. Request interceptor adds auth token from Supabase session
2. Response interceptor handles errors:
   - 403 + `SUBSCRIPTION_REQUIRED` → Shows upgrade toast + redirect
   - 403 + `PREMIUM_REQUIRED` → Shows upgrade toast
   - 429 → Shows rate limit toast
   - Other errors → Shows error toast with message
3. Errors tracked to Sentry (if configured)

**Error Toast:**
- `frontend/src/components/Feedback/ErrorToast.tsx` - Error toast component
- Auto-dismisses after timeout
- User can manually dismiss

---

## Additional Mechanics

### Input Filters & Reformatters

**API Endpoints:**
- `POST /input-filters/reformat` - Reformat input text
  - Route: `backend/src/routes/input-filters.ts`
- `POST /input-filters/transcribe` - Voice-to-text
  - Route: `backend/src/routes/input-filters.ts`

**Services:**
- `backend/src/services/inputReformatter.ts` - Input reformatting
- `backend/src/services/voiceToTextService.ts` - Voice transcription

**Premium Features:**
- Voice-to-text requires premium (`requirePremium: true`)

---

### Template Presets

**API Endpoints:**
- `GET /presets` - Get preset configurations
  - Route: `backend/src/routes/presets.ts`

**Flow:**
- Presets are pre-configured vibe configs
- Users can apply presets to quickly set vibe sliders

---

### Export Functionality

**API Endpoints:**
- `GET /export/failure-patterns` - Export failure patterns
  - Route: `backend/src/routes/export.ts`
- `GET /export/success-patterns` - Export success patterns
- `GET /export/audit-trail` - Export audit trail

**Formats:**
- JSON, CSV supported
- Content-Disposition headers set for download

---

## Summary

**Total API Endpoints**: ~30+ endpoints across routes
**Database Tables**: 15+ tables (user_profiles, vibe_configs, agent_runs, templates, organizations, etc.)
**RLS Policies**: Enabled on all user-owned tables
**Auth Enforcement**: All user endpoints require `authMiddleware`
**Error Handling**: Structured errors, no hard-500s, graceful degradation
**Billing Integration**: Stripe checkout, portal, webhooks fully integrated
**Usage Metering**: Monthly limits enforced per tier

**Next Steps for Verification:**
1. Test each flow end-to-end
2. Verify RLS policies block unauthorized access
3. Test billing webhook handling
4. Verify usage limits enforce correctly
5. Test error scenarios (network failures, invalid input, etc.)
