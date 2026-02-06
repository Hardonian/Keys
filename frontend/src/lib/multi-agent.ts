/**
 * Multi-Agent Collaboration
 * 
 * Agents work as collaborators, not just workers.
 * Distinct cognitive roles: Auditor, Optimizer, Skeptic, Operator
 * Agent disagreement is surfaced, not hidden.
 * 
 * @phase Phase 6 - Human-Agent Collaboration
 */

import { z } from 'zod';

// Cognitive Role Types
export const CognitiveRole = {
  OPERATOR: 'operator',       // Executes the primary task
  AUDITOR: 'auditor',         // Reviews for correctness and compliance
  SKEPTIC: 'skeptic',         // Challenges assumptions and finds edge cases
  OPTIMIZER: 'optimizer',     // Improves efficiency and performance
  SYNTHESIZER: 'synthesizer', // Combines outputs from multiple agents
  ARBITER: 'arbiter',         // Resolves conflicts between agents
} as const;

export type CognitiveRoleType = typeof CognitiveRole[keyof typeof CognitiveRole];

// Agent Role Definition
export const AgentRoleSchema = z.object({
  agent_id: z.string(),
  role: z.nativeEnum(CognitiveRole),
  priority: z.number(), // Higher = evaluated first
  can_veto: z.boolean(),
  required_for_consensus: z.boolean(),
  weight: z.number().min(0).max(1), // Influence on final decision
});

export type AgentRole = z.infer<typeof AgentRoleSchema>;

// Agent Opinion
export const AgentOpinionSchema = z.object({
  agent_id: z.string(),
  role: z.nativeEnum(CognitiveRole),
  timestamp: z.string().datetime(),
  
  // The opinion
  verdict: z.enum(['approve', 'reject', 'request_changes', 'abstain']),
  confidence: z.number().min(0).max(1),
  
  // Reasoning
  reasoning: z.string(),
  evidence: z.array(z.object({
    type: z.string(),
    data: z.unknown(),
  })),
  
  // Specific concerns or suggestions
  concerns: z.array(z.object({
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string(),
    suggested_fix: z.string().optional(),
  })),
  
  // If this agent is disagreeing with others
  disagreements: z.array(z.object({
    with_agent: z.string(),
    description: z.string(),
    their_position: z.string(),
    my_position: z.string(),
    why_they_might_be_wrong: z.string(),
    what_would_change_my_mind: z.string(),
  })),
});

export type AgentOpinion = z.infer<typeof AgentOpinionSchema>;

// Consensus Result
export const ConsensusResultSchema = z.object({
  reached: z.boolean(),
  final_verdict: z.enum(['approved', 'rejected', 'needs_revision', 'escalated']),
  
  // Vote tally
  votes: z.object({
    approve: z.number(),
    reject: z.number(),
    request_changes: z.number(),
    abstain: z.number(),
  }),
  
  // Consensus details
  confidence: z.number().min(0).max(1),
  consensus_type: z.enum(['unanimous', 'supermajority', 'simple_majority', 'weighted', 'arbiter_decision']),
  
  // Participating agents
  agents: z.array(z.object({
    agent_id: z.string(),
    role: z.nativeEnum(CognitiveRole),
    verdict: z.string(),
    weight: z.number(),
  })),
  
  // Conflicts (if any)
  conflicts: z.array(z.object({
    between: z.array(z.string()),
    issue: z.string(),
    resolution: z.string(),
  })),
  
  // Arbiter decision (if consensus not reached naturally)
  arbiter_decision: z.object({
    arbiter_id: z.string(),
    reasoning: z.string(),
    overridden_agents: z.array(z.string()),
  }).optional(),
  
  // Timestamp
  timestamp: z.string().datetime(),
});

export type ConsensusResult = z.infer<typeof ConsensusResultSchema>;

// Memory Scopes
export const MemoryScopeSchema = z.object({
  scope: z.enum(['per-run', 'per-project', 'global']),
  agent_id: z.string(),
  
  // Memory entries
  entries: z.array(z.object({
    id: z.string(),
    timestamp: z.string().datetime(),
    type: z.enum(['observation', 'decision', 'feedback', 'correction']),
    content: z.string(),
    importance: z.number().min(0).max(1),
    tags: z.array(z.string()),
    
    // Editable/forgettable
    editable: z.boolean(),
    user_id: z.string().optional(), // Who created this memory
  })),
  
  // Retention policy
  retention: z.object({
    max_entries: z.number(),
    ttl_days: z.number(),
    auto_forget_threshold: z.number(), // Importance below which entries are auto-forgotten
  }),
});

export type MemoryScope = z.infer<typeof MemoryScopeSchema>;

// Default multi-agent configurations for common scenarios
export const MULTI_AGENT_CONFIGS = {
  // Security Review Panel
  security_review: {
    name: 'Security Review Panel',
    description: 'Comprehensive security analysis with multiple perspectives',
    agents: [
      { agent_id: 'security-operator', role: CognitiveRole.OPERATOR, priority: 1, can_veto: true, required_for_consensus: true, weight: 0.3 },
      { agent_id: 'security-auditor', role: CognitiveRole.AUDITOR, priority: 2, can_veto: true, required_for_consensus: true, weight: 0.3 },
      { agent_id: 'security-skeptic', role: CognitiveRole.SKEPTIC, priority: 3, can_veto: false, required_for_consensus: false, weight: 0.2 },
      { agent_id: 'security-optimizer', role: CognitiveRole.OPTIMIZER, priority: 4, can_veto: false, required_for_consensus: false, weight: 0.1 },
      { agent_id: 'security-synthesizer', role: CognitiveRole.SYNTHESIZER, priority: 5, can_veto: false, required_for_consensus: false, weight: 0.1 },
    ],
    consensus_rules: {
      threshold: 0.7,
      require_auditor_approval: true,
      allow_arbiter_override: true,
    },
  },
  
  // Code Review Committee
  code_review: {
    name: 'Code Review Committee',
    description: 'Thorough code review with diverse perspectives',
    agents: [
      { agent_id: 'code-operator', role: CognitiveRole.OPERATOR, priority: 1, can_veto: true, required_for_consensus: true, weight: 0.25 },
      { agent_id: 'code-auditor', role: CognitiveRole.AUDITOR, priority: 2, can_veto: true, required_for_consensus: true, weight: 0.25 },
      { agent_id: 'code-skeptic', role: CognitiveRole.SKEPTIC, priority: 3, can_veto: false, required_for_consensus: false, weight: 0.2 },
      { agent_id: 'code-optimizer', role: CognitiveRole.OPTIMIZER, priority: 4, can_veto: false, required_for_consensus: false, weight: 0.2 },
      { agent_id: 'code-arbiter', role: CognitiveRole.ARBITER, priority: 5, can_veto: true, required_for_consensus: false, weight: 0.1 },
    ],
    consensus_rules: {
      threshold: 0.6,
      require_auditor_approval: false,
      allow_arbiter_override: true,
    },
  },
  
  // Architecture Decision Board
  architecture_decision: {
    name: 'Architecture Decision Board',
    description: 'High-stakes architecture decisions with thorough review',
    agents: [
      { agent_id: 'arch-operator', role: CognitiveRole.OPERATOR, priority: 1, can_veto: true, required_for_consensus: true, weight: 0.2 },
      { agent_id: 'arch-auditor', role: CognitiveRole.AUDITOR, priority: 2, can_veto: true, required_for_consensus: true, weight: 0.2 },
      { agent_id: 'arch-skeptic', role: CognitiveRole.SKEPTIC, priority: 3, can_veto: true, required_for_consensus: true, weight: 0.2 },
      { agent_id: 'arch-optimizer', role: CognitiveRole.OPTIMIZER, priority: 4, can_veto: false, required_for_consensus: false, weight: 0.15 },
      { agent_id: 'arch-synthesizer', role: CognitiveRole.SYNTHESIZER, priority: 5, can_veto: false, required_for_consensus: false, weight: 0.15 },
      { agent_id: 'arch-arbiter', role: CognitiveRole.ARBITER, priority: 6, can_veto: true, required_for_consensus: false, weight: 0.1 },
    ],
    consensus_rules: {
      threshold: 0.8,
      require_auditor_approval: true,
      allow_arbiter_override: true,
    },
  },
};

/**
 * Calculate consensus from agent opinions
 */
export function calculateConsensus(
  opinions: AgentOpinion[],
  roles: AgentRole[],
  threshold: number = 0.7
): ConsensusResult {
  const now = new Date().toISOString();
  
  // Calculate weighted votes
  let totalWeight = 0;
  let approveWeight = 0;
  let rejectWeight = 0;
  let changesWeight = 0;
  
  const agentVotes = opinions.map(opinion => {
    const role = roles.find(r => r.agent_id === opinion.agent_id);
    const weight = role?.weight || 0.1;
    totalWeight += weight;
    
    switch (opinion.verdict) {
      case 'approve':
        approveWeight += weight;
        break;
      case 'reject':
        rejectWeight += weight;
        break;
      case 'request_changes':
        changesWeight += weight;
        break;
    }
    
    return {
      agent_id: opinion.agent_id,
      role: opinion.role,
      verdict: opinion.verdict,
      weight,
    };
  });
  
  // Determine if consensus is reached
  const approvalRatio = approveWeight / totalWeight;
  const rejectionRatio = rejectWeight / totalWeight;
  const changesRatio = changesWeight / totalWeight;
  
  let reached = false;
  let finalVerdict: ConsensusResult['final_verdict'] = 'escalated';
  let consensusType: ConsensusResult['consensus_type'] = 'weighted';
  
  if (approvalRatio >= threshold) {
    reached = true;
    finalVerdict = 'approved';
    consensusType = approvalRatio === 1 ? 'unanimous' : approvalRatio >= 0.66 ? 'supermajority' : 'weighted';
  } else if (rejectionRatio >= threshold) {
    reached = true;
    finalVerdict = 'rejected';
    consensusType = rejectionRatio === 1 ? 'unanimous' : 'weighted';
  } else if (changesRatio >= threshold) {
    reached = true;
    finalVerdict = 'needs_revision';
  }
  
  // Identify conflicts
  const conflicts: ConsensusResult['conflicts'] = [];
  for (const opinion of opinions) {
    for (const disagreement of opinion.disagreements) {
      const existing = conflicts.find(c => 
        c.between.includes(opinion.agent_id) && 
        c.between.includes(disagreement.with_agent)
      );
      if (!existing) {
        conflicts.push({
          between: [opinion.agent_id, disagreement.with_agent],
          issue: disagreement.description || 'Fundamental disagreement on approach',
          resolution: 'Unresolved - requires arbiter',
        });
      }
    }
  }
  
  return {
    reached,
    final_verdict: finalVerdict,
    votes: {
      approve: opinions.filter(o => o.verdict === 'approve').length,
      reject: opinions.filter(o => o.verdict === 'reject').length,
      request_changes: opinions.filter(o => o.verdict === 'request_changes').length,
      abstain: opinions.filter(o => o.verdict === 'abstain').length,
    },
    confidence: Math.max(approvalRatio, rejectionRatio, changesRatio),
    consensus_type: consensusType,
    agents: agentVotes,
    conflicts,
    timestamp: now,
  };
}

/**
 * Format agent disagreement for display
 */
export function formatDisagreement(
  opinion1: AgentOpinion,
  opinion2: AgentOpinion
): { summary: string; resolution_path: string[] } {
  const disagreements = opinion1.disagreements.filter(d => d.with_agent === opinion2.agent_id);
  
  if (disagreements.length === 0) {
    return {
      summary: 'No explicit disagreement recorded',
      resolution_path: ['Review both opinions for implicit conflicts'],
    };
  }
  
  const disagreement = disagreements[0];
  
  return {
    summary: `${opinion1.agent_id} (${opinion1.role}) disagrees with ${opinion2.agent_id} (${opinion2.role}): ${disagreement.description || 'Fundamental approach difference'} `,
    resolution_path: [
      `1. ${opinion1.agent_id} believes: ${disagreement.my_position}`,
      `2. ${opinion2.agent_id} believes: ${disagreement.their_position}`,
      `3. ${opinion1.agent_id}'s challenge: ${disagreement.why_they_might_be_wrong}`,
      `4. What would change ${opinion1.agent_id}'s mind: ${disagreement.what_would_change_my_mind}`,
    ],
  };
}

/**
 * Memory management functions
 */
export function addMemory(
  scope: MemoryScope,
  entry: Omit<MemoryScope['entries'][0], 'id' | 'timestamp'>
): MemoryScope {
  const newEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  
  const updatedEntries = [...scope.entries, newEntry];
  
  // Enforce retention policy
  const prunedEntries = updatedEntries
    .filter(e => e.importance >= scope.retention.auto_forget_threshold)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, scope.retention.max_entries);
  
  return {
    ...scope,
    entries: prunedEntries,
  };
}

export function forgetMemory(
  scope: MemoryScope,
  entryId: string,
  userId: string
): MemoryScope {
  const entry = scope.entries.find(e => e.id === entryId);
  
  if (!entry) {
    throw new Error(`Memory entry ${entryId} not found`);
  }
  
  if (!entry.editable) {
    throw new Error(`Memory entry ${entryId} is not editable`);
  }
  
  // Only the creator or an admin can delete
  if (entry.user_id && entry.user_id !== userId) {
    throw new Error('Not authorized to delete this memory entry');
  }
  
  return {
    ...scope,
    entries: scope.entries.filter(e => e.id !== entryId),
  };
}

export function editMemory(
  scope: MemoryScope,
  entryId: string,
  updates: Partial<Omit<MemoryScope['entries'][0], 'id' | 'timestamp' | 'user_id'>>,
  userId: string
): MemoryScope {
  const entry = scope.entries.find(e => e.id === entryId);
  
  if (!entry) {
    throw new Error(`Memory entry ${entryId} not found`);
  }
  
  if (!entry.editable) {
    throw new Error(`Memory entry ${entryId} is not editable`);
  }
  
  if (entry.user_id && entry.user_id !== userId) {
    throw new Error('Not authorized to edit this memory entry');
  }
  
  return {
    ...scope,
    entries: scope.entries.map(e =>
      e.id === entryId ? { ...e, ...updates } : e
    ),
  };
}
