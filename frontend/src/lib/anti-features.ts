/**
 * What This System Refuses To Do
 * 
 * Opinionated defaults with visible constraints.
 * Hard-coded guardrails that fail loudly and clearly.
 * 
 * @phase Phase 5 - Opinionated Defaults + Anti-Features
 */

import { Shield, AlertTriangle, Lock, Eye, Clock, Database, Globe, FileWarning } from 'lucide-react';

export interface AntiFeature {
  id: string;
  category: 'safety' | 'privacy' | 'determinism' | 'transparency';
  title: string;
  description: string;
  icon: typeof Shield;
  rationale: string;
  enforcedBy: string;
  errorMessage: string;
}

export const ANTI_FEATURES: AntiFeature[] = [
  // Safety Anti-Features
  {
    id: 'no-silent-failures',
    category: 'safety',
    title: 'No Silent Failures',
    description: 'The system will never fail silently. Every error is logged, reported, and actionable.',
    icon: AlertTriangle,
    rationale: 'Silent failures erode trust. Users must always know when something goes wrong and why.',
    enforcedBy: 'Global error boundary with mandatory reporting',
    errorMessage: 'Operation failed. Check the execution trace for details.',
  },
  {
    id: 'no-unbounded-operations',
    category: 'safety',
    title: 'No Unbounded Operations',
    description: 'Every operation has limits: max rows, max files, max time, max memory.',
    icon: Database,
    rationale: 'Without limits, a runaway agent could exhaust resources or cause cascading failures.',
    enforcedBy: 'Blast radius constraints on all agents',
    errorMessage: 'Operation exceeded blast radius limits. Reduce scope or request elevated permissions.',
  },
  {
    id: 'no-delete-without-confirmation',
    category: 'safety',
    title: 'No Delete Without Explicit Confirmation',
    description: 'Destructive operations require user confirmation, even with high-trust agents.',
    icon: FileWarning,
    rationale: 'Data loss is unacceptable. The system errs on the side of caution.',
    enforcedBy: 'Policy engine blocks DELETE operations without approval',
    errorMessage: 'Delete operation blocked. Explicit approval required.',
  },
  
  // Privacy Anti-Features
  {
    id: 'no-data-exfiltration',
    category: 'privacy',
    title: 'No Data Exfiltration',
    description: 'Agents cannot send your data to external services without explicit opt-in.',
    icon: Lock,
    rationale: 'Your data stays in your environment. Period.',
    enforcedBy: 'Network policies block external egress by default',
    errorMessage: 'External API call blocked. Add explicit permission to agent configuration.',
  },
  {
    id: 'no-training-on-your-data',
    category: 'privacy',
    title: 'No Training on Your Data',
    description: 'Your inputs and outputs are never used to train models.',
    icon: Eye,
    rationale: 'Intellectual property and privacy must be preserved.',
    enforcedBy: 'Zero-retention guarantees with third-party providers',
    errorMessage: 'N/A - This is a contractual guarantee, not a runtime check',
  },
  
  // Determinism Anti-Features
  {
    id: 'no-hidden-randomness',
    category: 'determinism',
    title: 'No Hidden Randomness',
    description: 'Every operation uses explicit, recorded seeds. Nothing is truly random.',
    icon: Clock,
    rationale: 'Reproducibility is essential for debugging and trust.',
    enforcedBy: 'All agents run in deterministic mode by default',
    errorMessage: 'Non-deterministic operation requested but not enabled for this agent.',
  },
  {
    id: 'no-irreproducible-actions',
    category: 'determinism',
    title: 'No Irreproducible Actions',
    description: 'Every action can be replayed with identical inputs for identical outputs.',
    icon: Clock,
    rationale: 'Auditability requires the ability to replay exactly what happened.',
    enforcedBy: 'Evidence bundles include full replay instructions',
    errorMessage: 'Action cannot be reproduced. Check evidence bundle for details.',
  },
  
  // Transparency Anti-Features
  {
    id: 'no-black-box-decisions',
    category: 'transparency',
    title: 'No Black Box Decisions',
    description: 'Every decision explains itself. No "trust me, I know what I\'m doing."',
    icon: Eye,
    rationale: 'Users must understand why decisions were made, not just what was decided.',
    enforcedBy: 'Reasoning trace required for all agent outputs',
    errorMessage: 'Decision rejected: missing required reasoning trace.',
  },
  {
    id: 'no-hidden-policies',
    category: 'transparency',
    title: 'No Hidden Policies',
    description: 'All policies are visible, versioned, and auditable. No secret rules.',
    icon: Shield,
    rationale: 'Users deserve to know what constraints are being enforced.',
    enforcedBy: 'Policy registry is public and immutable',
    errorMessage: 'Unknown policy referenced. All policies must be registered.',
  },
];

/**
 * Golden Path - Recommended workflows for common use cases
 */
export const GOLDEN_PATHS = [
  {
    id: 'security-audit',
    name: 'Security Audit',
    description: 'Analyze codebase for vulnerabilities and policy violations',
    steps: [
      { agent: 'SecurityAgent', action: 'Scan dependencies', policy: 'read-only' },
      { agent: 'SecurityAgent', action: 'Check for secrets', policy: 'read-only' },
      { agent: 'RLSValidator', action: 'Validate RLS policies', policy: 'read-only' },
      { agent: 'ReportAgent', action: 'Generate report', policy: 'output-only' },
    ],
    estimatedTime: '45s',
    determinism: 'deterministic' as const,
  },
  {
    id: 'dependency-health',
    name: 'Dependency Health Check',
    description: 'Identify outdated, vulnerable, or conflicting dependencies',
    steps: [
      { agent: 'ParserAgent', action: 'Parse manifests', policy: 'read-only' },
      { agent: 'VulnAgent', action: 'Query vulnerability DB', policy: 'external-api' },
      { agent: 'ConstraintAgent', action: 'Check versions', policy: 'compute-only' },
      { agent: 'ReportAgent', action: 'Generate report', policy: 'output-only' },
    ],
    estimatedTime: '30s',
    determinism: 'deterministic' as const,
  },
  {
    id: 'doc-generation',
    name: 'Architecture Documentation',
    description: 'Generate up-to-date docs from your codebase',
    steps: [
      { agent: 'ScannerAgent', action: 'Scan structure', policy: 'read-only' },
      { agent: 'APIExtractor', action: 'Extract API surface', policy: 'read-only' },
      { agent: 'DiagramAgent', action: 'Generate diagrams', policy: 'output-only' },
      { agent: 'DocCompiler', action: 'Compile docs', policy: 'output-only' },
    ],
    estimatedTime: '60s',
    determinism: 'deterministic' as const,
  },
];

/**
 * Guardrails - Runtime enforcement points
 */
export const GUARDRAILS = [
  {
    id: 'pre-execution',
    name: 'Pre-Execution Validation',
    description: 'Every action is validated before execution',
    checks: [
      'Blast radius constraints',
      'Policy compliance',
      'Resource availability',
      'Permission verification',
    ],
    onFailure: 'BLOCK',
  },
  {
    id: 'mid-execution',
    name: 'Mid-Execution Monitoring',
    description: 'Ongoing validation during execution',
    checks: [
      'Resource usage monitoring',
      'Timeout enforcement',
      'Anomaly detection',
      'Policy violation detection',
    ],
    onFailure: 'INTERRUPT',
  },
  {
    id: 'post-execution',
    name: 'Post-Execution Verification',
    description: 'Validation of outputs before delivery',
    checks: [
      'Output schema validation',
      'Evidence bundle completeness',
      'Audit log verification',
      'Blast radius compliance check',
    ],
    onFailure: 'QUARANTINE',
  },
];

/**
 * Check if a requested action violates any anti-features
 */
export function checkAntiFeatures(
  action: { type: string; description: string },
  context: { trustLevel: string; environment: string }
): { violations: AntiFeature[]; warnings: string[] } {
  const violations: AntiFeature[] = [];
  const warnings: string[] = [];
  
  // Check for silent failure potential
  if (action.type === 'DELETE' && context.environment === 'production') {
    violations.push(ANTI_FEATURES.find(af => af.id === 'no-delete-without-confirmation')!);
  }
  
  // Check for unbounded operations
  if (action.description.toLowerCase().includes('all') || 
      action.description.toLowerCase().includes('every')) {
    warnings.push('Operation appears unbounded. Consider adding limits.');
  }
  
  return { violations, warnings };
}

/**
 * Get recommended golden path for a use case
 */
export function getGoldenPath(useCase: string): typeof GOLDEN_PATHS[0] | null {
  const normalized = useCase.toLowerCase();
  
  if (normalized.includes('security') || normalized.includes('audit')) {
    return GOLDEN_PATHS.find(p => p.id === 'security-audit') || null;
  }
  
  if (normalized.includes('depend') || normalized.includes('package')) {
    return GOLDEN_PATHS.find(p => p.id === 'dependency-health') || null;
  }
  
  if (normalized.includes('doc') || normalized.includes('diagram')) {
    return GOLDEN_PATHS.find(p => p.id === 'doc-generation') || null;
  }
  
  return null;
}
