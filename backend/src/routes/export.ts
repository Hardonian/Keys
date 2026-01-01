/**
 * Export Routes
 * 
 * Allows users to export their institutional memory:
 * - Failure patterns (partial value - loses pattern matching)
 * - Success patterns (partial value - loses pattern recognition)
 * - Audit trails (full value - compliance requirement)
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Export failure patterns
 * GET /export/failure-patterns
 */
router.get(
  '/failure-patterns',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const format = (req.query.format as string) || 'json';

    // Get failure patterns
    const { data: patterns, error } = await supabase
      .from('failure_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch failure patterns', error instanceof Error ? error : new Error(String(error)), { userId });
      return res.status(500).json({ error: 'Failed to fetch failure patterns' });
    }

    // Format based on requested format
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="failure-patterns-${Date.now()}.json"`);
      return res.json({
        exported_at: new Date().toISOString(),
        user_id: userId,
        pattern_count: patterns?.length || 0,
        patterns: patterns || [],
        note: 'This export contains failure patterns but loses pattern matching capabilities. Pattern signatures and prevention rules are proprietary.',
      });
    } else if (format === 'csv') {
      // Convert to CSV
      const csvRows = [
        ['Pattern Type', 'Description', 'Failure Reason', 'Prevention Rule', 'Severity', 'Occurrence Count', 'Created At'],
        ...(patterns || []).map(p => [
          p.pattern_type,
          p.pattern_description,
          p.failure_reason,
          p.prevention_rule,
          p.severity,
          p.occurrence_count.toString(),
          p.created_at,
        ]),
      ];

      const csv = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="failure-patterns-${Date.now()}.csv"`);
      return res.send(csv);
    }

    return res.status(400).json({ error: 'Invalid format. Use "json" or "csv"' });
  })
);

/**
 * Export success patterns
 * GET /export/success-patterns
 */
router.get(
  '/success-patterns',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const format = (req.query.format as string) || 'json';

    // Get success patterns
    const { data: patterns, error } = await supabase
      .from('success_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch success patterns', error instanceof Error ? error : new Error(String(error)), { userId });
      return res.status(500).json({ error: 'Failed to fetch success patterns' });
    }

    // Format based on requested format
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="success-patterns-${Date.now()}.json"`);
      return res.json({
        exported_at: new Date().toISOString(),
        user_id: userId,
        pattern_count: patterns?.length || 0,
        patterns: patterns || [],
        note: 'This export contains success patterns but loses pattern recognition capabilities. Pattern signatures and success factors are proprietary.',
      });
    } else if (format === 'yaml') {
      // Convert to YAML-like template format
      const yaml = `# Success Patterns Export
# Exported: ${new Date().toISOString()}
# User ID: ${userId}
# Pattern Count: ${patterns?.length || 0}
# Note: This export loses pattern recognition capabilities

patterns:
${(patterns || []).map(p => `  - type: ${p.pattern_type}
    description: ${p.pattern_description}
    context: ${p.context}
    outcome: ${p.outcome}
    success_factors: ${JSON.stringify(p.success_factors)}
    usage_count: ${p.usage_count}
    success_rate: ${p.success_rate}
    created_at: ${p.created_at}`).join('\n')}
`;
      res.setHeader('Content-Type', 'text/yaml');
      res.setHeader('Content-Disposition', `attachment; filename="success-patterns-${Date.now()}.yaml"`);
      return res.send(yaml);
    }

    return res.status(400).json({ error: 'Invalid format. Use "json" or "yaml"' });
  })
);

/**
 * Export audit trails
 * GET /export/audit-trails
 */
router.get(
  '/audit-trails',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const format = (req.query.format as string) || 'json';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Build query
    let query = supabase
      .from('agent_runs')
      .select('id, user_id, input, output, template_id, created_at, safety_checks_passed, safety_check_results')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10000); // Limit for performance

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: runs, error } = await query;

    if (error) {
      logger.error('Failed to fetch audit trails', error instanceof Error ? error : new Error(String(error)), { userId });
      return res.status(500).json({ error: 'Failed to fetch audit trails' });
    }

    // Format based on requested format
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-trails-${Date.now()}.json"`);
      return res.json({
        exported_at: new Date().toISOString(),
        user_id: userId,
        record_count: runs?.length || 0,
        date_range: {
          start: startDate || 'all',
          end: endDate || 'all',
        },
        records: runs || [],
        note: 'This export contains full audit trail data for compliance purposes.',
      });
    } else if (format === 'csv') {
      // Convert to CSV
      const csvRows = [
        ['Run ID', 'User ID', 'Input', 'Output', 'Template ID', 'Safety Checks Passed', 'Created At'],
        ...(runs || []).map(r => [
          r.id,
          r.user_id,
          JSON.stringify(r.input).substring(0, 100),
          JSON.stringify(r.output).substring(0, 100),
          r.template_id || '',
          r.safety_checks_passed ? 'true' : 'false',
          r.created_at,
        ]),
      ];

      const csv = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-trails-${Date.now()}.csv"`);
      return res.send(csv);
    }

    return res.status(400).json({ error: 'Invalid format. Use "json" or "csv"' });
  })
);

/**
 * Export all institutional memory
 * GET /export/all
 */
router.get(
  '/all',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;

    // Get all data
    const [failurePatterns, successPatterns, auditTrails] = await Promise.all([
      supabase.from('failure_patterns').select('*').eq('user_id', userId),
      supabase.from('success_patterns').select('*').eq('user_id', userId),
      supabase
        .from('agent_runs')
        .select('id, user_id, input, output, template_id, created_at, safety_checks_passed')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000),
    ]);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="institutional-memory-${Date.now()}.json"`);
    return res.json({
      exported_at: new Date().toISOString(),
      user_id: userId,
      failure_patterns: {
        count: failurePatterns.data?.length || 0,
        patterns: failurePatterns.data || [],
        note: 'Partial value - loses pattern matching capabilities',
      },
      success_patterns: {
        count: successPatterns.data?.length || 0,
        patterns: successPatterns.data || [],
        note: 'Partial value - loses pattern recognition capabilities',
      },
      audit_trails: {
        count: auditTrails.data?.length || 0,
        records: auditTrails.data || [],
        note: 'Full value - complete audit trail for compliance',
      },
      institutional_memory_value: {
        failure_patterns_value: (failurePatterns.data?.length || 0) * 10, // $10 per pattern
        success_patterns_value: (successPatterns.data?.length || 0) * 5, // $5 per pattern
        audit_trails_value: (auditTrails.data?.length || 0) * 1, // $1 per record
        total_value: (failurePatterns.data?.length || 0) * 10 + (successPatterns.data?.length || 0) * 5 + (auditTrails.data?.length || 0) * 1,
        note: 'Estimated value of institutional memory. Switching to alternatives loses this value.',
      },
    });
  })
);

export { router as exportRouter };
