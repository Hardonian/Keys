'use client';

/**
 * Decision Lineage Page (/lineage)
 * 
 * Shows decision timeline and lineage graph
 * "Where your decisions came from and what they led to"
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Bot, 
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock timeline data
const TIMELINE_DATA = {
  id: 'timeline_001',
  name: 'Security Operations',
  description: 'Security policy decisions and their lineage',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
  nodes: [
    {
      id: 'node_001',
      timestamp: new Date('2024-01-15'),
      type: 'action',
      description: 'Initial security audit executed',
      context: 'security_audit',
      automated: true,
      agentId: 'SecurityAgent',
      confidence: 0.92,
      sequence: 1,
      parentIds: [],
      childIds: ['node_002'],
      impact: { timeSaved: 120, riskAvoided: 'Unknown vulnerability exposure' },
      projectPhase: 'discovery',
    },
    {
      id: 'node_002',
      timestamp: new Date('2024-01-16'),
      type: 'policy',
      description: 'RLS policy validation enforced',
      context: 'policy_enforcement',
      automated: true,
      agentId: 'PolicyAgent',
      confidence: 0.95,
      sequence: 2,
      parentIds: ['node_001'],
      childIds: ['node_003', 'node_004'],
      impact: { timeSaved: 60 },
      projectPhase: 'implementation',
    },
    {
      id: 'node_003',
      timestamp: new Date('2024-01-17'),
      type: 'override',
      description: 'Human override: Allowed elevated access for migration',
      context: 'security_exception',
      automated: false,
      userId: 'admin@company.com',
      confidence: 1.0,
      sequence: 3,
      parentIds: ['node_002'],
      childIds: ['node_005'],
      impact: { riskAvoided: 'Migration blockage' },
      projectPhase: 'migration',
    },
    {
      id: 'node_004',
      timestamp: new Date('2024-01-18'),
      type: 'automation',
      description: 'Automated scanning scheduled',
      context: 'scheduling',
      automated: true,
      agentId: 'SchedulerAgent',
      confidence: 0.98,
      sequence: 4,
      parentIds: ['node_002'],
      childIds: [],
      impact: { timeSaved: 240 },
      projectPhase: 'operations',
    },
    {
      id: 'node_005',
      timestamp: new Date('2024-01-20'),
      type: 'action',
      description: 'Migration completed successfully',
      context: 'completion',
      automated: false,
      userId: 'admin@company.com',
      confidence: 1.0,
      sequence: 5,
      parentIds: ['node_003'],
      childIds: [],
      impact: { valueCreated: 'Production migration complete' },
      projectPhase: 'complete',
    },
  ],
};

const TYPE_COLORS: Record<string, string> = {
  action: 'bg-blue-500',
  policy: 'bg-green-500',
  override: 'bg-orange-500',
  configuration: 'bg-purple-500',
  automation: 'bg-cyan-500',
};

export default function LineagePage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const timeline = TIMELINE_DATA;

  const totalTimeSaved = timeline.nodes.reduce((sum, n) => sum + (n.impact.timeSaved || 0), 0);
  const totalRisksAvoided = timeline.nodes.filter(n => n.impact.riskAvoided).length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold">Decision Lineage</h1>
            </div>
            <p className="text-muted-foreground">
              {timeline.name} — {timeline.description}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{timeline.nodes.length}</div>
              <p className="text-sm text-muted-foreground">Total decisions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {timeline.nodes.filter(n => n.automated).length}
              </div>
              <p className="text-sm text-muted-foreground">Automated</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalTimeSaved}m</div>
              <p className="text-sm text-muted-foreground">Time saved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalRisksAvoided}</div>
              <p className="text-sm text-muted-foreground">Risks avoided</p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Decision Timeline</CardTitle>
            <CardDescription>Chronological view of all decisions and their relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.nodes.map((node, index) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative pl-8 pb-8 border-l-2 ${
                    index === timeline.nodes.length - 1 ? '' : 'border-muted'
                  }`}
                >
                  {/* Timeline dot */}
                  <div 
                    className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full ${TYPE_COLORS[node.type]} border-4 border-background`}
                  />

                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedNode === node.id ? 'border-primary bg-muted' : 'hover:border-muted-foreground'
                    }`}
                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {node.automated ? (
                            <Bot className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">{node.description}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {node.timestamp.toLocaleDateString()}
                          <Badge variant="outline" className="text-xs capitalize">
                            {node.type}
                          </Badge>
                          <span className="capitalize">{node.projectPhase}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Math.round(node.confidence * 100)}% confidence
                        </div>
                        {node.impact.timeSaved && (
                          <p className="text-xs text-green-600">+{node.impact.timeSaved}m saved</p>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {selectedNode === node.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t space-y-3"
                      >
                        {node.parentIds.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Depends on:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {node.parentIds.map(parentId => {
                                const parent = timeline.nodes.find(n => n.id === parentId);
                                return parent ? (
                                  <Badge key={parentId} variant="secondary" className="text-xs">
                                    {parent.description.slice(0, 30)}...
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {node.childIds.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Led to:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {node.childIds.map(childId => {
                                const child = timeline.nodes.find(n => n.id === childId);
                                return child ? (
                                  <Badge key={childId} variant="secondary" className="text-xs">
                                    <ArrowRight className="w-3 h-3 mr-1" />
                                    {child.description.slice(0, 30)}...
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {node.impact.riskAvoided && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Risk avoided: {node.impact.riskAvoided}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Sequence: {node.sequence} | Context: {node.context}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Value Summary */}
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>Accumulated Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{totalTimeSaved} minutes</div>
                <p className="text-sm text-muted-foreground">Time saved through automation</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{totalRisksAvoided}</div>
                <p className="text-sm text-muted-foreground">Risks identified and mitigated</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round(timeline.nodes.filter(n => n.automated).length / timeline.nodes.length * 100)}%
                </div>
                <p className="text-sm text-muted-foreground">Automation rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
