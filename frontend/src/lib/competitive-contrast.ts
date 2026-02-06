/**
 * Competitive Contrast Engine
 *
 * Phase 15 Implementation: Explicitly highlight why this system is different
 *
 * Show:
 * - what other tools automate blindly
 * - what this system reasons about
 *
 * Side-by-side explanations (not marketing fluff):
 * - "Why this decision required reasoning, not rules"
 * - "Why generic automation would fail here"
 */

import { EvidenceBundle } from './evidence-bundle';

// Contrast Scenario Types
export type ContrastScenarioType =
  | 'security_policy'
  | 'dependency_update'
  | 'configuration_change'
  | 'architecture_decision'
  | 'risk_assessment'
  | 'compliance_check';

// Generic Automation Approach
export interface GenericApproach {
  name: string;
  description: string;
  approach: string;
  limitations: string[];
  failureModes: string[];
  exampleFailure: string;
}

// Control Plane Approach
export interface ControlPlaneApproach {
  name: string;
  description: string;
  approach: string;
  advantages: string[];
  reasoningSteps: string[];
  exampleSuccess: string;
}

// Side-by-side Comparison
export interface ContrastComparison {
  id: string;
  scenario: {
    type: ContrastScenarioType;
    title: string;
    description: string;
    complexity: 'simple' | 'moderate' | 'complex' | 'wicked';
  };

  generic: GenericApproach;
  controlPlane: ControlPlaneApproach;

  // Key differentiators
  differentiators: Array<{
    aspect: string;
    genericResult: string;
    controlPlaneResult: string;
    whyItMatters: string;
  }>;

  // Why reasoning matters here
  reasoningRequired: string[];
  whyRulesFail: string[];

  // Evidence
  bundleId?: string;
  realWorldExample?: {
    context: string;
    outcome: string;
    valueCreated: string;
  };
}

// Built-in Contrasts
export const BUILT_IN_CONTRASTS: ContrastComparison[] = [
  {
    id: 'contrast_security_policy_violation',
    scenario: {
      type: 'security_policy',
      title: 'Security Policy Violation Detection',
      description: 'A developer submits code that would expose sensitive data',
      complexity: 'complex',
    },

    generic: {
      name: 'Rule-Based Scanner',
      description: 'Traditional linter or SAST tool',
      approach: 'Pattern matching against known vulnerability signatures',
      limitations: [
        'Only catches known patterns',
        'Cannot understand context',
        'High false positive rate',
        'No concept of data sensitivity',
      ],
      failureModes: [
        'Novel vulnerability patterns pass undetected',
        'Context-aware bypasses succeed',
        'Teams disable rules due to noise',
      ],
      exampleFailure: 'A rule checking for "password" in code would miss "pwd" or "passwd" or custom encryption. It would also flag test fixtures as violations without understanding context.',
    },

    controlPlane: {
      name: 'Contextual Policy Engine',
      description: 'Multi-agent system with reasoning',
      approach: 'Semantic analysis + policy reasoning + blast radius evaluation',
      advantages: [
        'Understands data flow and sensitivity',
        'Considers blast radius and impact',
        'Learns from historical violations',
        'Explains why something is risky',
      ],
      reasoningSteps: [
        'Analyze data flow: Where does sensitive data originate?',
        'Evaluate exposure surface: Who can access this?',
        'Assess blast radius: What breaks if this is wrong?',
        'Consider alternatives: Is there a safer pattern?',
        'Generate explanation: Why should the developer care?',
      ],
      exampleSuccess: 'System detected that a logging statement would emit user emails in production logs. It understood: (1) email is PII, (2) logs are accessible to ops team, (3) this violates GDPR Article 32. Suggested using user_id hash instead.',
    },

    differentiators: [
      {
        aspect: 'Context Understanding',
        genericResult: 'Sees "log(user.email)" as string match',
        controlPlaneResult: 'Understands email as PII in production context with GDPR implications',
        whyItMatters: 'Data sensitivity depends on context. "test@test.com" in a test is fine. Real user emails in production logs is a compliance violation.',
      },
      {
        aspect: 'Blast Radius',
        genericResult: 'No concept of impact scope',
        controlPlaneResult: 'Calculates who can see the logs, how long they persist, retention policies',
        whyItMatters: 'Risk is not binary. Logging to ephemeral debug stream vs. permanent searchable archive have vastly different risk profiles.',
      },
      {
        aspect: 'Remediation',
        genericResult: 'Generic warning: "Don\'t log sensitive data"',
        controlPlaneResult: 'Specific suggestion: "Use user.hash_id instead of user.email for correlation without PII exposure"',
        whyItMatters: 'Developers need actionable fixes, not vague warnings. Specific alternatives reduce time-to-fix from hours to minutes.',
      },
    ],

    reasoningRequired: [
      'Data classification requires understanding semantic meaning, not just patterns',
      'Risk assessment requires evaluating blast radius and exposure',
      'Compliance requires knowing which regulations apply in which contexts',
      'Remediation requires creative alternatives that preserve functionality',
    ],

    whyRulesFail: [
      'Cannot enumerate all ways to log user data (console.log, logger.info, print, etc.)',
      'Cannot know which variables contain sensitive data without data flow analysis',
      'Cannot assess risk without understanding deployment context',
      'Cannot suggest alternatives without understanding the developer\'s intent',
    ],
  },

  {
    id: 'contrast_dependency_update',
    scenario: {
      type: 'dependency_update',
      title: 'Dependency Update Decision',
      description: 'A critical security update is available but requires a major version bump',
      complexity: 'wicked',
    },

    generic: {
      name: 'Automated Update Tool',
      description: 'Dependabot, Snyk, or similar',
      approach: 'Flag updates based on severity scores and version delta',
      limitations: [
        'Treats all updates equally',
        'No understanding of breaking changes impact',
        'Cannot evaluate test coverage',
        'Binary decision: update or ignore',
      ],
      failureModes: [
        'Auto-merges breaking changes that break production',
        'Delays critical updates due to generic "major version" fear',
        'Floods teams with low-priority updates during crunch time',
      ],
      exampleFailure: 'Tool flagged lodash 3.x → 4.x as "high priority" because it was a major version. Auto-merged. Broke 47% of test suite. Production rollback required. Actual security fix was one-line patch that could have been backported.',
    },

    controlPlane: {
      name: 'Intelligent Update Advisor',
      description: 'Risk-aware update recommendation system',
      approach: 'Multi-factor analysis: security risk × breaking impact × team capacity',
      advantages: [
        'Evaluates actual vs. potential breaking changes',
        'Considers test coverage and confidence',
        'Times recommendations based on team capacity',
        'Suggests alternative mitigations (backports, workarounds)',
      ],
      reasoningSteps: [
        "Assess security risk: Is this actively exploited? What's the blast radius?",
        'Analyze breaking changes: Which APIs does our codebase actually use?',
        'Evaluate confidence: Do we have tests covering affected code paths?',
        'Check team capacity: Is this a good time for an update?',
        'Recommend approach: Full update, targeted backport, or temporary workaround?',
      ],
      exampleSuccess: 'System detected lodash CVE but also identified that: (1) We only use 3 of 50 changed APIs, (2) All 3 have backward-compatible shims, (3) Test coverage on affected paths is 94%, (4) Sprint ends tomorrow - wait 3 days. Recommended waiting + provided one-line workaround for immediate security mitigation.',
    },

    differentiators: [
      {
        aspect: 'Impact Assessment',
        genericResult: 'Major version = high risk, minor = low risk',
        controlPlaneResult: 'Uses static analysis to determine which changed APIs we actually call',
        whyItMatters: 'A major version with breaking changes in APIs we don\'t use is lower risk than a minor version that changes behavior in our hot path.',
      },
      {
        aspect: 'Timing Intelligence',
        genericResult: 'Creates PR immediately or on schedule',
        controlPlaneResult: 'Considers sprint cycles, release schedules, and team capacity',
        whyItMatters: 'A breaking change during crunch week can derail a release. Same change during refactoring sprint is manageable.',
      },
      {
        aspect: 'Mitigation Options',
        genericResult: 'Update or ignore',
        controlPlaneResult: 'Update, backport, workaround, or defer with monitoring',
        whyItMatters: 'Sometimes a WAF rule or input validation is a better immediate fix than a rushed dependency update.',
      },
    ],

    reasoningRequired: [
      'Breaking change impact requires static analysis of actual code usage',
      'Risk assessment requires weighing security risk against stability risk',
      'Timing requires understanding team processes and capacity',
      'Mitigation requires creative thinking about alternative defenses',
    ],

    whyRulesFail: [
      'Semantic versioning is a promise, not a guarantee of breaking impact',
      'Security severity scores don\'t account for actual exploitability in your architecture',
      'Cannot determine blast radius without analyzing your specific usage patterns',
      'Cannot weigh competing risks without understanding business context',
    ],
  },

  {
    id: 'contrast_architecture_decision',
    scenario: {
      type: 'architecture_decision',
      title: 'API Deprecation and Migration',
      description: 'A core API is being deprecated. Teams need to migrate.',
      complexity: 'wicked',
    },

    generic: {
      name: 'Deprecation Notifier',
      description: 'Static analysis or runtime warning',
      approach: 'Flag usage of deprecated APIs',
      limitations: [
        'No understanding of migration effort',
        'Cannot prioritize based on traffic',
        'No assistance with migration path',
        'Noise from low-usage endpoints',
      ],
      failureModes: [
        'Teams ignore warnings due to volume',
        'High-traffic endpoints deprioritized due to effort',
        'Migration code is buggy due to lack of guidance',
      ],
      exampleFailure: 'Dashboard showed 200+ deprecated API usages. Team ignored it for months. High-traffic checkout endpoint broke in production when old API was finally removed. Revenue impact: $2M in 4 hours.',
    },

    controlPlane: {
      name: 'Intelligent Migration Planner',
      description: 'Reasoned migration prioritization and assistance',
      approach: 'Traffic analysis + effort estimation + risk-based prioritization',
      advantages: [
        'Prioritizes by actual traffic and revenue impact',
        'Estimates migration effort per endpoint',
        'Suggests migration patterns and provides code',
        'Creates phased migration plan with milestones',
      ],
      reasoningSteps: [
        'Analyze traffic: Which deprecated endpoints are actually called?',
        'Assess impact: Revenue at risk, user-facing vs internal',
        'Estimate effort: Complexity of migration for each call site',
        'Prioritize: Risk × Traffic ÷ Effort = Priority score',
        'Plan: Create phased migration with validation gates',
      ],
      exampleSuccess: 'System analyzed 200 flagged usages and determined: (1) Only 12 are in production code paths, (2) 3 are high-traffic revenue-critical, (3) 1 is complex migration, 2 are simple. Created phased plan: Week 1 - simple high-traffic, Week 2 - complex high-traffic, Month 2 - low-traffic. Provided migration code for each.',
    },

    differentiators: [
      {
        aspect: 'Signal vs Noise',
        genericResult: '200 warnings, all treated equally',
        controlPlaneResult: '12 actual production usages prioritized by impact',
        whyItMatters: '200 warnings = ignored. 12 prioritized items with clear impact = actioned.',
      },
      {
        aspect: 'Migration Assistance',
        genericResult: 'Flag: "This is deprecated"',
        controlPlaneResult: 'Provides: Before/after code, effort estimate, validation steps',
        whyItMatters: 'Knowing something is wrong is 1% of the solution. The other 99% is fixing it safely.',
      },
      {
        aspect: 'Phased Approach',
        genericResult: 'Update all or nothing',
        controlPlaneResult: 'Risk-based phases with rollback plans',
        whyItMatters: 'Big-bang migrations are risky. Phased migrations with validation reduce blast radius.',
      },
    ],

    reasoningRequired: [
      'Distinguishing production code from test fixtures, dead code, and branches',
      'Assessing business impact requires understanding revenue attribution',
      'Effort estimation requires semantic understanding of API changes',
      'Prioritization requires multi-factor optimization (risk, effort, value)',
    ],

    whyRulesFail: [
      'Cannot determine if code is actually executed without runtime or advanced static analysis',
      'Cannot assess business impact without correlating with analytics data',
      'Cannot estimate effort without understanding the complexity of both old and new APIs',
      'Cannot create migration plans without understanding dependencies between changes',
    ],
  },
];

// Contrast Engine
export class CompetitiveContrastEngine {
  private contrasts: Map<string, ContrastComparison> = new Map();

  constructor() {
    // Load built-in contrasts
    for (const contrast of BUILT_IN_CONTRASTS) {
      this.contrasts.set(contrast.id, contrast);
    }
  }

  /**
   * Get all contrasts
   */
  getAllContrasts(): ContrastComparison[] {
    return Array.from(this.contrasts.values());
  }

  /**
   * Get contrast by ID
   */
  getContrast(id: string): ContrastComparison | undefined {
    return this.contrasts.get(id);
  }

  /**
   * Get contrasts by scenario type
   */
  getContrastsByType(type: ContrastScenarioType): ContrastComparison[] {
    return this.getAllContrasts().filter(c => c.scenario.type === type);
  }

  /**
   * Find relevant contrast for an evidence bundle
   */
  findRelevantContrast(bundle: EvidenceBundle): ContrastComparison | undefined {
    const actionType = bundle.action.type;

    // Map action types to scenario types
    const typeMap: Record<string, ContrastScenarioType> = {
      security_scan: 'security_policy',
      dependency_health: 'dependency_update',
      architecture_scan: 'architecture_decision',
    };

    const scenarioType = typeMap[actionType];
    if (!scenarioType) return undefined;

    const candidates = this.getContrastsByType(scenarioType);
    return candidates[0]; // Return first match
  }

  /**
   * Generate contrast explanation for a bundle
   */
  generateExplanation(bundle: EvidenceBundle): {
    contrast: ContrastComparison;
    relevance: string;
    whyReasoningMatters: string[];
  } | null {
    const contrast = this.findRelevantContrast(bundle);
    if (!contrast) return null;

    return {
      contrast,
      relevance: `This ${bundle.action.type} required reasoning because: ${contrast.whyRulesFail[0]}`,
      whyReasoningMatters: contrast.reasoningRequired,
    };
  }

  /**
   * Add custom contrast
   */
  addContrast(contrast: ContrastComparison): void {
    this.contrasts.set(contrast.id, contrast);
  }

  /**
   * Export all contrasts
   */
  exportContrasts(): Record<string, ContrastComparison> {
    return Object.fromEntries(this.contrasts);
  }
}

// Factory
export function createCompetitiveContrastEngine(): CompetitiveContrastEngine {
  return new CompetitiveContrastEngine();
}
