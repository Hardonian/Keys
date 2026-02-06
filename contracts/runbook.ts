import { z } from 'zod';

export const RunbookInputSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'json', 'secret', 'url']),
  description: z.string().optional(),
  required: z.boolean().default(true),
  defaultValue: z.string().optional(),
});

export type RunbookInput = z.infer<typeof RunbookInputSchema>;

export const RunbookAnnotationSchema = z.object({
  id: z.string().min(1),
  cellId: z.string().min(1),
  stepId: z.string().min(1),
  kind: z.enum(['note', 'warning', 'decision', 'evidence']),
  message: z.string().min(1),
  author: z.string().min(1),
  tags: z.array(z.string()).default([]),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
});

export type RunbookAnnotation = z.infer<typeof RunbookAnnotationSchema>;

export const RunbookStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  checklist: z.array(z.string().min(1)).min(1),
  annotations: z.array(RunbookAnnotationSchema).default([]),
  expectedOutcome: z.string().optional(),
});

export type RunbookStep = z.infer<typeof RunbookStepSchema>;

export const RunbookManifestSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  inputs: z.array(RunbookInputSchema).default([]),
  sideEffects: z.array(z.string().min(1)).default([]),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  steps: z.array(RunbookStepSchema).min(1),
  tags: z.array(z.string()).default([]),
});

export type RunbookManifest = z.infer<typeof RunbookManifestSchema>;
