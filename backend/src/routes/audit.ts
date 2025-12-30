import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { auditLogService } from '../services/auditLogService.js';

const router = Router();

// All audit routes require admin authentication
router.use(authMiddleware);
router.use(requireRole('admin', 'superadmin'));

/**
 * Get audit logs
 * GET /audit/logs
 */
router.get(
  '/logs',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      limit,
    } = req.query;

    const filters: any = {};
    if (userId) filters.userId = userId as string;
    if (action) filters.action = action as string;
    if (resourceType) filters.resourceType = resourceType as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string, 10);

    const logs = await auditLogService.getAuditLogs(filters);

    res.json({
      logs,
      count: logs.length,
    });
  })
);

export { router as auditRouter };
