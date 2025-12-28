import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// All preset routes require authentication
router.use(authMiddleware);

/**
 * GET /presets/:userId - Get user's vibe presets
 */
router.get('/:userId', async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;

    // Verify user can access this resource
    if (req.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await supabase
      .from('vibe_configs')
      .select('id, name, playfulness, revenue_focus, investor_perspective, created_at, updated_at')
      .eq('user_id', userId)
      .not('name', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching presets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /presets/:userId - Create new preset
 */
router.post('/:userId', async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { name, playfulness, revenue_focus, investor_perspective, custom_instructions } = req.body;

    // Verify user can access this resource
    if (req.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Preset name is required' });
    }

    const { data, error } = await supabase
      .from('vibe_configs')
      .insert({
        user_id: userId,
        name,
        playfulness: playfulness ?? 50,
        revenue_focus: revenue_focus ?? 60,
        investor_perspective: investor_perspective ?? 40,
        custom_instructions,
        auto_suggest: true,
        approval_required: true,
        logging_level: 'standard',
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating preset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /presets/:id - Update preset
 */
router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get preset to verify ownership
    const { data: preset } = await supabase
      .from('vibe_configs')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    // Verify user can access this resource
    if (req.userId !== preset.user_id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await supabase
      .from('vibe_configs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating preset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /presets/:id - Delete preset
 */
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Get preset to verify ownership
    const { data: preset } = await supabase
      .from('vibe_configs')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    // Verify user can access this resource
    if (req.userId !== preset.user_id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error } = await supabase.from('vibe_configs').delete().eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting preset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as presetsRouter };
