import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { telemetryService } from '../services/telemetryService.js';
import { getCurrentUsage, checkLimit } from '../services/usageMetering.js';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get aggregated metrics for dashboard
 * GET /metrics/dashboard
 */
router.get(
  '/dashboard',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;

    // Get user profile for subscription tier
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, subscription_status')
      .eq('user_id', userId)
      .single();

    // Get usage metrics
    const runsUsage = await getCurrentUsage(userId, 'runs');
    const tokensUsage = await getCurrentUsage(userId, 'tokens');
    const templatesUsage = await getCurrentUsage(userId, 'templates');
    const exportsUsage = await getCurrentUsage(userId, 'exports');

    // Get limits
    const runsLimit = await checkLimit(userId, 'runs');
    const tokensLimit = await checkLimit(userId, 'tokens');
    const templatesLimit = await checkLimit(userId, 'templates');
    const exportsLimit = await checkLimit(userId, 'exports');

    // Get engagement metrics
    const engagement = await telemetryService.getEngagementMetrics(userId, 7);

    // Get total cost
    const totalCost = await telemetryService.getTotalCost(userId, 30);

    // Get total users (for admin)
    let totalUsers = null;
    if (req.user?.role === 'admin') {
      const { count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      totalUsers = count || 0;
    }

    // Get total prompts generated (aggregate)
    const { count: totalPrompts } = await supabase
      .from('agent_runs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get total templates created
    const { count: totalTemplates } = await supabase
      .from('user_template_customizations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    res.json({
      user: {
        subscriptionTier: profile?.subscription_tier || 'free',
        subscriptionStatus: profile?.subscription_status || 'free',
      },
      usage: {
        runs: {
          current: runsUsage,
          limit: runsLimit.limit,
          remaining: runsLimit.remaining,
          percentage: runsLimit.limit > 0 ? Math.round((runsUsage / runsLimit.limit) * 100) : 0,
        },
        tokens: {
          current: tokensUsage,
          limit: tokensLimit.limit,
          remaining: tokensLimit.remaining,
          percentage: tokensLimit.limit > 0 ? Math.round((tokensUsage / tokensLimit.limit) * 100) : 0,
        },
        templates: {
          current: templatesUsage,
          limit: templatesLimit.limit,
          remaining: templatesLimit.remaining,
          percentage: templatesLimit.limit > 0 ? Math.round((templatesUsage / templatesLimit.limit) * 100) : 0,
        },
        exports: {
          current: exportsUsage,
          limit: exportsLimit.limit,
          remaining: exportsLimit.remaining,
          percentage: exportsLimit.limit > 0 ? Math.round((exportsUsage / exportsLimit.limit) * 100) : 0,
        },
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
        promptsGenerated: totalPrompts || 0,
        templatesCreated: totalTemplates || 0,
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
