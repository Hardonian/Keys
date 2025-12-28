// User Profile Types
export interface UserProfile {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  name?: string;
  role?: 'founder' | 'pm' | 'staff_engineer' | 'devops' | 'cfo' | 'investor';
  vertical?: 'software' | 'agency' | 'internal_tools' | 'content' | 'other';
  stack: {
    code_repo?: boolean;
    issue_tracker?: boolean;
    doc_space?: boolean;
    ci_cd?: boolean;
    infra?: boolean;
    analytics?: boolean;
    [key: string]: boolean | undefined;
  };
  tone?: 'playful' | 'serious' | 'technical' | 'casual' | 'balanced';
  risk_tolerance?: 'conservative' | 'moderate' | 'aggressive';
  kpi_focus?: 'velocity' | 'reliability' | 'growth' | 'revenue' | 'quality';
  perspective?: 'founder' | 'pm' | 'staff_engineer' | 'devops' | 'cfo' | 'investor';
  behavior_embedding?: number[];
  brand_voice?: string;
  company_context?: string;
  preferred_models?: string[];
  timezone?: string;
  premium_features?: {
    enabled: boolean;
    voiceToText?: boolean;
    tokenLimit?: number;
    advancedFilters?: boolean;
    customPrompts?: boolean;
  };
}

// Prompt Atom Types
export interface PromptAtom {
  id: string;
  created_at: string;
  name: string;
  category: 'tone' | 'stack' | 'perspective' | 'phase' | 'domain' | 'constraint' | 'example' | 'goal' | 'risk';
  version: number;
  system_prompt?: string;
  constraints?: Record<string, any>;
  examples?: any[];
  weight: number;
  compatible_atoms?: string[];
  target_roles?: string[];
  target_verticals?: string[];
  usage_count: number;
  success_rate: number;
  active: boolean;
}

// Vibe Config Types
export interface VibeConfig {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  name?: string;
  playfulness: number;
  revenue_focus: number;
  investor_perspective: number;
  selected_atoms?: string[];
  custom_instructions?: string;
  auto_suggest: boolean;
  approval_required: boolean;
  logging_level: 'standard' | 'verbose' | 'minimal';
}

// Agent Run Types
export interface AgentRun {
  id: string;
  user_id: string;
  created_at: string;
  trigger: 'manual' | 'event' | 'schedule' | 'chat_input';
  trigger_data?: Record<string, any>;
  assembled_prompt?: string;
  selected_atoms?: string[];
  vibe_config_snapshot?: Partial<VibeConfig>;
  agent_type: 'suggestion' | 'generator' | 'orchestrator';
  model_used?: string;
  generated_content?: Record<string, any>;
  user_feedback?: 'approved' | 'rejected' | 'revised';
  feedback_detail?: string;
  tokens_used?: number;
  latency_ms?: number;
  cost_usd?: number;
}

// Background Event Types
export interface BackgroundEvent {
  id: string;
  user_id: string;
  created_at: string;
  event_type: string;
  source: 'code_repo' | 'issue_tracker' | 'ci_cd' | 'infra' | 'metrics' | 'manual' | 'schedule';
  event_data?: Record<string, any>;
  event_timestamp?: string;
  suggestion_generated: boolean;
  suggestion_id?: string;
  user_actioned: boolean;
}

// Agent Output Types
export type OutputType =
  | 'prompt_refinement'
  | 'content_generation'
  | 'agent_scaffold'
  | 'workflow_recommendation'
  | 'data_insight'
  | 'code_snippet';

export interface AgentOutput {
  outputType: OutputType;
  content: string | Record<string, any>;
  requiresApproval: boolean;
  editableFields: string[];
  generatedAt: string;
  modelUsed: string;
  tokensUsed: number;
  costUsd: number;
}

// Task Intent Types
export interface TaskIntent {
  task: string;
  artifact_type?: 'rfc' | 'adr' | 'test_plan' | 'changelog' | 'incident_report' | 'roadmap';
  context?: string;
  tools?: string[];
}

// Prompt Assembly Result Types
export interface PromptAssemblyResult {
  systemPrompt: string;
  userPrompt: string;
  context: {
    userRole?: string;
    userVertical?: string;
    userStack?: Record<string, boolean>;
    executionConstraints?: Record<string, any>;
  };
  selectedAtomIds: string[];
  blendRecipe: Array<{
    id: string;
    name: string;
    weight: number;
    influence: 'primary' | 'secondary' | 'modifier';
  }>;
}
