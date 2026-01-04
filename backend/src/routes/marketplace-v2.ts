import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import {
  hasEntitlement,
  resolveTenantContext,
  grantEntitlement,
} from '../lib/marketplace/entitlements.js';
import {
  getSignedUrl,
  hashIP,
  truncateUserAgent,
} from '../lib/marketplace/storage.js';
import {
  discoverKeys,
  getRelatedKeys,
  recordDiscoverySignal,
  type DiscoverySignal,
} from '../lib/marketplace/discovery.js';
import {
  createKeyCheckoutSession,
  createBundleCheckoutSession,
  calculateBundleDiscount,
} from '../lib/marketplace/stripe.js';
import { ingestAllKeys, ingestFromAssetsIndex } from '../lib/marketplace/ingestion.js';
import { logger } from '../utils/logger.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get all marketplace keys (public listing)
 * GET /marketplace/keys
 */
router.get(
  '/keys',
  asyncHandler(async (req, res) => {
    const { key_type, tool, category, difficulty, search, outcome, maturity } = req.query;

    let query = supabase
      .from('marketplace_keys')
      .select('id, slug, title, description, tool, key_type, category, difficulty, tags, version, license_spdx, outcome, maturity, created_at')
      .order('created_at', { ascending: false });

    if (tool) {
      query = query.eq('tool', tool as string);
    }

    if (key_type) {
      query = query.eq('key_type', key_type as string);
    }

    if (category) {
      query = query.eq('category', category as string);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty as string);
    }

    if (outcome) {
      query = query.eq('outcome', outcome as string);
    }

    if (maturity) {
      query = query.eq('maturity', maturity as string);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch keys',
        message: error.message,
      });
    }

    res.json({ keys: data || [] });
  })
);

/**
 * Get discovery recommendations
 * GET /marketplace/discover
 */
router.get(
  '/discover',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { key_type, limit } = req.query;

    try {
      const recommendations = await discoverKeys(userId, {
        limit: limit ? parseInt(limit as string) : 10,
        keyType: key_type as any,
        excludeOwned: true,
      });

      // Get full key details
      const keyIds = recommendations.map(r => r.keyId);
      const { data: keys } = await supabase
        .from('marketplace_keys')
        .select('id, slug, title, description, key_type, version')
        .in('id', keyIds);

      // Map recommendations to keys
      const results = recommendations.map(rec => {
        const key = keys?.find(k => k.id === rec.keyId);
        return {
          ...key,
          reason: rec.reason,
          confidence: rec.confidence,
        };
      }).filter(Boolean);

      res.json({ recommendations: results });
    } catch (error: any) {
      logger.error('Failed to discover keys:', error);
      res.status(500).json({
        error: 'Failed to discover keys',
        message: error.message,
      });
    }
  })
);

/**
 * Record discovery signal
 * POST /marketplace/discover/signal
 */
router.post(
  '/discover/signal',
  authMiddleware,
  validateBody(
    z.object({
      signal_type: z.enum(['role', 'tool_intent', 'problem_category', 'view', 'purchase']),
      signal_value: z.string(),
      metadata: z.record(z.any()).optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const signal: DiscoverySignal = req.body;

    try {
      await recordDiscoverySignal(userId, signal);
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Failed to record discovery signal:', error);
      res.status(500).json({
        error: 'Failed to record signal',
        message: error.message,
      });
    }
  })
);

/**
 * Get a single key by slug
 * GET /marketplace/keys/:slug
 */
router.get(
  '/keys/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const { data: key, error } = await supabase
      .from('marketplace_keys')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !key) {
      return res.status(404).json({
        error: 'Key not found',
      });
    }

    // Check if user has entitlement (if authenticated)
    let hasAccess = false;
    if (req.headers.authorization) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser(
          req.headers.authorization.replace('Bearer ', '')
        );

        if (user) {
          const tenant = await resolveTenantContext(user.id);
          const check = await hasEntitlement(tenant.tenantId, tenant.tenantType, key.id);
          hasAccess = check.hasAccess;
        }
      } catch {
        // Ignore auth errors, user is not authenticated
      }
    }

    // Get related keys
    const related = await getRelatedKeys(slug, 5);

    // Get versions
    const { data: versions } = await supabase
      .from('marketplace_key_versions')
      .select('version, created_at, changelog_md_path')
      .eq('key_id', key.id)
      .order('created_at', { ascending: false });

    res.json({
      key: {
        ...key,
        hasAccess,
        relatedKeys: related,
        versions: versions || [],
      },
    });
  })
);

/**
 * Download a key (requires entitlement)
 * POST /marketplace/keys/:slug/download
 */
router.post(
  '/keys/:slug/download',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { slug } = req.params;
    const { version } = req.body;
    const userId = req.userId!;

    // Get key
    const { data: key, error: keyError } = await supabase
      .from('marketplace_keys')
      .select('id, slug, version, zip_path')
      .eq('slug', slug)
      .single();

    if (keyError || !key) {
      return res.status(404).json({
        error: 'Key not found',
      });
    }

    // Resolve tenant context
    const tenant = await resolveTenantContext(userId);

    // Check entitlement
    const entitlementCheck = await hasEntitlement(
      tenant.tenantId,
      tenant.tenantType,
      key.id
    );

    if (!entitlementCheck.hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this key. Please purchase it first.',
      });
    }

    // Get version-specific path if version specified
    let zipPath = key.zip_path;
    if (version) {
      const { data: versionData } = await supabase
        .from('marketplace_key_versions')
        .select('zip_path')
        .eq('key_id', key.id)
        .eq('version', version)
        .single();

      if (versionData?.zip_path) {
        zipPath = versionData.zip_path;
      }
    }

    if (!zipPath) {
      return res.status(404).json({
        error: 'Download file not found',
      });
    }

    // Generate signed URL
    let signedUrl: string;
    try {
      signedUrl = await getSignedUrl(zipPath, 3600); // 1 hour expiry
    } catch (error: any) {
      logger.error('Failed to generate signed URL:', error);
      return res.status(500).json({
        error: 'Failed to generate download link',
        message: 'Storage service unavailable',
      });
    }

    // Log download event
    const ipHash = hashIP(req.ip || req.socket.remoteAddress || 'unknown');
    const userAgent = truncateUserAgent(req.headers['user-agent'] || '');

    await supabase.from('marketplace_download_events').insert({
      tenant_id: tenant.tenantId,
      tenant_type: tenant.tenantType,
      user_id: userId,
      key_id: key.id,
      version: version || key.version,
      ip_hash: ipHash,
      user_agent: userAgent,
    });

    // Track analytics
    await supabase.from('marketplace_analytics').insert({
      event_type: 'download',
      key_id: key.id,
      user_id: userId,
      tenant_id: tenant.tenantId,
      tenant_type: tenant.tenantType,
    });

    res.json({
      downloadUrl: signedUrl,
      expiresIn: 3600,
    });
  })
);

/**
 * Create checkout session for a key
 * POST /marketplace/keys/:slug/checkout
 */
router.post(
  '/keys/:slug/checkout',
  authMiddleware,
  validateBody(
    z.object({
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { slug } = req.params;
    const userId = req.userId!;
    const { successUrl, cancelUrl } = req.body;

    try {
      const session = await createKeyCheckoutSession(userId, slug, successUrl, cancelUrl);
      res.json(session);
    } catch (error: any) {
      logger.error('Failed to create checkout session:', error);
      res.status(500).json({
        error: 'Failed to create checkout session',
        message: error.message,
      });
    }
  })
);

/**
 * Get bundles
 * GET /marketplace/bundles
 */
router.get(
  '/bundles',
  asyncHandler(async (req, res) => {
    const { bundle_type } = req.query;

    let query = supabase
      .from('marketplace_bundles')
      .select('id, slug, title, description, bundle_type, price_cents, key_ids')
      .order('created_at', { ascending: false });

    if (bundle_type) {
      query = query.eq('bundle_type', bundle_type as string);
    }

    const { data: bundles, error } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch bundles',
        message: error.message,
      });
    }

    // Enrich with key details
    const enrichedBundles = await Promise.all(
      (bundles || []).map(async (bundle) => {
        const keyIds = bundle.key_ids as string[];
        const { data: keys } = await supabase
          .from('marketplace_keys')
          .select('id, slug, title, key_type')
          .in('id', keyIds);

        return {
          ...bundle,
          keys: keys || [],
        };
      })
    );

    res.json({ bundles: enrichedBundles });
  })
);

/**
 * Get bundle discount (for authenticated users)
 * GET /marketplace/bundles/:slug/discount
 */
router.get(
  '/bundles/:slug/discount',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { slug } = req.params;
    const userId = req.userId!;

    const { data: bundle } = await supabase
      .from('marketplace_bundles')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    try {
      const discount = await calculateBundleDiscount(userId, bundle.id);
      res.json(discount);
    } catch (error: any) {
      logger.error('Failed to calculate bundle discount:', error);
      res.status(500).json({
        error: 'Failed to calculate discount',
        message: error.message,
      });
    }
  })
);

/**
 * Create checkout session for a bundle
 * POST /marketplace/bundles/:slug/checkout
 */
router.post(
  '/bundles/:slug/checkout',
  authMiddleware,
  validateBody(
    z.object({
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { slug } = req.params;
    const userId = req.userId!;
    const { successUrl, cancelUrl } = req.body;

    try {
      const session = await createBundleCheckoutSession(userId, slug, successUrl, cancelUrl);
      res.json(session);
    } catch (error: any) {
      logger.error('Failed to create bundle checkout session:', error);
      res.status(500).json({
        error: 'Failed to create checkout session',
        message: error.message,
      });
    }
  })
);

/**
 * Track analytics event
 * POST /marketplace/analytics
 */
router.post(
  '/analytics',
  authMiddleware,
  validateBody(
    z.object({
      event_type: z.enum(['view', 'discovery_click', 'purchase', 'download', 'bundle_upgrade']),
      key_id: z.string().uuid().optional(),
      bundle_id: z.string().uuid().optional(),
      discovery_reason: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { event_type, key_id, bundle_id, discovery_reason, metadata } = req.body;

    const tenant = await resolveTenantContext(userId);

    await supabase.from('marketplace_analytics').insert({
      event_type,
      key_id: key_id || null,
      bundle_id: bundle_id || null,
      user_id: userId,
      tenant_id: tenant.tenantId,
      tenant_type: tenant.tenantType,
      discovery_reason: discovery_reason || null,
      metadata: metadata || {},
    });

    res.json({ success: true });
  })
);

/**
 * Admin: Ingest keys from assets
 * POST /marketplace/admin/ingest
 */
router.post(
  '/admin/ingest',
  authMiddleware,
  requireRole('admin', 'superadmin'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const result = await ingestAllKeys();
      res.json(result);
    } catch (error: any) {
      logger.error('Failed to ingest keys:', error);
      res.status(500).json({
        error: 'Failed to ingest keys',
        message: error.message,
      });
    }
  })
);

/**
 * Admin: Ingest from assets index JSON
 * POST /marketplace/admin/ingest-index
 */
router.post(
  '/admin/ingest-index',
  authMiddleware,
  requireRole('admin', 'superadmin'),
  validateBody(
    z.object({
      assetsIndex: z.any(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const result = await ingestFromAssetsIndex(req.body.assetsIndex);
      res.json(result);
    } catch (error: any) {
      logger.error('Failed to ingest from index:', error);
      res.status(500).json({
        error: 'Failed to ingest from index',
        message: error.message,
      });
    }
  })
);

/**
 * Get user entitlements
 * GET /marketplace/entitlements
 */
router.get(
  '/entitlements',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const tenant = await resolveTenantContext(userId);

    const { getTenantEntitlements } = await import('../lib/marketplace/entitlements.js');
    const entitlements = await getTenantEntitlements(tenant.tenantId, tenant.tenantType);

    res.json({
      tenantId: tenant.tenantId,
      tenantType: tenant.tenantType,
      entitlements,
    });
  })
);

export { router as marketplaceV2Router };
