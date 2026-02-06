'use client';

/**
 * System Memory Page (/memory)
 * 
 * Shows system beliefs, confidence levels, and evidence
 * "What the system has learned and how confident it is"
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SystemBelief } from '@/lib/system-memory';

// Mock beliefs for demo
const MOCK_BELIEFS: SystemBelief[] = [
  {
    id: 'belief_001',
    statement: 'SecurityAgent is highly reliable for vulnerability detection',
    category: 'agent_reliability',
    confidence: 0.94,
    confidenceTrend: 'rising',
    supportingEvidence: [
      { id: 'ev_001', type: 'statistical', source: 'execution_history', description: '47 consecutive successful scans', timestamp: new Date(), strength: 0.95 },
      { id: 'ev_002', type: 'expert', source: 'security_team', description: 'Validated findings against manual audit', timestamp: new Date(), strength: 0.90 },
    ],
    contradictingEvidence: [],
    formedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(),
    updateCount: 12,
    timesValidated: 47,
    timesOverridden: 2,
    timesCorrected: 1,
    humanAnnotations: [
      { id: 'ann_001', type: 'agreement', userId: 'alice@company.com', comment: 'Consistently accurate', timestamp: new Date() },
    ],
    appliedInContexts: ['security_audit', 'dependency_scan'],
    impactScore: 8.5,
  },
  {
    id: 'belief_002',
    statement: 'Weekly dependency scans reduce MTTD by 7x compared to monthly',
    category: 'policy_effectiveness',
    confidence: 0.88,
    confidenceTrend: 'stable',
    supportingEvidence: [
      { id: 'ev_003', type: 'statistical', source: 'incident_response', description: 'CVE detection time: 2 days (weekly) vs 14 days (monthly)', timestamp: new Date(), strength: 0.90 },
    ],
    contradictingEvidence: [
      { id: 'ev_004', type: 'observation', source: 'developer_feedback', description: 'Weekly scans can be noisy', timestamp: new Date(), strength: 0.30 },
    ],
    formedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(),
    updateCount: 8,
    timesValidated: 23,
    timesOverridden: 0,
    timesCorrected: 0,
    humanAnnotations: [],
    appliedInContexts: ['dependency_health'],
    impactScore: 9.2,
  },
  {
    id: 'belief_003',
    statement: 'Human overrides occur most frequently during sprint deadlines',
    category: 'user_preferences',
    confidence: 0.72,
    confidenceTrend: 'rising',
    supportingEvidence: [
      { id: 'ev_005', type: 'statistical', source: 'override_logs', description: '78% of overrides occur within 3 days of sprint end', timestamp: new Date(), strength: 0.75 },
    ],
    contradictingEvidence: [],
    formedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(),
    updateCount: 3,
    timesValidated: 8,
    timesOverridden: 0,
    timesCorrected: 0,
    humanAnnotations: [
      { id: 'ann_002', type: 'clarification', userId: 'bob@company.com', comment: 'We also override when demos are due', timestamp: new Date() },
    ],
    appliedInContexts: ['policy_enforcement'],
    impactScore: 6.5,
  },
];

const TREND_ICONS = {
  rising: <TrendingUp className="w-4 h-4 text-green-500" />,
  falling: <TrendingDown className="w-4 h-4 text-red-500" />,
  stable: <Minus className="w-4 h-4 text-gray-500" />,
};

const CONFIDENCE_COLORS = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-red-500',
};

export default function SystemMemoryPage() {
  const [beliefs, setBeliefs] = useState<SystemBelief[]>(MOCK_BELIEFS);
  const [selectedBelief, setSelectedBelief] = useState<SystemBelief | null>(null);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return CONFIDENCE_COLORS.high;
    if (confidence >= 0.5) return CONFIDENCE_COLORS.medium;
    return CONFIDENCE_COLORS.low;
  };

  const handleAnnotate = (beliefId: string, type: HumanAnnotation['type']) => {
    // In real implementation, this would call the API
    console.log(`Annotated belief ${beliefId} with ${type}`);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            <h1 className="text-3xl font-bold">System Memory</h1>
          </div>
          <p className="text-muted-foreground">
            What the system believes, why it believes it, and how confident it is
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{beliefs.length}</div>
              <p className="text-sm text-muted-foreground">Active beliefs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {Math.round(beliefs.reduce((sum, b) => sum + b.confidence, 0) / beliefs.length * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Avg confidence</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {beliefs.reduce((sum, b) => sum + b.timesValidated, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Validations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {beliefs.filter(b => b.timesOverridden > 0).length}
              </div>
              <p className="text-sm text-muted-foreground">Contested</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Beliefs</TabsTrigger>
            <TabsTrigger value="high">High Confidence</TabsTrigger>
            <TabsTrigger value="contested">Contested</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {beliefs.map((belief) => (
              <motion.div
                key={belief.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedBelief(belief)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{belief.statement}</CardTitle>
                          {TREND_ICONS[belief.confidenceTrend]}
                        </div>
                        <CardDescription className="capitalize">
                          {belief.category.replace('_', ' ')}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {Math.round(belief.confidence * 100)}%
                        </div>
                        <p className="text-xs text-muted-foreground">confidence</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Confidence bar */}
                      <div className="space-y-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getConfidenceColor(belief.confidence)} transition-all`}
                            style={{ width: `${belief.confidence * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Supported by {belief.supportingEvidence.length} evidence</span>
                          <span>Validated {belief.timesValidated} times</span>
                        </div>
                      </div>

                      {/* Evidence pills */}
                      <div className="flex flex-wrap gap-2">
                        {belief.supportingEvidence.slice(0, 3).map((ev) => (
                          <Badge key={ev.id} variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                            {ev.source}
                          </Badge>
                        ))}
                        {belief.contradictingEvidence.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <XCircle className="w-3 h-3 mr-1 text-red-500" />
                            {belief.contradictingEvidence.length} contradicting
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnnotate(belief.id, 'agreement');
                          }}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Agree
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnnotate(belief.id, 'disagreement');
                          }}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Disagree
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Comment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="high" className="space-y-4">
            {beliefs.filter(b => b.confidence >= 0.8).map((belief) => (
              <Card key={belief.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    <CardTitle className="text-lg">{belief.statement}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(belief.confidence * 100)}% confidence
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Validated {belief.timesValidated} times with {belief.supportingEvidence.length} supporting evidence
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="contested" className="space-y-4">
            {beliefs.filter(b => b.timesOverridden > 0).map((belief) => (
              <Card key={belief.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <CardTitle className="text-lg">{belief.statement}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold">{belief.timesOverridden}</div>
                    <div>
                      <p className="font-medium">Overridden {belief.timesOverridden} times</p>
                      <p className="text-sm text-muted-foreground">
                        Despite {belief.timesValidated} successful validations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
