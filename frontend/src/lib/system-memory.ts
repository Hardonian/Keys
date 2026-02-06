/**
 * System Memory That Earns Trust
 * 
 * Phase 12 Implementation: Memory evolves from storage → judgment
 * 
 * Track:
 * - what worked
 * - what failed
 * - what was overridden by humans
 * 
 * Expose:
 * - "System beliefs"
 * - Confidence levels
 * - Evidence backing each belief
 * 
 * Allow:
 * - Human override
 * - Explicit disagreement logging
 */

import { EvidenceBundle } from './evidence-bundle';

// Memory Event Types
export type MemoryEventType = 
  | 'success'       // Action completed successfully
  | 'failure'       // Action failed
  | 'override'      // Human overrode system recommendation
  | 'correction'    // System was wrong, human corrected
  | 'validation'    // System was right, confirmed
  | 'exploration'   // New pattern discovered
  | 'degradation';  // Performance degraded

// System Belief - The core judgment unit
export interface SystemBelief {
  id: string;
  
  // What the system believes
  statement: string;
  category: string;
  
  // Confidence metrics
  confidence: number; // 0-1
  confidenceTrend: 'rising' | 'falling' | 'stable';
  
  // Evidence
  supportingEvidence: BeliefEvidence[];
  contradictingEvidence: BeliefEvidence[];
  
  // History
  formedAt: Date;
  lastUpdated: Date;
  updateCount: number;
  
  // Validation
  timesValidated: number;
  timesOverridden: number;
  timesCorrected: number;
  
  // Human interaction
  humanAnnotations: HumanAnnotation[];
  
  // Usage
  appliedInContexts: string[];
  impactScore: number; // How much value this belief has created
}

// Evidence for beliefs
export interface BeliefEvidence {
  id: string;
  type: 'observation' | 'experiment' | 'expert' | 'statistical';
  source: string;
  description: string;
  timestamp: Date;
  strength: number; // 0-1
  bundleId?: string; // Reference to evidence bundle
}

// Human annotations on beliefs
export interface HumanAnnotation {
  id: string;
  type: 'agreement' | 'disagreement' | 'clarification' | 'correction';
  userId: string;
  comment: string;
  timestamp: Date;
  evidence?: string;
}

// Memory Event - Raw observations
export interface MemoryEvent {
  id: string;
  type: MemoryEventType;
  timestamp: Date;
  
  // Context
  context: {
    taskType: string;
    agentIds: string[];
    policies: string[];
    inputs: Record<string, unknown>;
  };
  
  // Outcome
  outcome: {
    success: boolean;
    expectedResult: string;
    actualResult: string;
    deviation?: string;
  };
  
  // Human interaction
  humanInteraction?: {
    userId: string;
    action: 'accepted' | 'overridden' | 'corrected' | 'validated';
    reason: string;
    originalSuggestion?: string;
    actualChoice?: string;
  };
  
  // Link to evidence
  evidenceBundleId: string;
  
  // Derived insights
  insights: string[];
}

// Belief Formation Engine
export interface BeliefFormationRule {
  name: string;
  pattern: (events: MemoryEvent[]) => boolean;
  belief: (events: MemoryEvent[]) => Omit<SystemBelief, 'id' | 'formedAt' | 'lastUpdated' | 'updateCount' | 'timesValidated' | 'timesOverridden' | 'timesCorrected' | 'humanAnnotations' | 'appliedInContexts' | 'impactScore'>;
}

// System Memory Engine
export class SystemMemory {
  private beliefs: Map<string, SystemBelief> = new Map();
  private events: MemoryEvent[] = [];
  private formationRules: BeliefFormationRule[];
  
  constructor(rules: BeliefFormationRule[] = DEFAULT_FORMATION_RULES) {
    this.formationRules = rules;
  }
  
  /**
   * Record a memory event
   */
  recordEvent(event: Omit<MemoryEvent, 'id'>): MemoryEvent {
    const fullEvent: MemoryEvent = {
      ...event,
      id: this.generateId(),
    };
    
    this.events.push(fullEvent);
    
    // Check if this event should update any beliefs
    this.updateBeliefs(fullEvent);
    
    // Check if new beliefs should be formed
    this.formNewBeliefs();
    
    return fullEvent;
  }
  
  /**
   * Record success
   */
  recordSuccess(
    bundle: EvidenceBundle,
    insights: string[]
  ): MemoryEvent {
    return this.recordEvent({
      type: 'success',
      timestamp: new Date(),
      context: {
        taskType: bundle.action.type,
        agentIds: [bundle.action.agent.id],
        policies: bundle.policies.map(p => p.name),
        inputs: bundle.action.input.context,
      },
      outcome: {
        success: true,
        expectedResult: bundle.reasoning.final_decision.choice,
        actualResult: bundle.output.content,
      },
      evidenceBundleId: bundle.id,
      insights,
    });
  }
  
  /**
   * Record failure
   */
  recordFailure(
    bundle: EvidenceBundle,
    error: string,
    insights: string[]
  ): MemoryEvent {
    return this.recordEvent({
      type: 'failure',
      timestamp: new Date(),
      context: {
        taskType: bundle.action.type,
        agentIds: [bundle.action.agent.id],
        policies: bundle.policies.map(p => p.name),
        inputs: bundle.action.input.context,
      },
      outcome: {
        success: false,
        expectedResult: bundle.reasoning.final_decision.choice,
        actualResult: error,
        deviation: error,
      },
      evidenceBundleId: bundle.id,
      insights,
    });
  }
  
  /**
   * Record human override
   */
  recordOverride(
    bundle: EvidenceBundle,
    userId: string,
    originalChoice: string,
    actualChoice: string,
    reason: string
  ): MemoryEvent {
    const event = this.recordEvent({
      type: 'override',
      timestamp: new Date(),
      context: {
        taskType: bundle.action.type,
        agentIds: [bundle.action.agent.id],
        policies: bundle.policies.map(p => p.name),
        inputs: bundle.action.input.context,
      },
      outcome: {
        success: true,
        expectedResult: originalChoice,
        actualResult: actualChoice,
        deviation: `Human chose "${actualChoice}" instead of "${originalChoice}"`,
      },
      humanInteraction: {
        userId,
        action: 'overridden',
        reason,
        originalSuggestion: originalChoice,
        actualChoice,
      },
      evidenceBundleId: bundle.id,
      insights: [`Human overrode system recommendation: ${reason}`],
    });
    
    // Update beliefs that were overridden
    this.handleOverride(userId, originalChoice, actualChoice, reason);
    
    return event;
  }
  
  /**
   * Get all beliefs
   */
  getBeliefs(): SystemBelief[] {
    return Array.from(this.beliefs.values());
  }
  
  /**
   * Get beliefs by category
   */
  getBeliefsByCategory(category: string): SystemBelief[] {
    return this.getBeliefs().filter(b => b.category === category);
  }
  
  /**
   * Get high-confidence beliefs
   */
  getStrongBeliefs(threshold = 0.8): SystemBelief[] {
    return this.getBeliefs().filter(b => b.confidence >= threshold);
  }
  
  /**
   * Get contested beliefs (high override rate)
   */
  getContestedBeliefs(): SystemBelief[] {
    return this.getBeliefs()
      .filter(b => b.timesOverridden > 0)
      .sort((a, b) => (b.timesOverridden / b.timesValidated) - (a.timesOverridden / a.timesValidated));
  }
  
  /**
   * Add human annotation to belief
   */
  annotateBelief(
    beliefId: string,
    annotation: Omit<HumanAnnotation, 'id' | 'timestamp'>
  ): void {
    const belief = this.beliefs.get(beliefId);
    if (!belief) return;
    
    belief.humanAnnotations.push({
      ...annotation,
      id: this.generateId(),
      timestamp: new Date(),
    });
    
    // Update confidence based on agreement/disagreement
    if (annotation.type === 'agreement') {
      belief.confidence = Math.min(1, belief.confidence + 0.05);
      belief.timesValidated++;
    } else if (annotation.type === 'disagreement') {
      belief.confidence = Math.max(0, belief.confidence - 0.1);
      belief.timesOverridden++;
    }
    
    belief.lastUpdated = new Date();
    belief.updateCount++;
  }
  
  /**
   * Export system beliefs as knowledge base
   */
  exportBeliefs(): Record<string, unknown> {
    return {
      beliefs: Array.from(this.beliefs.values()),
      stats: {
        totalBeliefs: this.beliefs.size,
        totalEvents: this.events.length,
        averageConfidence: this.getBeliefs().reduce((sum, b) => sum + b.confidence, 0) / this.beliefs.size || 0,
        contestedBeliefs: this.getContestedBeliefs().length,
      },
      exportedAt: new Date(),
    };
  }
  
  /**
   * Import beliefs from knowledge base
   */
  importBeliefs(data: Record<string, unknown>): void {
    if (data.beliefs && Array.isArray(data.beliefs)) {
      for (const belief of data.beliefs) {
        this.beliefs.set(belief.id, belief as SystemBelief);
      }
    }
  }
  
  // Private methods
  
  private updateBeliefs(event: MemoryEvent): void {
    // Find relevant beliefs and update them
    for (const belief of this.beliefs.values()) {
      // Check if event contradicts or supports belief
      const isRelevant = this.isEventRelevantToBelief(event, belief);
      if (!isRelevant) continue;
      
      if (event.type === 'success') {
        belief.timesValidated++;
        belief.confidence = this.calculateNewConfidence(belief, 'validate');
        belief.confidenceTrend = 'rising';
      } else if (event.type === 'failure') {
        belief.timesCorrected++;
        belief.confidence = this.calculateNewConfidence(belief, 'correct');
        belief.confidenceTrend = 'falling';
      } else if (event.type === 'override') {
        belief.timesOverridden++;
        belief.confidence = this.calculateNewConfidence(belief, 'override');
        belief.confidenceTrend = 'falling';
      }
      
      belief.lastUpdated = new Date();
      belief.updateCount++;
    }
  }
  
  private formNewBeliefs(): void {
    for (const rule of this.formationRules) {
      if (rule.pattern(this.events)) {
        const partialBelief = rule.belief(this.events);
        
        // Check if belief already exists
        const existingKey = Array.from(this.beliefs.keys()).find(key => {
          const b = this.beliefs.get(key)!;
          return b.statement === partialBelief.statement && b.category === partialBelief.category;
        });
        
        if (!existingKey) {
          const newBelief: SystemBelief = {
            ...partialBelief,
            id: this.generateId(),
            formedAt: new Date(),
            lastUpdated: new Date(),
            updateCount: 1,
            timesValidated: 0,
            timesOverridden: 0,
            timesCorrected: 0,
            humanAnnotations: [],
            appliedInContexts: [],
            impactScore: 0,
          };
          
          this.beliefs.set(newBelief.id, newBelief);
        }
      }
    }
  }
  
  private handleOverride(userId: string, original: string, actual: string, reason: string): void {
    // Find beliefs related to the overridden recommendation
    for (const belief of this.beliefs.values()) {
      if (belief.statement.includes(original) || belief.appliedInContexts.includes(original)) {
        this.annotateBelief(belief.id, {
          type: 'correction',
          userId,
          comment: `Overrode recommendation "${original}" with "${actual}". Reason: ${reason}`,
          evidence: reason,
        });
      }
    }
  }
  
  private isEventRelevantToBelief(event: MemoryEvent, belief: SystemBelief): boolean {
    // Simple relevance check - could be more sophisticated
    const context = JSON.stringify(event.context).toLowerCase();
    const beliefText = belief.statement.toLowerCase();
    return context.includes(beliefText) || beliefText.includes(event.context.taskType.toLowerCase());
  }
  
  private calculateNewConfidence(
    belief: SystemBelief,
    updateType: 'validate' | 'correct' | 'override'
  ): number {
    const total = belief.timesValidated + belief.timesOverridden + belief.timesCorrected;
    
    if (updateType === 'validate') {
      return Math.min(1, (belief.timesValidated + 1) / (total + 1));
    } else {
      // Penalize more heavily for overrides and corrections
      const penalty = updateType === 'override' ? 0.1 : 0.05;
      return Math.max(0, belief.confidence - penalty);
    }
  }
  
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Default belief formation rules
const DEFAULT_FORMATION_RULES: BeliefFormationRule[] = [
  {
    name: 'reliable_agent_detection',
    pattern: (events) => {
      // If an agent has 5+ successes with no failures
      const agentSuccesses = new Map<string, number>();
      const agentFailures = new Map<string, number>();
      
      for (const event of events) {
        for (const agentId of event.context.agentIds) {
          if (event.type === 'success') {
            agentSuccesses.set(agentId, (agentSuccesses.get(agentId) || 0) + 1);
          } else if (event.type === 'failure') {
            agentFailures.set(agentId, (agentFailures.get(agentId) || 0) + 1);
          }
        }
      }
      
      return Array.from(agentSuccesses.entries()).some(
        ([agentId, successes]) => successes >= 5 && (agentFailures.get(agentId) || 0) === 0
      );
    },
    belief: (events) => {
      const agentSuccesses = new Map<string, number>();
      for (const event of events) {
        for (const agentId of event.context.agentIds) {
          if (event.type === 'success') {
            agentSuccesses.set(agentId, (agentSuccesses.get(agentId) || 0) + 1);
          }
        }
      }
      
      const reliableAgent = Array.from(agentSuccesses.entries())
        .sort((a, b) => b[1] - a[1])[0][0];
      
      return {
        statement: `Agent ${reliableAgent} is highly reliable for its task type`,
        category: 'agent_reliability',
        confidence: 0.85,
        confidenceTrend: 'stable',
        supportingEvidence: [{
          id: 'initial',
          type: 'statistical',
          source: 'execution_history',
          description: '5+ consecutive successes with no failures',
          timestamp: new Date(),
          strength: 0.85,
        }],
        contradictingEvidence: [],
      };
    },
  },
  
  {
    name: 'policy_effectiveness',
    pattern: (events) => {
      // If a policy has caught issues 3+ times
      const policyCatches = new Map<string, number>();
      
      for (const event of events) {
        if (event.type === 'failure' && event.outcome.deviation?.includes('policy')) {
          for (const policy of event.context.policies) {
            policyCatches.set(policy, (policyCatches.get(policy) || 0) + 1);
          }
        }
      }
      
      return Array.from(policyCatches.values()).some(count => count >= 3);
    },
    belief: (events) => {
      const policyCatches = new Map<string, number>();
      
      for (const event of events) {
        if (event.type === 'failure' && event.outcome.deviation?.includes('policy')) {
          for (const policy of event.context.policies) {
            policyCatches.set(policy, (policyCatches.get(policy) || 0) + 1);
          }
        }
      }
      
      const effectivePolicy = Array.from(policyCatches.entries())
        .sort((a, b) => b[1] - a[1])[0][0];
      
      return {
        statement: `Policy "${effectivePolicy}" is effective at preventing issues`,
        category: 'policy_effectiveness',
        confidence: 0.8,
        confidenceTrend: 'stable',
        supportingEvidence: [{
          id: 'initial',
          type: 'observation',
          source: 'failure_prevention',
          description: 'Prevented 3+ potential issues',
          timestamp: new Date(),
          strength: 0.8,
        }],
        contradictingEvidence: [],
      };
    },
  },
  
  {
    name: 'user_preference_learning',
    pattern: (events) => {
      // If user consistently overrides in a specific direction
      const overridePatterns = events.filter(e => e.type === 'override');
      if (overridePatterns.length < 3) return false;
      
      // Check if overrides cluster around similar contexts
      const contexts = overridePatterns.map(e => e.context.taskType);
      const contextCounts = new Map<string, number>();
      for (const ctx of contexts) {
        contextCounts.set(ctx, (contextCounts.get(ctx) || 0) + 1);
      }
      
      return Array.from(contextCounts.values()).some(count => count >= 3);
    },
    belief: (events) => {
      const overridePatterns = events.filter(e => e.type === 'override');
      const contexts = overridePatterns.map(e => e.context.taskType);
      const contextCounts = new Map<string, number>();
      for (const ctx of contexts) {
        contextCounts.set(ctx, (contextCounts.get(ctx) || 0) + 1);
      }
      
      const preferredContext = Array.from(contextCounts.entries())
        .sort((a, b) => b[1] - a[1])[0][0];
      
      return {
        statement: `User prefers specific configurations for ${preferredContext} tasks`,
        category: 'user_preferences',
        confidence: 0.7,
        confidenceTrend: 'rising',
        supportingEvidence: [{
          id: 'initial',
          type: 'observation',
          source: 'override_patterns',
          description: 'Consistent override pattern detected in 3+ similar contexts',
          timestamp: new Date(),
          strength: 0.7,
        }],
        contradictingEvidence: [],
      };
    },
  },
];

// Factory function
export function createSystemMemory(): SystemMemory {
  return new SystemMemory();
}

// React hook (placeholder for actual implementation)
export function useSystemMemory() {
  return {
    memory: new SystemMemory(),
    beliefs: [],
    recordSuccess: () => {},
    recordFailure: () => {},
    recordOverride: () => {},
  };
}
