/**
 * CI/CD Integration Routes
 * 
 * Core defensive moat: CI/CD integration creates mandatory usage.
 * Automatic PR comments with security/compliance checks, merge blocking on failures.
 */

import { Router } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validation.js';
import { safetyEnforcementService } from '../services/safetyEnforcementService.js';
import { failurePatternService } from '../services/failurePatternService.js';
import { logger } from '../utils/logger.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const prCheckSchema = z.object({
  prId: z.string(),
  repo: z.string(),
  branch: z.string(),
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    additions: z.number().optional(),
    deletions: z.number().optional(),
  })),
  commitMessages: z.array(z.string()).optional(),
  userId: z.string().optional(), // Optional for webhook calls
});

/**
 * POST /cicd/pr-check
 * Check PR for security/compliance issues
 */
router.post(
  '/pr-check',
  authMiddleware,
  validateBody(prCheckSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.body.userId || req.userId!;
    const { prId, repo, branch, files, commitMessages } = req.body;

    const checks: Array<{
      file: string;
      passed: boolean;
      blocked: boolean;
      warnings: Array<{
        type: string;
        severity: string;
        message: string;
        line?: number;
      }>;
    }> = [];

    let overallPassed = true;
    let overallBlocked = false;
    const allWarnings: Array<{
      file: string;
      type: string;
      severity: string;
      message: string;
      line?: number;
    }> = [];

    // Check each file
    for (const file of files) {
      const safetyCheck = await safetyEnforcementService.checkOutput(file.content, {
        outputType: 'code',
        userId,
      });

      // Check for similar failures
      const failureMatches = await failurePatternService.checkForSimilarFailures(
        userId,
        file.content,
        { repo, branch, filePath: file.path }
      );

      const fileWarnings = [
        ...safetyCheck.warnings.map(w => ({
          file: file.path,
          type: w.type,
          severity: w.severity,
          message: w.message,
        })),
        ...failureMatches
          .filter(m => m.match_confidence > 0.7)
          .map(m => ({
            file: file.path,
            type: 'similar_failure',
            severity: 'high' as const,
            message: 'This code is similar to a previous failure pattern.',
          })),
      ];

      const fileBlocked = safetyCheck.blocked || failureMatches.some(m => m.match_confidence > 0.9);

      checks.push({
        file: file.path,
        passed: safetyCheck.passed && failureMatches.length === 0,
        blocked: fileBlocked,
        warnings: fileWarnings,
      });

      if (!safetyCheck.passed) {
        overallPassed = false;
      }

      if (fileBlocked) {
        overallBlocked = true;
      }

      allWarnings.push(...fileWarnings);
    }

    // Generate PR comment
    const comment = generatePRComment({
      passed: overallPassed,
      blocked: overallBlocked,
      checks,
      warnings: allWarnings,
      repo,
      branch,
    });

    // Store check result
    await supabase
      .from('agent_runs')
      .insert({
        user_id: userId,
        trigger: 'cicd_pr_check',
        trigger_data: {
          prId,
          repo,
          branch,
          checks,
        },
        agent_type: 'orchestrator',
        generated_content: {
          comment,
          checks,
          blocked: overallBlocked,
        },
        safety_checks_passed: overallPassed,
        safety_check_results: {
          checks,
          warnings: allWarnings,
        },
      });

    res.json({
      passed: overallPassed,
      blocked: overallBlocked,
      checks,
      comment,
      warnings: allWarnings,
    });
  })
);

/**
 * POST /cicd/webhook
 * GitHub webhook endpoint for automatic PR checks
 */
router.post(
  '/webhook',
  // Note: This should use webhook signature verification in production
  asyncHandler(async (req, res) => {
    const event = req.headers['x-github-event'];
    const payload = req.body;

    if (event === 'pull_request' && payload.action === 'opened') {
      const pr = payload.pull_request;
      const repo = payload.repository.full_name;
      const branch = pr.head.ref;

      // Get PR files (would need GitHub API call in production)
      // For now, return structure
      res.json({
        message: 'PR check initiated',
        prId: pr.id.toString(),
        repo,
        branch,
        note: 'Use POST /cicd/pr-check with file contents for full check',
      });
    } else {
      res.json({ message: 'Event not handled', event });
    }
  })
);

/**
 * GET /cicd/status/:prId
 * Get status of PR check
 */
router.get(
  '/status/:prId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { prId } = req.params;

    const { data: runs } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('user_id', userId)
      .eq('trigger', 'cicd_pr_check')
      .contains('trigger_data', { prId })
      .order('created_at', { ascending: false })
      .limit(1);

    if (!runs || runs.length === 0) {
      return res.status(404).json({ error: 'PR check not found' });
    }

    const run = runs[0];
    const result = run.generated_content as any;

    res.json({
      prId,
      passed: run.safety_checks_passed,
      blocked: result?.blocked || false,
      checks: result?.checks || [],
      comment: result?.comment || '',
      createdAt: run.created_at,
    });
  })
);

function generatePRComment(params: {
  passed: boolean;
  blocked: boolean;
  checks: Array<{
    file: string;
    passed: boolean;
    blocked: boolean;
    warnings: Array<{
      type: string;
      severity: string;
      message: string;
    }>;
  }>;
  warnings: Array<{
    file: string;
    type: string;
    severity: string;
    message: string;
  }>;
  repo: string;
  branch: string;
}): string {
  const { passed, blocked, checks, warnings } = params;

  let comment = '## 🔒 Keys Security & Compliance Check\n\n';

  if (blocked) {
    comment += '❌ **BLOCKED** - This PR contains critical security or compliance issues and cannot be merged.\n\n';
  } else if (!passed) {
    comment += '⚠️ **WARNINGS** - This PR has security/compliance warnings. Review before merging.\n\n';
  } else {
    comment += '✅ **PASSED** - All security and compliance checks passed.\n\n';
  }

  // Summary
  const criticalWarnings = warnings.filter(w => w.severity === 'critical');
  const highWarnings = warnings.filter(w => w.severity === 'high');
  const mediumWarnings = warnings.filter(w => w.severity === 'medium');
  const lowWarnings = warnings.filter(w => w.severity === 'low');

  comment += '### Summary\n\n';
  comment += `- Files checked: ${checks.length}\n`;
  comment += `- Critical issues: ${criticalWarnings.length}\n`;
  comment += `- High severity: ${highWarnings.length}\n`;
  comment += `- Medium severity: ${mediumWarnings.length}\n`;
  comment += `- Low severity: ${lowWarnings.length}\n\n`;

  // File-by-file breakdown
  if (checks.length > 0) {
    comment += '### File Checks\n\n';
    checks.forEach(check => {
      const status = check.blocked ? '❌ BLOCKED' : check.passed ? '✅ PASSED' : '⚠️ WARNINGS';
      comment += `#### ${check.file} - ${status}\n\n`;

      if (check.warnings.length > 0) {
        check.warnings.forEach(warning => {
          const emoji = warning.severity === 'critical' ? '🔴' : warning.severity === 'high' ? '🟠' : warning.severity === 'medium' ? '🟡' : '🟢';
          comment += `${emoji} **${warning.type.toUpperCase()}** (${warning.severity}): ${warning.message}\n\n`;
        });
      }
    });
  }

  // Recommendations
  if (criticalWarnings.length > 0 || highWarnings.length > 0) {
    comment += '### Recommendations\n\n';
    comment += '1. Review all critical and high-severity warnings\n';
    comment += '2. Fix security vulnerabilities before merging\n';
    comment += '3. Ensure compliance with GDPR/SOC 2 requirements\n';
    comment += '4. Consider running additional security scans\n\n';
  }

  comment += '---\n';
  comment += '*Powered by Keys - Your institutional memory prevents failures before they happen.*';

  return comment;
}

export { router as cicdIntegrationRouter };
