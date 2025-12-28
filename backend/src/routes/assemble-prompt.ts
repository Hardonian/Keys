import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validation.js';
import { assemblePrompt } from '../services/promptAssembly.js';
import type { InputFilter } from '../types/filters.js';

const router = Router();

const assemblePromptSchema = z.object({
  userId: z.string().uuid(),
  taskDescription: z.string().min(1),
  vibeConfig: z.object({
    playfulness: z.number().min(0).max(100).optional(),
    revenue_focus: z.number().min(0).max(100).optional(),
    investor_perspective: z.number().min(0).max(100).optional(),
  }).optional(),
  inputFilter: z.object({
    model: z.string().optional(),
    provider: z.enum(['openai', 'anthropic', 'google', 'meta', 'custom']).optional(),
    style: z
      .enum([
        'concise',
        'detailed',
        'technical',
        'conversational',
        'structured',
        'prompt_engineering',
        'chain_of_thought',
        'few_shot',
      ])
      .optional(),
    outputFormat: z
      .enum(['markdown', 'json', 'code', 'plain_text', 'structured_prompt', 'provider_native'])
      .optional(),
    tone: z.enum(['playful', 'serious', 'technical', 'casual', 'balanced']).optional(),
    maxTokens: z.number().optional(),
    temperature: z.number().min(0).max(2).optional(),
    useProviderGuidelines: z.boolean().optional(),
    usePromptEngineering: z.boolean().optional(),
  }).optional(),
});

router.post(
  '/',
  validateBody(assemblePromptSchema),
  asyncHandler(async (req, res) => {
    const { userId, taskDescription, vibeConfig, inputFilter } = req.body;

    const result = await assemblePrompt(
      userId,
      taskDescription,
      vibeConfig || {},
      inputFilter
    );

    res.json(result);
  })
);

export { router as assemblePromptRouter };
