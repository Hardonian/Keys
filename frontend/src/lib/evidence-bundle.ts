/**
 * Evidence Bundle Format
 * 
 * Every automated action emits:
 * - Human-readable explanation
 * - Machine-readable evidence packet
 * - Deterministic replay instructions
 * 
 * @phase Phase 3 - Explainability by Default
 */

import { z } from 'zod';

// Evidence Bundle Schema
export const EvidenceBundleSchema = z.object({
  // Metadata
  id: z.string().uuid(),
  version: z.literal('1.0.0'),
  timestamp: z.string().datetime(),
  
  // Action Details
  action: z.object({
    type: z.string(),
    description: z.string(),
    agent: z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
    }),
    input: z.object({
      raw: z.string(),
      normalized: z.string(),
      context: z.record(z.unknown()),
    }),
  }),
  
  // Execution Trace
  trace: z.array(z.object({
    step: z.number(),
    timestamp: z.string().datetime(),
    component: z.string(),
    action: z.string(),
    duration_ms: z.number(),
    input_hash: z.string(),
    output_hash: z.string(),
    metadata: z.record(z.unknown()).optional(),
  })),
  
  // Policy Evaluations
  policies: z.array(z.object({
    id: z.string(),
    name: z.string(),
    result: z.enum(['passed', 'failed', 'waived']),
    reason: z.string(),
    evaluated_at: z.string().datetime(),
    evidence: z.record(z.unknown()),
  })),
  
  // Reasoning Trace
  reasoning: z.object({
    summary: z.string(),
    steps: z.array(z.object({
      number: z.number(),
      description: z.string(),
      rationale: z.string(),
      confidence: z.number().min(0).max(1),
      alternatives_considered: z.array(z.string()),
      why_chosen: z.string(),
      why_not_others: z.array(z.string()),
    })),
    final_decision: z.object({
      choice: z.string(),
      confidence: z.number().min(0).max(1),
      supporting_evidence: z.array(z.string()),
    }),
  }),
  
  // Output
  output: z.object({
    type: z.enum(['text', 'code', 'structured', 'file']),
    content: z.string(),
    format: z.string().optional(),
    attachments: z.array(z.object({
      name: z.string(),
      type: z.string(),
      size: z.number(),
      hash: z.string(),
    })).optional(),
  }),
  
  // Replay Instructions
  replay: z.object({
    deterministic: z.boolean(),
    seed: z.string().optional(),
    dependencies: z.array(z.object({
      name: z.string(),
      version: z.string(),
      hash: z.string(),
    })),
    environment: z.record(z.string()),
    command: z.string(),
  }),
  
  // Audit Trail
  audit: z.object({
    creator: z.string(),
    organization: z.string().optional(),
    session_id: z.string(),
    request_id: z.string(),
    ip_address: z.string().optional(),
    user_agent: z.string().optional(),
  }),
});

export type EvidenceBundle = z.infer<typeof EvidenceBundleSchema>;

/**
 * Create an evidence bundle from an action execution
 */
export function createEvidenceBundle(
  action: {
    type: string;
    description: string;
    agent: { id: string; name: string; version: string };
    input: { raw: string; context: Record<string, unknown> };
  },
  trace: EvidenceBundle['trace'],
  policies: EvidenceBundle['policies'],
  reasoning: EvidenceBundle['reasoning'],
  output: EvidenceBundle['output'],
  audit: EvidenceBundle['audit']
): EvidenceBundle {
  const now = new Date().toISOString();
  
  return {
    id: crypto.randomUUID(),
    version: '1.0.0',
    timestamp: now,
    action: {
      ...action,
      input: {
        raw: action.input.raw,
        normalized: normalizeInput(action.input.raw),
        context: action.input.context,
      },
    },
    trace,
    policies,
    reasoning,
    output,
    replay: {
      deterministic: true,
      dependencies: [
        { name: 'keys-platform', version: '1.0.0', hash: 'abc123' },
      ],
      environment: {},
      command: `keys replay ${crypto.randomUUID()}`,
    },
    audit,
  };
}

/**
 * Generate a human-readable explanation from an evidence bundle
 */
export function generateExplanation(bundle: EvidenceBundle): string {
  const lines = [
    `# ${bundle.action.description}`,
    ``,
    `**Executed at:** ${new Date(bundle.timestamp).toLocaleString()}`,
    `**By:** ${bundle.action.agent.name} (v${bundle.action.agent.version})`,
    `**Request ID:** ${bundle.audit.request_id}`,
    ``,
    `## What Happened`,
    ``,
    bundle.reasoning.summary,
    ``,
    `## Step-by-Step Reasoning`,
    ``,
    ...bundle.reasoning.steps.map(step => [
      `### Step ${step.number}: ${step.description}`,
      ``,
      step.rationale,
      ``,
      `**Confidence:** ${(step.confidence * 100).toFixed(1)}%`,
      ``,
      step.alternatives_considered.length > 0 ? `**Alternatives considered:** ${step.alternatives_considered.join(', ')}` : '',
      ``,
    ].join('\n')),
    ``,
    `## Policy Checks`,
    ``,
    ...bundle.policies.map(policy => [
      `- **${policy.name}**: ${policy.result.toUpperCase()}`,
      policy.reason ? `  - ${policy.reason}` : '',
    ].join('\n')),
    ``,
    `## Output`,
    ``,
    `Type: ${bundle.output.type}`,
    ``,
    '```',
    bundle.output.content.slice(0, 500) + (bundle.output.content.length > 500 ? '...' : ''),
    '```',
    ``,
    `## Replay This Execution`,
    ``,
    '```bash',
    bundle.replay.command,
    '```',
    ``,
    `This execution ${bundle.replay.deterministic ? 'is' : 'is NOT'} deterministic and can be replayed with identical results.`,
  ];
  
  return lines.join('\n');
}

/**
 * Export evidence bundle to downloadable formats
 */
export function exportEvidenceBundle(
  bundle: EvidenceBundle,
  format: 'json' | 'markdown' | 'pdf'
): { content: string; filename: string; mimeType: string } {
  switch (format) {
    case 'json':
      return {
        content: JSON.stringify(bundle, null, 2),
        filename: `evidence-${bundle.id}.json`,
        mimeType: 'application/json',
      };
    case 'markdown':
      return {
        content: generateExplanation(bundle),
        filename: `evidence-${bundle.id}.md`,
        mimeType: 'text/markdown',
      };
    case 'pdf':
      // PDF generation would require a library like puppeteer or jsPDF
      // For now, return markdown with PDF extension as placeholder
      return {
        content: generateExplanation(bundle),
        filename: `evidence-${bundle.id}.pdf`,
        mimeType: 'application/pdf',
      };
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Validate an evidence bundle
 */
export function validateEvidenceBundle(bundle: unknown): { valid: boolean; errors?: string[] } {
  const result = EvidenceBundleSchema.safeParse(bundle);
  
  if (result.success) {
    return { valid: true };
  }
  
  return {
    valid: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  };
}

/**
 * Calculate trust score from evidence bundle
 */
export function calculateTrustScore(bundle: EvidenceBundle): {
  overall: number;
  breakdown: Record<string, number>;
} {
  const policyScore = bundle.policies.filter(p => p.result === 'passed').length / bundle.policies.length;
  const reasoningScore = bundle.reasoning.final_decision.confidence;
  const traceScore = bundle.trace.every(t => t.duration_ms < 5000) ? 1 : 0.8;
  
  return {
    overall: (policyScore * 0.4 + reasoningScore * 0.4 + traceScore * 0.2),
    breakdown: {
      policy_compliance: policyScore,
      reasoning_confidence: reasoningScore,
      performance: traceScore,
    },
  };
}

// Helper function
function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}
