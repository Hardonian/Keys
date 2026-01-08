import { Router } from 'express';
import { z } from 'zod';
import { orchestrateAgent } from '../services/agentOrchestration.js';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PromptAssemblyResult } from '../types/index.js';
import { telemetryService } from '../services/telemetryService.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { entitlementsMiddleware } from '../middleware/entitlements.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validation.js';
import { checkLimit, trackUsage } from '../services/usageMetering.js';
import { RateLimitError } from '../types/errors.js';
import { failurePatternService } from '../services/failurePatternService.js';
import { safetyEnforcementService } from '../services/safetyEnforcementService.js';

const router = Router();

let supabaseClient: SupabaseClient<any> | null = null;
function getSupabaseAdminClient() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // In non-production environments/tests, allow mocking createClient() without requiring env.
    supabaseClient = createClient<any>(url || 'http://127.0.0.1:54321', key || 'test-service-role') as SupabaseClient<any>;
    return supabaseClient;
  }
  supabaseClient = createClient<any>(url, key) as SupabaseClient<any>;
  return supabaseClient;
}

const orchestrateAgentSchema = z.object({
  assembledPrompt: z.object({
    systemPrompt: z.string().min(1),
    userPrompt: z.string().optional(),
    selectedAtomIds: z.array(z.string().uuid()).optional(),
    context: z.record(z.any()).optional(),
  }),
  taskIntent: z.string().optional(),
  naturalLanguageInput: z.string().min(1).max(10000),
});

router.post(
  '/',
  authMiddleware,
  validateBody(orchestrateAgentSchema),
  entitlementsMiddleware({ checkUsageLimit: true }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!; // Always use authenticated user ID
    const { assembledPrompt, taskIntent, naturalLanguageInput } = req.body;

    // Check usage limits before processing
    const usageCheck = await checkLimit(userId, 'runs', 1);
    if (!usageCheck.allowed) {
      const error = new RateLimitError(
        `Usage limit exceeded. You have used ${usageCheck.current}/${usageCheck.limit} runs this month. Please upgrade your plan to continue.`
      );
      error.context = {
        current: usageCheck.current,
        limit: usageCheck.limit,
        remaining: usageCheck.remaining,
        metricType: 'runs',
      };
      throw error;
    }

    const startTime = Date.now();

    // Apply failure prevention rules (defensive moat: institutional memory)
    const preventionRules = await failurePatternService.getPreventionRules(
      userId,
      assembledPrompt.context
    );
    
    // Enhance system prompt with prevention rules
    const enhancedSystemPrompt = preventionRules.length > 0
      ? `${assembledPrompt.systemPrompt}\n\n## Prevention Rules (Based on Past Failures):\n${preventionRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}`
      : assembledPrompt.systemPrompt;

    const enhancedPrompt: PromptAssemblyResult = {
      ...assembledPrompt,
      systemPrompt: enhancedSystemPrompt,
    };

    // Orchestrate agent
    const output = await orchestrateAgent(
      enhancedPrompt,
      taskIntent || naturalLanguageInput,
      naturalLanguageInput
    );

    const latencyMs = Date.now() - startTime;

    // Safety enforcement (defensive moat: transfer risk to Keys)
    const outputContent = typeof output.content === 'string' 
      ? output.content 
      : JSON.stringify(output.content);

    const safetyCheck = await safetyEnforcementService.checkOutput(outputContent, {
      outputType: output.outputType,
      templateId: assembledPrompt.context?.templateId,
      userId,
    });

    // Block output if critical security/compliance issues detected
    if (safetyCheck.blocked) {
      const criticalWarnings = safetyCheck.warnings.filter(w => w.severity === 'critical');
      return res.status(400).json({
        error: 'Output blocked due to security or compliance issues',
        message: 'This output contains critical security or compliance vulnerabilities and cannot be generated.',
        warnings: criticalWarnings,
        checks: {
          security: safetyCheck.checks.security,
          compliance: safetyCheck.checks.compliance,
        },
      });
    }

    // Add safety warnings to output
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

    // Check for similar failures (defensive moat: prevent repeat mistakes)
    const failureMatches = await failurePatternService.checkForSimilarFailures(
      userId,
      outputContent,
      assembledPrompt.context
    );

    // If high-confidence failure match detected, warn user
    const criticalMatches = failureMatches.filter(m => m.match_confidence > 0.8 && m.match_type === 'exact');
    if (criticalMatches.length > 0) {
      // Add warning to output
      output.warnings = output.warnings || [];
      output.warnings.push({
        type: 'similar_failure_detected',
        message: `This output is similar to a previous failure. Review carefully before using.`,
        patternIds: criticalMatches.map(m => m.pattern_id),
      });
    }

    // Log agent run with safety check results
    const { data: run } = await getSupabaseAdminClient()
      .from('agent_runs')
      .insert({
        user_id: userId,
        trigger: 'chat_input',
        assembled_prompt: enhancedPrompt.systemPrompt,
        selected_atoms: assembledPrompt.selectedAtomIds,
        vibe_config_snapshot: assembledPrompt.context,
        agent_type: 'orchestrator',
        model_used: output.modelUsed,
        generated_content: output.content,
        tokens_used: output.tokensUsed,
        latency_ms: latencyMs,
        cost_usd: output.costUsd,
        safety_checks_passed: safetyCheck.passed,
        safety_check_results: {
          security: safetyCheck.checks.security,
          compliance: safetyCheck.checks.compliance,
          quality: safetyCheck.checks.quality,
        },
      })
      .select()
      .single();

    // Track telemetry and usage
    if (run) {
      await telemetryService.trackChatMessage(userId, naturalLanguageInput.length);
      if (output.costUsd && output.tokensUsed) {
        await telemetryService.trackCost(userId, output.costUsd, output.tokensUsed);
        // Track token usage
        await trackUsage(userId, 'tokens', output.tokensUsed).catch((err) => {
          // Log but don't fail the request if usage tracking fails
          console.error('Failed to track token usage:', err);
        });
      }
      // Track run usage (already checked limit above)
      await trackUsage(userId, 'runs', 1).catch((err) => {
        console.error('Failed to track run usage:', err);
      });
    }

    res.json(output);
  })
);

export { router as orchestrateAgentRouter };
