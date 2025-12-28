import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { telemetryService } from '../services/telemetryService.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

router.post('/', async (req, res) => {
  try {
    const { runId, feedback, detail } = req.body;

    if (!runId || !feedback) {
      return res.status(400).json({
        error: 'Missing required fields: runId, feedback',
      });
    }

    // Update agent run with feedback
    const { data, error } = await supabase
      .from('agent_runs')
      .update({
        user_feedback: feedback,
        feedback_detail: detail,
      })
      .eq('id', runId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Update atom success rates based on feedback
    if (data.selected_atoms && feedback === 'approved') {
      // Increment usage count and update success rate for approved atoms
      for (const atomId of data.selected_atoms) {
        const { data: atom } = await supabase
          .from('prompt_atoms')
          .select('usage_count, success_rate')
          .eq('id', atomId)
          .single();

        if (atom) {
          const newUsageCount = (atom.usage_count || 0) + 1;
          // Simple moving average for success rate
          const newSuccessRate =
            ((atom.success_rate || 0.5) * (newUsageCount - 1) + 1) / newUsageCount;

          await supabase
            .from('prompt_atoms')
            .update({
              usage_count: newUsageCount,
              success_rate: newSuccessRate,
            })
            .eq('id', atomId);
        }
      }
    }

    // Track telemetry
    if (data.user_id) {
      const source = data.trigger === 'event' ? 'background' : 'manual';
      await telemetryService.trackSuggestionFeedback(
        data.user_id,
        runId,
        feedback,
        source
      );
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as feedbackRouter };
