import { z } from 'zod';

/**
 * Base schema for all KEY types
 */
const baseKeySchema = {
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  version: z.string().min(1).max(50),
  license_spdx: z.string().min(1),
  tags: z.array(z.string()).default([]),
  outcome: z.string().optional(),
  maturity: z.enum(['starter', 'operator', 'scale', 'enterprise']).optional(),
  author: z.object({
    name: z.string(),
    email: z.string().email().optional(),
  }).optional(),
};

/**
 * Jupyter Key schema (from library.json)
 */
export const jupyterKeySchema = z.object({
  ...baseKeySchema,
  category: z.string().max(100).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  runtime_minutes: z.number().int().positive().optional(),
  preview_public: z.boolean().default(true),
  assets: z.object({
    cover: z.string().optional(),
    preview_html: z.string().optional(),
    zip: z.string(), // Required
    changelog_md: z.string().optional(),
  }),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
});

/**
 * Node/Next Key schema (from key.json)
 */
export const nodeKeySchema = z.object({
  ...baseKeySchema,
  tool: z.enum(['node', 'next']),
  key_type: z.array(z.enum(['route', 'job', 'data', 'ui', 'integration'])).min(1),
  runtime: z.enum(['node', 'next']),
  side_effects: z.array(z.string()).optional(),
  required_env: z.array(z.string()).optional(),
  optional_env: z.array(z.string()).optional(),
  tenant_scope: z.enum(['per-user-tenant-id', 'global', 'per-tenant-id']).optional(),
  compatibility: z.object({
    node: z.string().optional(),
    next: z.string().optional(),
    react: z.string().optional(),
    typescript: z.string().optional(),
  }).optional(),
  dependencies: z.array(z.object({
    name: z.string(),
    version: z.string(),
    required: z.boolean(),
  })).optional(),
  documentation: z.object({
    readme: z.string(),
    quickstart: z.string(),
    changelog: z.string(),
  }),
});

/**
 * Runbook Key schema (from pack.json)
 */
export const runbookKeySchema = z.object({
  ...baseKeySchema,
  tool: z.literal('operational'),
  key_type: z.array(z.enum(['incident', 'failure-mode', 'decision', 'recovery'])).min(1),
  severity_level: z.enum(['p0', 'p1', 'p2', 'p3', 'p4']).optional(),
  runtime_dependency: z.enum(['assisted', 'automated']).optional(),
  required_access_level: z.enum(['read', 'write', 'admin']).optional(),
  produces_evidence: z.boolean().optional(),
  compliance_relevance: z.array(z.string()).optional(),
  references_jupyter_keys: z.array(z.string().regex(/^jupyter-[a-z0-9-]+$/)).optional(),
  references_node_keys: z.array(z.string().regex(/^(node|next)-[a-z0-9-]+$/)).optional(),
  related_runbooks: z.array(z.string()).optional(),
  documentation: z.object({
    readme: z.string(),
    checklist: z.string(),
    changelog: z.string(),
  }),
});

/**
 * Stripe Key schema (workflow keys for Stripe integration)
 */
export const stripeKeySchema = z.object({
  ...baseKeySchema,
  tool: z.literal('stripe'),
  key_type: z.array(z.enum(['workflow'])).min(1),
  webhook_event_types: z.array(z.string()).optional(), // Stripe event types handled
  stripe_integration_level: z.enum(['basic', 'advanced', 'enterprise']).optional(),
  required_env: z.array(z.string()).optional(), // e.g., ['STRIPE_SECRET_KEY']
  optional_env: z.array(z.string()).optional(),
  dependencies: z.array(z.object({
    name: z.string(),
    version: z.string(),
    required: z.boolean(),
  })).optional(),
  documentation: z.object({
    readme: z.string(),
    quickstart: z.string(),
    changelog: z.string(),
  }),
});

/**
 * GitHub Key schema (workflow/template keys for GitHub)
 */
export const githubKeySchema = z.object({
  ...baseKeySchema,
  tool: z.literal('github'),
  key_type: z.array(z.enum(['workflow', 'template'])).min(1),
  github_workflow_type: z.string().optional(), // 'ci', 'cd', 'test', 'deploy', etc.
  github_template_type: z.string().optional(), // 'repository', 'issue', 'pr', etc.
  documentation: z.object({
    readme: z.string(),
    quickstart: z.string(),
    changelog: z.string(),
  }),
});

/**
 * Supabase Key schema (template/workflow keys for Supabase)
 */
export const supabaseKeySchema = z.object({
  ...baseKeySchema,
  tool: z.literal('supabase'),
  key_type: z.array(z.enum(['template', 'workflow'])).min(1),
  supabase_feature_type: z.string().optional(), // 'rls', 'auth', 'realtime', 'storage', etc.
  required_env: z.array(z.string()).optional(),
  optional_env: z.array(z.string()).optional(),
  dependencies: z.array(z.object({
    name: z.string(),
    version: z.string(),
    required: z.boolean(),
  })).optional(),
  documentation: z.object({
    readme: z.string(),
    quickstart: z.string(),
    changelog: z.string(),
  }),
});

/**
 * Cursor Key schema (prompt/composer keys for Cursor)
 */
export const cursorKeySchema = z.object({
  ...baseKeySchema,
  tool: z.literal('cursor'),
  key_type: z.array(z.enum(['prompt', 'composer'])).min(1),
  cursor_prompt_type: z.string().optional(), // 'mega-prompt', 'composer-instruction', etc.
  documentation: z.object({
    readme: z.string(),
    quickstart: z.string(),
    changelog: z.string(),
  }),
});

/**
 * Assets index schema (from build_assets_index.ts output)
 */
export const assetsIndexSchema = z.object({
  version: z.string(),
  generated_at: z.string().datetime().optional(),
  runbooks: z.array(runbookKeySchema.partial()).default([]),
  node_keys: z.array(nodeKeySchema.partial()).default([]),
  stripe_keys: z.array(stripeKeySchema.partial()).default([]),
  github_keys: z.array(githubKeySchema.partial()).default([]),
  supabase_keys: z.array(supabaseKeySchema.partial()).default([]),
  cursor_keys: z.array(cursorKeySchema.partial()).default([]),
});

export type JupyterKeyMetadata = z.infer<typeof jupyterKeySchema>;
export type NodeKeyMetadata = z.infer<typeof nodeKeySchema>;
export type RunbookKeyMetadata = z.infer<typeof runbookKeySchema>;
export type StripeKeyMetadata = z.infer<typeof stripeKeySchema>;
export type GitHubKeyMetadata = z.infer<typeof githubKeySchema>;
export type SupabaseKeyMetadata = z.infer<typeof supabaseKeySchema>;
export type CursorKeyMetadata = z.infer<typeof cursorKeySchema>;
export type AssetsIndex = z.infer<typeof assetsIndexSchema>;

/**
 * Unified key metadata type for database
 */
export type UnifiedKeyMetadata = {
  slug: string;
  tool: 'jupyter' | 'node' | 'next' | 'runbook' | 'stripe' | 'github' | 'supabase' | 'cursor';
  key_type: string | string[]; // Tool-specific: 'jupyter'/'runbook' for legacy, array for node/next, string for others
  title: string;
  description?: string;
  version: string;
  license_spdx: string;
  tags: string[];
  outcome?: string;
  maturity?: 'starter' | 'operator' | 'scale' | 'enterprise';
  
  // Jupyter-specific
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  runtime_minutes?: number;
  preview_public?: boolean;
  
  // Node/Next-specific
  runtime?: 'node' | 'next';
  key_types?: string[]; // Array for node/next keys
  
  // Runbook-specific
  severity_level?: 'p0' | 'p1' | 'p2' | 'p3' | 'p4';
  runtime_dependency?: 'assisted' | 'automated';
  required_access_level?: 'read' | 'write' | 'admin';
  produces_evidence?: boolean;
  compliance_relevance?: string[];
  
  // Stripe-specific
  webhook_event_types?: string[];
  stripe_integration_level?: 'basic' | 'advanced' | 'enterprise';
  
  // GitHub-specific
  github_workflow_type?: string;
  github_template_type?: string;
  
  // Supabase-specific
  supabase_feature_type?: string;
  
  // Cursor-specific
  cursor_prompt_type?: string;
  
  // Common environment/dependencies
  required_env?: string[];
  optional_env?: string[];
  dependencies?: Array<{
    name: string;
    version: string;
    required: boolean;
  }>;
  
  // Asset paths
  cover_path?: string;
  preview_html_path?: string;
  zip_path?: string;
  changelog_md_path?: string;
  sha256?: string;
};
