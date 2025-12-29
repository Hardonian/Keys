import { Router } from 'express';
import { z } from 'zod';
import { orchestrateAgent } from '../services/agentOrchestration.js';
import { createClient } from '@supabase/supabase-js';
import type { PromptAssemblyResult } from '../types/index.js';
import { telemetryService } from '../services/telemetryService.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validation.js';
import { checkLimit, trackUsage } from '../services/usageMetering.js';
import { RateLimitError } from '../types/errors.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Orchestrate agent
    const output = await orchestrateAgent(
      assembledPrompt as PromptAssemblyResult,
      taskIntent || naturalLanguageInput,
      naturalLanguageInput
    );

    const latencyMs = Date.now() - startTime;

    // Log agent run
    const { data: run } = await supabase
      .from('agent_runs')
      .insert({
        user_id: userId,
        trigger: 'chat_input',
        assembled_prompt: assembledPrompt.systemPrompt,
        selected_atoms: assembledPrompt.selectedAtomIds,
        vibe_config_snapshot: assembledPrompt.context,
        agent_type: 'orchestrator',
        model_used: output.modelUsed,
        generated_content: output.content,
        tokens_used: output.tokensUsed,
        latency_ms: latencyMs,
        cost_usd: output.costUsd,
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
