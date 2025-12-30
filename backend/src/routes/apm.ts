import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { apmService } from '../services/apmService.js';
import { errorTrackingService } from '../services/errorTrackingService.js';

const router = Router();

/**
 * Get performance statistics
 * GET /apm/performance
 */
router.get(
  '/performance',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Check admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { endpoint, hours } = req.query;
    const hoursNum = hours ? parseInt(hours as string, 10) : 24;

    const stats = await apmService.getPerformanceStats(
      endpoint as string | undefined,
      hoursNum
    );

    res.json(stats);
  })
);

/**
 * Get error statistics
 * GET /apm/errors
 */
router.get(
  '/errors',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Check admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { hours } = req.query;
    const hoursNum = hours ? parseInt(hours as string, 10) : 24;

    const stats = await apmService.getErrorStats(hoursNum);
    const groups = await errorTrackingService.getErrorGroups(hoursNum);
    const budget = await errorTrackingService.checkErrorBudget('hour');

    res.json({
      ...stats,
      groups,
      budget,
    });
  })
);

export { router as apmRouter };
