import { z } from 'zod';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: any;
}

/**
 * JSON validator utility using Zod schemas
 */
export class JSONValidator {
  /**
   * Validate JSON against a Zod schema
   */
  validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult {
    try {
      const parsed = schema.parse(data);
      return {
        valid: true,
        errors: [],
        data: parsed,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        };
      }
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      };
    }
  }

  /**
   * Validate JSON string
   */
  validateJSONString<T>(schema: z.ZodSchema<T>, jsonString: string): ValidationResult {
    try {
      const parsed = JSON.parse(jsonString);
      return this.validate(schema, parsed);
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Invalid JSON string'],
      };
    }
  }

  /**
   * Safe parse - returns data or null
   */
  safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
    const result = schema.safeParse(data);
    return result.success ? result.data : null;
  }
}

/**
 * Common schemas for API validation
 */
export const commonSchemas = {
  userId: z.string().uuid(),
  email: z.string().email(),
  url: z.string().url(),
  positiveNumber: z.number().positive(),
  nonNegativeNumber: z.number().nonnegative(),
  dateString: z.string().datetime(),
  jsonObject: z.record(z.any()),
};

/**
 * Agent run schema
 */
export const agentRunSchema = z.object({
  user_id: commonSchemas.userId,
  trigger: z.enum(['chat_input', 'event', 'manual', 'telemetry']),
  trigger_data: commonSchemas.jsonObject.optional(),
  agent_type: z.string(),
  model_used: z.string().optional(),
  tokens_used: commonSchemas.nonNegativeNumber.optional(),
  cost_usd: commonSchemas.nonNegativeNumber.optional(),
  latency_ms: commonSchemas.nonNegativeNumber.optional(),
  user_feedback: z.enum(['approved', 'rejected', 'revised']).optional(),
});

/**
 * Vibe config schema
 */
export const vibeConfigSchema = z.object({
  user_id: commonSchemas.userId,
  playfulness: z.number().min(0).max(100),
  revenue_focus: z.number().min(0).max(100),
  investor_perspective: z.number().min(0).max(100),
  name: z.string().optional(),
  custom_instructions: z.string().optional(),
  auto_suggest: z.boolean().optional(),
  approval_required: z.boolean().optional(),
});

/**
 * User profile schema
 */
export const userProfileSchema = z.object({
  user_id: commonSchemas.userId,
  name: z.string().optional(),
  role: z.string().optional(),
  vertical: z.string().optional(),
  tone: z.string().optional(),
  kpi_focus: z.string().optional(),
  perspective: z.string().optional(),
  stack: commonSchemas.jsonObject.optional(),
  brand_context: z.string().optional(),
});

/**
 * Prompt assembly request schema
 */
export const promptAssemblySchema = z.object({
  userId: commonSchemas.userId,
  taskDescription: z.string().min(1),
  vibeConfig: z.object({
    playfulness: z.number().min(0).max(100),
    revenue_focus: z.number().min(0).max(100),
    investor_perspective: z.number().min(0).max(100),
  }).optional(),
});

/**
 * Agent orchestration request schema
 */
export const agentOrchestrationSchema = z.object({
  userId: commonSchemas.userId,
  taskDescription: z.string().min(1),
  assembledPrompt: z.object({
    systemPrompt: z.string(),
    userPrompt: z.string(),
    constraints: commonSchemas.jsonObject.optional(),
  }),
  outputType: z.enum(['content', 'scaffold', 'analysis', 'suggestion']).optional(),
});

export const jsonValidator = new JSONValidator();
