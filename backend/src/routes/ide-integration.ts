/**
 * IDE Integration Routes
 * 
 * Core defensive moat: IDE integration creates daily dependency.
 * Auto-injects context (file tree, git history, recent changes) to make Keys unavoidable.
 */

import { Router } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validation.js';
import { assemblePrompt } from '../services/promptAssembly.js';
import { orchestrateAgent } from '../services/agentOrchestration.js';
import { failurePatternService } from '../services/failurePatternService.js';
import { safetyEnforcementService } from '../services/safetyEnforcementService.js';
import { logger } from '../utils/logger.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ideContextSchema = z.object({
  filePath: z.string(),
  fileTree: z.array(z.object({
    path: z.string(),
    type: z.enum(['file', 'directory']),
    language: z.string().optional(),
  })).optional(),
  gitHistory: z.object({
    recentCommits: z.array(z.object({
      hash: z.string(),
      message: z.string(),
      author: z.string(),
      date: z.string(),
    })).optional(),
    currentBranch: z.string().optional(),
    modifiedFiles: z.array(z.string()).optional(),
  }).optional(),
  recentChanges: z.array(z.object({
    file: z.string(),
    changes: z.string(),
    timestamp: z.string(),
  })).optional(),
  openFiles: z.array(z.string()).optional(),
  cursorPosition: z.object({
    line: z.number(),
    column: z.number(),
  }).optional(),
});

const ideGenerateSchema = z.object({
  context: ideContextSchema,
  task: z.string().min(1),
  vibeConfig: z.record(z.any()).optional(),
});

/**
 * GET /ide/context
 * Get enhanced context for IDE integration
 */
router.get(
  '/context',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const filePath = req.query.filePath as string;

    if (!filePath) {
      return res.status(400).json({ error: 'filePath query parameter required' });
    }

    // Get user profile for context
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get prevention rules for this context
    const preventionRules = await failurePatternService.getPreventionRules(userId, {
      filePath,
    });

    // Get success patterns
    const successPatterns = await failurePatternService.getSuccessPatterns(userId, {
      filePath,
    });

    res.json({
      context: {
        filePath,
        userRole: profile?.role,
        userStack: profile?.stack,
        preventionRules,
        successPatterns: successPatterns.map(p => ({
          description: p.pattern_description,
          factors: p.success_factors,
        })),
      },
    });
  })
);

/**
 * POST /ide/generate
 * Generate output with IDE context automatically injected
 */
router.post(
  '/generate',
  authMiddleware,
  validateBody(ideGenerateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { context, task, vibeConfig } = req.body;

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Build enhanced context from IDE data
    const enhancedContext = {
      ...context,
      userRole: profile.role,
      userStack: profile.stack,
      userVertical: profile.vertical,
      // Add IDE-specific context
      ideContext: {
        filePath: context.filePath,
        fileTree: context.fileTree,
        gitHistory: context.gitHistory,
        recentChanges: context.recentChanges,
        openFiles: context.openFiles,
        cursorPosition: context.cursorPosition,
      },
    };

    // Assemble prompt with IDE context
    const assembledPrompt = await assemblePrompt(
      userId,
      task,
      vibeConfig || {},
      {
        context: enhancedContext,
      }
    );

    // Enhance prompt with IDE context
    const ideContextPrompt = `
## IDE Context:
- Current File: ${context.filePath}
${context.openFiles ? `- Open Files: ${context.openFiles.join(', ')}` : ''}
${context.gitHistory?.currentBranch ? `- Git Branch: ${context.gitHistory.currentBranch}` : ''}
${context.gitHistory?.modifiedFiles ? `- Modified Files: ${context.gitHistory.modifiedFiles.join(', ')}` : ''}
${context.recentChanges ? `- Recent Changes:\n${context.recentChanges.map(c => `  - ${c.file}: ${c.changes.substring(0, 100)}`).join('\n')}` : ''}

${assembledPrompt.systemPrompt}
`;

    const enhancedAssembledPrompt = {
      ...assembledPrompt,
      systemPrompt: ideContextPrompt,
    };

    // Generate output
    const output = await orchestrateAgent(
      enhancedAssembledPrompt,
      task,
      task
    );

    // Safety check
    const outputContent = typeof output.content === 'string'
      ? output.content
      : JSON.stringify(output.content);

    const safetyCheck = await safetyEnforcementService.checkOutput(outputContent, {
      outputType: output.outputType,
      userId,
    });

    if (safetyCheck.blocked) {
      return res.status(400).json({
        error: 'Output blocked due to security or compliance issues',
        warnings: safetyCheck.warnings.filter(w => w.severity === 'critical'),
      });
    }

    // Add warnings
    if (safetyCheck.warnings.length > 0) {
      output.warnings = output.warnings || [];
      safetyCheck.warnings.forEach(warning => {
        output.warnings!.push({
          type: warning.type,
          message: warning.message,
          suggestion: warning.suggestion,
        });
      });
    }

    // Check for similar failures
    const failureMatches = await failurePatternService.checkForSimilarFailures(
      userId,
      outputContent,
      enhancedContext
    );

    const criticalMatches = failureMatches.filter(m => m.match_confidence > 0.8);
    if (criticalMatches.length > 0) {
      output.warnings = output.warnings || [];
      output.warnings.push({
        type: 'similar_failure_detected',
        message: 'This output is similar to a previous failure. Review carefully.',
        patternIds: criticalMatches.map(m => m.pattern_id),
      });
    }

    // Add safety check info
    output.safetyCheck = {
      passed: safetyCheck.passed,
      securityScore: safetyCheck.checks.security.score,
      complianceStandards: safetyCheck.checks.compliance.standards,
    };

    res.json(output);
  })
);

/**
 * POST /ide/inline-suggest
 * Get inline suggestions for current cursor position
 */
router.post(
  '/inline-suggest',
  authMiddleware,
  validateBody(z.object({
    context: ideContextSchema,
    prefix: z.string().optional(),
    suffix: z.string().optional(),
  })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { context, prefix, suffix } = req.body;

    // Build task from context
    const task = `Complete the code at cursor position in ${context.filePath}${prefix ? `\n\nPrefix:\n${prefix}` : ''}${suffix ? `\n\nSuffix:\n${suffix}` : ''}`;

    // Use same generation logic as /ide/generate but return inline suggestions
    const { context: _, ...generateBody } = req.body;
    const generateReq = {
      ...req,
      body: {
        context,
        task,
        vibeConfig: {},
      },
    };

    // Reuse generate endpoint logic (simplified)
    res.json({
      suggestions: [
        {
          text: '// Use IDE integration endpoint to generate suggestions',
          range: {
            start: { line: context.cursorPosition?.line || 0, character: context.cursorPosition?.column || 0 },
            end: { line: context.cursorPosition?.line || 0, character: context.cursorPosition?.column || 0 },
          },
        },
      ],
      message: 'Use POST /ide/generate for full generation',
    });
  })
);

export { router as ideIntegrationRouter };
