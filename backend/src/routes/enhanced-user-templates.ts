/**
 * Enhanced User Templates API
 * 
 * Comprehensive API with all features: validation, testing, history, analytics, sharing, etc.
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { userTemplateService } from '../services/userTemplateService.js';
import { templateValidationService } from '../services/templateValidationService.js';
import { templateHistoryService } from '../services/templateHistoryService.js';
import { templateAnalyticsService } from '../services/templateAnalyticsService.js';
import { templateTestingService } from '../services/templateTestingService.js';
import { templateSearchService } from '../services/templateSearchService.js';
import { templateSharingService } from '../services/templateSharingService.js';
import { templatePresetService } from '../services/templatePresetService.js';
import { templateExportService } from '../services/templateExportService.js';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// All routes require authentication
router.use(authMiddleware);

// ============================================================================
// VALIDATION ENDPOINTS
// ============================================================================

/**
 * POST /user-templates/:templateId/validate
 * Validate customization before saving
 */
router.post(
  '/:templateId/validate',
  validateParams(z.object({ templateId: z.string() })),
  validateBody(
    z.object({
      customVariables: z.record(z.any()).optional(),
      customInstructions: z.string().optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { templateId } = req.params;
    const { customVariables = {}, customInstructions } = req.body;

    const validation = templateValidationService.validateCustomization(
      templateId,
      customVariables,
      customInstructions
    );

    // Get available variables
    const availableVariables = templateValidationService.getAvailableVariables(templateId);

    res.json({
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      availableVariables,
    });
  })
);

/**
 * GET /user-templates/:templateId/variables
 * Get available variables for a template
 */
router.get(
  '/:templateId/variables',
  validateParams(z.object({ templateId: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { templateId } = req.params;
    const variables = templateValidationService.getAvailableVariables(templateId);
    res.json({ variables });
  })
);

// ============================================================================
// TESTING ENDPOINTS
// ============================================================================

/**
 * POST /user-templates/:templateId/test
 * Test template customization without saving
 */
router.post(
  '/:templateId/test',
  validateParams(z.object({ templateId: z.string() })),
  validateBody(
    z.object({
      customVariables: z.record(z.any()).optional(),
      customInstructions: z.string().optional(),
      inputFilter: z.record(z.any()).optional(),
      taskDescription: z.string().optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId } = req.params;
    const { customVariables, customInstructions, inputFilter, taskDescription } = req.body;

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const testResult = await templateTestingService.testTemplateCustomization(
      templateId,
      profile || {},
      {
        customVariables,
        customInstructions,
        inputFilter,
        taskDescription,
      }
    );

    res.json(testResult);
  })
);

/**
 * POST /user-templates/:templateId/compare
 * Compare base and customized prompts
 */
router.post(
  '/:templateId/compare',
  validateParams(z.object({ templateId: z.string() })),
  validateBody(
    z.object({
      customVariables: z.record(z.any()).optional(),
      customInstructions: z.string().optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId } = req.params;
    const { customVariables, customInstructions } = req.body;

    // Get preview (has both base and customized)
    const preview = await userTemplateService.getTemplatePreview(userId, templateId);

    // Generate test prompt with customizations
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const testResult = await templateTestingService.testTemplateCustomization(
      templateId,
      profile || {},
      { customVariables, customInstructions }
    );

    // Compare base with test result
    const comparison = templateTestingService.comparePrompts(
      preview.basePrompt,
      testResult.renderedPrompt
    );

    res.json({
      basePrompt: preview.basePrompt,
      customizedPrompt: testResult.renderedPrompt,
      comparison,
      testResult,
    });
  })
);

// ============================================================================
// HISTORY ENDPOINTS
// ============================================================================

/**
 * GET /user-templates/:templateId/history
 * Get customization history
 */
router.get(
  '/:templateId/history',
  validateParams(z.object({ templateId: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId } = req.params;

    const history = await templateHistoryService.getCustomizationHistory(userId, templateId);
    res.json({ history });
  })
);

/**
 * POST /user-templates/:templateId/history/:historyId/rollback
 * Rollback to a specific history entry
 */
router.post(
  '/:templateId/history/:historyId/rollback',
  validateParams(
    z.object({
      templateId: z.string(),
      historyId: z.string(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId, historyId } = req.params;

    await templateHistoryService.rollbackToHistoryEntry(userId, templateId, historyId);

    const preview = await userTemplateService.getTemplatePreview(userId, templateId);
    res.json({
      message: 'Rolled back successfully',
      preview,
    });
  })
);

/**
 * GET /user-templates/:templateId/history/diff
 * Get diff between two history entries
 */
router.get(
  '/:templateId/history/diff',
  validateParams(z.object({ templateId: z.string() })),
  validateQuery(
    z.object({
      entryId1: z.string(),
      entryId2: z.string(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId } = req.params;
    const { entryId1, entryId2 } = req.query;

    const diff = await templateHistoryService.getHistoryDiff(
      userId,
      templateId,
      entryId1 as string,
      entryId2 as string
    );

    res.json(diff);
  })
);

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

/**
 * POST /user-templates/:templateId/analytics
 * Track template usage (Injection Event)
 */
router.post(
  '/:templateId/analytics',
  validateParams(z.object({ templateId: z.string() })),
  validateBody(
    z.object({
      success: z.boolean().optional(),
      tokens_used: z.number().optional(),
      latency_ms: z.number().optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId } = req.params;
    const { success, tokens_used, latency_ms } = req.body;

    await templateAnalyticsService.trackUsage(userId, templateId, {
      success,
      tokens_used,
      latency_ms,
    });

    res.json({ success: true });
  })
);

/**
 * GET /user-templates/:templateId/analytics
 * Get analytics for a template
 */
router.get(
  '/:templateId/analytics',
  validateParams(z.object({ templateId: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId } = req.params;

    const analytics = await templateAnalyticsService.getTemplateAnalytics(
      userId,
      templateId
    );
    res.json({ analytics });
  })
);

/**
 * GET /user-templates/analytics/stats
 * Get user's overall usage statistics
 */
router.get(
  '/analytics/stats',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const stats = await templateAnalyticsService.getUserUsageStats(userId);
    res.json({ stats });
  })
);

/**
 * POST /user-templates/:templateId/feedback
 * Submit feedback/rating for a template
 */
router.post(
  '/:templateId/feedback',
  validateParams(z.object({ templateId: z.string() })),
  validateBody(
    z.object({
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
      suggestions: z.string().optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId } = req.params;
    const { rating, comment, suggestions } = req.body;

    await templateAnalyticsService.submitFeedback(
      userId,
      templateId,
      rating,
      comment,
      suggestions
    );

    res.json({ message: 'Feedback submitted successfully' });
  })
);

/**
 * GET /user-templates/:templateId/feedback
 * Get feedback for a template
 */
router.get(
  '/:templateId/feedback',
  validateParams(z.object({ templateId: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { templateId } = req.params;
    const feedback = await templateAnalyticsService.getTemplateFeedback(templateId);
    res.json({ feedback });
  })
);

// ============================================================================
// SEARCH ENDPOINTS
// ============================================================================

/**
 * GET /user-templates/search
 * Search templates
 */
router.get(
  '/search',
  validateQuery(
    z.object({
      query: z.string().optional(),
      milestone: z.string().array().optional(),
      tags: z.string().array().optional(),
      stack: z.string().array().optional(),
      priority: z.string().array().optional(),
      security_level: z.string().array().optional(),
      optimization_level: z.string().array().optional(),
      hasCustomization: z.boolean().optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const filters: any = { ...req.query, userId };

    // Parse array query params
    const parseArray = (value: string | string[] | undefined): string[] | undefined => {
      if (!value) return undefined;
      if (Array.isArray(value)) return value;
      return value.split(',').map((v) => v.trim()).filter(Boolean);
    };

    filters.milestone = parseArray(filters.milestone);
    filters.tags = parseArray(filters.tags);
    filters.stack = parseArray(filters.stack);
    filters.priority = parseArray(filters.priority);
    filters.security_level = parseArray(filters.security_level);
    filters.optimization_level = parseArray(filters.optimization_level);

    const results = await templateSearchService.searchTemplates(filters);
    res.json({ results, count: results.length });
  })
);

/**
 * GET /user-templates/recommended
 * Get recommended templates for user
 */
router.get(
  '/recommended',
  validateQuery(
    z.object({
      limit: z.string().transform(Number).optional(),
      basedOnUsage: z.string().transform((v) => v === 'true').optional(),
      basedOnStack: z.string().transform((v) => v === 'true').optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { limit, basedOnUsage, basedOnStack } = req.query;

    const recommended = await templateSearchService.getRecommendedTemplates(userId, {
      limit: limit as number | undefined,
      basedOnUsage: basedOnUsage as boolean | undefined,
      basedOnStack: basedOnStack as boolean | undefined,
    });

    res.json({ recommended });
  })
);

/**
 * GET /user-templates/popular
 * Get popular templates
 */
router.get(
  '/popular',
  validateQuery(z.object({ limit: z.string().transform(Number).optional() })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { limit } = req.query;
    const popular = await templateSearchService.getPopularTemplates(limit as number | undefined);
    res.json({ popular });
  })
);

// ============================================================================
// SHARING ENDPOINTS
// ============================================================================

/**
 * POST /user-templates/:templateId/share
 * Share a template customization
 */
router.post(
  '/:templateId/share',
  validateParams(z.object({ templateId: z.string() })),
  validateBody(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
      sharedWithUserIds: z.string().array().optional(),
      sharedWithTeamIds: z.string().array().optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId } = req.params;
    const shareOptions = req.body;

    const shared = await templateSharingService.shareTemplate(
      userId,
      templateId,
      shareOptions
    );

    res.json({ shared });
  })
);

/**
 * GET /user-templates/shared
 * Get shared templates available to user
 */
router.get(
  '/shared',
  validateQuery(
    z.object({
      templateId: z.string().optional(),
      isPublic: z.string().transform((v) => v === 'true').optional(),
      ownerId: z.string().optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId, isPublic, ownerId } = req.query;

    const shared = await templateSharingService.getAvailableSharedTemplates(userId, {
      templateId: templateId as string | undefined,
      isPublic: isPublic as boolean | undefined,
      ownerId: ownerId as string | undefined,
    });

    res.json({ shared, count: shared.length });
  })
);

/**
 * POST /user-templates/shared/:sharedId/clone
 * Clone a shared template
 */
router.post(
  '/shared/:sharedId/clone',
  validateParams(z.object({ sharedId: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { sharedId } = req.params;

    await templateSharingService.cloneSharedTemplate(userId, sharedId);

    res.json({ message: 'Template cloned successfully' });
  })
);

// ============================================================================
// PRESETS ENDPOINTS
// ============================================================================

/**
 * GET /user-templates/presets
 * Get template presets
 */
router.get(
  '/presets',
  validateQuery(
    z.object({
      category: z.string().optional(),
      includeSystem: z.string().transform((v) => v === 'true').optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { category, includeSystem } = req.query;

    const presets = await templatePresetService.getPresets({
      category: category as string | undefined,
      includeSystem: includeSystem as boolean | undefined,
      userId,
    });

    res.json({ presets, count: presets.length });
  })
);

/**
 * POST /user-templates/presets
 * Create a template preset
 */
router.post(
  '/presets',
  validateBody(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      category: z.string(),
      templateIds: z.string().array(),
      customVariables: z.record(z.any()).optional(),
      customInstructions: z.string().optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const presetData = req.body;

    const preset = await templatePresetService.createPreset(userId, presetData);
    res.json({ preset });
  })
);

/**
 * POST /user-templates/presets/:presetId/apply
 * Apply a preset to user's customizations
 */
router.post(
  '/presets/:presetId/apply',
  validateParams(z.object({ presetId: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { presetId } = req.params;

    const result = await templatePresetService.applyPreset(userId, presetId);
    res.json(result);
  })
);

// ============================================================================
// EXPORT/IMPORT ENDPOINTS
// ============================================================================

/**
 * GET /user-templates/export
 * Export user's customizations
 */
router.get(
  '/export',
  validateQuery(
    z.object({
      templateIds: z.string().array().optional(),
      format: z.enum(['json', 'yaml', 'csv']).optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateIds, format } = req.query;

    const parseArray = (value: string | string[] | undefined): string[] | undefined => {
      if (!value) return undefined;
      if (Array.isArray(value)) return value;
      return value.split(',').map((v) => v.trim()).filter(Boolean);
    };

    if (format && format !== 'json') {
      const exportData = await templateExportService.exportToFormat(
        userId,
        format as 'yaml' | 'csv',
        parseArray(templateIds as string | string[] | undefined)
      );

      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'text/yaml');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="templates-export.${format}"`
      );
      res.send(exportData);
    } else {
      const exportData = await templateExportService.exportUserCustomizations(userId, {
        templateIds: parseArray(templateIds as string | string[] | undefined),
      });

      res.json(exportData);
    }
  })
);

/**
 * POST /user-templates/import
 * Import customizations from export
 */
router.post(
  '/import',
  validateBody(
    z.object({
      exportData: z.any(),
      overwriteExisting: z.boolean().optional(),
      skipErrors: z.boolean().optional(),
    })
  ),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { exportData, overwriteExisting, skipErrors } = req.body;

    // Validate export data
    const validation = templateExportService.validateExportData(exportData);
    if (!validation.valid) {
      res.status(400).json({
        error: 'Invalid export data',
        errors: validation.errors,
      });
      return;
    }

    const result = await templateExportService.importCustomizations(userId, exportData, {
      overwriteExisting,
      skipErrors,
    });

    res.json(result);
  })
);

export { router as enhancedUserTemplatesRouter };
