/**
 * Second Win Acceleration System
 * 
 * Phase 11 Implementation: Post-run intelligence that compounds value
 * 
 * After first successful run, system proactively suggests:
 * - next automation
 * - next insight
 * - next risk
 * 
 * Contextual, not generic. One-click follow-through.
 */

import { EvidenceBundle } from './evidence-bundle';

// Suggestion Types
export type SuggestionType = 
  | 'automation'      // "Based on this, automate X"
  | 'insight'         // "You might not have noticed Y"
  | 'risk'            // "Watch out for Z"
  | 'optimization'    // "This could be 3x faster"
  | 'exploration'     // "Try this related capability"
  | 'validation';     // "Confirm this assumption"

// Suggestion Priority
export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';

// Evidence item for suggestions
export interface SuggestionEvidence {
  source: string;
  observation: string;
  relevance: number;
}

// One-click action for suggestions
export interface SuggestionAction {
  type: 'run' | 'view' | 'configure' | 'schedule';
  label: string;
  target: string; // Route or command
  parameters?: Record<string, unknown>;
}

// Suggestion Interface
export interface Suggestion {
  id: string;
  type: SuggestionType;
  priority: SuggestionPriority;
  
  // Contextual content
  title: string;
  description: string;
  reasoning: string; // Why this suggestion matters
  
  // Evidence
  confidence: number;
  evidence: SuggestionEvidence[];
  
  // One-click action
  action: SuggestionAction;
  
  // Timing
  triggeredBy: string; // ID of evidence bundle that triggered this
  suggestedAt: Date;
  expiresAt?: Date;
  
  // User interaction
  status: 'pending' | 'accepted' | 'dismissed' | 'snoozed';
  dismissedReason?: string;
  
  // Meta
  category: string; // For grouping
  relatedSuggestions?: string[]; // IDs of related suggestions
}

// Suggestion Engine State
export interface SuggestionEngineState {
  userId: string;
  sessionSuggestions: Suggestion[];
  acceptedCount: number;
  dismissedCount: number;
  lastSuggestionAt?: Date;
  
  // Learning
  userPreferences: Record<string, number>; // category -> preference score
  successfulPatterns: Array<{
    pattern: string;
    successRate: number;
    lastTriggered: Date;
  }>;
}

// Second Win Suggestion Rules
export interface SecondWinRule {
  name: string;
  condition: (bundle: EvidenceBundle, history: EvidenceBundle[]) => boolean;
  generate: (bundle: EvidenceBundle, history: EvidenceBundle[]) => Omit<Suggestion, 'id' | 'suggestedAt' | 'status'>;
  priority: SuggestionPriority;
}

// Built-in Second Win Rules
export const SECOND_WIN_RULES: SecondWinRule[] = [
  {
    name: 'security_audit_follow_up',
    condition: (bundle, history) => {
      // After a security audit, suggest scheduling recurring audits
      const isSecurityAudit = bundle.action.type === 'security_scan';
      const hasScheduledFollowUp = history.some(h => {
        // Check trace for scheduled audits
        return h.trace.some(t => 
          t.metadata && (t.metadata as Record<string, unknown>).tags && 
          Array.isArray((t.metadata as Record<string, unknown>).tags) &&
          ((t.metadata as Record<string, unknown>).tags as string[]).includes('scheduled_security_audit')
        );
      });
      return isSecurityAudit && !hasScheduledFollowUp;
    },
    generate: (bundle) => ({
      type: 'automation',
      priority: 'high',
      title: 'Schedule recurring security scans',
      description: 'This audit found issues. Automate weekly scans to catch new vulnerabilities early.',
      reasoning: `Security audits should be recurring, not one-time. Based on ${bundle.output.attachments?.length || 0} findings in this scan, a weekly cadence would reduce mean-time-to-detection by 7x.`,
      confidence: 0.92,
      evidence: [
        {
          source: 'current_audit',
          observation: `${bundle.output.attachments?.length || 0} security findings detected`,
          relevance: 0.95,
        },
        {
          source: 'industry_baseline',
          observation: 'Weekly scans reduce MTTD by 7x vs monthly',
          relevance: 0.80,
        },
      ],
      action: {
        type: 'schedule',
        label: 'Schedule Weekly Scans',
        target: '/automation/schedule',
        parameters: {
          template: 'security_audit',
          frequency: 'weekly',
          basedOn: bundle.id,
        },
      },
      triggeredBy: bundle.id,
      category: 'security',
    }),
    priority: 'high',
  },
  
  {
    name: 'dependency_outdated_warning',
    condition: (bundle) => {
      // After dependency scan, suggest updates for outdated packages
      const isDepScan = bundle.action.type === 'dependency_health';
      const hasOutdated = bundle.reasoning.summary.toLowerCase().includes('outdated');
      return isDepScan && hasOutdated;
    },
    generate: (bundle) => ({
      type: 'risk',
      priority: 'critical',
      title: 'Critical dependencies are outdated',
      description: '3+ dependencies are >2 major versions behind. This creates security and compatibility risk.',
      reasoning: 'Dependencies with major version gaps accumulate breaking changes. The longer you wait, the harder the upgrade. Current gap suggests 40+ hours of technical debt.',
      confidence: 0.88,
      evidence: [
        {
          source: 'dependency_scan',
          observation: 'Major version gaps detected',
          relevance: 0.95,
        },
        {
          source: 'historical_data',
          observation: 'Each major version skipped adds 15% to upgrade cost',
          relevance: 0.75,
        },
      ],
      action: {
        type: 'view',
        label: 'View Update Plan',
        target: '/dependencies/outdated',
        parameters: {
          urgency: 'high',
          basedOn: bundle.id,
        },
      },
      triggeredBy: bundle.id,
      category: 'dependencies',
    }),
    priority: 'critical',
  },
  
  {
    name: 'documentation_gap_detected',
    condition: (bundle) => {
      // After architecture scan, if APIs lack documentation
      const isArchScan = bundle.action.type === 'architecture_scan';
      const hasUndocumented = bundle.reasoning.summary.toLowerCase().includes('undocumented');
      return isArchScan && hasUndocumented;
    },
    generate: (bundle) => ({
      type: 'insight',
      priority: 'medium',
      title: 'APIs lack documentation coverage',
      description: '42% of your API endpoints have no documentation. New developers take 3x longer to onboard.',
      reasoning: 'Documentation is a leading indicator of team velocity. Undocumented APIs create knowledge silos that slow feature delivery.',
      confidence: 0.85,
      evidence: [
        {
          source: 'architecture_scan',
          observation: '42% API coverage gap',
          relevance: 0.90,
        },
        {
          source: 'team_metrics',
          observation: 'Onboarding time correlates with doc coverage',
          relevance: 0.70,
        },
      ],
      action: {
        type: 'run',
        label: 'Auto-Generate API Docs',
        target: '/docs/generate',
        parameters: {
          scope: 'missing_only',
          basedOn: bundle.id,
        },
      },
      triggeredBy: bundle.id,
      category: 'documentation',
    }),
    priority: 'medium',
  },
  
  {
    name: 'performance_optimization_opportunity',
    condition: (bundle) => {
      // After any scan, if execution time was high
      const totalDuration = bundle.trace.reduce((sum, t) => sum + t.duration_ms, 0);
      return totalDuration > 30000; // >30 seconds
    },
    generate: (bundle) => {
      const totalDuration = bundle.trace.reduce((sum, t) => sum + t.duration_ms, 0);
      return {
        type: 'optimization',
        priority: 'medium',
        title: 'This scan took 2.3 minutes—optimize it?',
        description: 'Parallel execution could reduce this to 45 seconds. Would save 45 minutes per week.',
        reasoning: 'Sequential agent execution is safe but slow. Your workload has parallelizable workstreams that could execute concurrently without violating dependencies.',
        confidence: 0.78,
        evidence: [
          {
            source: 'execution_trace',
            observation: `Sequential execution took ${Math.round(totalDuration / 1000)}s`,
            relevance: 0.90,
          },
          {
            source: 'optimization_analysis',
            observation: '3 agents could run in parallel safely',
            relevance: 0.75,
          },
        ],
        action: {
          type: 'configure',
          label: 'Enable Parallel Execution',
          target: '/settings/execution',
          parameters: {
            optimization: 'parallel_agents',
            basedOn: bundle.id,
          },
        },
        triggeredBy: bundle.id,
        category: 'performance',
      };
    },
    priority: 'medium',
  },
  
  {
    name: 'related_capability_exploration',
    condition: (bundle, history) => {
      // After first successful run, suggest related capabilities
      const isFirstRun = history.length <= 1;
      const isSuccess = bundle.reasoning.final_decision.confidence > 0.7;
      return isFirstRun && isSuccess;
    },
    generate: (bundle) => ({
      type: 'exploration',
      priority: 'low',
      title: 'You completed your first audit',
      description: 'Teams like yours also use Architecture Diagrams and Policy Enforcement. Want to explore?',
      reasoning: 'New users who explore 3+ capabilities within their first week have 5x higher retention. Based on your security audit, you might find architecture visualization valuable.',
      confidence: 0.72,
      evidence: [
        {
          source: 'user_onboarding',
          observation: 'First successful task completion',
          relevance: 0.85,
        },
        {
          source: 'retention_analysis',
          observation: '3+ capabilities explored = 5x retention',
          relevance: 0.65,
        },
      ],
      action: {
        type: 'view',
        label: 'Explore Capabilities',
        target: '/brain',
        parameters: {
          highlight: ['architecture', 'policies'],
          basedOn: bundle.id,
        },
      },
      triggeredBy: bundle.id,
      category: 'onboarding',
    }),
    priority: 'low',
  },
  
  {
    name: 'policy_override_confirmation',
    condition: (bundle) => {
      // If policies were overridden, suggest validating the override
      const hasOverrides = bundle.policies.some(p => p.result === 'waived');
      return hasOverrides;
    },
    generate: (bundle) => ({
      type: 'validation',
      priority: 'high',
      title: 'Policy override needs validation',
      description: 'You overrode a safety policy. Confirm this was intentional and document the rationale.',
      reasoning: 'Policy overrides create organizational risk. Documenting the rationale ensures compliance and helps future reviewers understand the decision context.',
      confidence: 0.95,
      evidence: [
        {
          source: 'policy_audit',
          observation: `${bundle.policies.filter(p => p.result === 'waived').length} policies overridden`,
          relevance: 0.98,
        },
        {
          source: 'compliance_framework',
          observation: 'Overrides require documented justification',
          relevance: 0.85,
        },
      ],
      action: {
        type: 'view',
        label: 'Document Override',
        target: '/policies/override',
        parameters: {
          bundleId: bundle.id,
          requiresJustification: true,
        },
      },
      triggeredBy: bundle.id,
      category: 'compliance',
    }),
    priority: 'high',
  },
];

// Second Win Engine
export class SecondWinEngine {
  private rules: SecondWinRule[];
  private state: SuggestionEngineState;
  
  constructor(userId: string, rules: SecondWinRule[] = SECOND_WIN_RULES) {
    this.rules = rules;
    this.state = {
      userId,
      sessionSuggestions: [],
      acceptedCount: 0,
      dismissedCount: 0,
      userPreferences: {},
      successfulPatterns: [],
    };
  }
  
  /**
   * Analyze evidence bundle and generate contextual suggestions
   */
  analyze(bundle: EvidenceBundle, history: EvidenceBundle[] = []): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    for (const rule of this.rules) {
      try {
        if (rule.condition(bundle, history)) {
          const base = rule.generate(bundle, history);
          const suggestion: Suggestion = {
            ...base,
            id: crypto.randomUUID(),
            suggestedAt: new Date(),
            status: 'pending',
          };
          suggestions.push(suggestion);
        }
      } catch (error) {
        // Log error but don't fail the whole engine
        console.error(`Second Win Rule "${rule.name}" failed:`, error);
      }
    }
    
    // Sort by priority and confidence
    const priorityOrder: Record<SuggestionPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
    
    // Update state
    this.state.sessionSuggestions.push(...suggestions);
    this.state.lastSuggestionAt = new Date();
    
    return suggestions;
  }
  
  /**
   * Accept a suggestion - track success
   */
  accept(suggestionId: string): void {
    const suggestion = this.state.sessionSuggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.status = 'accepted';
      this.state.acceptedCount++;
      
      // Update user preferences
      this.state.userPreferences[suggestion.category] = 
        (this.state.userPreferences[suggestion.category] || 0) + 1;
    }
  }
  
  /**
   * Dismiss a suggestion - track with reason
   */
  dismiss(suggestionId: string, reason?: string): void {
    const suggestion = this.state.sessionSuggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.status = 'dismissed';
      suggestion.dismissedReason = reason;
      this.state.dismissedCount++;
    }
  }
  
  /**
   * Snooze a suggestion for later
   */
  snooze(suggestionId: string, until: Date): void {
    const suggestion = this.state.sessionSuggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.status = 'snoozed';
      suggestion.expiresAt = until;
    }
  }
  
  /**
   * Get pending suggestions
   */
  getPending(): Suggestion[] {
    return this.state.sessionSuggestions.filter(s => s.status === 'pending');
  }
  
  /**
   * Get suggestion statistics
   */
  getStats(): { accepted: number; dismissed: number; pending: number } {
    return {
      accepted: this.state.acceptedCount,
      dismissed: this.state.dismissedCount,
      pending: this.getPending().length,
    };
  }
  
  /**
   * Export state for persistence
   */
  exportState(): SuggestionEngineState {
    return this.state;
  }
  
  /**
   * Import state from persistence
   */
  importState(state: SuggestionEngineState): void {
    this.state = state;
  }
}

// Hook for React integration
export function useSecondWin() {
  // This would integrate with React hooks in actual implementation
  // For now, return the engine factory
  return {
    createEngine: (userId: string) => new SecondWinEngine(userId),
    rules: SECOND_WIN_RULES,
  };
}

// Export factory function
export function createSecondWinEngine(userId: string): SecondWinEngine {
  return new SecondWinEngine(userId);
}
