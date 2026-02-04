/**
 * Export Routes
 * 
 * Allows users to export their institutional memory:
 * - Failure patterns (partial value - loses pattern matching)
 * - Success patterns (partial value - loses pattern recognition)
 * - Audit trails (full value - compliance requirement)
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const router = Router() as Router;
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXPORT_BATCH_SIZE = 1000;

const escapeCsvCell = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
};

const writeCsvRow = (res: Response, cells: Array<string | number | null | undefined>) => {
  res.write(`${cells.map(escapeCsvCell).join(',')}\n`);
};

type ExportCursor = { createdAt: string; id: string };

const buildKeysetFilter = (cursor: ExportCursor) =>
  `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`;

const endStreamWithError = (
  res: Response,
  message: string,
  error: unknown,
  context: Record<string, unknown>
) => {
  logger.error(message, error instanceof Error ? error : new Error(String(error)), context);
  if (!res.headersSent) {
    res.status(500).json({ error: message });
    return;
  }
  res.end();
};

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

    const { count: patternCount, error: countError } = await supabase
      .from('failure_patterns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      endStreamWithError(res, 'Failed to fetch failure patterns', countError, { userId });
      return;
    }

    // Format based on requested format
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="failure-patterns-${Date.now()}.json"`);
      res.write(`{"exported_at":${JSON.stringify(new Date().toISOString())},`);
      res.write(`"user_id":${JSON.stringify(userId)},`);
      res.write(`"pattern_count":${patternCount || 0},`);
      res.write('"patterns":[');

      let cursor: ExportCursor | null = null;
      let first = true;

      while (true) {
        let query = supabase
          .from('failure_patterns')
          .select(
            'id, created_at, pattern_type, pattern_description, failure_reason, prevention_rule, severity, occurrence_count'
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(EXPORT_BATCH_SIZE);

        if (cursor) {
          query = query.or(buildKeysetFilter(cursor));
        }

        const { data, error } = await query;

        if (error) {
          endStreamWithError(res, 'Failed to fetch failure patterns', error, { userId });
          return;
        }

        if (!data || data.length === 0) {
          break;
        }

        for (const pattern of data) {
          if (!first) {
            res.write(',');
          }
          first = false;
          res.write(
            JSON.stringify({
              pattern_type: pattern.pattern_type,
              pattern_description: pattern.pattern_description,
              failure_reason: pattern.failure_reason,
              prevention_rule: pattern.prevention_rule,
              severity: pattern.severity,
              occurrence_count: pattern.occurrence_count,
              created_at: pattern.created_at,
            })
          );
        }

        if (data.length < EXPORT_BATCH_SIZE) {
          break;
        }

        const last = data[data.length - 1];
        cursor = { createdAt: last.created_at, id: last.id };
      }

      res.write('],');
      res.write(
        `"note":${JSON.stringify(
          'This export contains failure patterns but loses pattern matching capabilities. Pattern signatures and prevention rules are proprietary.'
        )}`
      );
      res.write('}');
      return res.end();
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="failure-patterns-${Date.now()}.csv"`);
      writeCsvRow(res, [
        'Pattern Type',
        'Description',
        'Failure Reason',
        'Prevention Rule',
        'Severity',
        'Occurrence Count',
        'Created At',
      ]);

      let cursor: ExportCursor | null = null;

      while (true) {
        let query = supabase
          .from('failure_patterns')
          .select(
            'id, created_at, pattern_type, pattern_description, failure_reason, prevention_rule, severity, occurrence_count'
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(EXPORT_BATCH_SIZE);

        if (cursor) {
          query = query.or(buildKeysetFilter(cursor));
        }

        const { data, error } = await query;

        if (error) {
          endStreamWithError(res, 'Failed to fetch failure patterns', error, { userId });
          return;
        }

        if (!data || data.length === 0) {
          break;
        }

        data.forEach((pattern) => {
          writeCsvRow(res, [
            pattern.pattern_type,
            pattern.pattern_description,
            pattern.failure_reason,
            pattern.prevention_rule,
            pattern.severity,
            pattern.occurrence_count,
            pattern.created_at,
          ]);
        });

        if (data.length < EXPORT_BATCH_SIZE) {
          break;
        }

        const last = data[data.length - 1];
        cursor = { createdAt: last.created_at, id: last.id };
      }
      return res.end();
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

    const { count: patternCount, error: countError } = await supabase
      .from('success_patterns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      endStreamWithError(res, 'Failed to fetch success patterns', countError, { userId });
      return;
    }

    // Format based on requested format
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="success-patterns-${Date.now()}.json"`);
      res.write(`{"exported_at":${JSON.stringify(new Date().toISOString())},`);
      res.write(`"user_id":${JSON.stringify(userId)},`);
      res.write(`"pattern_count":${patternCount || 0},`);
      res.write('"patterns":[');

      let cursor: ExportCursor | null = null;
      let first = true;

      while (true) {
        let query = supabase
          .from('success_patterns')
          .select(
            'id, created_at, pattern_type, pattern_description, context, outcome, success_factors, usage_count, success_rate'
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(EXPORT_BATCH_SIZE);

        if (cursor) {
          query = query.or(buildKeysetFilter(cursor));
        }

        const { data, error } = await query;

        if (error) {
          endStreamWithError(res, 'Failed to fetch success patterns', error, { userId });
          return;
        }

        if (!data || data.length === 0) {
          break;
        }

        for (const pattern of data) {
          if (!first) {
            res.write(',');
          }
          first = false;
          res.write(
            JSON.stringify({
              pattern_type: pattern.pattern_type,
              pattern_description: pattern.pattern_description,
              context: pattern.context,
              outcome: pattern.outcome,
              success_factors: pattern.success_factors,
              usage_count: pattern.usage_count,
              success_rate: pattern.success_rate,
              created_at: pattern.created_at,
            })
          );
        }

        if (data.length < EXPORT_BATCH_SIZE) {
          break;
        }

        const last = data[data.length - 1];
        cursor = { createdAt: last.created_at, id: last.id };
      }

      res.write('],');
      res.write(
        `"note":${JSON.stringify(
          'This export contains success patterns but loses pattern recognition capabilities. Pattern signatures and success factors are proprietary.'
        )}`
      );
      res.write('}');
      return res.end();
    } else if (format === 'yaml') {
      res.setHeader('Content-Type', 'text/yaml');
      res.setHeader('Content-Disposition', `attachment; filename="success-patterns-${Date.now()}.yaml"`);
      res.write(`# Success Patterns Export
# Exported: ${new Date().toISOString()}
# User ID: ${userId}
# Pattern Count: ${patternCount || 0}
# Note: This export loses pattern recognition capabilities

patterns:
`);

      let cursor: ExportCursor | null = null;

      while (true) {
        let query = supabase
          .from('success_patterns')
          .select(
            'id, created_at, pattern_type, pattern_description, context, outcome, success_factors, usage_count, success_rate'
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(EXPORT_BATCH_SIZE);

        if (cursor) {
          query = query.or(buildKeysetFilter(cursor));
        }

        const { data, error } = await query;

        if (error) {
          endStreamWithError(res, 'Failed to fetch success patterns', error, { userId });
          return;
        }

        if (!data || data.length === 0) {
          break;
        }

        data.forEach((pattern) => {
          res.write(`  - type: ${pattern.pattern_type}
    description: ${pattern.pattern_description}
    context: ${pattern.context}
    outcome: ${pattern.outcome}
    success_factors: ${JSON.stringify(pattern.success_factors)}
    usage_count: ${pattern.usage_count}
    success_rate: ${pattern.success_rate}
    created_at: ${pattern.created_at}
`);
        });

        if (data.length < EXPORT_BATCH_SIZE) {
          break;
        }

        const last = data[data.length - 1];
        cursor = { createdAt: last.created_at, id: last.id };
      }
      return res.end();
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

    let countQuery = supabase
      .from('agent_runs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (startDate) {
      countQuery = countQuery.gte('created_at', startDate);
    }
    if (endDate) {
      countQuery = countQuery.lte('created_at', endDate);
    }

    const { count: recordCount, error: countError } = await countQuery;

    if (countError) {
      endStreamWithError(res, 'Failed to fetch audit trails', countError, { userId });
      return;
    }

    // Format based on requested format
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-trails-${Date.now()}.json"`);
      res.write(`{"exported_at":${JSON.stringify(new Date().toISOString())},`);
      res.write(`"user_id":${JSON.stringify(userId)},`);
      res.write(`"record_count":${recordCount || 0},`);
      res.write(`"date_range":{"start":${JSON.stringify(startDate || 'all')},"end":${JSON.stringify(endDate || 'all')}},`);
      res.write('"records":[');

      let cursor: ExportCursor | null = null;
      let first = true;

      while (true) {
        let query = supabase
          .from('agent_runs')
          .select('id, user_id, input, output, template_id, created_at, safety_checks_passed, safety_check_results')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(EXPORT_BATCH_SIZE);

        if (startDate) {
          query = query.gte('created_at', startDate);
        }
        if (endDate) {
          query = query.lte('created_at', endDate);
        }
        if (cursor) {
          query = query.or(buildKeysetFilter(cursor));
        }

        const { data, error } = await query;

        if (error) {
          endStreamWithError(res, 'Failed to fetch audit trails', error, { userId });
          return;
        }

        if (!data || data.length === 0) {
          break;
        }

        for (const run of data) {
          if (!first) {
            res.write(',');
          }
          first = false;
          res.write(
            JSON.stringify({
              id: run.id,
              user_id: run.user_id,
              input: run.input,
              output: run.output,
              template_id: run.template_id,
              created_at: run.created_at,
              safety_checks_passed: run.safety_checks_passed,
              safety_check_results: run.safety_check_results,
            })
          );
        }

        if (data.length < EXPORT_BATCH_SIZE) {
          break;
        }

        const last = data[data.length - 1];
        cursor = { createdAt: last.created_at, id: last.id };
      }

      res.write('],');
      res.write(`"note":${JSON.stringify('This export contains full audit trail data for compliance purposes.')}`);
      res.write('}');
      return res.end();
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-trails-${Date.now()}.csv"`);
      writeCsvRow(res, [
        'Run ID',
        'User ID',
        'Input',
        'Output',
        'Template ID',
        'Safety Checks Passed',
        'Created At',
      ]);

      let cursor: ExportCursor | null = null;

      while (true) {
        let query = supabase
          .from('agent_runs')
          .select('id, user_id, input, output, template_id, created_at, safety_checks_passed')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(EXPORT_BATCH_SIZE);

        if (startDate) {
          query = query.gte('created_at', startDate);
        }
        if (endDate) {
          query = query.lte('created_at', endDate);
        }
        if (cursor) {
          query = query.or(buildKeysetFilter(cursor));
        }

        const { data, error } = await query;

        if (error) {
          endStreamWithError(res, 'Failed to fetch audit trails', error, { userId });
          return;
        }

        if (!data || data.length === 0) {
          break;
        }

        data.forEach((run) => {
          writeCsvRow(res, [
            run.id,
            run.user_id,
            JSON.stringify(run.input).substring(0, 100),
            JSON.stringify(run.output).substring(0, 100),
            run.template_id || '',
            run.safety_checks_passed ? 'true' : 'false',
            run.created_at,
          ]);
        });

        if (data.length < EXPORT_BATCH_SIZE) {
          break;
        }

        const last = data[data.length - 1];
        cursor = { createdAt: last.created_at, id: last.id };
      }
      return res.end();
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
    const [failureCount, successCount, auditCount] = await Promise.all([
      supabase.from('failure_patterns').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('success_patterns').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('agent_runs').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    if (failureCount.error || successCount.error || auditCount.error) {
      endStreamWithError(res, 'Failed to fetch export data', new Error('Export count query failed'), { userId });
      return;
    }

    const failurePatternsCount = failureCount.count || 0;
    const successPatternsCount = successCount.count || 0;
    const auditTrailsCount = auditCount.count || 0;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="institutional-memory-${Date.now()}.json"`);
    res.write(`{"exported_at":${JSON.stringify(new Date().toISOString())},`);
    res.write(`"user_id":${JSON.stringify(userId)},`);

    res.write(`"failure_patterns":{"count":${failurePatternsCount},"patterns":[`);
    let cursor: ExportCursor | null = null;
    let first = true;

    while (true) {
      let query = supabase
        .from('failure_patterns')
        .select(
          'id, created_at, pattern_type, pattern_description, failure_reason, prevention_rule, severity, occurrence_count'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(EXPORT_BATCH_SIZE);

      if (cursor) {
        query = query.or(buildKeysetFilter(cursor));
      }

      const { data, error } = await query;

      if (error) {
        endStreamWithError(res, 'Failed to fetch failure patterns', error, { userId });
        return;
      }

      if (!data || data.length === 0) {
        break;
      }

      for (const pattern of data) {
        if (!first) {
          res.write(',');
        }
        first = false;
        res.write(
          JSON.stringify({
            pattern_type: pattern.pattern_type,
            pattern_description: pattern.pattern_description,
            failure_reason: pattern.failure_reason,
            prevention_rule: pattern.prevention_rule,
            severity: pattern.severity,
            occurrence_count: pattern.occurrence_count,
            created_at: pattern.created_at,
          })
        );
      }

      if (data.length < EXPORT_BATCH_SIZE) {
        break;
      }

      const last = data[data.length - 1];
      cursor = { createdAt: last.created_at, id: last.id };
    }

    res.write('],');
    res.write(
      `"note":${JSON.stringify('Partial value - loses pattern matching capabilities')}},`
    );

    res.write(`"success_patterns":{"count":${successPatternsCount},"patterns":[`);
    cursor = null;
    first = true;

    while (true) {
      let query = supabase
        .from('success_patterns')
        .select(
          'id, created_at, pattern_type, pattern_description, context, outcome, success_factors, usage_count, success_rate'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(EXPORT_BATCH_SIZE);

      if (cursor) {
        query = query.or(buildKeysetFilter(cursor));
      }

      const { data, error } = await query;

      if (error) {
        endStreamWithError(res, 'Failed to fetch success patterns', error, { userId });
        return;
      }

      if (!data || data.length === 0) {
        break;
      }

      for (const pattern of data) {
        if (!first) {
          res.write(',');
        }
        first = false;
        res.write(
          JSON.stringify({
            pattern_type: pattern.pattern_type,
            pattern_description: pattern.pattern_description,
            context: pattern.context,
            outcome: pattern.outcome,
            success_factors: pattern.success_factors,
            usage_count: pattern.usage_count,
            success_rate: pattern.success_rate,
            created_at: pattern.created_at,
          })
        );
      }

      if (data.length < EXPORT_BATCH_SIZE) {
        break;
      }

      const last = data[data.length - 1];
      cursor = { createdAt: last.created_at, id: last.id };
    }

    res.write('],');
    res.write(
      `"note":${JSON.stringify('Partial value - loses pattern recognition capabilities')}},`
    );

    res.write(`"audit_trails":{"count":${auditTrailsCount},"records":[`);
    cursor = null;
    first = true;

    while (true) {
      let query = supabase
        .from('agent_runs')
        .select('id, user_id, input, output, template_id, created_at, safety_checks_passed')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(EXPORT_BATCH_SIZE);

      if (cursor) {
        query = query.or(buildKeysetFilter(cursor));
      }

      const { data, error } = await query;

      if (error) {
        endStreamWithError(res, 'Failed to fetch audit trails', error, { userId });
        return;
      }

      if (!data || data.length === 0) {
        break;
      }

      for (const run of data) {
        if (!first) {
          res.write(',');
        }
        first = false;
        res.write(
          JSON.stringify({
            id: run.id,
            user_id: run.user_id,
            input: run.input,
            output: run.output,
            template_id: run.template_id,
            created_at: run.created_at,
            safety_checks_passed: run.safety_checks_passed,
          })
        );
      }

      if (data.length < EXPORT_BATCH_SIZE) {
        break;
      }

      const last = data[data.length - 1];
      cursor = { createdAt: last.created_at, id: last.id };
    }

    res.write('],');
    res.write(`"note":${JSON.stringify('Full value - complete audit trail for compliance')}},`);

    res.write('"institutional_memory_value":{');
    res.write(`"failure_patterns_value":${failurePatternsCount * 10},`);
    res.write(`"success_patterns_value":${successPatternsCount * 5},`);
    res.write(`"audit_trails_value":${auditTrailsCount},`);
    res.write(
      `"total_value":${failurePatternsCount * 10 + successPatternsCount * 5 + auditTrailsCount},`
    );
    res.write(
      `"note":${JSON.stringify(
        'Estimated value of institutional memory. Switching to alternatives loses this value.'
      )}`
    );
    res.write('}}');
    return res.end();
  })
);

export { router as exportRouter };
