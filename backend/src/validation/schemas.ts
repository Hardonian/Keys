import { z } from 'zod';

// User Profile Schemas
export const createProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['founder', 'pm', 'staff_engineer', 'devops', 'cfo', 'investor']).optional(),
  vertical: z.enum(['software', 'agency', 'internal_tools', 'content', 'other']).optional(),
  stack: z.record(z.boolean()).optional(),
  tone: z.enum(['playful', 'serious', 'technical', 'casual', 'balanced']).optional(),
  risk_tolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  kpi_focus: z.enum(['velocity', 'reliability', 'growth', 'revenue', 'quality']).optional(),
  perspective: z.enum(['founder', 'pm', 'staff_engineer', 'devops', 'cfo', 'investor']).optional(),
  brand_voice: z.string().max(500).optional(),
  company_context: z.string().max(2000).optional(),
  preferred_models: z.array(z.string()).optional(),
  timezone: z.string().optional(),
});

export const updateProfileSchema = createProfileSchema.partial();

// Vibe Config Schemas
export const createVibeConfigSchema = z.object({
  name: z.string().max(100).optional(),
  playfulness: z.number().min(0).max(100),
  revenue_focus: z.number().min(0).max(100),
  investor_perspective: z.number().min(0).max(100),
  selected_atoms: z.array(z.string().uuid()).optional(),
  custom_instructions: z.string().max(2000).optional(),
  auto_suggest: z.boolean().optional(),
  approval_required: z.boolean().optional(),
  logging_level: z.enum(['standard', 'verbose', 'minimal']).optional(),
});

export const updateVibeConfigSchema = createVibeConfigSchema.partial();

// Prompt Assembly Schemas
export const assemblePromptSchema = z.object({
  taskDescription: z.string().min(1).max(5000),
  vibeConfig: createVibeConfigSchema.optional(),
});

// Agent Orchestration Schemas
export const orchestrateAgentSchema = z.object({
  promptAssembly: z.object({
    systemPrompt: z.string(),
    userPrompt: z.string(),
    selectedAtomIds: z.array(z.string().uuid()),
  }),
  taskDescription: z.string().min(1),
  userInput: z.string().min(1),
});

// Feedback Schemas
export const feedbackSchema = z.object({
  runId: z.string().uuid(),
  feedback: z.enum(['approved', 'rejected', 'revised']),
  feedbackDetail: z.string().max(2000).optional(),
});

// Webhook Schemas
export const webhookCodeRepoSchema = z.object({
  event: z.string(),
  repository: z.string(),
  data: z.record(z.any()),
});

// Query Parameter Schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const filterSchema = z.object({
  role: z.enum(['founder', 'pm', 'staff_engineer', 'devops', 'cfo', 'investor']).optional(),
  vertical: z.enum(['software', 'agency', 'internal_tools', 'content', 'other']).optional(),
  state: z.enum(['open', 'closed', 'all']).optional(),
});
