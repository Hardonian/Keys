/**
 * Moat Metrics Routes
 * 
 * Endpoints for tracking defensive moat effectiveness
 */

import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { moatMetricsService } from '../services/moatMetricsService.js';

const router = Router();

/**
 * GET /moat-metrics
 * Get moat metrics for authenticated user
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const metrics = await moatMetricsService.getMoatMetrics(
      userId,
      startDate,
      endDate
    );

    res.json(metrics);
  })
);

export { router as moatMetricsRouter };
