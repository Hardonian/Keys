import type { Request, Response } from 'express';
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { auditLogService } from '../services/auditLogService.js';
import { jobForgeAdapter, JobForgeError } from '../integrations/jobforgeAdapter.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

const router = Router() as Router;
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// All admin routes require authentication
router.use(authMiddleware);

/**
 * GET /admin/atoms - List all prompt atoms
 */
router.get('/atoms', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { category, active } = req.query;

    let query = supabase.from('prompt_atoms').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    if (active !== undefined) {
      query = query.eq('active', active === 'true');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching atoms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /admin/atoms - Create new atom
 */
router.post('/atoms', requireRole('admin', 'superadmin'), async (req: AuthenticatedRequest, res) => {
  try {
    const atom = req.body;

    const { data, error } = await supabase
      .from('prompt_atoms')
      .insert(atom)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Log audit event
    await auditLogService.logAdminAction(
      req.userId!,
      'create_atom',
      'prompt_atom',
      data.id,
      { category: atom.category },
      req
    );

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating atom:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /admin/atoms/:id - Update atom
 */
router.patch('/atoms/:id', requireRole('admin', 'superadmin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('prompt_atoms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Log audit event
    await auditLogService.logAdminAction(
      req.userId!,
      'update_atom',
      'prompt_atom',
      id,
      { fields: Object.keys(updates) },
      req
    );

    res.json(data);
  } catch (error) {
    console.error('Error updating atom:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /admin/atoms/:id - Delete atom
 */
router.delete('/atoms/:id', requireRole('admin', 'superadmin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('prompt_atoms').delete().eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Log audit event
    await auditLogService.logAdminAction(
      req.userId!,
      'delete_atom',
      'prompt_atom',
      id,
      {},
      req
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting atom:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /admin/analytics - Get analytics data
 */
router.get('/analytics', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Get run statistics
    const { data: runs } = await supabase
      .from('agent_runs')
      .select('*')
      .gte('created_at', startDate.toISOString());

    const totalRuns = runs?.length || 0;
    const approvedRuns = runs?.filter((r) => r.user_feedback === 'approved').length || 0;
    const totalCost = runs?.reduce((sum, r) => sum + (r.cost_usd || 0), 0) || 0;
    const totalTokens = runs?.reduce((sum, r) => sum + (r.tokens_used || 0), 0) || 0;

    // Get user statistics
    const { data: profiles } = await supabase.from('user_profiles').select('user_id');

    // Get atom statistics
    const { data: atoms } = await supabase
      .from('prompt_atoms')
      .select('id, success_rate, usage_count');

    const avgSuccessRate =
      atoms && atoms.length > 0
        ? atoms.reduce((sum, a) => sum + (a.success_rate || 0), 0) / atoms.length
        : 0;

    res.json({
      period: {
        days: Number(days),
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      runs: {
        total: totalRuns,
        approved: approvedRuns,
        approvalRate: totalRuns > 0 ? (approvedRuns / totalRuns) * 100 : 0,
      },
      cost: {
        total: totalCost,
        average: totalRuns > 0 ? totalCost / totalRuns : 0,
        tokens: totalTokens,
      },
      users: {
        total: profiles?.length || 0,
      },
      atoms: {
        total: atoms?.length || 0,
        averageSuccessRate: avgSuccessRate,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /admin/profiles - List all user profiles
 */
router.get('/profiles', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { role, vertical, limit = 100 } = req.query;

    let query = supabase.from('user_profiles').select('*');

    if (role) {
      query = query.eq('role', role);
    }

    if (vertical) {
      query = query.eq('vertical', vertical);
    }

    const { data, error } = await query.limit(Number(limit)).order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /admin/health - System health check (admin only)
 * Validates database contract and connectivity
 */
router.get('/health', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const startTime = Date.now();
    const healthChecks: Record<string, { status: 'ok' | 'error' | 'warning'; message: string; details?: any }> = {};
    
    // Check database connectivity
    const dbStartTime = Date.now();
    const { error: dbError } = await supabase.from('user_profiles').select('user_id').limit(1);
    const dbResponseTime = Date.now() - dbStartTime;
    const dbConnected = !dbError;
    
    healthChecks.database_connectivity = {
      status: dbConnected ? 'ok' : 'error',
      message: dbConnected ? 'Database is reachable' : `Database error: ${dbError?.message}`,
      details: { responseTime: dbResponseTime },
    };

    // Check required tables exist
    const requiredTables = [
      'user_profiles',
      'prompt_atoms',
      'vibe_configs',
      'agent_runs',
      'background_events',
      'user_template_customizations',
      'organizations',
      'organization_members',
    ];
    
    const tableChecks: string[] = [];
    const missingTables: string[] = [];
    
    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (error && (error.code === 'PGRST116' || error.message?.includes('does not exist'))) {
        missingTables.push(table);
      } else {
        tableChecks.push(table);
      }
    }
    
    healthChecks.required_tables = {
      status: missingTables.length === 0 ? 'ok' : 'error',
      message: missingTables.length === 0 
        ? `All ${requiredTables.length} required tables exist`
        : `Missing tables: ${missingTables.join(', ')}`,
      details: { 
        found: tableChecks.length,
        missing: missingTables.length,
        missingTables,
      },
    };

    // Check critical functions
    const { error: uuidError } = await supabase.rpc('gen_random_uuid');
    const uuidAvailable = !uuidError;
    
    const { error: trackError } = await supabase.rpc('track_template_usage', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_template_id: 'health-check',
      p_success: true,
    });
    const trackFunctionExists = !trackError || !(trackError.message?.includes('does not exist') || trackError.code === '42883');
    
    healthChecks.database_functions = {
      status: uuidAvailable && trackFunctionExists ? 'ok' : 'warning',
      message: uuidAvailable && trackFunctionExists
        ? 'Required functions are available'
        : `Some functions missing: ${!uuidAvailable ? 'gen_random_uuid ' : ''}${!trackFunctionExists ? 'track_template_usage' : ''}`,
    };

    // Check RLS is enabled (by trying anon query - should fail)
    const anonClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    const { data: anonData, error: anonError } = await anonClient
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    let rlsWorking = !anonData || anonData.length === 0;
    if (anonError && !rlsWorking) {
      const errorObj = anonError as { code?: string; message?: string };
      rlsWorking = errorObj.code === 'PGRST301' || 
        (typeof errorObj.message === 'string' && errorObj.message.includes('permission'));
    }
    
    healthChecks.rls_enforcement = {
      status: rlsWorking ? 'ok' : 'warning',
      message: rlsWorking 
        ? 'RLS appears to be enforcing access control'
        : 'RLS may not be properly configured - anon client could access user data',
    };

    // Check Redis (if configured)
    let redisConnected = false;
    try {
      const { initRedis } = await import('../cache/redis.js');
      const redis = initRedis();
      if (redis) {
        await redis.ping();
        redisConnected = true;
      }
    } catch {
      // Redis not configured or unavailable
    }
    
    healthChecks.redis = {
      status: redisConnected ? 'ok' : 'warning',
      message: redisConnected ? 'Redis is connected' : 'Redis not configured or unavailable',
    };

    // Check Stripe (if configured)
    const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
    
    healthChecks.stripe = {
      status: stripeConfigured ? 'ok' : 'warning',
      message: stripeConfigured ? 'Stripe is configured' : 'Stripe not configured',
    };

    // Get webhook status (would need to track this in a table)
    const webhookStatus = {
      stripe: {
        status: stripeConfigured ? 'ok' as const : 'unknown' as const,
        lastReceived: null as string | null,
      },
      github: {
        status: 'unknown' as const,
        lastReceived: null as string | null,
      },
    };

    // Get system uptime (process uptime in seconds)
    const uptime = Math.floor(process.uptime());
    const version = process.env.npm_package_version || '1.0.0';

    // Overall health status
    const hasErrors = Object.values(healthChecks).some(check => check.status === 'error');
    const hasWarnings = Object.values(healthChecks).some(check => check.status === 'warning');

    res.status(hasErrors ? 503 : 200).json({
      status: hasErrors ? 'degraded' : hasWarnings ? 'healthy' : 'healthy',
      timestamp: new Date().toISOString(),
      checks: healthChecks,
      database: {
        connected: dbConnected,
        responseTime: dbResponseTime,
      },
      webhooks: webhookStatus,
      services: {
        redis: {
          connected: redisConnected,
        },
        stripe: {
          configured: stripeConfigured,
        },
      },
      system: {
        uptime,
        version,
      },
    });
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

const jobForgeEventSchema = z.object({
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  eventType: z.string().min(1),
  payload: z.record(z.unknown()).default({}),
});

const jobForgeModuleSchema = z.object({
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  moduleId: z.string().min(1),
  input: z.record(z.unknown()).default({}),
});

const jobForgeReportQuerySchema = z.object({
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
});

const jobForgeBundleSchema = z.object({
  tenantId: z.string().min(1),
  projectId: z.string().min(1),
  bundleId: z.string().min(1),
  confirm: z.boolean().optional(),
});

const handleJobForgeError = (res: Response, error: unknown, context: Record<string, unknown>) => {
  if (error instanceof JobForgeError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  logger.error('JobForge admin request failed.', error instanceof Error ? error : undefined, context);
  return res.status(500).json({ error: 'JobForge request failed.' });
};

/**
 * GET /admin/jobforge/status - Get JobForge integration status
 */
router.get('/jobforge/status', requireRole('admin', 'superadmin'), async (_req, res) => {
  try {
    const status = await jobForgeAdapter.getStatus();
    res.json(status);
  } catch (error) {
    handleJobForgeError(res, error, { action: 'jobforge_status' });
  }
});

/**
 * POST /admin/jobforge/events - Submit JobForge event
 */
router.post('/jobforge/events', requireRole('admin', 'superadmin'), async (req: AuthenticatedRequest, res) => {
  const parsed = jobForgeEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  try {
    const result = await jobForgeAdapter.submitEvent(parsed.data);
    res.json({ status: 'submitted', result });
  } catch (error) {
    handleJobForgeError(res, error, { action: 'jobforge_submit_event', userId: req.userId });
  }
});

/**
 * POST /admin/jobforge/modules/dry-run - Run JobForge module dry-run
 */
router.post('/jobforge/modules/dry-run', requireRole('admin', 'superadmin'), async (req: AuthenticatedRequest, res) => {
  const parsed = jobForgeModuleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  try {
    const result = await jobForgeAdapter.runModuleDryRun(parsed.data);
    res.json({ status: 'dry_run', result });
  } catch (error) {
    handleJobForgeError(res, error, { action: 'jobforge_module_dry_run', userId: req.userId });
  }
});

/**
 * GET /admin/jobforge/reports/:reportId - View JobForge report
 */
router.get('/jobforge/reports/:reportId', requireRole('admin', 'superadmin'), async (req, res) => {
  const queryParsed = jobForgeReportQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return res.status(400).json({ error: 'Invalid query parameters.' });
  }

  try {
    const result = await jobForgeAdapter.getReport({
      tenantId: queryParsed.data.tenantId,
      projectId: queryParsed.data.projectId,
      reportId: req.params.reportId,
    });
    res.json({ status: 'ok', result });
  } catch (error) {
    handleJobForgeError(res, error, { action: 'jobforge_get_report' });
  }
});

/**
 * POST /admin/jobforge/reports/:reportId/bundle-execution - Request bundle execution
 */
router.post('/jobforge/reports/:reportId/bundle-execution', requireRole('admin', 'superadmin'), async (req, res) => {
  const parsed = jobForgeBundleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  if (!parsed.data.confirm) {
    return res.status(400).json({ error: 'Bundle execution requires confirm=true.' });
  }

  try {
    const result = await jobForgeAdapter.requestBundleExecution({
      tenantId: parsed.data.tenantId,
      projectId: parsed.data.projectId,
      reportId: req.params.reportId,
      bundleId: parsed.data.bundleId,
    });
    res.json({ status: 'queued', result });
  } catch (error) {
    handleJobForgeError(res, error, { action: 'jobforge_bundle_execution' });
  }
});

export { router as adminRouter };
