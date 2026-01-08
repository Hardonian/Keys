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

