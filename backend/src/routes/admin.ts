import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// All admin routes require authentication
router.use(authMiddleware);

/**
 * GET /admin/atoms - List all prompt atoms
 */
router.get('/atoms', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { category, active } = req.query;

    let query = supabase.from('prompt_atoms').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    if (active !== undefined) {
      query = query.eq('active', active === 'true');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching atoms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /admin/atoms - Create new atom
 */
router.post('/atoms', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const atom = req.body;

    const { data, error } = await supabase
      .from('prompt_atoms')
      .insert(atom)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating atom:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /admin/atoms/:id - Update atom
 */
router.patch('/atoms/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('prompt_atoms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating atom:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /admin/atoms/:id - Delete atom
 */
router.delete('/atoms/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('prompt_atoms').delete().eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting atom:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /admin/analytics - Get analytics data
 */
router.get('/analytics', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Get run statistics
    const { data: runs } = await supabase
      .from('agent_runs')
      .select('*')
      .gte('created_at', startDate.toISOString());

    const totalRuns = runs?.length || 0;
    const approvedRuns = runs?.filter((r) => r.user_feedback === 'approved').length || 0;
    const totalCost = runs?.reduce((sum, r) => sum + (r.cost_usd || 0), 0) || 0;
    const totalTokens = runs?.reduce((sum, r) => sum + (r.tokens_used || 0), 0) || 0;

    // Get user statistics
    const { data: profiles } = await supabase.from('user_profiles').select('user_id');

    // Get atom statistics
    const { data: atoms } = await supabase
      .from('prompt_atoms')
      .select('id, success_rate, usage_count');

    const avgSuccessRate =
      atoms && atoms.length > 0
        ? atoms.reduce((sum, a) => sum + (a.success_rate || 0), 0) / atoms.length
        : 0;

    res.json({
      period: {
        days: Number(days),
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      runs: {
        total: totalRuns,
        approved: approvedRuns,
        approvalRate: totalRuns > 0 ? (approvedRuns / totalRuns) * 100 : 0,
      },
      cost: {
        total: totalCost,
        average: totalRuns > 0 ? totalCost / totalRuns : 0,
        tokens: totalTokens,
      },
      users: {
        total: profiles?.length || 0,
      },
      atoms: {
        total: atoms?.length || 0,
        averageSuccessRate: avgSuccessRate,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /admin/profiles - List all user profiles
 */
router.get('/profiles', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { role, vertical, limit = 100 } = req.query;

    let query = supabase.from('user_profiles').select('*');

    if (role) {
      query = query.eq('role', role);
    }

    if (vertical) {
      query = query.eq('vertical', vertical);
    }

    const { data, error } = await query.limit(Number(limit)).order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as adminRouter };
