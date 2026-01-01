/**
 * Feedback Route
 * 
 * Tracks user feedback on agent outputs to build failure memory.
 * This is critical for the defensive moat: institutional memory.
 */

import { Router } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validation.js';
import { failurePatternService } from '../services/failurePatternService.js';
import { logger } from '../utils/logger.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const feedbackSchema = z.object({
  runId: z.string().uuid(),
  feedback: z.enum(['approved', 'rejected', 'revised']),
  feedbackDetail: z.string().optional(),
  failureType: z.enum(['security', 'quality', 'compliance', 'performance', 'architecture', 'best_practice', 'user_rejection', 'user_revision']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

router.post(
  '/',
  authMiddleware,
  validateBody(feedbackSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { runId, feedback, feedbackDetail, failureType, severity } = req.body;

    // Get the agent run
    const { data: run, error: runError } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('id', runId)
      .eq('user_id', userId)
      .single();

    if (runError || !run) {
      return res.status(404).json({ error: 'Agent run not found' });
    }

    // Update agent run with feedback
    await supabase
      .from('agent_runs')
      .update({
        user_feedback: feedback,
        feedback_detail: feedbackDetail,
      })
      .eq('id', runId);

    // If rejected or revised, record as failure pattern
    if (feedback === 'rejected' || feedback === 'revised') {
      const outputContent = typeof run.generated_content === 'string'
        ? run.generated_content
        : JSON.stringify(run.generated_content);

      await failurePatternService.recordFailure(userId, {
        pattern_type: failureType || (feedback === 'rejected' ? 'user_rejection' : 'user_revision'),
        pattern_description: feedbackDetail || `User ${feedback} output`,
        original_output: outputContent,
        failure_reason: feedbackDetail || `User ${feedback} this output`,
        detected_in: run.trigger_data?.context || 'chat',
        context_snapshot: {
          template_id: run.vibe_config_snapshot?.template_id,
          vibe_config: run.vibe_config_snapshot,
          assembled_prompt: run.assembled_prompt,
        },
        severity: severity || (feedback === 'rejected' ? 'high' : 'medium'),
      });

      logger.info('Recorded failure pattern from user feedback', {
        userId,
        runId,
        feedback,
        failureType: failureType || (feedback === 'rejected' ? 'user_rejection' : 'user_revision'),
      });
    }

    // If approved and used in production, record as success pattern
    if (feedback === 'approved' && req.body.productionUsed) {
      const outputContent = typeof run.generated_content === 'string'
        ? run.generated_content
        : JSON.stringify(run.generated_content);

      await failurePatternService.recordSuccess(userId, {
        pattern_type: 'production_ready',
        pattern_description: 'Output approved and used in production',
        context: run.trigger_data?.context || 'chat',
        outcome: 'Successfully used in production',
        success_factors: ['user_approval', 'production_usage'],
        context_snapshot: {
          template_id: run.vibe_config_snapshot?.template_id,
          vibe_config: run.vibe_config_snapshot,
        },
        output_example: outputContent,
      });

      logger.info('Recorded success pattern from user approval', {
        userId,
        runId,
      });
    }

    res.json({ success: true, message: 'Feedback recorded' });
  })
);

export { router as feedbackRouter };
