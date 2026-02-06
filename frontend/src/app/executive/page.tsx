'use client';

/**
 * Executive Dashboard (/executive)
 * 
 * Non-technical stakeholder view
 * Shows: what changed, what risk was avoided, what value was created
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock executive data
const EXECUTIVE_DATA = {
  summary: {
    period: 'This Quarter',
    totalDecisions: 1247,
    automatedRate: 0.85,
    riskAvoided: 23,
    valueCreated: '623 hours saved',
    systemHealth: 'excellent' as const,
    teamConfidence: 0.92,
  },
  cards: [
    {
      id: 'value_summary',
      type: 'value' as const,
      priority: 'high' as const,
      headline: '1,247 decisions automated',
      subheadline: 'System handled routine choices, freeing team for strategic work',
      whatHappened: 'The system processed 1,247 decisions this quarter, applying learned patterns and verified policies.',
      whyItMatters: 'Automating routine decisions reduces human error and accelerates delivery while maintaining audit trails.',
      whatWeDid: 'Deployed automation across security, dependencies, and documentation workflows.',
      metric: { value: '85%', change: '+12% from last quarter', trend: 'up' as const },
      evidence: ['All decisions logged with full rationale', 'Policy compliance: 100%', 'No post-hoc overrides required'],
      confidence: 0.94,
      requiresAction: false,
    },
    {
      id: 'risk_summary',
      type: 'risk' as const,
      priority: 'critical' as const,
      headline: '23 risks identified and avoided',
      subheadline: 'Early detection prevented downstream issues',
      whatHappened: 'The system flagged 23 potential risks before they became problems.',
      whyItMatters: 'Early risk detection reduces remediation cost by 10x and prevents customer impact.',
      whatWeDid: 'Implemented continuous scanning with automated policy enforcement.',
      metric: { value: '23', change: '+5 from last quarter', trend: 'up' as const },
      evidence: ['Security vulnerabilities patched proactively', 'Dependency conflicts resolved before deployment', 'Policy violations blocked automatically'],
      confidence: 0.97,
      requiresAction: false,
    },
    {
      id: 'confidence_summary',
      type: 'confidence' as const,
      priority: 'medium' as const,
      headline: 'System confidence remains high',
      subheadline: '92% average confidence across all decisions',
      whatHappened: 'The system tracked confidence scores for every decision, with full transparency into uncertainty.',
      whyItMatters: 'Knowing what we don\'t know is as valuable as knowing what we do. High confidence enables autonomy.',
      whatWeDid: 'Validated decisions against historical outcomes and human feedback.',
      metric: { value: '92%', change: '+3% from last quarter', trend: 'up' as const },
      evidence: ['Validated predictions: 94% accuracy', 'Human overrides: <2% of decisions', 'Confidence correlates with success rate'],
      confidence: 0.92,
      requiresAction: false,
    },
  ],
  trends: {
    automationRate: { current: 0.85, previous: 0.73, change: 0.12 },
    riskDetection: { current: 23, previous: 18, change: 5 },
    timeSavings: { current: 623, previous: 467, change: 156 },
  },
  alerts: [],
};

const TYPE_ICONS = {
  value: <TrendingUp className="w-6 h-6 text-green-500" />,
  risk: <Shield className="w-6 h-6 text-blue-500" />,
  confidence: <CheckCircle className="w-6 h-6 text-purple-500" />,
  change: <Clock className="w-6 h-6 text-orange-500" />,
  alert: <AlertTriangle className="w-6 h-6 text-red-500" />,
};

const HEALTH_COLORS = {
  excellent: 'bg-green-500',
  good: 'bg-blue-500',
  concerning: 'bg-yellow-500',
  critical: 'bg-red-500',
};

export default function ExecutiveDashboardPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Executive Dashboard</h1>
            <p className="text-muted-foreground">
              Operational overview for stakeholders and leadership
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Board Report
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* System Health */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">System Health</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${HEALTH_COLORS[EXECUTIVE_DATA.summary.systemHealth]}`} />
                  <span className="text-2xl font-bold capitalize">
                    {EXECUTIVE_DATA.summary.systemHealth}
                  </span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground">{EXECUTIVE_DATA.summary.period}</p>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Decisions Automated</p>
              <div className="text-3xl font-bold">{EXECUTIVE_DATA.summary.totalDecisions.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                +{(EXECUTIVE_DATA.trends.automationRate.change * 100).toFixed(0)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Automation Rate</p>
              <div className="text-3xl font-bold">{Math.round(EXECUTIVE_DATA.summary.automatedRate * 100)}%</div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                Target: 80%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Risks Avoided</p>
              <div className="text-3xl font-bold">{EXECUTIVE_DATA.summary.riskAvoided}</div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                +{EXECUTIVE_DATA.trends.riskDetection.change}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Value Created</p>
              <div className="text-3xl font-bold">{EXECUTIVE_DATA.summary.valueCreated}</div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <DollarSign className="w-4 h-4" />
                ${(EXECUTIVE_DATA.trends.timeSavings.current * 150).toLocaleString()} equivalent
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Executive Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">What Happened This Period</h2>
          {EXECUTIVE_DATA.cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      {TYPE_ICONS[card.type]}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <CardTitle>{card.headline}</CardTitle>
                        {card.metric && (
                          <div className="text-right">
                            <div className="text-2xl font-bold">{card.metric.value}</div>
                            <div className={`text-sm flex items-center justify-end gap-1 ${
                              card.metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {card.metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              {card.metric.change}
                            </div>
                          </div>
                        )}
                      </div>
                      <CardDescription>{card.subheadline}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">What Happened</p>
                      <p className="text-sm">{card.whatHappened}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Why It Matters</p>
                      <p className="text-sm">{card.whyItMatters}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">What We Did</p>
                      <p className="text-sm">{card.whatWeDid}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {card.evidence.map((e, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {e}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
