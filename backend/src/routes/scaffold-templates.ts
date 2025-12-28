import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { scaffoldTemplateService } from '../services/scaffoldTemplateService.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /scaffold-templates
 * List available scaffold templates with filtering
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const listTemplatesSchema = z.object({
  milestone: z.string().array().optional(),
  stack: z.string().array().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  security_level: z.enum(['required', 'recommended', 'optional']).optional(),
  optimization_level: z.enum(['required', 'recommended', 'optional']).optional(),
  tags: z.string().array().optional(),
  exclude_tags: z.string().array().optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    // Parse query parameters (arrays come as comma-separated strings or arrays)
    const parseArray = (value: string | string[] | undefined): string[] | undefined => {
      if (!value) return undefined;
      if (Array.isArray(value)) return value;
      return value.split(',').map((v) => v.trim()).filter(Boolean);
    };

    const filter = {
      milestone: parseArray(req.query.milestone as string | string[] | undefined),
      stack: parseArray(req.query.stack as string | string[] | undefined),
      priority: req.query.priority as 'high' | 'medium' | 'low' | undefined,
      security_level: req.query.security_level as
        | 'required'
        | 'recommended'
        | 'optional'
        | undefined,
      optimization_level: req.query.optimization_level as
        | 'required'
        | 'recommended'
        | 'optional'
        | undefined,
      tags: parseArray(req.query.tags as string | string[] | undefined),
      exclude_tags: parseArray(req.query.exclude_tags as string | string[] | undefined),
    };

    const templates = scaffoldTemplateService.filterTemplates(filter);

    res.json({
      templates: templates.map((t) => ({
        id: t.id,
        milestone: t.milestone,
        name: t.name,
        description: t.description,
        priority: t.priority,
        dependencies: t.dependencies,
        tags: t.tags,
        stack: t.stack,
        security_level: t.security_level,
        optimization_level: t.optimization_level,
      })),
      count: templates.length,
    });
  })
);

/**
 * GET /scaffold-templates/:id
 * Get a specific template by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const template = scaffoldTemplateService.getTemplate(req.params.id);

    if (!template) {
      res.status(404).json({
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: `Template with ID ${req.params.id} not found`,
        },
      });
      return;
    }

    res.json({
      id: template.id,
      milestone: template.milestone,
      name: template.name,
      description: template.description,
      priority: template.priority,
      dependencies: template.dependencies,
      tags: template.tags,
      stack: template.stack,
      security_level: template.security_level,
      optimization_level: template.optimization_level,
      mega_prompt: template.mega_prompt,
      variables: template.variables,
    });
  })
);

/**
 * POST /scaffold-templates/generate
 * Generate scaffold prompt from templates
 */
const generatePromptSchema = z.object({
  taskDescription: z.string().min(1),
  templateIds: z.string().array().optional(),
  adaptationConfig: z
    .object({
      framework: z.enum(['express', 'fastify', 'nextjs']).optional(),
      database: z.enum(['postgresql', 'supabase', 'mongodb']).optional(),
      authMethod: z.enum(['jwt', 'oauth', 'session']).optional(),
      variables: z.record(z.string()).optional(),
    })
    .optional(),
});

router.post(
  '/generate',
  validateBody(generatePromptSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { taskDescription, templateIds, adaptationConfig } = req.body;
    const userId = req.userId!;

    // Load user profile
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      res.status(404).json({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'User profile not found',
        },
      });
      return;
    }

    // Use provided templates or get recommended ones
    const selectedTemplateIds =
      templateIds ||
      scaffoldTemplateService
        .getRecommendedTemplates(profile, taskDescription)
        .map((t) => t.id);

    // Generate scaffold prompt
    const result = scaffoldTemplateService.generateScaffoldPrompt(
      taskDescription,
      profile,
      selectedTemplateIds,
      adaptationConfig
    );

    res.json({
      systemPrompt: result.systemPrompt,
      userPrompt: result.userPrompt,
      templates: result.templates.map((t) => ({
        id: t.id,
        name: t.name,
        milestone: t.milestone,
      })),
      modifiedPrompts: result.modifiedPrompts,
    });
  })
);

/**
 * GET /scaffold-templates/recommended
 * Get recommended templates for a task
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const recommendedSchema = z.object({
  taskDescription: z.string().min(1),
});

router.get(
  '/recommended',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const taskDescription = req.query.taskDescription as string;
    
    if (!taskDescription) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'taskDescription query parameter is required',
        },
      });
      return;
    }
    const userId = req.userId!;

    // Load user profile
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      res.status(404).json({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'User profile not found',
        },
      });
      return;
    }

    // Get recommended templates
    const recommended = scaffoldTemplateService.getRecommendedTemplates(
      profile,
      taskDescription
    );

    res.json({
      templates: recommended.map((t) => ({
        id: t.id,
        milestone: t.milestone,
        name: t.name,
        description: t.description,
        priority: t.priority,
        dependencies: t.dependencies,
        tags: t.tags,
        stack: t.stack,
        security_level: t.security_level,
        optimization_level: t.optimization_level,
      })),
      count: recommended.length,
    });
  })
);

export { router as scaffoldTemplatesRouter };
