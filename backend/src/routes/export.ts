/**
 * Export Routes
 * 
 * Core defensive moat: Export functionality makes data valuable outside Keys,
 * but leaving still loses convenience and accumulated value.
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /export/institutional-memory
 * Export all failure patterns, success patterns, and audit trail
 */
router.get(
  '/institutional-memory',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const format = (req.query.format as string) || 'json';

    // Get failure patterns
    const { data: failurePatterns } = await supabase
      .from('failure_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get success patterns
    const { data: successPatterns } = await supabase
      .from('success_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get audit trail (agent runs with safety checks)
    const { data: auditTrail } = await supabase
      .from('agent_runs')
      .select('id, created_at, trigger, agent_type, safety_checks_passed, safety_check_results, user_feedback')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000); // Last 1000 runs

    // Get pattern matches
    const { data: patternMatches } = await supabase
      .from('pattern_matches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      summary: {
        failurePatterns: failurePatterns?.length || 0,
        successPatterns: successPatterns?.length || 0,
        auditTrailEntries: auditTrail?.length || 0,
        patternMatches: patternMatches?.length || 0,
      },
      failurePatterns: failurePatterns || [],
      successPatterns: successPatterns || [],
      auditTrail: auditTrail || [],
      patternMatches: patternMatches || [],
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="keys-institutional-memory-${userId}-${Date.now()}.json"`);
      res.json(exportData);
    } else if (format === 'yaml') {
      // Convert to YAML (simplified - in production use proper YAML library)
      const yaml = convertToYAML(exportData);
      res.setHeader('Content-Type', 'text/yaml');
      res.setHeader('Content-Disposition', `attachment; filename="keys-institutional-memory-${userId}-${Date.now()}.yaml"`);
      res.send(yaml);
    } else {
      res.status(400).json({ error: 'Invalid format. Use "json" or "yaml"' });
    }
  })
);

/**
 * GET /export/failure-patterns
 * Export failure patterns as security rules (can be imported into other tools)
 */
router.get(
  '/failure-patterns',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const format = (req.query.format as string) || 'json';

    const { data: failurePatterns } = await supabase
      .from('failure_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('resolved', false)
      .order('severity', { ascending: false })
      .order('occurrence_count', { ascending: false });

    // Convert to security rules format
    const securityRules = (failurePatterns || []).map(pattern => ({
      id: pattern.id,
      name: pattern.pattern_description,
      type: pattern.pattern_type,
      severity: pattern.severity,
      pattern: pattern.pattern_signature,
      prevention: pattern.prevention_rule,
      promptAddition: pattern.prevention_prompt_addition,
      occurrenceCount: pattern.occurrence_count,
      lastOccurrence: pattern.last_occurrence,
    }));

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      format: 'security-rules',
      rules: securityRules,
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="keys-security-rules-${userId}-${Date.now()}.json"`);
      res.json(exportData);
    } else {
      res.status(400).json({ error: 'Invalid format. Use "json"' });
    }
  })
);

/**
 * GET /export/success-patterns
 * Export success patterns as templates (can be imported into other tools)
 */
router.get(
  '/success-patterns',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const format = (req.query.format as string) || 'json';

    const { data: successPatterns } = await supabase
      .from('success_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('success_rate', { ascending: false })
      .order('usage_count', { ascending: false });

    // Convert to templates format
    const templates = (successPatterns || []).map(pattern => ({
      id: pattern.id,
      name: pattern.pattern_description,
      type: pattern.pattern_type,
      context: pattern.context,
      outcome: pattern.outcome,
      successFactors: pattern.success_factors,
      outputExample: pattern.output_example,
      successRate: pattern.success_rate,
      usageCount: pattern.usage_count,
    }));

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      format: 'templates',
      templates,
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="keys-success-templates-${userId}-${Date.now()}.json"`);
      res.json(exportData);
    } else {
      res.status(400).json({ error: 'Invalid format. Use "json"' });
    }
  })
);

/**
 * GET /export/audit-trail
 * Export audit trail for compliance
 */
router.get(
  '/audit-trail',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const format = (req.query.format as string) || 'json';

    let query = supabase
      .from('agent_runs')
      .select('id, created_at, trigger, agent_type, safety_checks_passed, safety_check_results, user_feedback, feedback_detail')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: auditTrail } = await query.limit(10000); // Max 10k entries

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      format: 'audit-trail',
      period: {
        start: startDate || 'all',
        end: endDate || 'all',
      },
      entries: auditTrail || [],
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="keys-audit-trail-${userId}-${Date.now()}.json"`);
      res.json(exportData);
    } else if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(exportData.entries);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="keys-audit-trail-${userId}-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.status(400).json({ error: 'Invalid format. Use "json" or "csv"' });
    }
  })
);

function convertToYAML(obj: any, indent = 0): string {
  const indentStr = '  '.repeat(indent);
  let yaml = '';

  if (Array.isArray(obj)) {
    obj.forEach(item => {
      yaml += `${indentStr}- ${convertToYAML(item, indent + 1)}\n`;
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yaml += `${indentStr}${key}:\n${convertToYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${indentStr}${key}:\n${convertToYAML(value, indent + 1)}`;
      } else {
        yaml += `${indentStr}${key}: ${value}\n`;
      }
    });
  } else {
    return String(obj);
  }

  return yaml;
}

function convertToCSV(entries: any[]): string {
  if (!entries || entries.length === 0) {
    return 'id,created_at,trigger,agent_type,safety_checks_passed,user_feedback\n';
  }

  const headers = ['id', 'created_at', 'trigger', 'agent_type', 'safety_checks_passed', 'user_feedback'];
  const rows = entries.map(entry => [
    entry.id,
    entry.created_at,
    entry.trigger || '',
    entry.agent_type || '',
    entry.safety_checks_passed ? 'true' : 'false',
    entry.user_feedback || '',
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
}

export { router as exportRouter };
