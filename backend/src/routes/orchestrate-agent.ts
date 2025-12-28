import { Router } from 'express';
import { orchestrateAgent } from '../services/agentOrchestration.js';
import { createClient } from '@supabase/supabase-js';
import type { PromptAssemblyResult } from '../types/index.js';
import { telemetryService } from '../services/telemetryService.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

router.post('/', async (req, res) => {
  try {
    const { assembledPrompt, taskIntent, naturalLanguageInput, userId } = req.body;

    if (!assembledPrompt || !naturalLanguageInput) {
      return res.status(400).json({
        error: 'Missing required fields: assembledPrompt, naturalLanguageInput',
      });
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
    if (userId) {
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

      // Track telemetry
      if (run) {
        await telemetryService.trackChatMessage(userId, naturalLanguageInput.length);
        if (output.costUsd && output.tokensUsed) {
          await telemetryService.trackCost(userId, output.costUsd, output.tokensUsed);
        }
      }
    }

    res.json(output);
  } catch (error) {
    console.error('Error orchestrating agent:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export { router as orchestrateAgentRouter };
