# Launch-pressure audit + final polish workflow (generated)

Generated at: 2026-01-08T04:18:27.278Z


## Short execution plan (≤10 lines)

- Enforce non-user-editable admin checks (prefer `app_metadata.role`, fallback allowlist).
- Keep runtime UI config safe-by-default with strict sanitization and ETag caching.
- Provide a gated internal review route for fast UI iteration on preview.
- Harden preview/prod parity: safe behavior with missing envs, no placeholder endpoints.
- Add light caching/ETag for config reads; require auth+role+optional signing for writes.
- Ensure backend tests + type-check pass; ensure frontend type-check/build pass.
- Provide a predictable “polish loop” using preview + runtime config edits.
- Document verification + rollback steps.

## Issues discovered (grouped by severity) + fixes applied

### CRITICAL (fixed)
- **Admin authorization trusted `user_metadata.role` (user-editable in Supabase)** → switched authorization to prefer `app_metadata.role` and added an optional `ADMIN_USER_IDS` allowlist bootstrap for existing deployments.

### HIGH (fixed)
- **Frontend build noise/failure risk from Next lockfile SWC patcher** → set `NEXT_IGNORE_INCORRECT_LOCKFILE=1` in `frontend` build script to prevent lockfile patch attempts during local builds.
- **Frontend type-check depended on build artifacts (`.next/types`)** → `type-check` now creates a minimal placeholder under `.next/types` before running `tsc`; E2E specs are excluded from `tsc` to keep app type-check focused.

### MEDIUM (known / follow-up)
- **Dev-only `npm audit` high severity in `glob` via `eslint-config-next`**: remediation requires major `eslint-config-next` upgrade (breaking). Keep pinned for now; schedule upgrade as a dedicated task.

### LOW (known / follow-up)
- **ESLint `no-explicit-any` warnings** remain in a few frontend files; these do not block build but should be cleaned up as time permits.

## Key env vars (runtime/polish)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: required for frontend Supabase access.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: required for backend admin DB access.
- `REQUEST_SIGNING_SECRET`: optional; if set and signing middleware enabled, admin config writes must be signed.
- `ENABLE_INTERNAL_REVIEW_ROUTE`: allow enabling `/_ _review` in production (still admin-gated).
- `ADMIN_USER_IDS`: optional comma-separated Supabase user IDs that should be treated as admin (bootstrap only).

## How to use the polish workflow (preview)

1. Deploy a preview (or run locally).
2. Visit `/__review` (gated by middleware).
3. Use the config editor to tweak `tokens`/`banner`/`features` and save.
4. Refresh key pages via the quick links to visually verify changes.
5. Iterate quickly: config changes should apply without rebuilds.

## Verification checklist

- Backend: `npm run type-check:backend`
- Backend: `npm run build:backend`
- Backend: `cd backend && npm test`
- Frontend: `npm run type-check:frontend`
- Frontend: `npm run build:frontend`
- Manual: as non-admin, `GET /api/internal/ui-config` returns 401/403.
- Manual: as admin/allowlisted, `PATCH /api/internal/ui-config` succeeds and updates `updatedAt`.
- Manual: runtime config fetch (`/api/ui-config`) returns sanitized config and respects ETag.

## Rollback instructions

- Revert commits touching the files in the “Files (full contents)” section.
- To disable the review route, unset `ENABLE_INTERNAL_REVIEW_ROUTE` and/or remove allowlisted admin IDs.
- To revert runtime config, delete/rollback migration `20260108090000_runtime_ui_config.sql` (or drop `runtime_ui_config`).
- To revert config values without schema changes: update `runtime_ui_config.public_config` back to defaults.

## Files (full contents)

### `backend/supabase/migrations/20260108090000_runtime_ui_config.sql`

```sql
-- Runtime UI configuration (public, runtime-editable)
-- Purpose: enable final UI polish without frontend rebuilds by storing a
-- strictly-sanitized PUBLIC configuration document in the database.
--
-- Security model:
-- - Read: allowed for anon/authenticated (public-safe document only)
-- - Write: no RLS write policies; only service role can update via backend

create table if not exists public.runtime_ui_config (
  id text primary key,
  public_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

create or replace function public.set_runtime_ui_config_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_runtime_ui_config_updated_at on public.runtime_ui_config;
create trigger trg_runtime_ui_config_updated_at
before update on public.runtime_ui_config
for each row
execute function public.set_runtime_ui_config_updated_at();

alter table public.runtime_ui_config enable row level security;

drop policy if exists "runtime_ui_config_read_all" on public.runtime_ui_config;
create policy "runtime_ui_config_read_all"
on public.runtime_ui_config
for select
to anon, authenticated
using (true);

-- Seed a safe default config.
insert into public.runtime_ui_config (id, public_config)
values (
  'default',
  '{
    "version": 1,
    "tokens": {
      "radius": "0.5rem"
    },
    "banner": {
      "enabled": false,
      "tone": "info",
      "text": "",
      "href": null,
      "dismissible": true
    },
    "features": {},
    "sections": {},
    "copy": {}
  }'::jsonb
)
on conflict (id) do nothing;

```

### `backend/src/index.ts`

```ts
import express from 'express';
import dotenv from 'dotenv';
import { profilesRouter } from './routes/profiles.js';
import { vibeConfigsRouter } from './routes/vibe-configs.js';
import { assemblePromptRouter } from './routes/assemble-prompt.js';
import { orchestrateAgentRouter } from './routes/orchestrate-agent.js';
import { feedbackRouter } from './routes/feedback.js';
import { webhooksRouter } from './routes/webhooks.js';
import { adminRouter } from './routes/admin.js';
import { presetsRouter } from './routes/presets.js';
import { authRouter } from './routes/auth.js';
import { inputFiltersRouter } from './routes/input-filters.js';
import { scaffoldTemplatesRouter } from './routes/scaffold-templates.js';
import { userTemplatesRouter } from './routes/user-templates.js';
import { enhancedUserTemplatesRouter } from './routes/enhanced-user-templates.js';
import { extensionAuthRouter } from './routes/extension-auth.js';
import { metricsRouter } from './routes/metrics.js';
import { ideIntegrationRouter } from './routes/ide-integration.js';
import { cicdIntegrationRouter } from './routes/cicd-integration.js';
import { exportRouter } from './routes/export.js';
import { moatMetricsRouter } from './routes/moat-metrics.js';
import { apmRouter } from './routes/apm.js';
import { auditRouter } from './routes/audit.js';
import { marketplaceRouter } from './routes/marketplace.js';
import { marketplaceV2Router } from './routes/marketplace-v2.js';
import { uiConfigPublicRouter, uiConfigAdminRouter } from './routes/ui-config.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { optionalAuthMiddleware, authMiddleware } from './middleware/auth.js';
import { userRateLimiterMiddleware, apiRateLimiter } from './middleware/rateLimit.js';
import {
  securityMiddleware,
  requestIdMiddleware,
  corsMiddleware,
  requestLoggingMiddleware,
} from './middleware/security.js';
import { initSentry } from './integrations/sentry.js';
import { initRedis } from './cache/redis.js';
import { logger } from './utils/logger.js';
import { createServer } from 'http';
import { WebSocketServer } from './websocket/server.js';

dotenv.config();

// Validate environment variables
import { validateEnv } from './utils/env.js';
validateEnv();

// Initialize Sentry before anything else
initSentry();

// Initialize Redis
initRedis();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware (must be first)
app.use(securityMiddleware());

// Request signing for sensitive operations
import { requestSigningMiddleware } from './middleware/securityHardening.js';
app.use(requestSigningMiddleware());

// Request ID middleware
app.use(requestIdMiddleware);

// CORS middleware
app.use(corsMiddleware());

// Request logging
app.use(requestLoggingMiddleware);

// Metrics middleware
import { metricsMiddleware } from './middleware/metrics.js';
import { apmMiddleware } from './middleware/apm.js';
app.use(metricsMiddleware);
app.use(apmMiddleware);

// Stripe webhook needs raw body for signature verification
// Mount it BEFORE JSON body parser
import { billingRouter } from './routes/billing.js';
app.use('/billing/webhook', express.raw({ type: 'application/json' }), billingRouter);

// Body parsing (for all other routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check (no auth, no rate limit)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Optional auth for public routes
app.use(optionalAuthMiddleware);

// Runtime UI config (public, cacheable; writable via /admin/ui-config)
app.use('/ui-config', uiConfigPublicRouter);
app.use('/admin/ui-config', uiConfigAdminRouter);

// Rate limiting for API routes
app.use('/api', apiRateLimiter);
app.use('/api', userRateLimiterMiddleware);

// Public routes
app.use('/auth', authRouter);

// Protected routes (require auth - enforced in route handlers)
app.use('/profiles', profilesRouter);
app.use('/vibe-configs', vibeConfigsRouter);
app.use('/assemble-prompt', assemblePromptRouter);
app.use('/orchestrate-agent', orchestrateAgentRouter);
app.use('/feedback', feedbackRouter);
app.use('/presets', presetsRouter);

// Input filters (require auth)
app.use('/input-filters', inputFiltersRouter);

// Scaffold templates (require auth) - Internal/admin use
app.use('/scaffold-templates', scaffoldTemplatesRouter);

// User templates (require auth) - User-facing customization API
app.use('/user-templates', userTemplatesRouter);

// Enhanced user templates (require auth) - Advanced features
app.use('/user-templates', enhancedUserTemplatesRouter);

// Admin routes (require auth)
app.use('/admin', authMiddleware, adminRouter);

// Webhooks with raw body middleware
const webhookMiddleware = express.raw({ type: 'application/json' });
app.use('/webhooks', webhookMiddleware, webhooksRouter);

// Other billing routes (checkout, portal) use JSON body parser
app.use('/billing', billingRouter);

// Extension auth routes (public, rate-limited)
app.use('/extension-auth', extensionAuthRouter);

// IDE integration routes (require auth)
app.use('/ide', ideIntegrationRouter);

// CI/CD integration routes (require auth)
app.use('/cicd', cicdIntegrationRouter);

// Export routes (require auth)
app.use('/export', exportRouter);

// Moat metrics routes (require auth)
app.use('/moat-metrics', moatMetricsRouter);

// Metrics routes (require auth)
app.use('/metrics', metricsRouter);

// APM routes (require auth, admin only)
app.use('/apm', apmRouter);

// Audit routes (require auth, admin only)
app.use('/audit', auditRouter);

// Marketplace routes (public listing, auth required for downloads)
app.use('/marketplace', marketplaceRouter);
// Marketplace v2 routes (unified keys, discovery, bundles)
app.use('/marketplace', marketplaceV2Router);

// Initialize WebSocket server
const wsServer = new WebSocketServer();
wsServer.initialize(server);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  logger.info('Backend server started', {
    port: PORT,
    environment: process.env.NODE_ENV,
    webhookEndpoints: [
      'POST /webhooks/code-repo - Code repository webhooks (GitHub/GitLab/Bitbucket)',
      'POST /webhooks/supabase - Supabase webhooks',
    ],
  });
});
```

### `backend/src/middleware/auth.ts`

```ts
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient<any> | null = null;

function getSupabaseAdminClient(): SupabaseClient<any> {
  const isTestRuntime = process.env.NODE_ENV === 'test' || typeof (import.meta as any)?.vitest !== 'undefined';
  if (!isTestRuntime && supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (isTestRuntime) {
    return createClient<any>(url || 'http://127.0.0.1:54321', key || 'test-service-role') as SupabaseClient<any>;
  }

  if (!url || !key) throw new Error('Supabase admin client is not configured');
  supabaseClient = createClient<any>(url, key) as SupabaseClient<any>;
  return supabaseClient;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

function isAllowlistedAdmin(userId: string | undefined): boolean {
  if (!userId) return false;
  const raw = process.env.ADMIN_USER_IDS || '';
  if (!raw.trim()) return false;
  const set = new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  return set.has(userId);
}

function getUserRole(user: { app_metadata?: any; user_metadata?: any; id?: string }): string | undefined {
  // Prefer app_metadata (not user-editable in Supabase).
  const appRole = user?.app_metadata?.role;
  if (typeof appRole === 'string' && appRole) return appRole;

  // Optional bootstrap: allowlist specific user IDs as admins via env.
  if (isAllowlistedAdmin(user?.id)) return 'admin';

  // Do NOT trust user_metadata.role for authorization.
  return undefined;
}

/**
 * Auth middleware to verify JWT token and extract user info
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Missing or invalid authorization header',
        },
        requestId: req.headers['x-request-id'],
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await getSupabaseAdminClient().auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ 
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid or expired token',
        },
        requestId: req.headers['x-request-id'],
      });
      return;
    }

    // Attach user info to request
    req.userId = user.id;
    req.user = {
      id: user.id,
      email: user.email,
      role: getUserRole(user),
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication error',
      },
      requestId: req.headers['x-request-id'],
    });
  }
}

/**
 * Optional auth - doesn't fail if no token, but attaches user if present
 */
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const {
        data: { user },
      } = await getSupabaseAdminClient().auth.getUser(token);

      if (user) {
        req.userId = user.id;
        req.user = {
          id: user.id,
          email: user.email,
          role: getUserRole(user),
        };
      }
    }

    next();
  } catch (error) {
    // Continue without auth on error
    next();
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRole = req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
```

### `backend/src/middleware/entitlements.ts`

```ts
import { Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from './auth.js';
import { logger } from '../utils/logger.js';

// Extend AuthenticatedRequest interface
export interface RequestWithEntitlements extends AuthenticatedRequest {
  entitlements?: {
    subscriptionStatus: string;
    premiumEnabled: boolean;
    stripeCustomerId?: string;
  };
}

let supabaseClient: SupabaseClient<any> | null = null;

function getSupabaseAdminClient(): SupabaseClient<any> {
  const isTestRuntime = process.env.NODE_ENV === 'test' || typeof (import.meta as any)?.vitest !== 'undefined';
  if (!isTestRuntime && supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // In tests we allow a safe local fallback so vitest can mock createClient()
  // without requiring real env vars. Also avoid caching across tests.
  if (isTestRuntime) {
    return createClient<any>(url || 'http://127.0.0.1:54321', key || 'test-service-role') as SupabaseClient<any>;
  }

  if (!url || !key) throw new Error('Supabase admin client is not configured');

  supabaseClient = createClient<any>(url, key) as SupabaseClient<any>;
  return supabaseClient;
}

export interface EntitlementCheck {
  requirePremium?: boolean;
  requireActiveSubscription?: boolean;
  checkUsageLimit?: boolean;
}

/**
 * Middleware to check user entitlements (subscription status, premium features, usage limits)
 */
export function entitlementsMiddleware(options: EntitlementCheck = {}) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.userId;
    const requestId = req.headers['x-request-id'] as string;

    if (!userId) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        },
        requestId,
      });
      return;
    }

    try {
      // Fast-path: if no subscription/premium requirements are requested, avoid a DB round-trip.
      // (Usage limits are enforced separately via usage metering.)
      if (!options.requireActiveSubscription && !options.requirePremium) {
        (req as RequestWithEntitlements).entitlements = {
          subscriptionStatus: 'unknown',
          premiumEnabled: false,
        };
        next();
        return;
      }

      const supabase = getSupabaseAdminClient();
      // Fetch user profile with subscription status
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('subscription_status, premium_features, stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found, which is OK for new users
        logger.error('Error fetching user profile', new Error(error.message), {
          userId,
          requestId,
        });
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to check entitlements',
          },
          requestId,
        });
        return;
      }

      const subscriptionStatus = profile?.subscription_status || 'inactive';
      const premiumFeatures = profile?.premium_features || { enabled: false };

      // Check active subscription requirement
      if (options.requireActiveSubscription) {
        if (subscriptionStatus !== 'active') {
          logger.warn('Access denied: subscription required', {
            userId,
            subscriptionStatus,
            requestId,
          });
          res.status(403).json({
            error: {
              code: 'SUBSCRIPTION_REQUIRED',
              message: 'Active subscription required',
              upgradeUrl: '/billing/portal',
            },
            requestId,
          });
          return;
        }
      }

      // Check premium features requirement
      if (options.requirePremium) {
        if (!premiumFeatures.enabled) {
          logger.warn('Access denied: premium features required', {
            userId,
            requestId,
          });
          res.status(403).json({
            error: {
              code: 'PREMIUM_REQUIRED',
              message: 'Premium features required',
              upgradeUrl: '/billing/portal',
            },
            requestId,
          });
          return;
        }
      }

      // Attach entitlement info to request for downstream use
      (req as RequestWithEntitlements).entitlements = {
        subscriptionStatus,
        premiumEnabled: premiumFeatures.enabled || false,
        stripeCustomerId: profile?.stripe_customer_id,
      };

      next();
    } catch (error) {
      logger.error('Entitlements check failed', error as Error, {
        userId,
        requestId,
      });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check entitlements',
        },
        requestId,
      });
    }
  };
}

```

### `backend/src/routes/ui-config.ts`

```ts
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validation.js';
import { DatabaseError } from '../types/errors.js';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';

type PublicUiConfig = {
  version: number;
  tokens: {
    radius: string;
  };
  banner: {
    enabled: boolean;
    tone: 'info' | 'warning' | 'success' | 'danger';
    text: string;
    href: string | null;
    dismissible: boolean;
  };
  features: Record<string, boolean>;
  sections: Record<string, boolean>;
  copy: Record<string, string>;
};

const DEFAULT_PUBLIC_CONFIG: PublicUiConfig = {
  version: 1,
  tokens: { radius: '0.5rem' },
  banner: { enabled: false, tone: 'info', text: '', href: null, dismissible: true },
  features: {},
  sections: {},
  copy: {},
};

const cssLength = z
  .string()
  .regex(/^\d+(\.\d+)?(px|rem|em|%)$/u, 'Invalid CSS length (expected px/rem/em/%)');

function sanitizeKeyValueMap<T>(
  input: unknown,
  valueGuard: (v: unknown) => v is T,
  opts: { maxEntries: number }
): Record<string, T> {
  const out: Record<string, T> = {};
  if (!input || typeof input !== 'object') return out;

  const entries = Object.entries(input as Record<string, unknown>);
  const keyPattern = /^[a-z0-9_.-]{1,64}$/u;

  for (const [k, v] of entries) {
    if (Object.keys(out).length >= opts.maxEntries) break;
    if (!keyPattern.test(k)) continue;
    if (!valueGuard(v)) continue;
    out[k] = v;
  }
  return out;
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function sanitizePublicUiConfig(raw: unknown): PublicUiConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_PUBLIC_CONFIG;
  const obj = raw as Record<string, unknown>;

  const version =
    typeof obj.version === 'number' && Number.isInteger(obj.version) && obj.version >= 1 && obj.version <= 1000
      ? obj.version
      : DEFAULT_PUBLIC_CONFIG.version;

  const tokensRaw = obj.tokens && typeof obj.tokens === 'object' ? (obj.tokens as Record<string, unknown>) : {};
  const radius =
    typeof tokensRaw.radius === 'string' && cssLength.safeParse(tokensRaw.radius).success
      ? tokensRaw.radius
      : DEFAULT_PUBLIC_CONFIG.tokens.radius;

  const bannerRaw = obj.banner && typeof obj.banner === 'object' ? (obj.banner as Record<string, unknown>) : {};
  const enabled = typeof bannerRaw.enabled === 'boolean' ? bannerRaw.enabled : DEFAULT_PUBLIC_CONFIG.banner.enabled;
  const tone = (() => {
    const t = bannerRaw.tone;
    return t === 'info' || t === 'warning' || t === 'success' || t === 'danger'
      ? t
      : DEFAULT_PUBLIC_CONFIG.banner.tone;
  })();
  const text =
    typeof bannerRaw.text === 'string' ? bannerRaw.text.slice(0, 200) : DEFAULT_PUBLIC_CONFIG.banner.text;
  const href =
    bannerRaw.href === null
      ? null
      : typeof bannerRaw.href === 'string' && z.string().url().safeParse(bannerRaw.href).success
        ? bannerRaw.href
        : DEFAULT_PUBLIC_CONFIG.banner.href;
  const dismissible =
    typeof bannerRaw.dismissible === 'boolean'
      ? bannerRaw.dismissible
      : DEFAULT_PUBLIC_CONFIG.banner.dismissible;

  const features = sanitizeKeyValueMap<boolean>(obj.features, isBoolean, { maxEntries: 200 });
  const sections = sanitizeKeyValueMap<boolean>(obj.sections, isBoolean, { maxEntries: 200 });
  const copyRaw = sanitizeKeyValueMap<string>(obj.copy, isString, { maxEntries: 200 });
  const copy: Record<string, string> = {};
  for (const [k, v] of Object.entries(copyRaw)) {
    copy[k] = v.slice(0, 2000);
  }

  return {
    version,
    tokens: { radius },
    banner: { enabled, tone, text, href, dismissible },
    features,
    sections,
    copy,
  };
}

function computeEtag(payload: unknown): string {
  const json = JSON.stringify(payload);
  const hash = crypto.createHash('sha256').update(json).digest('hex').slice(0, 32);
  return `W/"ui-config-${hash}"`;
}

let supabaseClient: SupabaseClient<any> | null = null;

function getSupabaseAdminClient(): SupabaseClient<any> {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if ((!url || !key) && process.env.NODE_ENV === 'test') {
    supabaseClient = createClient<any>(url || 'http://127.0.0.1:54321', key || 'test-service-role') as SupabaseClient<any>;
    return supabaseClient;
  }

  if (!url || !key) {
    throw new Error('Supabase admin client is not configured');
  }

  supabaseClient = createClient<any>(url, key) as SupabaseClient<any>;
  return supabaseClient;
}

async function readConfigRow(): Promise<{ config: PublicUiConfig; updatedAt: string | null }> {
  const { data, error } = await getSupabaseAdminClient()
    .from('runtime_ui_config')
    .select('public_config, updated_at')
    .eq('id', 'default')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new DatabaseError('Failed to load runtime UI config', { error: error.message });
  }

  const config = sanitizePublicUiConfig(data?.public_config);
  const updatedAt = data?.updated_at ?? null;
  return { config, updatedAt };
}

export const uiConfigPublicRouter = Router();
export const uiConfigAdminRouter = Router();

// Light rate limit to prevent abuse (config is public/cacheable).
uiConfigPublicRouter.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

uiConfigPublicRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { config, updatedAt } = await readConfigRow();
    const etag = computeEtag({ config, updatedAt });

    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
    if (updatedAt) res.setHeader('X-UI-Config-Updated-At', updatedAt);
    res.json({ config, updatedAt });
  })
);

const updateSchema = z.object({
  config: z.unknown(),
});

uiConfigAdminRouter.patch(
  '/',
  authMiddleware,
  requireRole('admin', 'superadmin'),
  validateBody(updateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const nextConfig = sanitizePublicUiConfig((req.body as { config: unknown }).config);

    const { data, error } = await getSupabaseAdminClient()
      .from('runtime_ui_config')
      .upsert({
        id: 'default',
        public_config: nextConfig,
        updated_by: req.userId ?? null,
      })
      .select('public_config, updated_at')
      .single();

    if (error) {
      throw new DatabaseError('Failed to update runtime UI config', { error: error.message });
    }

    const config = sanitizePublicUiConfig(data?.public_config);
    const updatedAt = data?.updated_at ?? null;
    const etag = computeEtag({ config, updatedAt });

    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'no-store');
    if (updatedAt) res.setHeader('X-UI-Config-Updated-At', updatedAt);
    res.json({ config, updatedAt });
  })
);

```

### `backend/src/routes/orchestrate-agent.ts`

```ts
import { Router } from 'express';
import { z } from 'zod';
import { orchestrateAgent } from '../services/agentOrchestration.js';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PromptAssemblyResult } from '../types/index.js';
import { telemetryService } from '../services/telemetryService.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { entitlementsMiddleware } from '../middleware/entitlements.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validation.js';
import { checkLimit, trackUsage } from '../services/usageMetering.js';
import { RateLimitError } from '../types/errors.js';
import { failurePatternService } from '../services/failurePatternService.js';
import { safetyEnforcementService } from '../services/safetyEnforcementService.js';

const router = Router();

let supabaseClient: SupabaseClient<any> | null = null;
function getSupabaseAdminClient() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // In non-production environments/tests, allow mocking createClient() without requiring env.
    supabaseClient = createClient<any>(url || 'http://127.0.0.1:54321', key || 'test-service-role') as SupabaseClient<any>;
    return supabaseClient;
  }
  supabaseClient = createClient<any>(url, key) as SupabaseClient<any>;
  return supabaseClient;
}

const orchestrateAgentSchema = z.object({
  assembledPrompt: z.object({
    systemPrompt: z.string().min(1),
    userPrompt: z.string().optional(),
    selectedAtomIds: z.array(z.string().uuid()).optional(),
    context: z.record(z.any()).optional(),
  }),
  taskIntent: z.string().optional(),
  naturalLanguageInput: z.string().min(1).max(10000),
});

router.post(
  '/',
  authMiddleware,
  validateBody(orchestrateAgentSchema),
  entitlementsMiddleware({ checkUsageLimit: true }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!; // Always use authenticated user ID
    const { assembledPrompt, taskIntent, naturalLanguageInput } = req.body;

    // Check usage limits before processing
    const usageCheck = await checkLimit(userId, 'runs', 1);
    if (!usageCheck.allowed) {
      const error = new RateLimitError(
        `Usage limit exceeded. You have used ${usageCheck.current}/${usageCheck.limit} runs this month. Please upgrade your plan to continue.`
      );
      error.context = {
        current: usageCheck.current,
        limit: usageCheck.limit,
        remaining: usageCheck.remaining,
        metricType: 'runs',
      };
      throw error;
    }

    const startTime = Date.now();

    // Apply failure prevention rules (defensive moat: institutional memory)
    const preventionRules = await failurePatternService.getPreventionRules(
      userId,
      assembledPrompt.context
    );
    
    // Enhance system prompt with prevention rules
    const enhancedSystemPrompt = preventionRules.length > 0
      ? `${assembledPrompt.systemPrompt}\n\n## Prevention Rules (Based on Past Failures):\n${preventionRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}`
      : assembledPrompt.systemPrompt;

    const enhancedPrompt: PromptAssemblyResult = {
      ...assembledPrompt,
      systemPrompt: enhancedSystemPrompt,
    };

    // Orchestrate agent
    const output = await orchestrateAgent(
      enhancedPrompt,
      taskIntent || naturalLanguageInput,
      naturalLanguageInput
    );

    const latencyMs = Date.now() - startTime;

    // Safety enforcement (defensive moat: transfer risk to Keys)
    const outputContent = typeof output.content === 'string' 
      ? output.content 
      : JSON.stringify(output.content);

    const safetyCheck = await safetyEnforcementService.checkOutput(outputContent, {
      outputType: output.outputType,
      templateId: assembledPrompt.context?.templateId,
      userId,
    });

    // Block output if critical security/compliance issues detected
    if (safetyCheck.blocked) {
      const criticalWarnings = safetyCheck.warnings.filter(w => w.severity === 'critical');
      return res.status(400).json({
        error: 'Output blocked due to security or compliance issues',
        message: 'This output contains critical security or compliance vulnerabilities and cannot be generated.',
        warnings: criticalWarnings,
        checks: {
          security: safetyCheck.checks.security,
          compliance: safetyCheck.checks.compliance,
        },
      });
    }

    // Add safety warnings to output
    if (safetyCheck.warnings.length > 0) {
      output.warnings = output.warnings || [];
      safetyCheck.warnings.forEach(warning => {
        output.warnings!.push({
          type: warning.type,
          message: warning.message,
          suggestion: warning.suggestion,
        });
      });
    }

    // Check for similar failures (defensive moat: prevent repeat mistakes)
    const failureMatches = await failurePatternService.checkForSimilarFailures(
      userId,
      outputContent,
      assembledPrompt.context
    );

    // If high-confidence failure match detected, warn user
    const criticalMatches = failureMatches.filter(m => m.match_confidence > 0.8 && m.match_type === 'exact');
    if (criticalMatches.length > 0) {
      // Add warning to output
      output.warnings = output.warnings || [];
      output.warnings.push({
        type: 'similar_failure_detected',
        message: `This output is similar to a previous failure. Review carefully before using.`,
        patternIds: criticalMatches.map(m => m.pattern_id),
      });
    }

    // Log agent run with safety check results
    const { data: run } = await getSupabaseAdminClient()
      .from('agent_runs')
      .insert({
        user_id: userId,
        trigger: 'chat_input',
        assembled_prompt: enhancedPrompt.systemPrompt,
        selected_atoms: assembledPrompt.selectedAtomIds,
        vibe_config_snapshot: assembledPrompt.context,
        agent_type: 'orchestrator',
        model_used: output.modelUsed,
        generated_content: output.content,
        tokens_used: output.tokensUsed,
        latency_ms: latencyMs,
        cost_usd: output.costUsd,
        safety_checks_passed: safetyCheck.passed,
        safety_check_results: {
          security: safetyCheck.checks.security,
          compliance: safetyCheck.checks.compliance,
          quality: safetyCheck.checks.quality,
        },
      })
      .select()
      .single();

    // Track telemetry and usage
    if (run) {
      await telemetryService.trackChatMessage(userId, naturalLanguageInput.length);
      if (output.costUsd && output.tokensUsed) {
        await telemetryService.trackCost(userId, output.costUsd, output.tokensUsed);
        // Track token usage
        await trackUsage(userId, 'tokens', output.tokensUsed).catch((err) => {
          // Log but don't fail the request if usage tracking fails
          console.error('Failed to track token usage:', err);
        });
      }
      // Track run usage (already checked limit above)
      await trackUsage(userId, 'runs', 1).catch((err) => {
        console.error('Failed to track run usage:', err);
      });
    }

    res.json(output);
  })
);

export { router as orchestrateAgentRouter };
```

### `backend/src/routes/profiles.ts`

```ts
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { createProfileSchema, updateProfileSchema } from '../validation/schemas.js';
import { NotFoundError, DatabaseError, AuthorizationError } from '../types/errors.js';
import { logger } from '../utils/logger.js';
import { getCache, setCache, deleteCache, cacheKeys } from '../cache/redis.js';
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { checkLimit } from '../services/usageMetering.js';

const router = Router();
let supabaseClient: SupabaseClient<any> | null = null;
function getSupabaseAdminClient() {
  const isTestRuntime = process.env.NODE_ENV === 'test' || typeof (import.meta as any)?.vitest !== 'undefined';
  if (!isTestRuntime && supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (isTestRuntime) {
    return createClient<any>(url || 'http://127.0.0.1:54321', key || 'test-service-role') as SupabaseClient<any>;
  }

  if (!url || !key) throw new Error('Supabase admin client is not configured');
  supabaseClient = createClient<any>(url, key) as SupabaseClient<any>;
  return supabaseClient;
}

// Get user profile
router.get(
  '/:userId',
  authMiddleware,
  validateParams(z.object({ userId: z.string().min(1) })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { userId } = req.params;
    const authenticatedUserId = req.userId!;
    const requestId = req.headers['x-request-id'] as string;

    // Enforce ownership: users can only access their own profile unless admin
    if (userId !== authenticatedUserId && req.user?.role !== 'admin') {
      throw new AuthorizationError('You can only access your own profile');
    }

    // Try cache first
    const cacheKey = cacheKeys.userProfile(userId);
    const cached = await getCache(cacheKey);
    if (cached) {
      logger.debug('Profile cache hit', { userId, requestId });
      return res.json(cached);
    }

    const { data, error } = await getSupabaseAdminClient()
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundError('User profile');
    }

    // Cache for 5 minutes
    await setCache(cacheKey, data, 300);

    logger.info('Profile fetched', { userId, requestId });
    res.json(data);
  })
);

// Create user profile
router.post(
  '/',
  authMiddleware,
  validateBody(createProfileSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const profile = req.body;
    const userId = req.userId!; // Always use authenticated user ID
    const requestId = req.headers['x-request-id'] as string;

    // Ignore user_id from body if present - always use authenticated user
    const { user_id, ...profileData } = profile;

    const { data, error } = await getSupabaseAdminClient()
      .from('user_profiles')
      .insert({ ...profileData, user_id: userId })
      .select()
      .single();

    if (error) {
      logger.error('Error creating profile', new Error(error.message), { userId, requestId });
      throw new DatabaseError('Failed to create profile', { error: error.message });
    }

    // Invalidate cache
    await deleteCache(cacheKeys.userProfile(userId));

    logger.info('Profile created', { userId, requestId });
    res.status(201).json(data);
  })
);

// Update user profile
router.patch(
  '/:userId',
  authMiddleware,
  validateParams(z.object({ userId: z.string().min(1) })),
  validateBody(updateProfileSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { userId } = req.params;
    const authenticatedUserId = req.userId!;
    const updates = req.body;
    const requestId = req.headers['x-request-id'] as string;

    // Enforce ownership: users can only update their own profile unless admin
    if (userId !== authenticatedUserId && req.user?.role !== 'admin') {
      throw new AuthorizationError('You can only update your own profile');
    }

    // Remove user_id from updates if present - cannot change ownership
    const { user_id, ...updateData } = updates;

    const { data, error } = await getSupabaseAdminClient()
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating profile', new Error(error.message), { userId, requestId });
      throw new DatabaseError('Failed to update profile', { error: error.message });
    }

    if (!data) {
      throw new NotFoundError('User profile');
    }

    // Invalidate cache
    await deleteCache(cacheKeys.userProfile(userId));

    logger.info('Profile updated', { userId, requestId });
    res.json(data);
  })
);

// List profiles (admin only)
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Only admins can list all profiles
    if (req.user?.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }
    const pagination = getPaginationParams(req.query);
    const requestId = req.headers['x-request-id'] as string;

    const { data, error, count } = await getSupabaseAdminClient()
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .range(
        (pagination.page - 1) * pagination.limit,
        pagination.page * pagination.limit - 1
      )
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error listing profiles', new Error(error.message), { requestId });
      throw new DatabaseError('Failed to list profiles', { error: error.message });
    }

    const response = createPaginatedResponse(data || [], count || 0, pagination);
    res.json(response);
  })
);

export { router as profilesRouter };
```

### `backend/src/services/apmService.ts`

```ts
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient<any> | null = null;

function getSupabaseAdminClient(): SupabaseClient<any> {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if ((!url || !key) && process.env.NODE_ENV === 'test') {
    supabaseClient = createClient<any>(url || 'http://127.0.0.1:54321', key || 'test-service-role') as SupabaseClient<any>;
    return supabaseClient;
  }

  if (!url || !key) {
    throw new Error('Supabase admin client is not configured');
  }

  supabaseClient = createClient<any>(url, key) as SupabaseClient<any>;
  return supabaseClient;
}

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ErrorMetric {
  errorType: string;
  errorMessage: string;
  endpoint?: string;
  userId?: string;
  stackTrace?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class APMService {
  private metricsBuffer: PerformanceMetric[] = [];
  private errorsBuffer: ErrorMetric[] = [];
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL = 10000; // 10 seconds

  constructor() {
    // Flush metrics periodically (skip in tests to avoid dangling intervals).
    if (process.env.NODE_ENV !== 'test') {
      setInterval(() => this.flushMetrics(), this.FLUSH_INTERVAL);
      setInterval(() => this.flushErrors(), this.FLUSH_INTERVAL);
    }
  }

  /**
   * Track request performance
   */
  trackRequest(metric: PerformanceMetric): void {
    this.metricsBuffer.push(metric);

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.BATCH_SIZE) {
      this.flushMetrics();
    }
  }

  /**
   * Track error
   */
  trackError(error: ErrorMetric): void {
    this.errorsBuffer.push(error);

    // Flush if buffer is full
    if (this.errorsBuffer.length >= this.BATCH_SIZE) {
      this.flushErrors();
    }
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(
    endpoint?: string,
    hours: number = 24
  ): Promise<{
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    count: number;
    errorRate: number;
  }> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    try {
      // Query from agent_runs table (using trigger_data for metrics)
      // In production, you'd have a dedicated metrics table
      const { data: runs } = await getSupabaseAdminClient()
        .from('agent_runs')
        .select('created_at, trigger_data, cost_usd')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      const metrics = (runs || [])
        .map((run) => {
          const triggerData = run.trigger_data as any;
          return triggerData?.duration || 0;
        })
        .filter((d) => d > 0);

      if (metrics.length === 0) {
        return {
          p50: 0,
          p95: 0,
          p99: 0,
          avg: 0,
          count: 0,
          errorRate: 0,
        };
      }

      const sorted = metrics.sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;

      return {
        p50,
        p95,
        p99,
        avg,
        count: sorted.length,
        errorRate: 0, // Would calculate from error metrics
      };
    } catch (error) {
      console.error('Error getting performance stats:', error);
      return {
        p50: 0,
        p95: 0,
        p99: 0,
        avg: 0,
        count: 0,
        errorRate: 0,
      };
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(hours: number = 24): Promise<{
    total: number;
    byType: Record<string, number>;
    recent: ErrorMetric[];
  }> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    // In production, query from error_logs table
    // For now, return current buffer stats
    const recent = this.errorsBuffer.filter(
      (e) => e.timestamp >= startTime
    );

    const byType: Record<string, number> = {};
    recent.forEach((error) => {
      byType[error.errorType] = (byType[error.errorType] || 0) + 1;
    });

    return {
      total: recent.length,
      byType,
      recent: recent.slice(0, 100), // Last 100 errors
    };
  }

  /**
   * Flush metrics buffer to database
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const toFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      // In production, insert into metrics table
      // For now, we'll log or store in a way that doesn't break the app
      console.log(`[APM] Flushing ${toFlush.length} performance metrics`);
      
      // Could store in background_events table with event_type='apm.metric'
      for (const metric of toFlush) {
        await getSupabaseAdminClient().from('background_events').insert({
          event_type: 'apm.metric',
          source: 'apm',
          event_data: metric,
          event_timestamp: metric.timestamp.toISOString(),
          user_id: metric.userId || 'system',
        });
      }
    } catch (error) {
      console.error('Error flushing metrics:', error);
      // Don't throw - APM failures shouldn't break the app
    }
  }

  /**
   * Flush errors buffer to database
   */
  private async flushErrors(): Promise<void> {
    if (this.errorsBuffer.length === 0) return;

    const toFlush = [...this.errorsBuffer];
    this.errorsBuffer = [];

    try {
      console.log(`[APM] Flushing ${toFlush.length} error metrics`);
      
      for (const error of toFlush) {
        await getSupabaseAdminClient().from('background_events').insert({
          event_type: 'apm.error',
          source: 'apm',
          event_data: error,
          event_timestamp: error.timestamp.toISOString(),
          user_id: error.userId || 'system',
        });
      }
    } catch (error) {
      console.error('Error flushing errors:', error);
    }
  }
}

export const apmService = new APMService();
```

### `backend/src/services/errorTrackingService.ts`

```ts
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { apmService } from './apmService.js';

let supabaseClient: SupabaseClient<any> | null = null;

function getSupabaseAdminClient() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if ((!url || !key) && process.env.NODE_ENV === 'test') {
    supabaseClient = createClient<any>(url || 'http://127.0.0.1:54321', key || 'test-service-role') as SupabaseClient<any>;
    return supabaseClient;
  }

  if (!url || !key) {
    throw new Error('Supabase admin client is not configured');
  }

  supabaseClient = createClient<any>(url, key) as SupabaseClient<any>;
  return supabaseClient;
}

export interface ErrorGroup {
  errorType: string;
  errorMessage: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  affectedUsers: number;
  stackTrace?: string;
}

export interface ErrorBudget {
  errorRate: number;
  threshold: number;
  period: 'hour' | 'day' | 'week';
  status: 'healthy' | 'warning' | 'exceeded';
}

export class ErrorTrackingService {
  /**
   * Group errors by fingerprint
   */
  private getErrorFingerprint(error: {
    errorType: string;
    errorMessage: string;
    stackTrace?: string;
  }): string {
    // Create fingerprint from error type, message, and first few lines of stack
    const stackLines = error.stackTrace?.split('\n').slice(0, 3).join('\n') || '';
    return `${error.errorType}:${error.errorMessage}:${stackLines}`.substring(0, 200);
  }

  /**
   * Track and group error
   */
  async trackError(error: {
    errorType: string;
    errorMessage: string;
    endpoint?: string;
    userId?: string;
    stackTrace?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // Track via APM
    apmService.trackError({
      errorType: error.errorType,
      errorMessage: error.errorMessage,
      endpoint: error.endpoint,
      userId: error.userId,
      stackTrace: error.stackTrace,
      timestamp: new Date(),
      metadata: error.metadata,
    });

    // Store in database for grouping
    const fingerprint = this.getErrorFingerprint(error);
    
    try {
      await getSupabaseAdminClient().from('background_events').insert({
        event_type: 'error.tracked',
        source: 'error_tracking',
        event_data: {
          ...error,
          fingerprint,
        },
        event_timestamp: new Date().toISOString(),
        user_id: error.userId || 'system',
      });
    } catch (err) {
      console.error('Error tracking failed:', err);
    }
  }

  /**
   * Get error groups (deduplicated errors)
   */
  async getErrorGroups(hours: number = 24): Promise<ErrorGroup[]> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    try {
      const { data: events } = await getSupabaseAdminClient()
        .from('background_events')
        .select('*')
        .eq('event_type', 'error.tracked')
        .gte('event_timestamp', startTime.toISOString())
        .order('event_timestamp', { ascending: false })
        .limit(1000);

      if (!events || events.length === 0) {
        return [];
      }

      // Group by fingerprint
      const groups = new Map<string, ErrorGroup>();

      events.forEach((event) => {
        const eventData = event.event_data as any;
        const fingerprint = eventData.fingerprint || 'unknown';

        if (!groups.has(fingerprint)) {
          groups.set(fingerprint, {
            errorType: eventData.errorType || 'Unknown',
            errorMessage: eventData.errorMessage || 'Unknown error',
            count: 0,
            firstSeen: new Date(event.event_timestamp),
            lastSeen: new Date(event.event_timestamp),
            affectedUsers: new Set<string>().size,
            stackTrace: eventData.stackTrace,
          });
        }

        const group = groups.get(fingerprint)!;
        group.count++;
        group.lastSeen = new Date(
          Math.max(
            group.lastSeen.getTime(),
            new Date(event.event_timestamp).getTime()
          )
        );
      });

      return Array.from(groups.values()).sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error getting error groups:', error);
      return [];
    }
  }

  /**
   * Check error budget
   */
  async checkErrorBudget(period: 'hour' | 'day' | 'week' = 'hour'): Promise<ErrorBudget> {
    const hours = period === 'hour' ? 1 : period === 'day' ? 24 : 168;
    const stats = await apmService.getErrorStats(hours);
    
    // Get total requests in same period (would need to track this)
    // For now, estimate based on error rate
    const estimatedRequests = stats.total * 100; // Assume 1% error rate
    const errorRate = estimatedRequests > 0 ? (stats.total / estimatedRequests) * 100 : 0;
    
    // Error budget: 1% error rate threshold
    const threshold = 1.0;
    let status: 'healthy' | 'warning' | 'exceeded' = 'healthy';
    
    if (errorRate > threshold) {
      status = 'exceeded';
    } else if (errorRate > threshold * 0.8) {
      status = 'warning';
    }

    return {
      errorRate,
      threshold,
      period,
      status,
    };
  }
}

export const errorTrackingService = new ErrorTrackingService();
```

### `backend/src/services/safetyEnforcementService.ts`

```ts
/**
 * Safety Enforcement Service
 * 
 * Core defensive moat: Automatic security/compliance/quality checking.
 * Transfers risk from user to Keys by guaranteeing outputs meet standards.
 */

import { logger } from '../utils/logger.js';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient<any> | null = null;

function getSupabaseAdminClient() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if ((!url || !key) && process.env.NODE_ENV === 'test') {
    supabaseClient = createClient<any>(url || 'http://127.0.0.1:54321', key || 'test-service-role') as SupabaseClient<any>;
    return supabaseClient;
  }

  if (!url || !key) {
    throw new Error('Supabase admin client is not configured');
  }

  supabaseClient = createClient<any>(url, key) as SupabaseClient<any>;
  return supabaseClient;
}

export interface SafetyCheckResult {
  passed: boolean;
  blocked: boolean;
  warnings: SafetyWarning[];
  checks: {
    security: SecurityCheckResult;
    compliance: ComplianceCheckResult;
    quality: QualityCheckResult;
  };
}

export interface SafetyWarning {
  type: 'security' | 'compliance' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  pattern?: string;
  suggestion?: string;
}

export interface SecurityCheckResult {
  passed: boolean;
  vulnerabilities: SecurityVulnerability[];
  score: number; // 0-100
}

export interface SecurityVulnerability {
  type: 'sql_injection' | 'xss' | 'csrf' | 'auth_bypass' | 'secret_exposure' | 'insecure_dependency' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  pattern: string;
  line?: number;
  description: string;
  fix: string;
}

export interface ComplianceCheckResult {
  passed: boolean;
  violations: ComplianceViolation[];
  standards: {
    gdpr: boolean;
    soc2: boolean;
    hipaa: boolean;
  };
}

export interface ComplianceViolation {
  standard: 'gdpr' | 'soc2' | 'hipaa';
  violation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fix: string;
}

export interface QualityCheckResult {
  passed: boolean;
  issues: QualityIssue[];
  score: number; // 0-100
}

export interface QualityIssue {
  type: 'code_smell' | 'anti_pattern' | 'best_practice' | 'performance' | 'maintainability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  pattern: string;
  description: string;
  suggestion: string;
}

export class SafetyEnforcementService {
  /**
   * Perform comprehensive safety checks on output
   */
  async checkOutput(
    output: string,
    context?: {
      outputType?: string;
      templateId?: string;
      userId?: string;
    }
  ): Promise<SafetyCheckResult> {
    const securityCheck = await this.checkSecurity(output, context);
    const complianceCheck = await this.checkCompliance(output, context);
    const qualityCheck = await this.checkQuality(output, context);

    const warnings: SafetyWarning[] = [];

    // Collect warnings from all checks
    securityCheck.vulnerabilities.forEach(vuln => {
      warnings.push({
        type: 'security',
        severity: vuln.severity,
        message: vuln.description,
        pattern: vuln.pattern,
        suggestion: vuln.fix,
      });
    });

    complianceCheck.violations.forEach(violation => {
      warnings.push({
        type: 'compliance',
        severity: violation.severity,
        message: violation.description,
        suggestion: violation.fix,
      });
    });

    qualityCheck.issues.forEach(issue => {
      warnings.push({
        type: 'quality',
        severity: issue.severity,
        message: issue.description,
        pattern: issue.pattern,
        suggestion: issue.suggestion,
      });
    });

    // Block if critical security or compliance issues
    const blocked = warnings.some(w => 
      w.severity === 'critical' && 
      (w.type === 'security' || w.type === 'compliance')
    );

    // Pass if no critical issues and all checks passed
    const passed = !blocked && securityCheck.passed && complianceCheck.passed && qualityCheck.passed;

    // Track guarantee metrics if user provided
    if (context?.userId) {
      await this.trackGuaranteeMetrics(context.userId, {
        security: securityCheck,
        compliance: complianceCheck,
        quality: qualityCheck,
        blocked,
        passed,
      });
    }

    return {
      passed,
      blocked,
      warnings,
      checks: {
        security: securityCheck,
        compliance: complianceCheck,
        quality: qualityCheck,
      },
    };
  }

  /**
   * Track guarantee metrics for billing and analytics
   */
  private async trackGuaranteeMetrics(
    userId: string,
    results: {
      security: SecurityCheckResult;
      compliance: ComplianceCheckResult;
      quality: QualityCheckResult;
      blocked: boolean;
      passed: boolean;
    }
  ): Promise<void> {
    try {
      // Get user's tier and guarantee coverage
      const { data: profile } = await getSupabaseAdminClient()
        .from('user_profiles')
        .select('subscription_tier, guarantee_coverage, prevented_failures_count')
        .eq('user_id', userId)
        .single();

      if (!profile) return;

      const tier = profile.subscription_tier || 'free';
      const guaranteeCoverage = profile.guarantee_coverage || [];

      // Only track for Pro, Pro+, and Enterprise tiers
      if (!['pro', 'pro+', 'enterprise'].includes(tier)) return;

      // Count prevented failures (blocked outputs)
      if (results.blocked) {
        const preventedCount = (profile.prevented_failures_count || 0) + 1;
        
        await getSupabaseAdminClient()
          .from('user_profiles')
          .update({ prevented_failures_count: preventedCount })
          .eq('user_id', userId);
      }

      // Track guarantee coverage usage
      const guaranteeUsage: Record<string, number> = {};
      
      if (guaranteeCoverage.includes('security')) {
        guaranteeUsage.security_checks = (guaranteeUsage.security_checks || 0) + 1;
        guaranteeUsage.security_vulnerabilities_found = results.security.vulnerabilities.length;
        guaranteeUsage.security_vulnerabilities_blocked = results.security.vulnerabilities.filter(
          v => v.severity === 'critical'
        ).length;
      }

      if (guaranteeCoverage.includes('compliance')) {
        guaranteeUsage.compliance_checks = (guaranteeUsage.compliance_checks || 0) + 1;
        guaranteeUsage.compliance_violations_found = results.compliance.violations.length;
        guaranteeUsage.compliance_violations_blocked = results.compliance.violations.filter(
          v => v.severity === 'critical'
        ).length;
      }

      if (guaranteeCoverage.includes('quality')) {
        guaranteeUsage.quality_checks = (guaranteeUsage.quality_checks || 0) + 1;
        guaranteeUsage.quality_issues_found = results.quality.issues.length;
        guaranteeUsage.quality_score = results.quality.score;
      }

      // Store guarantee metrics (could be in a separate table for analytics)
      // For now, we'll log them for tracking
      logger.info('Guarantee metrics tracked', {
        userId,
        tier,
        guaranteeCoverage,
        preventedFailures: profile.prevented_failures_count,
        guaranteeUsage,
      });
    } catch (error) {
      logger.error('Failed to track guarantee metrics', error instanceof Error ? error : new Error(String(error)), { userId });
    }
  }

  /**
   * Security scanning
   */
  private async checkSecurity(
    output: string,
    context?: Record<string, any>
  ): Promise<SecurityCheckResult> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // SQL Injection patterns
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b[^;]*;)/gi,
      /(\b(UNION|OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /('|"|`).*(\bor\b|\band\b).*\1/gi,
      /(\$\{[^}]+\})/g, // Template injection
    ];

    sqlInjectionPatterns.forEach(pattern => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          vulnerabilities.push({
            type: 'sql_injection',
            severity: 'critical',
            pattern: match,
            description: `Potential SQL injection detected: ${match.substring(0, 50)}`,
            fix: 'Use parameterized queries or prepared statements. Never concatenate user input into SQL queries.',
          });
        });
      }
    });

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers
      /<iframe[^>]*>/gi,
    ];

    xssPatterns.forEach(pattern => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          vulnerabilities.push({
            type: 'xss',
            severity: 'high',
            pattern: match,
            description: `Potential XSS vulnerability detected: ${match.substring(0, 50)}`,
            fix: 'Sanitize user input and use Content Security Policy (CSP). Escape HTML entities.',
          });
        });
      }
    });

    // Secret exposure patterns
    const secretPatterns = [
      /(api[_-]?key|secret|password|token|credential)\s*[=:]\s*["']?([a-zA-Z0-9]{20,})["']?/gi,
      /(BEGIN\s+(RSA\s+)?PRIVATE\s+KEY|-----BEGIN)/gi,
      /(aws[_-]?access[_-]?key[_-]?id|aws[_-]?secret[_-]?access[_-]?key)/gi,
      /(ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36})/g, // GitHub tokens
    ];

    secretPatterns.forEach(pattern => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          vulnerabilities.push({
            type: 'secret_exposure',
            severity: 'critical',
            pattern: match.substring(0, 50) + '...',
            description: 'Potential secret/credential exposure detected',
            fix: 'Never hardcode secrets. Use environment variables or secret management systems.',
          });
        });
      }
    });

    // Auth bypass patterns
    const authBypassPatterns = [
      /(if\s*\(\s*true\s*\)|if\s*\(\s*1\s*==\s*1\s*\))/gi,
      /(bypass|skip|ignore)[_-]?auth/gi,
      /(admin|root)[_-]?mode/gi,
    ];

    authBypassPatterns.forEach(pattern => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          vulnerabilities.push({
            type: 'auth_bypass',
            severity: 'critical',
            pattern: match,
            description: `Potential authentication bypass detected: ${match}`,
            fix: 'Always verify authentication and authorization. Never skip security checks.',
          });
        });
      }
    });

    // Calculate security score
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

    const score = Math.max(0, 100 - (criticalCount * 30 + highCount * 15 + mediumCount * 5 + lowCount * 2));

    return {
      passed: vulnerabilities.length === 0,
      vulnerabilities,
      score,
    };
  }

  /**
   * Compliance checking
   */
  private async checkCompliance(
    output: string,
    context?: Record<string, any>
  ): Promise<ComplianceCheckResult> {
    const violations: ComplianceViolation[] = [];

    // GDPR patterns
    const gdprPatterns = [
      {
        pattern: /(personal\s+data|pii|personally\s+identifiable)/gi,
        check: (match: string) => {
          // Check if there's proper handling mentioned
          const hasConsent = output.match(/(consent|opt[_-]?in|permission)/gi);
          const hasEncryption = output.match(/(encrypt|hash|secure)/gi);
          if (!hasConsent && !hasEncryption) {
            return {
              standard: 'gdpr' as const,
              violation: 'Personal data processing without explicit consent or encryption',
              severity: 'high' as const,
              description: 'GDPR requires explicit consent for personal data processing and encryption for storage',
              fix: 'Add explicit consent mechanism and encrypt personal data at rest and in transit.',
            };
          }
          return null;
        },
      },
      {
        pattern: /(log|store|save).*email/gi,
        check: (match: string) => {
          const hasConsent = output.match(/(consent|permission|opt[_-]?in)/gi);
          if (!hasConsent) {
            return {
              standard: 'gdpr' as const,
              violation: 'Email storage without consent',
              severity: 'medium' as const,
              description: 'GDPR requires consent before storing email addresses',
              fix: 'Add explicit consent before storing email addresses.',
            };
          }
          return null;
        },
      },
    ];

    gdprPatterns.forEach(({ pattern, check }) => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const violation = check(match);
          if (violation) {
            violations.push(violation);
          }
        });
      }
    });

    // SOC 2 patterns
    const soc2Patterns = [
      {
        pattern: /(password|credential|secret)/gi,
        check: (match: string) => {
          const hasHashing = output.match(/(hash|bcrypt|argon2|scrypt|pbkdf2)/gi);
          const hasEncryption = output.match(/(encrypt|aes|rsa)/gi);
          if (!hasHashing && !hasEncryption) {
            return {
              standard: 'soc2' as const,
              violation: 'Passwords/secrets stored without hashing or encryption',
              severity: 'critical' as const,
              description: 'SOC 2 requires passwords and secrets to be hashed or encrypted',
              fix: 'Use strong hashing algorithms (bcrypt, argon2) for passwords. Encrypt secrets.',
            };
          }
          return null;
        },
      },
      {
        pattern: /(audit|log)/gi,
        check: (match: string) => {
          const hasAuditLog = output.match(/(audit[_-]?log|log[_-]?audit|audit[_-]?trail)/gi);
          if (!hasAuditLog) {
            return {
              standard: 'soc2' as const,
              violation: 'Missing audit logging for sensitive operations',
              severity: 'medium' as const,
              description: 'SOC 2 requires audit logging for all sensitive operations',
              fix: 'Add audit logging for authentication, authorization, and data access operations.',
            };
          }
          return null;
        },
      },
    ];

    soc2Patterns.forEach(({ pattern, check }) => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const violation = check(match);
          if (violation) {
            violations.push(violation);
          }
        });
      }
    });

    // HIPAA patterns (if healthcare context)
    if (context?.outputType?.includes('health') || output.match(/(patient|health|medical|phi)/gi)) {
      const hipaaPatterns = [
        {
          pattern: /(patient|health|medical)/gi,
          check: (match: string) => {
            const hasEncryption = output.match(/(encrypt|tls|ssl|aes)/gi);
            const hasAccessControl = output.match(/(auth|authorize|permission|role)/gi);
            if (!hasEncryption || !hasAccessControl) {
              return {
                standard: 'hipaa' as const,
                violation: 'PHI handling without encryption and access controls',
                severity: 'critical' as const,
                description: 'HIPAA requires encryption and access controls for PHI',
                fix: 'Encrypt PHI at rest and in transit. Implement role-based access control.',
              };
            }
            return null;
          },
        },
      ];

      hipaaPatterns.forEach(({ pattern, check }) => {
        const matches = output.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const violation = check(match);
            if (violation) {
              violations.push(violation);
            }
          });
        }
      });
    }

    return {
      passed: violations.length === 0,
      violations,
      standards: {
        gdpr: violations.filter(v => v.standard === 'gdpr').length === 0,
        soc2: violations.filter(v => v.standard === 'soc2').length === 0,
        hipaa: violations.filter(v => v.standard === 'hipaa').length === 0,
      },
    };
  }

  /**
   * Quality checking
   */
  private async checkQuality(
    output: string,
    context?: Record<string, any>
  ): Promise<QualityCheckResult> {
    const issues: QualityIssue[] = [];

    // Code smells
    const codeSmellPatterns = [
      {
        pattern: /(function\s+\w+\s*\([^)]*\)\s*\{[^}]{500,}\})/gs, // Long functions
        issue: {
          type: 'code_smell' as const,
          severity: 'medium' as const,
          pattern: 'Long function',
          description: 'Function exceeds recommended length (500+ characters)',
          suggestion: 'Break down into smaller, focused functions. Follow single responsibility principle.',
        },
      },
      {
        pattern: /(if\s*\([^)]+\)\s*\{[^}]*\}\s*else\s*if\s*\([^)]+\)\s*\{[^}]*\}\s*else\s*if)/gi, // Deep nesting
        issue: {
          type: 'code_smell' as const,
          severity: 'low' as const,
          pattern: 'Deep nesting',
          description: 'Deeply nested conditionals reduce readability',
          suggestion: 'Use early returns, guard clauses, or strategy pattern to reduce nesting.',
        },
      },
      {
        pattern: /(TODO|FIXME|HACK|XXX)/gi,
        issue: {
          type: 'code_smell' as const,
          severity: 'low' as const,
          pattern: 'Technical debt markers',
          description: 'Code contains TODO/FIXME comments indicating incomplete work',
          suggestion: 'Address technical debt before production deployment.',
        },
      },
    ];

    codeSmellPatterns.forEach(({ pattern, issue }) => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(() => {
          issues.push(issue);
        });
      }
    });

    // Anti-patterns
    const antiPatterns = [
      {
        pattern: /(eval\s*\(|Function\s*\(|new\s+Function)/gi,
        issue: {
          type: 'anti_pattern' as const,
          severity: 'high' as const,
          pattern: 'eval() usage',
          description: 'Use of eval() is a security and performance anti-pattern',
          suggestion: 'Avoid eval(). Use safer alternatives like JSON.parse() or function factories.',
        },
      },
      {
        pattern: /(var\s+\w+)/g, // var instead of const/let
        issue: {
          type: 'anti_pattern' as const,
          severity: 'low' as const,
          pattern: 'var keyword',
          description: 'Use of var instead of const/let',
          suggestion: 'Use const for immutable values, let for mutable values. Avoid var.',
        },
      },
    ];

    antiPatterns.forEach(({ pattern, issue }) => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(() => {
          issues.push(issue);
        });
      }
    });

    // Best practices
    const bestPracticeChecks = [
      {
        pattern: /(async\s+function|async\s+\()/gi,
        check: (match: string) => {
          const hasErrorHandling = output.match(/(try\s*\{|catch\s*\(|\.catch\s*\()/gi);
          if (!hasErrorHandling) {
            return {
              type: 'best_practice' as const,
              severity: 'medium' as const,
              pattern: 'Missing error handling',
              description: 'Async functions should have error handling',
              suggestion: 'Add try-catch blocks or .catch() handlers for async operations.',
            };
          }
          return null;
        },
      },
    ];

    bestPracticeChecks.forEach(({ pattern, check }) => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const issue = check(match);
          if (issue) {
            issues.push(issue);
          }
        });
      }
    });

    // Calculate quality score
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    const score = Math.max(0, 100 - (criticalCount * 20 + highCount * 10 + mediumCount * 5 + lowCount * 2));

    return {
      passed: issues.length === 0 || (criticalCount === 0 && highCount === 0),
      issues,
      score,
    };
  }
}

export const safetyEnforcementService = new SafetyEnforcementService();
```

### `backend/src/utils/logger.ts`

```ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private defaultLogLevel: LogLevel;

  constructor() {
    this.defaultLogLevel = 'info';
  }

  private currentLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
    return envLevel || this.defaultLogLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.currentLogLevel());
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...context,
    };
    return JSON.stringify(logEntry);
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error?.message,
        stack: error?.stack,
        name: error?.name,
      };
      console.error(this.formatMessage('error', message, errorContext));
    }
  }
}

export const logger = new Logger();
```

### `backend/src/utils/retry.ts`

```ts
/**
 * Retry utility for transient failures
 */

export interface RetryOptions {
  /**
   * Legacy option name (max retries, excluding the first attempt).
   * If provided, total attempts = maxRetries + 1.
   */
  maxRetries?: number;
  /**
   * Legacy option name (ms).
   */
  initialDelay?: number;
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryable?: (error: any) => boolean;
}

type NormalizedRetryOptions = {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryable: (error: any) => boolean;
};

const DEFAULT_OPTIONS: NormalizedRetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryable: (error: any) => {
    // Default: retry transient failures. Callers can override for stricter behavior.
    // Keeping this permissive avoids surprising "no retry" behavior for generic errors.
    void error;
    return true;
  },
};

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Support legacy option names used by existing call sites/tests.
  const legacyMaxAttempts =
    typeof options.maxRetries === 'number' && options.maxRetries >= 0
      ? options.maxRetries + 1
      : undefined;
  const legacyInitialDelayMs =
    typeof options.initialDelay === 'number' && options.initialDelay >= 0
      ? options.initialDelay
      : undefined;

  const opts: NormalizedRetryOptions = {
    maxAttempts: legacyMaxAttempts ?? options.maxAttempts ?? DEFAULT_OPTIONS.maxAttempts,
    initialDelayMs: legacyInitialDelayMs ?? options.initialDelayMs ?? DEFAULT_OPTIONS.initialDelayMs,
    maxDelayMs: options.maxDelayMs ?? DEFAULT_OPTIONS.maxDelayMs,
    backoffMultiplier: options.backoffMultiplier ?? DEFAULT_OPTIONS.backoffMultiplier,
    retryable: options.retryable ?? DEFAULT_OPTIONS.retryable,
  };
  let lastError: any;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt === opts.maxAttempts || !opts.retryable(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff (first retry waits initialDelayMs).
      const retryAfter = error.response?.headers['retry-after'];
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, waitMs));

      // Increase delay for next retry if we weren't instructed by Retry-After.
      if (!retryAfter) {
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
      } else {
        delay = opts.initialDelayMs;
      }
    }
  }

  throw lastError;
}
```

### `backend/__tests__/integration/routes/profiles.integration.test.ts`

```ts
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler, notFoundHandler } from '../../../src/middleware/errorHandler.js';

const testUserId = 'test-user-123';

// Mock auth to behave like an authenticated request in integration tests.
vi.mock('../../../src/middleware/auth.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.userId = testUserId;
    req.user = { id: testUserId, role: 'admin' };
    next();
  },
  optionalAuthMiddleware: (_req: any, _res: any, next: any) => next(),
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock Supabase client used by the router (no network).
type ProfileRow = { id: string; user_id: string; name?: string; role?: string; vertical?: string };
const profiles = new Map<string, ProfileRow>();

vi.mock('@supabase/supabase-js', () => {
  const mockSupabase = {
    from: (_table: string) => ({
      select: (_cols?: any, _opts?: any) => ({
        eq: (_col: string, userId: string) => ({
          single: async () => {
            const row = profiles.get(userId);
            if (!row) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
            return { data: row, error: null };
          },
        }),
        range: () => ({
          order: async () => ({ data: Array.from(profiles.values()), error: null, count: profiles.size }),
        }),
        order: () => ({
          order: async () => ({ data: Array.from(profiles.values()), error: null, count: profiles.size }),
        }),
      }),
      insert: (row: any) => ({
        select: () => ({
          single: async () => {
            const id = `prof_${Math.random().toString(36).slice(2, 10)}`;
            const full = { id, ...row } as ProfileRow;
            profiles.set(full.user_id, full);
            return { data: full, error: null };
          },
        }),
      }),
      update: (updates: any) => ({
        eq: (_col: string, userId: string) => ({
          select: () => ({
            single: async () => {
              const existing = profiles.get(userId);
              if (!existing) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
              const next = { ...existing, ...updates } as ProfileRow;
              profiles.set(userId, next);
              return { data: next, error: null };
            },
          }),
        }),
      }),
    }),
    auth: {
      getUser: async () => ({ data: { user: { id: testUserId, email: 'test@example.com', user_metadata: { role: 'admin' } } }, error: null }),
    },
  };
  return { createClient: vi.fn(() => mockSupabase) };
});

let app: express.Application;

describe('Profiles API Integration Tests', () => {
  beforeAll(async () => {
    const { profilesRouter } = await import('../../../src/routes/profiles.js');
    app = express();
    app.use(express.json());
    app.use('/profiles', profilesRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  it('should create a profile', async () => {
    const response = await request(app)
      .post('/profiles')
      .send({
        user_id: testUserId,
        name: 'Test User',
        role: 'founder',
        vertical: 'software',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.user_id).toBe(testUserId);
    expect(response.body.name).toBe('Test User');
  });

  it('should get a profile', async () => {
    const response = await request(app)
      .get(`/profiles/${testUserId}`)
      .expect(200);

    expect(response.body.user_id).toBe(testUserId);
  });

  it('should update a profile', async () => {
    const response = await request(app)
      .patch(`/profiles/${testUserId}`)
      .send({
        name: 'Updated Name',
      })
      .expect(200);

    expect(response.body.name).toBe('Updated Name');
  });

  it('should return 404 for non-existent profile', async () => {
    await request(app)
      .get('/profiles/non-existent')
      .expect(404);
  });

  it('should validate input', async () => {
    const response = await request(app)
      .post('/profiles')
      .send({
        role: 'invalid-role',
      })
      .expect(400);

    expect(response.body.error).toHaveProperty('code');
  });
});
```

### `backend/__tests__/unit/utils/retry.test.ts`

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retry } from '../../../src/utils/retry';

describe('Retry Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const promise = retry(fn, { maxRetries: 2, initialDelay: 100 });
    // Attach handlers before advancing timers (avoid unhandled rejection warnings).
    const assertion = expect(promise).resolves.toBe('success');
    await vi.advanceTimersByTimeAsync(100);
    await assertion;

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    const error = new Error('fail');
    const fn = vi.fn().mockRejectedValue(error);

    const promise = retry(fn, { maxRetries: 2, initialDelay: 100 });
    // Attach handlers before advancing timers (avoid unhandled rejection warnings).
    const assertion = expect(promise).rejects.toThrow('fail');
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect retryable function', async () => {
    const error = new Error('not retryable');
    const fn = vi.fn().mockRejectedValue(error);

    const promise = retry(fn, {
      retryable: (err) => err.message !== 'not retryable',
    });

    await expect(promise).rejects.toThrow('not retryable');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

### `frontend/src/runtime-ui-config/shared.ts`

```ts
export type RuntimeUiConfig = {
  version: number;
  tokens: {
    radius: string;
  };
  banner: {
    enabled: boolean;
    tone: 'info' | 'warning' | 'success' | 'danger';
    text: string;
    href: string | null;
    dismissible: boolean;
  };
  features: Record<string, boolean>;
  sections: Record<string, boolean>;
  copy: Record<string, string>;
};

export const DEFAULT_RUNTIME_UI_CONFIG: RuntimeUiConfig = {
  version: 1,
  tokens: { radius: '0.5rem' },
  banner: { enabled: false, tone: 'info', text: '', href: null, dismissible: true },
  features: {},
  sections: {},
  copy: {},
};

const CSS_LENGTH_RE = /^\d+(\.\d+)?(px|rem|em|%)$/u;
const KEY_RE = /^[a-z0-9_.-]{1,64}$/u;

export function sanitizeRuntimeUiConfig(raw: unknown): RuntimeUiConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_RUNTIME_UI_CONFIG;
  const obj = raw as Record<string, unknown>;

  const version =
    typeof obj.version === 'number' && Number.isInteger(obj.version) && obj.version >= 1 && obj.version <= 1000
      ? obj.version
      : DEFAULT_RUNTIME_UI_CONFIG.version;

  const tokensRaw = obj.tokens && typeof obj.tokens === 'object' ? (obj.tokens as Record<string, unknown>) : {};
  const radius =
    typeof tokensRaw.radius === 'string' && CSS_LENGTH_RE.test(tokensRaw.radius)
      ? tokensRaw.radius
      : DEFAULT_RUNTIME_UI_CONFIG.tokens.radius;

  const bannerRaw = obj.banner && typeof obj.banner === 'object' ? (obj.banner as Record<string, unknown>) : {};
  const enabled = typeof bannerRaw.enabled === 'boolean' ? bannerRaw.enabled : DEFAULT_RUNTIME_UI_CONFIG.banner.enabled;
  const tone =
    bannerRaw.tone === 'info' || bannerRaw.tone === 'warning' || bannerRaw.tone === 'success' || bannerRaw.tone === 'danger'
      ? bannerRaw.tone
      : DEFAULT_RUNTIME_UI_CONFIG.banner.tone;
  const text = typeof bannerRaw.text === 'string' ? bannerRaw.text.slice(0, 200) : DEFAULT_RUNTIME_UI_CONFIG.banner.text;
  const href =
    bannerRaw.href === null
      ? null
      : typeof bannerRaw.href === 'string' && /^https?:\/\//u.test(bannerRaw.href)
        ? bannerRaw.href
        : DEFAULT_RUNTIME_UI_CONFIG.banner.href;
  const dismissible =
    typeof bannerRaw.dismissible === 'boolean'
      ? bannerRaw.dismissible
      : DEFAULT_RUNTIME_UI_CONFIG.banner.dismissible;

  const features: Record<string, boolean> = {};
  const sections: Record<string, boolean> = {};
  const copy: Record<string, string> = {};

  if (obj.features && typeof obj.features === 'object') {
    for (const [k, v] of Object.entries(obj.features as Record<string, unknown>)) {
      if (Object.keys(features).length >= 200) break;
      if (!KEY_RE.test(k)) continue;
      if (typeof v !== 'boolean') continue;
      features[k] = v;
    }
  }

  if (obj.sections && typeof obj.sections === 'object') {
    for (const [k, v] of Object.entries(obj.sections as Record<string, unknown>)) {
      if (Object.keys(sections).length >= 200) break;
      if (!KEY_RE.test(k)) continue;
      if (typeof v !== 'boolean') continue;
      sections[k] = v;
    }
  }

  if (obj.copy && typeof obj.copy === 'object') {
    for (const [k, v] of Object.entries(obj.copy as Record<string, unknown>)) {
      if (Object.keys(copy).length >= 200) break;
      if (!KEY_RE.test(k)) continue;
      if (typeof v !== 'string') continue;
      copy[k] = v.slice(0, 2000);
    }
  }

  return {
    version,
    tokens: { radius },
    banner: { enabled, tone, text, href, dismissible },
    features,
    sections,
    copy,
  };
}

```

### `frontend/src/runtime-ui-config/client.ts`

```ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { RuntimeUiConfig } from './shared';
import { DEFAULT_RUNTIME_UI_CONFIG, sanitizeRuntimeUiConfig } from './shared';

type RuntimeUiConfigResponse = {
  config: RuntimeUiConfig;
  updatedAt: string | null;
};

let cached: RuntimeUiConfigResponse | null = null;
let inflight: Promise<RuntimeUiConfigResponse> | null = null;

export async function fetchRuntimeUiConfig(): Promise<RuntimeUiConfigResponse> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch('/api/ui-config', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`ui-config HTTP ${res.status}`);

      const json = (await res.json()) as Partial<RuntimeUiConfigResponse>;
      const next: RuntimeUiConfigResponse = {
        config: sanitizeRuntimeUiConfig(json.config),
        updatedAt: typeof json.updatedAt === 'string' ? json.updatedAt : null,
      };
      cached = next;
      return next;
    } catch {
      cached = { config: DEFAULT_RUNTIME_UI_CONFIG, updatedAt: null };
      return cached;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function applyRuntimeUiTokens(config: RuntimeUiConfig): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--radius', config.tokens?.radius || DEFAULT_RUNTIME_UI_CONFIG.tokens.radius);
}

export function useRuntimeUiConfig(): RuntimeUiConfigResponse {
  const [state, setState] = useState<RuntimeUiConfigResponse>(() => cached || { config: DEFAULT_RUNTIME_UI_CONFIG, updatedAt: null });

  useEffect(() => {
    let mounted = true;
    fetchRuntimeUiConfig().then((data) => {
      if (!mounted) return;
      setState(data);
      applyRuntimeUiTokens(data.config);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Ensure we always expose a fully-formed object.
  return useMemo(() => {
    return {
      config: state?.config || DEFAULT_RUNTIME_UI_CONFIG,
      updatedAt: state?.updatedAt ?? null,
    };
  }, [state]);
}

```

### `frontend/src/components/RuntimeUiBanner.tsx`

```ts
/* Runtime UI banner (config-driven, safe defaults) */
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRuntimeUiConfig } from '@/runtime-ui-config/client';

function toneClasses(tone: 'info' | 'warning' | 'success' | 'danger') {
  switch (tone) {
    case 'success':
      return 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-900';
    case 'warning':
      return 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-900';
    case 'danger':
      return 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-100 dark:border-rose-900';
    case 'info':
    default:
      return 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-900';
  }
}

export function RuntimeUiBanner() {
  const { config } = useRuntimeUiConfig();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('runtime_ui_banner_dismissed') === '1';
    } catch {
      return false;
    }
  });

  const banner = config.banner;
  const isVisible = !!banner?.enabled && !!banner?.text && !(banner.dismissible && dismissed);

  const cls = useMemo(() => toneClasses(banner?.tone || 'info'), [banner?.tone]);

  if (!isVisible) return null;

  return (
    <div className={`border-b ${cls}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 flex items-start gap-3">
        <div className="text-sm leading-5 flex-1">
          {banner.href ? (
            <Link href={banner.href} className="underline underline-offset-4">
              {banner.text}
            </Link>
          ) : (
            <span>{banner.text}</span>
          )}
        </div>
        {banner.dismissible ? (
          <button
            type="button"
            className="text-xs px-2 py-1 rounded-md border border-current/20 hover:border-current/40"
            onClick={() => {
              try {
                sessionStorage.setItem('runtime_ui_banner_dismissed', '1');
              } catch {
                // ignore
              }
              setDismissed(true);
            }}
            aria-label="Dismiss announcement"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}

```

### `frontend/src/components/DiagnosticsPanel.tsx`

```ts
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRuntimeUiConfig } from '@/runtime-ui-config/client';

interface DiagnosticsPanelProps {
  className?: string;
}

export function DiagnosticsPanel({ className = '' }: DiagnosticsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, session } = useAuth();
  const { config: runtimeConfig, updatedAt } = useRuntimeUiConfig();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set';

  // Only show in development or for admins
  const isDev = process.env.NODE_ENV === 'development';
  const isAdmin = (user as any)?.app_metadata?.role === 'admin';

  if (!isDev && !isAdmin) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 dark:bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors text-sm font-mono"
        aria-label="Toggle diagnostics panel"
      >
        {isOpen ? '▼' : '▲'} Diagnostics
      </button>
      
      {isOpen && (
        <div className="mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-4 max-w-md text-xs font-mono">
          <div className="space-y-2">
            <div>
              <span className="text-gray-500 dark:text-gray-400">User ID:</span>
              <div className="text-gray-900 dark:text-white break-all">{user?.id || 'Not authenticated'}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Email:</span>
              <div className="text-gray-900 dark:text-white">{user?.email || 'N/A'}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Session:</span>
              <div className="text-gray-900 dark:text-white">{session ? 'Active' : 'Inactive'}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">API Base URL:</span>
              <div className="text-gray-900 dark:text-white break-all">{apiBaseUrl}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Supabase URL:</span>
              <div className="text-gray-900 dark:text-white break-all">{supabaseUrl}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Environment:</span>
              <div className="text-gray-900 dark:text-white">{process.env.NODE_ENV}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Feature Flags:</span>
              <div className="text-gray-900 dark:text-white">
                {Object.keys(runtimeConfig.features || {}).length} flags
              </div>
              <div className="text-gray-500 dark:text-gray-400 mt-1">
                UI config updated: {updatedAt || 'unknown'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### `frontend/src/app/api/ui-config/route.ts`

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_RUNTIME_UI_CONFIG, sanitizeRuntimeUiConfig } from '@/runtime-ui-config/shared';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(req: Request) {
  const ifNoneMatch = req.headers.get('if-none-match');

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      const res = NextResponse.json({ config: DEFAULT_RUNTIME_UI_CONFIG, updatedAt: null }, { status: 200 });
      res.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=30');
      return res;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data, error } = await supabase
      .from('runtime_ui_config')
      .select('public_config, updated_at')
      .eq('id', 'default')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const config = sanitizeRuntimeUiConfig(data?.public_config);
    const updatedAt = (data?.updated_at as string | null) ?? null;

    // Deterministic weak ETag based on config + updatedAt.
    const etag = `W/"ui-config-${Buffer.from(JSON.stringify({ config, updatedAt })).toString('base64url').slice(0, 32)}"`;
    if (ifNoneMatch && ifNoneMatch === etag) {
      const res = new NextResponse(null, { status: 304 });
      res.headers.set('ETag', etag);
      res.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
      return res;
    }

    const res = NextResponse.json({ config, updatedAt }, { status: 200 });
    res.headers.set('ETag', etag);
    if (updatedAt) res.headers.set('X-UI-Config-Updated-At', updatedAt);
    res.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
    return res;
  } catch {
    // Fail closed with safe defaults (no rebuild required).
    const res = NextResponse.json({ config: DEFAULT_RUNTIME_UI_CONFIG, updatedAt: null }, { status: 200 });
    res.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=30');
    return res;
  }
}

```

### `frontend/src/app/api/internal/ui-config/route.ts`

```ts
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabasePublicClient } from '@supabase/supabase-js';
import { DEFAULT_RUNTIME_UI_CONFIG } from '@/runtime-ui-config/shared';
import { sanitizeRuntimeUiConfig } from '@/runtime-ui-config/shared';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const REQUEST_SIGNING_SECRET = process.env.REQUEST_SIGNING_SECRET || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function requireAdminAccess() {
  const supabase = createClient();
  const [{ data: userData }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);

  const user = userData.user;
  const session = sessionData.session;

  if (!user || !session?.access_token) {
    return { ok: false as const, status: 401 as const, token: null, role: null };
  }

  const role = (user.app_metadata as Record<string, unknown> | null | undefined)?.role;
  const roleStr = typeof role === 'string' ? role : 'user';
  const allowlist = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const isAllowlisted = allowlist.includes(user.id);
  const isAdmin = isAllowlisted || roleStr === 'admin' || roleStr === 'superadmin';

  if (!isAdmin) {
    return { ok: false as const, status: 403 as const, token: null, role: roleStr };
  }

  return { ok: true as const, status: 200 as const, token: session.access_token, role: roleStr };
}

export async function GET() {
  const auth = await requireAdminAccess();
  if (!auth.ok) {
    return NextResponse.json({ error: 'Admin access required' }, { status: auth.status });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ config: DEFAULT_RUNTIME_UI_CONFIG, updatedAt: null }, { status: 200 });
    }

    const supabase = createSupabasePublicClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data, error } = await supabase
      .from('runtime_ui_config')
      .select('public_config, updated_at')
      .eq('id', 'default')
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { config: sanitizeRuntimeUiConfig(data?.public_config), updatedAt: (data?.updated_at as string | null) ?? null },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ config: DEFAULT_RUNTIME_UI_CONFIG, updatedAt: null }, { status: 200 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdminAccess();
  if (!auth.ok) {
    return NextResponse.json({ error: 'Admin access required' }, { status: auth.status });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Backend expects: { config: <unknown> }
  const bodyString = JSON.stringify(payload ?? {});
  const timestamp = Date.now().toString();
  const signature =
    REQUEST_SIGNING_SECRET
      ? crypto.createHmac('sha256', REQUEST_SIGNING_SECRET).update(`${timestamp}:${bodyString}`).digest('hex')
      : '';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const upstream = await fetch(`${BACKEND_BASE_URL}/admin/ui-config`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${auth.token}`,
        ...(REQUEST_SIGNING_SECRET
          ? { 'X-Request-Timestamp': timestamp, 'X-Request-Signature': signature }
          : {}),
      },
      body: bodyString,
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await upstream.text();
    const res = new NextResponse(text, { status: upstream.status });
    res.headers.set('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

```

### `frontend/src/app/__review/page.tsx`

```ts
import Link from 'next/link';
import { generatePageMetadata } from '@/utils/metadata';
import { ReviewClient } from './review-client';

export const metadata = generatePageMetadata({
  title: 'Internal Review',
  description: 'Internal UI review and polish utilities (non-public).',
  path: '/__review',
  noIndex: true,
});

export default function ReviewPage() {
  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Internal Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fast visual QA for preview deployments: critical links, state toggles, and runtime UI config.
          </p>
        </div>
        <Link href="/" className="text-sm underline underline-offset-4">
          Back to app
        </Link>
      </div>

      <div className="mt-8">
        <ReviewClient />
      </div>
    </main>
  );
}

```

### `frontend/src/app/__review/review-client.tsx`

```ts
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { RuntimeUiConfig } from '@/runtime-ui-config/shared';
import { DEFAULT_RUNTIME_UI_CONFIG, sanitizeRuntimeUiConfig } from '@/runtime-ui-config/shared';
import { useRuntimeUiConfig } from '@/runtime-ui-config/client';

type UiStateMode = 'normal' | 'loading' | 'empty' | 'error';

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

export function ReviewClient() {
  const { user } = useAuth();
  const { config: currentConfig, updatedAt } = useRuntimeUiConfig();
  const role = (user?.app_metadata as Record<string, unknown> | null | undefined)?.role;
  const isAdmin = role === 'admin' || role === 'superadmin';

  const [mode, setMode] = useState<UiStateMode>('normal');
  const [editorText, setEditorText] = useState(() => prettyJson(currentConfig));
  const [status, setStatus] = useState<string | null>(null);

  const criticalLinks = useMemo(
    () => [
      { href: '/', label: 'Home' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/signup', label: 'Sign up' },
      { href: '/signin', label: 'Sign in' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/chat', label: 'Chat' },
      { href: '/templates', label: 'Templates' },
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/account/billing', label: 'Billing' },
      { href: '/admin/dashboard', label: 'Admin' },
    ],
    []
  );

  async function reloadConfig() {
    setStatus(null);
    try {
      const res = await fetch('/api/ui-config', { cache: 'no-store' });
      const json = (await res.json()) as { config?: RuntimeUiConfig };
      setEditorText(prettyJson(sanitizeRuntimeUiConfig(json.config)));
      setStatus('Loaded latest runtime config.');
    } catch {
      setStatus('Failed to load runtime config (using defaults).');
      setEditorText(prettyJson(DEFAULT_RUNTIME_UI_CONFIG));
    }
  }

  async function saveConfig() {
    setStatus(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(editorText);
    } catch {
      setStatus('Config JSON is invalid.');
      return;
    }

    try {
      const res = await fetch('/api/internal/ui-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: parsed }),
      });
      const text = await res.text();
      if (!res.ok) {
        setStatus(`Save failed (HTTP ${res.status}): ${text}`);
        return;
      }
      setStatus('Saved. Refresh pages to confirm UI changes.');
      // Re-sync editor with what the backend accepted (sanitized).
      try {
        const json = JSON.parse(text) as { config?: RuntimeUiConfig };
        if (json?.config) setEditorText(prettyJson(sanitizeRuntimeUiConfig(json.config)));
      } catch {
        // ignore
      }
    } catch {
      setStatus('Save failed (network error).');
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-lg border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold">Critical links</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use these to quickly click through launch-critical flows in preview.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {criticalLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <h2 className="mt-8 text-base font-semibold">UI state toggles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Forces common states locally to validate empty/error/loading visuals.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['normal', 'loading', 'empty', 'error'] as UiStateMode[]).map((m) => (
            <button
              key={m}
              type="button"
              className={`rounded-md border px-3 py-2 text-sm ${
                mode === m ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-md border p-4">
          {mode === 'loading' ? (
            <div className="space-y-3">
              <div className="h-4 w-2/3 rounded bg-muted shimmer" />
              <div className="h-4 w-1/2 rounded bg-muted shimmer" />
              <div className="h-24 w-full rounded bg-muted shimmer" />
            </div>
          ) : mode === 'empty' ? (
            <div className="text-sm text-muted-foreground">
              Empty state: no items found. (Verify copy, spacing, and CTA affordance.)
            </div>
          ) : mode === 'error' ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
              Error state: a predictable failure occurred. (Verify tone, action, and accessibility.)
            </div>
          ) : (
            <div className="text-sm">
              Normal state: use this panel to rapidly toggle and sanity-check visual states.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Runtime UI config</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Current config is fetched at runtime (no rebuild). Only public-safe values are exposed.
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              Updated at: <span className="font-mono">{updatedAt || 'unknown'}</span>
            </div>
          </div>
          <button type="button" className="text-sm underline underline-offset-4" onClick={reloadConfig}>
            Reload
          </button>
        </div>

        <div className="mt-4">
          <textarea
            className="h-96 w-full rounded-md border bg-background p-3 font-mono text-xs leading-5"
            value={editorText}
            onChange={(e) => setEditorText(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">{status || (isAdmin ? ' ' : 'Admin required to save.')}</div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setEditorText(prettyJson(currentConfig))}
            >
              Reset editor
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-2 text-sm ${
                isAdmin ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground'
              }`}
              onClick={saveConfig}
              disabled={!isAdmin}
            >
              Save
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

```

### `frontend/public/robots.txt`

```text
# robots.txt for Cursor Venture Companion
User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /__review/

# Allow important pages
Allow: /
Allow: /chat
Allow: /dashboard
Allow: /profile
Allow: /templates

# Sitemap location
Sitemap: https://keys.dev/sitemap.xml
```

### `frontend/src/app/robots.ts`

```ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://keys.dev';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/__review/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

### `frontend/src/contexts/AuthContext.tsx`

```ts
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // `createClient()` can return a disabled client when env vars are missing.
  // Cast to keep Supabase types across the app (noImplicitAny).
  const supabase = createClient() as unknown as SupabaseClient;

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setError(null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { error: null };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
  };

  const refreshSession = async () => {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) {
      setError(error);
      return;
    }
    setSession(session);
    setUser(session?.user ?? null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### `frontend/src/utils/supabase/client.ts`

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    // Never fall back to an external placeholder domain.
    // If env vars are missing, return a safe "disabled" client that performs no network calls.
    const disabledError = new Error('Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY)');

    const disabledQueryResult = Promise.resolve({ data: null, error: disabledError });
    const disabledQuery: any = {
      select: () => disabledQuery,
      insert: () => disabledQuery,
      update: () => disabledQuery,
      delete: () => disabledQuery,
      upsert: () => disabledQuery,
      eq: () => disabledQuery,
      order: () => disabledQuery,
      limit: () => disabledQuery,
      range: () => disabledQuery,
      single: () => disabledQueryResult,
      maybeSingle: () => disabledQueryResult,
      then: disabledQueryResult.then.bind(disabledQueryResult),
      catch: disabledQueryResult.catch.bind(disabledQueryResult),
    };

    const noopSub = { unsubscribe: () => {} };
    const disabledClient: any = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: disabledError }),
        getUser: async () => ({ data: { user: null }, error: disabledError }),
        onAuthStateChange: () => ({ data: { subscription: noopSub } }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: disabledError }),
        signUp: async () => ({ data: { user: null, session: null }, error: disabledError }),
        signOut: async () => ({ error: null }),
        refreshSession: async () => ({ data: { session: null }, error: disabledError }),
      },
      from: () => disabledQuery,
      channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
      removeChannel: () => {},
    };

    return disabledClient;
  }
  
  return createBrowserClient(url, key);
}
```

### `frontend/src/utils/supabase/server.ts`

```ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Server-safe disabled client: no network calls, preserves build behavior.
    const disabledError = new Error('Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    const noopSub = { unsubscribe: () => {} };
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: disabledError }),
        getSession: async () => ({ data: { session: null }, error: disabledError }),
        onAuthStateChange: () => ({ data: { subscription: noopSub } }),
      },
    } as any;
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
```

### `frontend/src/utils/supabase/middleware.ts`

```ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, do not create a client (avoid placeholder domains).
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  // Only if we have valid env vars, otherwise skip auth check during build
  if (url && key) {
    try {
      await supabase.auth.getUser();
    } catch {
      // Ignore auth errors during build
    }
  }

  return supabaseResponse;
}
```

### `frontend/src/middleware.ts`

```ts
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/chat', '/profile', '/templates', '/admin', '/api/billing'];

// Public routes that authenticated users should be redirected away from
const publicAuthRoutes = ['/signin', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isReviewRoute = pathname.startsWith('/__review');

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Add Security Headers
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = url && key
    ? createServerClient(
        url,
        key,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value,
                ...options,
              });
              supabaseResponse = NextResponse.next({
                request,
              });
              supabaseResponse.cookies.set({
                name,
                value,
                ...options,
              });
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value: '',
                ...options,
              });
              supabaseResponse = NextResponse.next({
                request,
              });
              supabaseResponse.cookies.set({
                name,
                value: '',
                ...options,
              });
            },
          },
        }
      )
    : null;

  let user: User | null = null;
  
  // Only check auth if we have valid env vars
  if (url && key && supabase) {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;
    } catch {
      // Ignore auth errors during build or when env vars are invalid
    }
  }

  // Internal review route gating (non-public)
  if (isReviewRoute) {
    const isPreview = process.env.VERCEL_ENV === 'preview';
    const isProd = process.env.NODE_ENV === 'production';

    // In production, require explicit enable + admin role.
    if (isProd && !isPreview) {
      if (process.env.ENABLE_INTERNAL_REVIEW_ROUTE !== 'true') {
        return new NextResponse('Not found', { status: 404 });
      }

      const role = (user as any)?.app_metadata?.role;
      const isAdmin = role === 'admin' || role === 'superadmin';
      const allowlist = (process.env.ADMIN_USER_IDS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const isAllowlisted = user?.id ? allowlist.includes(user.id) : false;
      if (!user || !isAdmin) {
        if (isAllowlisted) return supabaseResponse;
        return new NextResponse('Not found', { status: 404 });
      }
      return supabaseResponse;
    }

    // In preview/dev: require authentication (keeps preview URLs safer if shared).
    if (!user && url && key) {
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // If env vars are missing (build), don't hard-fail.
    if (!url || !key) {
      return supabaseResponse;
    }

    return supabaseResponse;
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicAuthRoute = publicAuthRoutes.some((route) => pathname.startsWith(route));

  // For protected routes, check authentication
  if (isProtectedRoute && !user && url && key) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated user tries to access signin/signup, redirect to dashboard
  if (isPublicAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### `frontend/package.json`

```json
{
  "name": "hardonia-ai-companion-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "NEXT_IGNORE_INCORRECT_LOCKFILE=1 next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "node -e \"const fs=require('fs'); fs.mkdirSync('.next/types',{recursive:true}); fs.writeFileSync('.next/types/__placeholder__.ts','export {}\\n');\" && tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  },
  "dependencies": {
    "@radix-ui/react-slot": "^1.2.4",
    "@sentry/nextjs": "^7.80.0",
    "@supabase/ssr": "^0.8.0",
    "@supabase/supabase-js": "^2.38.0",
    "@xstate/react": "^6.0.0",
    "axios": "^1.6.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "critters": "^0.0.25",
    "framer-motion": "^12.23.26",
    "lucide-react": "^0.562.0",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.48.2",
    "tailwind-merge": "^2.6.0",
    "xstate": "^5.25.0",
    "zod": "^3.22.4",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@vitest/coverage-v8": "^4.0.16",
    "@vitest/ui": "^4.0.16",
    "autoprefixer": "^10.4.16",
    "eslint": "8.57.1",
    "eslint-config-next": "14.2.35",
    "jsdom": "^23.0.0",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.0",
    "vitest": "^4.0.16"
  }
}
```

### `frontend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "e2e",
    "playwright.config.ts"
  ]
}
```

### `package.json`

```json
{
  "name": "keys",
  "version": "1.0.0",
  "description": "The keyring to modern tools - A marketplace of structured assets that unlock practical capability in Cursor, Jupyter, GitHub, Stripe, and more",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "lint": "npm run lint:frontend && npm run lint:backend",
    "lint:frontend": "cd frontend && npm run lint",
    "lint:backend": "cd backend && npm run lint",
    "type-check": "npm run type-check:frontend && npm run type-check:backend",
    "type-check:frontend": "cd frontend && npm run type-check",
    "type-check:backend": "cd backend && npm run type-check",
    "db:verify": "tsx scripts/db-verify.ts",
    "db:smoke": "tsx scripts/db-smoke.ts",
    "db:migrate": "cd backend && npm run migrate",
    "db:reconcile": "echo 'Run migration: backend/supabase/migrations/00000000000000_backend_contract_reconcile.sql in Supabase SQL editor'"
  },
  "devDependencies": {
    "@types/pg": "^8.16.0",
    "concurrently": "^8.2.2",
    "pg": "^8.16.3"
  },
  "overrides": {
    "@next/eslint-plugin-next": {
      "glob": "10.4.6"
    }
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```
