import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import {
  validateLibraryIndex,
  type LibraryIndex,
  type PackMetadata,
} from '../lib/marketplace/schema.js';
import {
  hasEntitlement,
  resolveTenantContext,
  grantEntitlement,
} from '../lib/marketplace/entitlements.js';
import {
  getSignedUrl,
  getPackAssetPath,
  hashIP,
  truncateUserAgent,
  fileExists,
} from '../lib/marketplace/storage.js';
import { createHash } from 'crypto';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get all marketplace packs (public listing)
 * GET /marketplace/packs
 */
router.get(
  '/packs',
  asyncHandler(async (req, res) => {
    const { category, difficulty, search } = req.query;

    let query = supabase
      .from('marketplace_packs')
      .select('id, slug, title, description, category, difficulty, runtime_minutes, tags, version, license_spdx, preview_public, cover_path, created_at')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category as string);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty as string);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch packs',
        message: error.message,
      });
    }

    res.json({ packs: data || [] });
  })
);

/**
 * Get a single pack by slug
 * GET /marketplace/packs/:slug
 */
router.get(
  '/packs/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const { data: pack, error } = await supabase
      .from('marketplace_packs')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !pack) {
      return res.status(404).json({
        error: 'Pack not found',
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
          const check = await hasEntitlement(tenant.tenantId, tenant.tenantType, pack.id);
          hasAccess = check.hasAccess;
        }
      } catch {
        // Ignore auth errors, user is not authenticated
      }
    }

    res.json({
      pack: {
        ...pack,
        hasAccess,
      },
    });
  })
);

/**
 * Download a pack (requires entitlement)
 * POST /marketplace/packs/:slug/download
 */
router.post(
  '/packs/:slug/download',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { slug } = req.params;
    const userId = req.userId!;

    // Get pack
    const { data: pack, error: packError } = await supabase
      .from('marketplace_packs')
      .select('id, slug, version, zip_path')
      .eq('slug', slug)
      .single();

    if (packError || !pack) {
      return res.status(404).json({
        error: 'Pack not found',
      });
    }

    // Resolve tenant context
    const tenant = await resolveTenantContext(userId);

    // Check entitlement
    const entitlementCheck = await hasEntitlement(
      tenant.tenantId,
      tenant.tenantType,
      pack.id
    );

    if (!entitlementCheck.hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this pack. Please purchase it first.',
      });
    }

    // Generate signed URL for ZIP
    const zipPath = pack.zip_path || getPackAssetPath(pack.slug, pack.version, 'zip');
    let signedUrl: string;

    try {
      signedUrl = await getSignedUrl(zipPath, 3600); // 1 hour expiry
    } catch (error: any) {
      console.error('Failed to generate signed URL:', error);
      return res.status(500).json({
        error: 'Failed to generate download link',
        message: 'Storage service unavailable',
      });
    }

    // Log download event
    const ipHash = hashIP(req.ip || req.socket.remoteAddress || 'unknown');
    const userAgent = truncateUserAgent(req.headers['user-agent'] || '');

    const { error: logError } = await supabase.from('marketplace_download_events').insert({
      tenant_id: tenant.tenantId,
      tenant_type: tenant.tenantType,
      user_id: userId,
      pack_id: pack.id,
      version: pack.version,
      ip_hash: ipHash,
      user_agent: userAgent,
    });

    if (logError) {
      // Log but don't fail the download
      console.error('Failed to log download event:', logError);
    }

    res.json({
      downloadUrl: signedUrl,
      expiresIn: 3600,
    });
  })
);

/**
 * Get preview HTML for a pack (public if preview_public=true, otherwise requires entitlement)
 * GET /marketplace/packs/:slug/preview
 */
router.get(
  '/packs/:slug/preview',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const { data: pack, error } = await supabase
      .from('marketplace_packs')
      .select('id, slug, version, preview_html_path, preview_public')
      .eq('slug', slug)
      .single();

    if (error || !pack) {
      return res.status(404).json({
        error: 'Pack not found',
      });
    }

    // Check if preview requires entitlement
    if (!pack.preview_public) {
      // Require auth
      if (!req.headers.authorization) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser(
          req.headers.authorization.replace('Bearer ', '')
        );

        if (!user) {
          return res.status(401).json({
            error: 'Authentication required',
          });
        }

        const tenant = await resolveTenantContext(user.id);
        const entitlementCheck = await hasEntitlement(
          tenant.tenantId,
          tenant.tenantType,
          pack.id
        );

        if (!entitlementCheck.hasAccess) {
          return res.status(403).json({
            error: 'Access denied',
          });
        }
      } catch {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }
    }

    // Generate signed URL for preview HTML
    const previewPath = pack.preview_html_path || getPackAssetPath(pack.slug, pack.version, 'preview_html');
    
    try {
      const signedUrl = await getSignedUrl(previewPath, 3600);
      res.json({ previewUrl: signedUrl });
    } catch (error: any) {
      console.error('Failed to generate preview URL:', error);
      res.status(500).json({
        error: 'Failed to generate preview link',
      });
    }
  })
);

/**
 * Admin: Publish packs from library.json
 * POST /marketplace/admin/publish
 */
router.post(
  '/admin/publish',
  authMiddleware,
  requireRole('admin', 'superadmin'),
  validateBody(
    z.object({
      libraryJson: z.unknown(), // Will be validated by validateLibraryIndex
      dryRun: z.boolean().default(false),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Admin role check enforced via requireRole middleware

    const { libraryJson, dryRun } = req.body;

    // Validate library.json schema
    let libraryIndex: LibraryIndex;
    try {
      libraryIndex = validateLibraryIndex(libraryJson);
    } catch (error: any) {
      return res.status(400).json({
        error: 'Invalid library.json schema',
        details: error.errors || error.message,
      });
    }

    const results: Array<{
      slug: string;
      status: 'success' | 'error';
      message?: string;
    }> = [];

    // Process each pack
    for (const packMetadata of libraryIndex.packs) {
      try {
        if (dryRun) {
          // Just validate, don't insert
          results.push({
            slug: packMetadata.slug,
            status: 'success',
            message: 'Validation passed (dry run)',
          });
          continue;
        }

        // Upsert pack
        const { data: pack, error: packError } = await supabase
          .from('marketplace_packs')
          .upsert(
            {
              slug: packMetadata.slug,
              title: packMetadata.title,
              description: packMetadata.description || null,
              category: packMetadata.category || null,
              difficulty: packMetadata.difficulty || null,
              runtime_minutes: packMetadata.runtime_minutes || null,
              tags: packMetadata.tags || [],
              version: packMetadata.version,
              license_spdx: packMetadata.license_spdx,
              preview_public: packMetadata.preview_public ?? true,
              cover_path: packMetadata.assets.cover
                ? getPackAssetPath(packMetadata.slug, packMetadata.version, 'cover')
                : null,
              preview_html_path: packMetadata.assets.preview_html
                ? getPackAssetPath(packMetadata.slug, packMetadata.version, 'preview_html')
                : null,
              zip_path: getPackAssetPath(packMetadata.slug, packMetadata.version, 'zip'),
              sha256: packMetadata.sha256 || null,
            },
            {
              onConflict: 'slug',
            }
          )
          .select('id')
          .single();

        if (packError) {
          throw new Error(`Database error: ${packError.message}`);
        }

        // Create version record
        await supabase.from('marketplace_pack_versions').upsert(
          {
            pack_id: pack.id,
            version: packMetadata.version,
            zip_path: getPackAssetPath(packMetadata.slug, packMetadata.version, 'zip'),
            preview_html_path: packMetadata.assets.preview_html
              ? getPackAssetPath(packMetadata.slug, packMetadata.version, 'preview_html')
              : null,
            cover_path: packMetadata.assets.cover
              ? getPackAssetPath(packMetadata.slug, packMetadata.version, 'cover')
              : null,
            changelog_md_path: packMetadata.assets.changelog_md
              ? getPackAssetPath(packMetadata.slug, packMetadata.version, 'changelog_md')
              : null,
            sha256: packMetadata.sha256 || null,
          },
          {
            onConflict: 'pack_id,version',
          }
        );

        results.push({
          slug: packMetadata.slug,
          status: 'success',
        });
      } catch (error: any) {
        results.push({
          slug: packMetadata.slug,
          status: 'error',
          message: error.message || 'Unknown error',
        });
      }
    }

    res.json({
      dryRun,
      total: libraryIndex.packs.length,
      results,
    });
  })
);

/**
 * Get user/org entitlements
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

/**
 * Get download analytics for a pack (admin/org admin only)
 * GET /marketplace/packs/:slug/analytics
 */
router.get(
  '/packs/:slug/analytics',
  authMiddleware,
  requireRole('admin', 'superadmin'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { slug } = req.params;
    const userId = req.userId!;

    // Get pack
    const { data: pack } = await supabase
      .from('marketplace_packs')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!pack) {
      return res.status(404).json({ error: 'Pack not found' });
    }

    // Resolve tenant
    const tenant = await resolveTenantContext(userId);

    // Get download count for this tenant
    const { data: downloads, error } = await supabase
      .from('marketplace_download_events')
      .select('id, version, created_at')
      .eq('pack_id', pack.id)
      .eq('tenant_id', tenant.tenantId)
      .eq('tenant_type', tenant.tenantType)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch analytics',
      });
    }

    res.json({
      packSlug: slug,
      totalDownloads: downloads?.length || 0,
      downloads: downloads || [],
    });
  })
);

export { router as marketplaceRouter };
