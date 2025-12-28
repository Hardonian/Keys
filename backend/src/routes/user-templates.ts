import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { userTemplateService } from '../services/userTemplateService.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /user-templates/milestone/:milestone
 * Get all templates for a milestone with base and customized previews
 */
router.get(
  '/milestone/:milestone',
  validateParams(z.object({ milestone: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { milestone } = req.params;

    const templates = await userTemplateService.getMilestoneTemplates(userId, milestone);

    res.json({
      milestone,
      templates,
      count: templates.length,
    });
  })
);

/**
 * GET /user-templates/:templateId/preview
 * Get template preview showing base and customized versions
 */
router.get(
  '/:templateId/preview',
  validateParams(z.object({ templateId: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId } = req.params;

    const preview = await userTemplateService.getTemplatePreview(userId, templateId);

    res.json(preview);
  })
);

/**
 * POST /user-templates/:templateId/customize
 * Save user customization for a template
 */
const customizeSchema = z.object({
  customVariables: z.record(z.any()).optional(),
  customInstructions: z.string().optional(),
});

router.post(
  '/:templateId/customize',
  validateParams(z.object({ templateId: z.string() })),
  validateBody(customizeSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId } = req.params;
    const { customVariables = {}, customInstructions } = req.body;

    const customization = await userTemplateService.saveCustomization(
      userId,
      templateId,
      customVariables,
      customInstructions
    );

    // Return updated preview
    const preview = await userTemplateService.getTemplatePreview(userId, templateId);

    res.json({
      customization,
      preview,
    });
  })
);

/**
 * PATCH /user-templates/:templateId/customize
 * Update existing customization
 */
const updateCustomizeSchema = z.object({
  customVariables: z.record(z.any()).optional(),
  customInstructions: z.string().optional(),
  enabled: z.boolean().optional(),
});

router.patch(
  '/:templateId/customize',
  validateParams(z.object({ templateId: z.string() })),
  validateBody(updateCustomizeSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId } = req.params;
    const { customVariables, customInstructions, enabled } = req.body;

    const customization = await userTemplateService.updateCustomization(
      userId,
      templateId,
      {
        customVariables,
        customInstructions,
        enabled,
      }
    );

    // Return updated preview
    const preview = await userTemplateService.getTemplatePreview(userId, templateId);

    res.json({
      customization,
      preview,
    });
  })
);

/**
 * DELETE /user-templates/:templateId/customize
 * Delete customization (revert to base template)
 */
router.delete(
  '/:templateId/customize',
  validateParams(z.object({ templateId: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId } = req.params;

    await userTemplateService.deleteCustomization(userId, templateId);

    // Return base preview
    const preview = await userTemplateService.getTemplatePreview(userId, templateId);

    res.json({
      message: 'Customization deleted, reverted to base template',
      preview,
    });
  })
);

/**
 * GET /user-templates/customizations
 * Get all user customizations
 */
router.get(
  '/customizations',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;

    const customizations = await userTemplateService.getUserCustomizations(userId);

    res.json({
      customizations,
      count: customizations.length,
    });
  })
);

/**
 * POST /user-templates/reset
 * Reset all customizations (revert all to base)
 */
router.post(
  '/reset',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;

    await userTemplateService.resetAllCustomizations(userId);

    res.json({
      message: 'All customizations reset to base templates',
    });
  })
);

/**
 * POST /user-templates/:templateId/generate
 * Generate prompt using user's customized template (or base if not customized)
 */
const generateSchema = z.object({
  taskDescription: z.string().min(1),
  inputFilter: z
    .object({
      style: z.string().optional(),
      outputFormat: z.string().optional(),
      tone: z.string().optional(),
    })
    .optional(),
});

router.post(
  '/:templateId/generate',
  validateParams(z.object({ templateId: z.string() })),
  validateBody(generateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const { templateId } = req.params;
    const { taskDescription, inputFilter } = req.body;

    const result = await userTemplateService.getUserTemplatePrompt(
      userId,
      templateId,
      taskDescription,
      inputFilter
    );

    res.json({
      prompt: result.prompt,
      isCustomized: result.isCustomized,
      templateId: result.templateId,
      message: result.isCustomized
        ? 'Using your customized template'
        : 'Using base template (no customization found)',
    });
  })
);

export { router as userTemplatesRouter };
