import type { Request, Response } from 'express';
import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { telemetryService } from '../services/telemetryService.js';
import { getCurrentUsage, getTierLimit } from '../services/usageMetering.js';
import { createClient } from '@supabase/supabase-js';

const router = Router() as Router;
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_METRICS_CACHE_TTL_MS = 5 * 60 * 1000;
let adminMetricsCache: { totalUsers: number; expiresAt: number } | null = null;

/**
 * Get aggregated metrics for dashboard
 * GET /metrics/dashboard
 */
router.get(
  '/dashboard',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;

    const wantsAdminMetrics = req.user?.role === 'admin';
    const adminCacheFresh =
      adminMetricsCache && adminMetricsCache.expiresAt > Date.now();
    const includeAdmin = wantsAdminMetrics && !adminCacheFresh;

    const [rpcResponse, engagement, totalCost] = await Promise.all([
      supabase.rpc('get_dashboard_metrics', {
        p_user_id: userId,
        p_include_admin: includeAdmin,
      }),
      telemetryService.getEngagementMetrics(userId, 7),
      telemetryService.getTotalCost(userId, 30),
    ]);

    let profile = rpcResponse.data?.profile;
    let usage = rpcResponse.data?.usage;
    let totals = rpcResponse.data?.totals;
    let totalUsers = rpcResponse.data?.admin_total_users ?? null;

    if (rpcResponse.error || !profile || !usage || !totals) {
      if (rpcResponse.error) {
        console.error('Failed to fetch dashboard metrics RPC:', rpcResponse.error);
      }
      const { data: fallbackProfile } = await supabase
        .from('user_profiles')
        .select('subscription_tier, subscription_status, guarantee_coverage, prevented_failures_count')
        .eq('user_id', userId)
        .single();

      profile = fallbackProfile || {
        subscription_tier: 'free',
        subscription_status: 'free',
        guarantee_coverage: [],
        prevented_failures_count: 0,
      };

      const [runsUsage, tokensUsage, templatesUsage, exportsUsage] = await Promise.all([
        getCurrentUsage(userId, 'runs'),
        getCurrentUsage(userId, 'tokens'),
        getCurrentUsage(userId, 'templates'),
        getCurrentUsage(userId, 'exports'),
      ]);

      const [totalPromptsResult, totalTemplatesResult, totalUsersResult] = await Promise.all([
        supabase
          .from('agent_runs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('user_template_customizations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        wantsAdminMetrics
          ? supabase.from('user_profiles').select('*', { count: 'exact', head: true })
          : Promise.resolve({ count: null }),
      ]);

      usage = {
        runs: runsUsage,
        tokens: tokensUsage,
        templates: templatesUsage,
        exports: exportsUsage,
      };
      totals = {
        prompts: totalPromptsResult.count ?? 0,
        templates: totalTemplatesResult.count ?? 0,
      };
      totalUsers = totalUsersResult.count ?? null;
    }

    if (wantsAdminMetrics) {
      if (includeAdmin && typeof totalUsers === 'number') {
        adminMetricsCache = {
          totalUsers,
          expiresAt: Date.now() + ADMIN_METRICS_CACHE_TTL_MS,
        };
      } else if (adminCacheFresh && adminMetricsCache) {
        totalUsers = adminMetricsCache.totalUsers;
      }
    }

    const tier = profile?.subscription_tier || 'free';

    const buildUsageSummary = (current: number, limit: number) => {
      if (limit === -1) {
        return {
          current,
          limit,
          remaining: -1,
          percentage: 0,
        };
      }

      return {
        current,
        limit,
        remaining: Math.max(0, limit - current),
        percentage: limit > 0 ? Math.round((current / limit) * 100) : 0,
      };
    };

    res.json({
      user: {
        subscriptionTier: tier,
        subscriptionStatus: profile?.subscription_status || 'free',
        guaranteeCoverage: profile?.guarantee_coverage || [],
        preventedFailuresCount: profile?.prevented_failures_count || 0,
      },
      usage: {
        runs: buildUsageSummary(usage?.runs || 0, getTierLimit(tier, 'runs')),
        tokens: buildUsageSummary(usage?.tokens || 0, getTierLimit(tier, 'tokens')),
        templates: buildUsageSummary(usage?.templates || 0, getTierLimit(tier, 'templates')),
        exports: buildUsageSummary(usage?.exports || 0, getTierLimit(tier, 'exports')),
      },
      engagement: {
        chatsPerWeek: engagement.chatsPerWeek,
        sliderAdjustments: engagement.sliderAdjustments,
        suggestionsApproved: engagement.suggestionsApproved,
        suggestionsRejected: engagement.suggestionsRejected,
        backgroundSuggestionsApproved: engagement.backgroundSuggestionsApproved,
        lastActiveAt: engagement.lastActiveAt.toISOString(),
      },
      totals: {
        promptsGenerated: totals?.prompts || 0,
        templatesCreated: totals?.templates || 0,
        totalCost: totalCost,
      },
      admin: totalUsers !== null ? { totalUsers } : undefined,
    });
  })
);

/**
 * Get public system metrics (cached, no auth required)
 * GET /metrics/public
 */
router.get(
  '/public',
  asyncHandler(async (_req, res) => {
    // In production, this would be cached (Redis) and updated periodically
    // For now, we'll query directly but should add caching

    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Get total prompts (last 30 days for "active" metric)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: totalPrompts } = await supabase
        .from('agent_runs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get total templates
      const { count: totalTemplates } = await supabase
        .from('user_template_customizations')
        .select('*', { count: 'exact', head: true });

      res.json({
        users: {
          total: totalUsers || 0,
        },
        usage: {
          totalPrompts: totalPrompts || 0,
          totalTemplates: totalTemplates || 0,
        },
        // Cache for 5 minutes
        cached: true,
        cacheExpiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });
    } catch (error) {
      console.error('Error fetching public metrics:', error);
      // Return safe defaults
      res.json({
        users: { total: 0 },
        usage: { totalPrompts: 0, totalTemplates: 0 },
        cached: false,
      });
    }
  })
);

/**
 * Get system-wide metrics (admin only)
 * GET /metrics/system
 */
router.get(
  '/system',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Check admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get total users
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: activeUsers } = await supabase
      .from('agent_runs')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get total prompts generated
    const { count: totalPrompts } = await supabase
      .from('agent_runs')
      .select('*', { count: 'exact', head: true });

    // Get total templates created
    const { count: totalTemplates } = await supabase
      .from('user_template_customizations')
      .select('*', { count: 'exact', head: true });

    // Get subscription breakdown
    const { data: subscriptions } = await supabase
      .from('user_profiles')
      .select('subscription_tier, subscription_status');

    const subscriptionBreakdown = {
      free: subscriptions?.filter((s) => s.subscription_tier === 'free').length || 0,
      pro: subscriptions?.filter((s) => s.subscription_tier === 'pro').length || 0,
      enterprise: subscriptions?.filter((s) => s.subscription_tier === 'enterprise').length || 0,
      active: subscriptions?.filter((s) => s.subscription_status === 'active').length || 0,
    };

    res.json({
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
      },
      usage: {
        totalPrompts: totalPrompts || 0,
        totalTemplates: totalTemplates || 0,
      },
      subscriptions: subscriptionBreakdown,
    });
  })
);

export { router as metricsRouter };
