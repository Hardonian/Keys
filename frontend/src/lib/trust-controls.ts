/**
 * Trust Controls - Blast Radius Constraints
 * 
 * Enterprise-grade trust surfaces with:
 * - Determinism mode toggle (deterministic / probabilistic / exploratory)
 * - Agent blast-radius constraints enforced by code
 * - Visual exposure of "what this agent can touch" vs "what it cannot"
 * 
 * @phase Phase 4 - Trust, Safety, and Blast Radius
 */

import { z } from 'zod';

// Determinism Modes
export const DeterminismMode = {
  DETERMINISTIC: 'deterministic',   // Same input = same output, always
  PROBABILISTIC: 'probabilistic',   // Controlled randomness for creativity
  EXPLORATORY: 'exploratory',       // Maximum exploration, non-deterministic
} as const;

export type DeterminismModeType = typeof DeterminismMode[keyof typeof DeterminismMode];

// Blast Radius Constraint Schema
export const BlastRadiusConstraintSchema = z.object({
  // Scope restrictions
  tables: z.array(z.object({
    name: z.string(),
    operations: z.array(z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE'])),
    row_limit: z.number().optional(),
    column_mask: z.array(z.string()).optional(),
  })).optional(),
  
  // API restrictions
  apis: z.array(z.object({
    host: z.string(),
    endpoints: z.array(z.string()),
    methods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE'])),
    rate_limit: z.number().optional(),
  })).optional(),
  
  // File system restrictions
  filesystem: z.object({
    read_paths: z.array(z.string()),
    write_paths: z.array(z.string()),
    forbidden_paths: z.array(z.string()),
    max_file_size: z.number().optional(),
  }).optional(),
  
  // Network restrictions
  network: z.object({
    allowed_hosts: z.array(z.string()),
    blocked_hosts: z.array(z.string()),
    max_connections: z.number(),
    timeout_ms: z.number(),
  }).optional(),
  
  // Time restrictions
  time_window: z.object({
    start: z.string().optional(), // ISO time
    end: z.string().optional(),
    timezone: z.string(),
    max_duration_ms: z.number(),
  }).optional(),
  
  // Resource limits
  resources: z.object({
    max_memory_mb: z.number(),
    max_cpu_percent: z.number(),
    max_disk_mb: z.number(),
  }).optional(),
});

export type BlastRadiusConstraint = z.infer<typeof BlastRadiusConstraintSchema>;

// Safety Policy Schema
export const SafetyPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  priority: z.number(), // Higher = evaluated first
  enabled: z.boolean(),
  
  // Conditions that trigger the policy
  condition: z.object({
    operator: z.enum(['AND', 'OR']),
    rules: z.array(z.object({
      field: z.string(),
      operator: z.enum(['eq', 'ne', 'gt', 'lt', 'contains', 'matches']),
      value: z.unknown(),
    })),
  }),
  
  // Actions to take when condition matches
  action: z.enum([
    'ALLOW',
    'BLOCK',
    'QUARANTINE',
    'REQUIRE_APPROVAL',
    'LOG_ONLY',
    'MUTATE', // Modify the request
  ]),
  
  // Additional action configuration
  action_config: z.object({
    message: z.string().optional(),
    mutation_rules: z.array(z.unknown()).optional(),
    approval_required_from: z.array(z.string()).optional(),
    quarantine_duration_ms: z.number().optional(),
  }).optional(),
  
  // Blast radius for this policy
  blast_radius: BlastRadiusConstraintSchema.optional(),
});

export type SafetyPolicy = z.infer<typeof SafetyPolicySchema>;

// Agent Configuration with Trust Controls
export const TrustedAgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  
  // Trust level
  trust_level: z.enum(['untrusted', 'low', 'medium', 'high', 'system']),
  
  // Determinism mode
  determinism_mode: z.enum(['deterministic', 'probabilistic', 'exploratory']),
  
  // Blast radius constraints
  blast_radius: BlastRadiusConstraintSchema,
  
  // Applied policies
  policies: z.array(z.string()), // Policy IDs
  
  // Required approvals
  requires_approval: z.object({
    always: z.boolean(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.unknown(),
    })).optional(),
  }),
  
  // Audit settings
  audit: z.object({
    log_input: z.boolean(),
    log_output: z.boolean(),
    log_reasoning: z.boolean(),
    retention_days: z.number(),
  }),
});

export type TrustedAgentConfig = z.infer<typeof TrustedAgentConfigSchema>;

// Default safety policies
export const DEFAULT_SAFETY_POLICIES: SafetyPolicy[] = [
  {
    id: 'policy-no-delete-production',
    name: 'No Delete on Production',
    description: 'Prevent any delete operations on production databases',
    priority: 100,
    enabled: true,
    condition: {
      operator: 'AND',
      rules: [
        { field: 'action.type', operator: 'eq', value: 'DELETE' },
        { field: 'environment', operator: 'eq', value: 'production' },
      ],
    },
    action: 'BLOCK',
    action_config: { message: 'Delete operations are not allowed in production' },
  },
  {
    id: 'policy-read-only-untrusted',
    name: 'Read-Only for Untrusted Agents',
    description: 'Untrusted agents can only read, never write',
    priority: 90,
    enabled: true,
    condition: {
      operator: 'AND',
      rules: [
        { field: 'agent.trust_level', operator: 'eq', value: 'untrusted' },
        { field: 'action.type', operator: 'matches', value: '^(INSERT|UPDATE|DELETE)$' },
      ],
    },
    action: 'BLOCK',
    action_config: { message: 'Untrusted agents are read-only' },
  },
  {
    id: 'policy-max-rows',
    name: 'Maximum Row Limit',
    description: 'Limit the number of rows any query can affect',
    priority: 80,
    enabled: true,
    condition: {
      operator: 'AND',
      rules: [
        { field: 'blast_radius.tables.0.row_limit', operator: 'gt', value: 100 },
      ],
    },
    action: 'REQUIRE_APPROVAL',
    action_config: {
      message: 'Query affects more than 100 rows and requires approval',
      approval_required_from: ['admin', 'data-owner'],
    },
  },
  {
    id: 'policy-sensitive-data',
    name: 'Sensitive Data Access',
    description: 'Access to sensitive columns requires approval',
    priority: 85,
    enabled: true,
    condition: {
      operator: 'OR',
      rules: [
        { field: 'query.columns', operator: 'contains', value: 'password' },
        { field: 'query.columns', operator: 'contains', value: 'ssn' },
        { field: 'query.columns', operator: 'contains', value: 'credit_card' },
      ],
    },
    action: 'REQUIRE_APPROVAL',
    action_config: {
      message: 'Access to sensitive data requires explicit approval',
      approval_required_from: ['security-admin'],
    },
  },
];

// Default blast radius for different trust levels
export const DEFAULT_BLAST_RADIUS: Record<TrustedAgentConfig['trust_level'], BlastRadiusConstraint> = {
  untrusted: {
    tables: [],
    apis: [],
    filesystem: {
      read_paths: [],
      write_paths: [],
      forbidden_paths: ['*'],
    },
    network: {
      allowed_hosts: [],
      blocked_hosts: ['*'],
      max_connections: 0,
      timeout_ms: 0,
    },
    resources: {
      max_memory_mb: 64,
      max_cpu_percent: 10,
      max_disk_mb: 0,
    },
  },
  low: {
    tables: [{ name: '*', operations: ['SELECT'], row_limit: 10 }],
    apis: [],
    filesystem: {
      read_paths: ['/tmp/sandbox/*'],
      write_paths: ['/tmp/sandbox/output/*'],
      forbidden_paths: ['/etc', '/usr', '/home', '/var'],
      max_file_size: 1024 * 1024, // 1MB
    },
    network: {
      allowed_hosts: [],
      blocked_hosts: ['internal.*', 'localhost', '127.0.0.1'],
      max_connections: 0,
      timeout_ms: 5000,
    },
    resources: {
      max_memory_mb: 128,
      max_cpu_percent: 25,
      max_disk_mb: 100,
    },
  },
  medium: {
    tables: [{ name: '*', operations: ['SELECT'], row_limit: 100 }],
    apis: [{ host: 'api.github.com', endpoints: ['/repos/*'], methods: ['GET'], rate_limit: 100 }],
    filesystem: {
      read_paths: ['/app/*', '/tmp/*'],
      write_paths: ['/tmp/*', '/output/*'],
      forbidden_paths: ['/etc/passwd', '/etc/shadow', '/root'],
      max_file_size: 10 * 1024 * 1024, // 10MB
    },
    network: {
      allowed_hosts: ['api.github.com', 'api.supabase.io'],
      blocked_hosts: ['internal.*', 'metadata.google.internal'],
      max_connections: 10,
      timeout_ms: 30000,
    },
    resources: {
      max_memory_mb: 512,
      max_cpu_percent: 50,
      max_disk_mb: 1000,
    },
  },
  high: {
    tables: [
      { name: '*', operations: ['SELECT', 'INSERT', 'UPDATE'], row_limit: 1000 },
      { name: 'audit_log', operations: ['INSERT'], row_limit: 10000 },
    ],
    apis: [
      { host: 'api.github.com', endpoints: ['/*'], methods: ['GET', 'POST'], rate_limit: 1000 },
      { host: 'api.stripe.com', endpoints: ['/*'], methods: ['GET'], rate_limit: 100 },
    ],
    filesystem: {
      read_paths: ['/*'],
      write_paths: ['/app/*', '/tmp/*', '/output/*'],
      forbidden_paths: ['/etc/passwd', '/etc/shadow'],
      max_file_size: 100 * 1024 * 1024, // 100MB
    },
    network: {
      allowed_hosts: ['*'],
      blocked_hosts: ['localhost', '127.0.0.1', '169.254.169.254'],
      max_connections: 100,
      timeout_ms: 60000,
    },
    resources: {
      max_memory_mb: 2048,
      max_cpu_percent: 80,
      max_disk_mb: 10000,
    },
  },
  system: {
    tables: [{ name: '*', operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] }],
    apis: [{ host: '*', endpoints: ['/*'], methods: ['GET', 'POST', 'PUT', 'DELETE'] }],
    filesystem: {
      read_paths: ['/*'],
      write_paths: ['/*'],
      forbidden_paths: [],
    },
    network: {
      allowed_hosts: ['*'],
      blocked_hosts: [],
      max_connections: 1000,
      timeout_ms: 300000,
    },
    resources: {
      max_memory_mb: 8192,
      max_cpu_percent: 100,
      max_disk_mb: 100000,
    },
  },
};

/**
 * Check if an action is allowed given blast radius constraints
 */
export function checkBlastRadius(
  action: { type: string; target: string; scope?: string },
  constraints: BlastRadiusConstraint
): { allowed: boolean; reason?: string; details?: Record<string, unknown> } {
  // Check table operations
  if (action.type === 'DATABASE' && constraints.tables) {
    const table = constraints.tables.find(t => 
      t.name === action.target || t.name === '*'
    );
    
    if (!table) {
      return {
        allowed: false,
        reason: `Table '${action.target}' is not in the allowed blast radius`,
      };
    }
    
    const operation = action.scope as string;
    if (!table.operations.includes(operation as any)) {
      return {
        allowed: false,
        reason: `Operation '${operation}' is not allowed on table '${action.target}'`,
        details: { allowed_operations: table.operations },
      };
    }
    
    return { allowed: true };
  }
  
  // Check filesystem operations
  if (action.type === 'FILESYSTEM' && constraints.filesystem) {
    const isRead = action.scope === 'READ';
    const allowedPaths = isRead 
      ? constraints.filesystem.read_paths 
      : constraints.filesystem.write_paths;
    
    const isAllowed = allowedPaths.some(path => 
      action.target.startsWith(path.replace('*', ''))
    );
    
    const isForbidden = constraints.filesystem.forbidden_paths.some(path =>
      action.target.startsWith(path.replace('*', '')) || path === '*'
    );
    
    if (isForbidden) {
      return {
        allowed: false,
        reason: `Path '${action.target}' is explicitly forbidden`,
      };
    }
    
    if (!isAllowed) {
      return {
        allowed: false,
        reason: `Path '${action.target}' is outside the allowed blast radius`,
        details: { allowed_paths: allowedPaths },
      };
    }
    
    return { allowed: true };
  }
  
  // Check network operations
  if (action.type === 'NETWORK' && constraints.network) {
    const host = action.target;
    
    const isBlocked = constraints.network.blocked_hosts.some(blocked =>
      host === blocked || host.endsWith(blocked.replace('*', ''))
    );
    
    if (isBlocked) {
      return {
        allowed: false,
        reason: `Host '${host}' is blocked`,
      };
    }
    
    const isAllowed = constraints.network.allowed_hosts.some(allowed =>
      allowed === '*' || host === allowed || host.endsWith(allowed.replace('*', ''))
    );
    
    if (!isAllowed) {
      return {
        allowed: false,
        reason: `Host '${host}' is not in the allowed blast radius`,
        details: { allowed_hosts: constraints.network.allowed_hosts },
      };
    }
    
    return { allowed: true };
  }
  
  return { allowed: true };
}

/**
 * Generate a visual representation of blast radius
 */
export function generateBlastRadiusVisualization(
  constraints: BlastRadiusConstraint
): { canTouch: string[]; cannotTouch: string[]; limitations: string[] } {
  const canTouch: string[] = [];
  const cannotTouch: string[] = [];
  const limitations: string[] = [];
  
  // Tables
  if (constraints.tables) {
    constraints.tables.forEach(table => {
      canTouch.push(`${table.name} (${table.operations.join(', ')})`);
      if (table.row_limit) {
        limitations.push(`Max ${table.row_limit} rows per query on ${table.name}`);
      }
    });
  } else {
    cannotTouch.push('Database tables');
  }
  
  // APIs
  if (constraints.apis && constraints.apis.length > 0) {
    constraints.apis.forEach(api => {
      canTouch.push(`${api.host}${api.endpoints[0]} (${api.methods.join(', ')})`);
      if (api.rate_limit) {
        limitations.push(`Rate limit: ${api.rate_limit} req/min for ${api.host}`);
      }
    });
  } else {
    cannotTouch.push('External APIs');
  }
  
  // Filesystem
  if (constraints.filesystem) {
    canTouch.push(...constraints.filesystem.read_paths.map(p => `Read: ${p}`));
    canTouch.push(...constraints.filesystem.write_paths.map(p => `Write: ${p}`));
    cannotTouch.push(...constraints.filesystem.forbidden_paths.map(p => `Forbidden: ${p}`));
    if (constraints.filesystem.max_file_size) {
      limitations.push(`Max file size: ${(constraints.filesystem.max_file_size / 1024 / 1024).toFixed(1)}MB`);
    }
  }
  
  // Network
  if (constraints.network) {
    if (constraints.network.allowed_hosts.includes('*')) {
      canTouch.push('All external hosts (except blocked)');
    } else {
      canTouch.push(...constraints.network.allowed_hosts.map(h => `Network: ${h}`));
    }
    cannotTouch.push(...constraints.network.blocked_hosts.map(h => `Blocked: ${h}`));
  }
  
  // Resources
  if (constraints.resources) {
    limitations.push(`Memory: ${constraints.resources.max_memory_mb}MB max`);
    limitations.push(`CPU: ${constraints.resources.max_cpu_percent}% max`);
  }
  
  return { canTouch, cannotTouch, limitations };
}
