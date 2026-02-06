export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RunbookInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'secret' | 'url';
  description?: string;
  required?: boolean;
  defaultValue?: string;
}

export interface RunbookAnnotation {
  id: string;
  cellId: string;
  stepId: string;
  kind: 'note' | 'warning' | 'decision' | 'evidence';
  message: string;
  author: string;
  tags?: string[];
  status?: 'todo' | 'in-progress' | 'done';
}

export interface RunbookStep {
  id: string;
  title: string;
  summary: string;
  checklist: string[];
  annotations?: RunbookAnnotation[];
  expectedOutcome?: string;
}

export interface RunbookManifest {
  name: string;
  description: string;
  inputs: RunbookInput[];
  sideEffects: string[];
  riskLevel: RiskLevel;
  steps: RunbookStep[];
  tags?: string[];
}

export interface EnterpriseConfig {
  enabled: boolean;
  orgName: string;
  ctaUrl?: string;
  progress?: number;
  nextMilestone?: string;
}
