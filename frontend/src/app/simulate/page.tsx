'use client';

/**
 * Counterfactual Simulation Page (/simulate)
 * 
 * "What if we had made a different decision?"
 * 
 * Features:
 * - Replay decisions
 * - Simulate alternative outcomes
 * - Stress test policies
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  History, 
  GitBranch, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock replay data
const MOCK_REPLAYS = [
  {
    id: 'replay_001',
    originalBundleId: 'bundle_001',
    status: 'completed',
    config: {
      deterministic: true,
      seed: 'seed_12345',
      environment: { NODE_ENV: 'production' },
    },
    steps: 12,
    matchesOriginal: true,
    divergences: [],
    startTime: new Date(Date.now() - 3600000),
    endTime: new Date(Date.now() - 3590000),
  },
];

const MOCK_COUNTERTFACTUALS = [
  {
    id: 'cf_001',
    originalDecisionId: 'node_001',
    whatIf: 'What if we had skipped the security audit?',
    alternativeAction: 'Deploy without security validation',
    simulatedOutcome: {
      summary: '73% probability of security incident within 30 days',
      probability: 0.73,
      confidence: 0.65,
    },
    comparison: {
      actualResult: 'System applied security policy and blocked deployment',
      hypotheticalResult: 'Deployment proceeds without policy check',
      difference: 'Potential security vulnerability in production',
      valueAtStake: '$50K - $500K in breach remediation costs',
    },
    verdict: 'correct_decision',
    confidence: 0.85,
  },
];

const MOCK_STRESS_TESTS = [
  {
    id: 'stress_001',
    policyId: 'policy_security_scan',
    status: 'completed',
    scenario: {
      name: 'Obfuscated SQL Injection Attempt',
      description: 'Attacker uses encoding to bypass pattern matching',
      severity: 'critical',
    },
    policyBlocked: true,
    bypassesFound: 0,
    recommendations: ['Policy is robust against tested attack vectors'],
  },
];

export default function SimulatePage() {
  const [activeTab, setActiveTab] = useState<'replay' | 'counterfactual' | 'stress'>('replay');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">Simulation & Replay</h1>
          </div>
          <p className="text-muted-foreground">
            Test decisions, explore alternatives, and validate policies
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-4">
          <Button
            variant={activeTab === 'replay' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('replay')}
          >
            <History className="w-4 h-4 mr-2" />
            Deterministic Replay
          </Button>
          <Button
            variant={activeTab === 'counterfactual' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('counterfactual')}
          >
            <GitBranch className="w-4 h-4 mr-2" />
            What If?
          </Button>
          <Button
            variant={activeTab === 'stress' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('stress')}
          >
            <Shield className="w-4 h-4 mr-2" />
            Policy Stress Test
          </Button>
        </div>

        {/* Replay Tab */}
        {activeTab === 'replay' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  Deterministic Replay
                </CardTitle>
                <CardDescription>
                  Replay any execution with identical results for audit compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {MOCK_REPLAYS.map((replay) => (
                  <Card key={replay.id} className="bg-muted">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={replay.matchesOriginal ? 'default' : 'destructive'}>
                              {replay.matchesOriginal ? 'Verified' : 'Divergence Detected'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {replay.steps} steps
                            </span>
                          </div>
                          <p className="text-sm">
                            <strong>Seed:</strong> {replay.config.seed}
                          </p>
                          <p className="text-sm">
                            <strong>Duration:</strong>{' '}
                            {replay.endTime && replay.startTime
                              ? `${(replay.endTime.getTime() - replay.startTime.getTime()) / 1000}s`
                              : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          {replay.matchesOriginal ? (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex gap-2">
                  <Button>
                    <Play className="w-4 h-4 mr-2" />
                    New Replay
                  </Button>
                  <Button variant="outline">
                    <Clock className="w-4 h-4 mr-2" />
                    Schedule Replay
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">100%</div>
                    <p className="text-sm text-muted-foreground">Replay success rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">12</div>
                    <p className="text-sm text-muted-foreground">Verified replays</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">0</div>
                    <p className="text-sm text-muted-foreground">Divergences found</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Counterfactual Tab */}
        {activeTab === 'counterfactual' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {MOCK_COUNTERTFACTUALS.map((cf) => (
              <Card key={cf.id}>
                <CardHeader>
                  <CardTitle>{cf.whatIf}</CardTitle>
                  <CardDescription>{cf.alternativeAction}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Outcome comparison */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-green-200 bg-green-50/50">
                      <h4 className="font-semibold text-green-700 mb-2">What Actually Happened</h4>
                      <p className="text-sm">{cf.comparison.actualResult}</p>
                    </div>
                    <div className="p-4 rounded-lg border border-red-200 bg-red-50/50">
                      <h4 className="font-semibold text-red-700 mb-2">What Would Have Happened</h4>
                      <p className="text-sm">{cf.comparison.hypotheticalResult}</p>
                    </div>
                  </div>

                  {/* Simulation results */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Simulated Outcome</span>
                      <Badge>{Math.round(cf.simulatedOutcome.probability * 100)}% probability</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {cf.simulatedOutcome.summary}
                    </p>
                  </div>

                  {/* Value at stake */}
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Value at Stake:</strong> {cf.comparison.valueAtStake}
                    </p>
                  </div>

                  {/* Verdict */}
                  <div className="flex items-center gap-2">
                    <Badge className={cf.verdict === 'correct_decision' ? 'bg-green-500' : 'bg-yellow-500'}>
                      {cf.verdict === 'correct_decision' ? 'Correct Decision' : 'Suboptimal'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(cf.confidence * 100)}% confidence
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Stress Test Tab */}
        {activeTab === 'stress' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {MOCK_STRESS_TESTS.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{test.scenario.name}</CardTitle>
                      <CardDescription>{test.scenario.description}</CardDescription>
                    </div>
                    <Badge 
                      variant={test.policyBlocked ? 'default' : 'destructive'}
                      className={test.policyBlocked ? 'bg-green-500' : 'bg-red-500'}
                    >
                      {test.policyBlocked ? 'Blocked' : 'Bypass Found'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{test.scenario.severity}</div>
                      <p className="text-sm text-muted-foreground">Severity</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{test.bypassesFound}</div>
                      <p className="text-sm text-muted-foreground">Bypasses found</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{test.policyBlocked ? 'Pass' : 'Fail'}</div>
                      <p className="text-sm text-muted-foreground">Result</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">Recommendations</p>
                    <ul className="text-sm space-y-1">
                      {test.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button>
              <Shield className="w-4 h-4 mr-2" />
              Run New Stress Test
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
