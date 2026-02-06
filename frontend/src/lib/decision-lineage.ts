/**
 * Decision Lineage - Irreversibility Without Lock-in
 *
 * Phase 13 Implementation: Users accumulate institutional memory that is portable but painful to recreate
 *
 * Tracks:
 * - decision history
 * - rationale graphs
 * - compliance artifacts
 * - institutional memory
 *
 * Exposes:
 * - Longitudinal timelines
 * - Decision lineage graphs
 * - Exportable but non-trivial artifacts
 */

import { EvidenceBundle } from './evidence-bundle';
import { SystemMemory } from './system-memory';

// Decision Node in the lineage graph
export interface DecisionNode {
  id: string;
  timestamp: Date;

  // The decision
  type: 'action' | 'policy' | 'override' | 'configuration' | 'automation';
  description: string;
  context: string;

  // Decision makers
  automated: boolean;
  agentId?: string;
  userId?: string;

  // Evidence
  evidenceBundleId: string;
  reasoning: string;
  confidence: number;

  // Lineage
  parentIds: string[]; // Previous decisions this depends on
  childIds: string[]; // Decisions that depend on this
  alternatives: AlternativeDecision[];

  // Impact
  impact: {
    riskAvoided?: string;
    valueCreated?: string;
    timeSaved?: number; // minutes
    costAvoided?: number; // dollars
  };

  // Temporal data
  sequence: number; // Order in timeline
  projectPhase: string;
}

// Alternative decisions considered
export interface AlternativeDecision {
  id: string;
  description: string;
  whyNotChosen: string;
  potentialImpact: string;
  riskIfTaken: string;
}

// Decision Timeline - Longitudinal view
export interface DecisionTimeline {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;

  // Nodes in order
  nodes: DecisionNode[];

  // Metadata
  totalDecisions: number;
  automatedDecisions: number;
  humanOverrides: number;

  // Value accumulation
  totalTimeSaved: number;
  totalCostAvoided: number;
  risksAvoided: string[];

  // Export info
  exportFormat: 'portable' | 'full';
  portableSize: number; // Approximate size in KB
}

// Compliance Artifact
export interface ComplianceArtifact {
  id: string;
  type: 'audit_trail' | 'decision_log' | 'policy_override' | 'risk_assessment';
  timestamp: Date;

  // Content
  summary: string;
  details: string;
  evidence: string[];

  // Signatures
  generatedBy: string;
  approvedBy?: string;
  auditHash: string;

  // Export
  format: 'pdf' | 'json' | 'markdown';
  retentionPeriod: string;
}

// Lineage Graph for visualization
export interface LineageGraph {
  nodes: Array<{
    id: string;
    type: DecisionNode['type'];
    label: string;
    timestamp: Date;
    confidence: number;
    automated: boolean;
  }>;

  edges: Array<{
    source: string;
    target: string;
    type: 'depends_on' | 'influenced_by' | 'overrode';
    label?: string;
  }>;

  clusters: Array<{
    id: string;
    label: string;
    nodeIds: string[];
    period: { start: Date; end: Date };
  }>;
}

// Decision Lineage Engine
export class DecisionLineage {
  private timelines: Map<string, DecisionTimeline> = new Map();
  private nodes: Map<string, DecisionNode> = new Map();
  private artifacts: Map<string, ComplianceArtifact> = new Map();
  private sequenceCounter = 0;

  /**
   * Create a new decision timeline
   */
  createTimeline(name: string, description: string): DecisionTimeline {
    const timeline: DecisionTimeline = {
      id: this.generateId('timeline'),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      nodes: [],
      totalDecisions: 0,
      automatedDecisions: 0,
      humanOverrides: 0,
      totalTimeSaved: 0,
      totalCostAvoided: 0,
      risksAvoided: [],
      exportFormat: 'portable',
      portableSize: 0,
    };

    this.timelines.set(timeline.id, timeline);
    return timeline;
  }

  /**
   * Record a decision in the lineage
   */
  recordDecision(
    timelineId: string,
    decision: Omit<DecisionNode, 'id' | 'sequence' | 'childIds'>
  ): DecisionNode {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) {
      throw new Error(`Timeline ${timelineId} not found`);
    }

    const node: DecisionNode = {
      ...decision,
      id: this.generateId('node'),
      sequence: ++this.sequenceCounter,
      childIds: [],
    };

    // Update parent nodes to reference this child
    for (const parentId of node.parentIds) {
      const parent = this.nodes.get(parentId);
      if (parent) {
        parent.childIds.push(node.id);
      }
    }

    this.nodes.set(node.id, node);
    timeline.nodes.push(node);
    timeline.updatedAt = new Date();

    // Update statistics
    timeline.totalDecisions++;
    if (node.automated) {
      timeline.automatedDecisions++;
    } else if (node.type === 'override') {
      timeline.humanOverrides++;
    }

    // Accumulate value
    if (node.impact.timeSaved) {
      timeline.totalTimeSaved += node.impact.timeSaved;
    }
    if (node.impact.costAvoided) {
      timeline.totalCostAvoided += node.impact.costAvoided;
    }
    if (node.impact.riskAvoided) {
      timeline.risksAvoided.push(node.impact.riskAvoided);
    }

    // Update portable size estimate
    timeline.portableSize = this.calculatePortableSize(timeline);

    return node;
  }

  /**
   * Record decision from evidence bundle
   */
  recordFromBundle(
    timelineId: string,
    bundle: EvidenceBundle,
    parentIds: string[] = [],
    userId?: string
  ): DecisionNode {
    const decision: Omit<DecisionNode, 'id' | 'sequence' | 'childIds'> = {
      timestamp: new Date(bundle.timestamp),
      type: 'action',
      description: bundle.action.description,
      context: bundle.action.type,
      automated: !userId,
      agentId: bundle.action.agent.id,
      userId,
      evidenceBundleId: bundle.id,
      reasoning: bundle.reasoning.summary,
      confidence: bundle.reasoning.final_decision.confidence,
      parentIds,
      alternatives: bundle.reasoning.steps[0]?.alternatives_considered.map((alt, i) => ({
        id: `${bundle.id}_alt_${i}`,
        description: alt,
        whyNotChosen: bundle.reasoning.steps[0]?.why_not_others[i] || 'Not selected',
        potentialImpact: 'Unknown - alternative not executed',
        riskIfTaken: 'Unknown without execution',
      })) || [],
      impact: {
        timeSaved: this.estimateTimeSaved(bundle),
      },
      projectPhase: 'active',
    };

    return this.recordDecision(timelineId, decision);
  }

  /**
   * Record a human override as a decision
   */
  recordOverride(
    timelineId: string,
    originalDecisionId: string,
    override: {
      userId: string;
      description: string;
      reasoning: string;
      bundleId: string;
    }
  ): DecisionNode {
    const parentNode = this.nodes.get(originalDecisionId);
    if (!parentNode) {
      throw new Error(`Original decision ${originalDecisionId} not found`);
    }

    const overrideNode = this.recordDecision(timelineId, {
      timestamp: new Date(),
      type: 'override',
      description: `Override: ${override.description}`,
      context: parentNode.context,
      automated: false,
      userId: override.userId,
      evidenceBundleId: override.bundleId,
      reasoning: override.reasoning,
      confidence: 1.0, // Human decisions have 100% confidence in the lineage
      parentIds: [originalDecisionId],
      alternatives: [{
        id: originalDecisionId,
        description: parentNode.description,
        whyNotChosen: 'Overridden by human decision',
        potentialImpact: parentNode.impact.valueCreated || 'Unknown',
        riskIfTaken: 'Avoided by override',
      }],
      impact: {
        riskAvoided: 'Automated decision risk',
      },
      projectPhase: parentNode.projectPhase,
    });

    return overrideNode;
  }

  /**
   * Generate lineage graph for visualization
   */
  generateGraph(timelineId: string): LineageGraph {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) {
      throw new Error(`Timeline ${timelineId} not found`);
    }

    const nodes = timeline.nodes.map(n => ({
      id: n.id,
      type: n.type,
      label: n.description.slice(0, 50) + (n.description.length > 50 ? '...' : ''),
      timestamp: n.timestamp,
      confidence: n.confidence,
      automated: n.automated,
    }));

    const edges: LineageGraph['edges'] = [];
    for (const node of timeline.nodes) {
      for (const parentId of node.parentIds) {
        edges.push({
          source: parentId,
          target: node.id,
          type: 'depends_on',
        });
      }

      if (node.type === 'override') {
        // Find the overridden decision
        const overridden = node.alternatives[0];
        if (overridden) {
          edges.push({
            source: node.id,
            target: overridden.id,
            type: 'overrode',
            label: 'overrode',
          });
        }
      }
    }

    // Create time-based clusters
    const clusters: LineageGraph['clusters'] = [];
    if (timeline.nodes.length > 0) {
      const sortedNodes = [...timeline.nodes].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const chunkSize = Math.max(1, Math.floor(sortedNodes.length / 4));

      for (let i = 0; i < 4; i++) {
        const start = i * chunkSize;
        const end = i === 3 ? sortedNodes.length : (i + 1) * chunkSize;
        const chunk = sortedNodes.slice(start, end);

        if (chunk.length > 0) {
          clusters.push({
            id: `cluster_${i}`,
            label: `Phase ${i + 1}`,
            nodeIds: chunk.map(n => n.id),
            period: {
              start: chunk[0].timestamp,
              end: chunk[chunk.length - 1].timestamp,
            },
          });
        }
      }
    }

    return { nodes, edges, clusters };
  }

  /**
   * Export timeline as portable artifact
   */
  exportPortable(timelineId: string): {
    summary: Record<string, unknown>;
    decisions: DecisionNode[];
    artifacts: ComplianceArtifact[];
    format: 'portable';
  } {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) {
      throw new Error(`Timeline ${timelineId} not found`);
    }

    // Portable version excludes some details but keeps the story
    const portableDecisions = timeline.nodes.map(n => ({
      ...n,
      // Keep core fields but remove internal references
      evidenceBundleId: '[bundles exported separately]',
      alternatives: n.alternatives.map(a => ({
        ...a,
        // Keep description but remove detailed analysis
        potentialImpact: '[see full export]',
        riskIfTaken: '[see full export]',
      })),
    }));

    const relevantArtifacts = Array.from(this.artifacts.values())
      .filter(a => timeline.nodes.some(n => n.evidenceBundleId.includes(a.id)));

    return {
      summary: {
        name: timeline.name,
        description: timeline.description,
        period: {
          start: timeline.createdAt,
          end: timeline.updatedAt,
        },
        statistics: {
          totalDecisions: timeline.totalDecisions,
          automatedRate: timeline.automatedDecisions / timeline.totalDecisions,
          overrideRate: timeline.humanOverrides / timeline.totalDecisions,
        },
        value: {
          timeSaved: timeline.totalTimeSaved,
          costAvoided: timeline.totalCostAvoided,
          risksAvoided: timeline.risksAvoided,
        },
      },
      decisions: portableDecisions,
      artifacts: relevantArtifacts,
      format: 'portable',
    };
  }

  /**
   * Export full timeline with all data
   */
  exportFull(timelineId: string): {
    timeline: DecisionTimeline;
    nodes: DecisionNode[];
    graph: LineageGraph;
    artifacts: ComplianceArtifact[];
    format: 'full';
  } {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) {
      throw new Error(`Timeline ${timelineId} not found`);
    }

    return {
      timeline,
      nodes: timeline.nodes,
      graph: this.generateGraph(timelineId),
      artifacts: Array.from(this.artifacts.values()),
      format: 'full',
    };
  }

  /**
   * Create compliance artifact
   */
  createArtifact(
    type: ComplianceArtifact['type'],
    summary: string,
    details: string,
    evidence: string[],
    generatedBy: string
  ): ComplianceArtifact {
    const artifact: ComplianceArtifact = {
      id: this.generateId('artifact'),
      type,
      timestamp: new Date(),
      summary,
      details,
      evidence,
      generatedBy,
      auditHash: this.generateAuditHash(summary, details, evidence),
      format: 'pdf',
      retentionPeriod: '7 years',
    };

    this.artifacts.set(artifact.id, artifact);
    return artifact;
  }

  /**
   * Get timeline statistics
   */
  getStats(timelineId: string): {
    totalDecisions: number;
    automatedRate: number;
    overrideRate: number;
    avgConfidence: number;
    totalValue: {
      timeSaved: number;
      costAvoided: number;
      risksAvoided: number;
    };
  } {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) {
      throw new Error(`Timeline ${timelineId} not found`);
    }

    const totalConfidence = timeline.nodes.reduce((sum, n) => sum + n.confidence, 0);

    return {
      totalDecisions: timeline.totalDecisions,
      automatedRate: timeline.totalDecisions > 0 ? timeline.automatedDecisions / timeline.totalDecisions : 0,
      overrideRate: timeline.totalDecisions > 0 ? timeline.humanOverrides / timeline.totalDecisions : 0,
      avgConfidence: timeline.totalDecisions > 0 ? totalConfidence / timeline.totalDecisions : 0,
      totalValue: {
        timeSaved: timeline.totalTimeSaved,
        costAvoided: timeline.totalCostAvoided,
        risksAvoided: timeline.risksAvoided.length,
      },
    };
  }

  /**
   * Find similar decisions across timelines
   */
  findSimilarDecisions(description: string, threshold = 0.7): DecisionNode[] {
    const results: DecisionNode[] = [];
    const searchTerms = description.toLowerCase().split(' ');

    for (const node of this.nodes.values()) {
      const nodeTerms = node.description.toLowerCase().split(' ');
      const common = searchTerms.filter(t => nodeTerms.includes(t));
      const similarity = common.length / Math.max(searchTerms.length, nodeTerms.length);

      if (similarity >= threshold) {
        results.push(node);
      }
    }

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Private helpers

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditHash(summary: string, details: string, evidence: string[]): string {
    const content = `${summary}|${details}|${evidence.join(',')}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `audit_${Math.abs(hash).toString(16)}`;
  }

  private estimateTimeSaved(bundle: EvidenceBundle): number {
    // Rough estimate based on action type and complexity
    const baseTime: Record<string, number> = {
      security_scan: 120,
      dependency_health: 60,
      architecture_scan: 180,
      documentation: 90,
      default: 30,
    };

    const complexity = bundle.trace.length;
    return (baseTime[bundle.action.type] || baseTime.default) + complexity * 5;
  }

  private calculatePortableSize(timeline: DecisionTimeline): number {
    // Rough estimate in KB
    const nodeSize = 2; // 2KB per node average
    return timeline.nodes.length * nodeSize;
  }
}

// Factory
export function createDecisionLineage(): DecisionLineage {
  return new DecisionLineage();
}

// Integration helper
export function createLineageFromMemory(
  memory: SystemMemory,
  name: string,
  description: string
): DecisionLineage {
  const lineage = new DecisionLineage();
  const timeline = lineage.createTimeline(name, description);

  // Note: This is a simplified integration
  // In practice, you'd iterate through memory events and convert them
  console.warn(`Created lineage timeline ${timeline.id} linked to memory`);

  return lineage;
}
