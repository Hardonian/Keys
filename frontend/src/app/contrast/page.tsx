'use client';

/**
 * Competitive Contrast Page (/contrast)
 * 
 * Shows side-by-side comparisons with generic automation tools
 * "Why Control Plane's reasoning approach wins"
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Scale, 
  XCircle, 
  CheckCircle, 
  Brain,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock contrast data
const CONTRASTS = [
  {
    id: 'contrast_001',
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
    ],
  },
  {
    id: 'contrast_002',
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
    },
    controlPlane: {
      name: 'Intelligent Update Advisor',
      description: 'Risk-aware update recommendation system',
      approach: 'Multi-factor analysis: security risk x breaking impact x team capacity',
      advantages: [
        'Evaluates actual vs. potential breaking changes',
        'Considers test coverage and confidence',
        'Times recommendations based on team capacity',
        'Suggests alternative mitigations (backports, workarounds)',
      ],
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
    ],
  },
];

export default function ContrastPage() {
  const [expandedId, setExpandedId] = useState<string | null>('contrast_001');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">Competitive Contrast</h1>
          </div>
          <p className="text-muted-foreground">
            Why reasoning beats rules — side-by-side comparison
          </p>
        </div>

        {/* Introduction */}
        <Card className="bg-muted">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Brain className="w-8 h-8 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Why This Matters</h3>
                <p className="text-muted-foreground">
                  Most automation tools follow rigid rules. Control Plane uses reasoning — 
                  understanding context, weighing trade-offs, and explaining decisions. 
                  Here is how that difference plays out in real scenarios.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contrasts */}
        <div className="space-y-4">
          {CONTRASTS.map((contrast) => (
            <Card key={contrast.id} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedId(expandedId === contrast.id ? null : contrast.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{contrast.scenario.title}</CardTitle>
                      <Badge variant="outline" className="capitalize">
                        {contrast.scenario.complexity} complexity
                      </Badge>
                    </div>
                    <CardDescription>{contrast.scenario.description}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedId === contrast.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              <AnimatePresence>
                {expandedId === contrast.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="space-y-6">
                      {/* Side-by-side comparison */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Generic Approach */}
                        <div className="p-4 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/10">
                          <div className="flex items-center gap-2 mb-3">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <h3 className="font-semibold">{contrast.generic.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {contrast.generic.description}
                          </p>
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-red-600">Limitations:</p>
                            <ul className="text-sm space-y-1">
                              {contrast.generic.limitations.map((limitation, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-red-500 mt-1">•</span>
                                  {limitation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Control Plane Approach */}
                        <div className="p-4 rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-950/10">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <h3 className="font-semibold">{contrast.controlPlane.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {contrast.controlPlane.description}
                          </p>
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-green-600">Advantages:</p>
                            <ul className="text-sm space-y-1">
                              {contrast.controlPlane.advantages.map((advantage, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-500 mt-1" />
                                  {advantage}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Key Differentiators */}
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Key Differentiators
                        </h4>
                        {contrast.differentiators.map((diff, i) => (
                          <Card key={i} className="bg-muted/50">
                            <CardContent className="pt-4">
                              <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Aspect
                                  </p>
                                  <p className="text-sm font-medium">{diff.aspect}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-red-600 mb-1">
                                    Generic Tools
                                  </p>
                                  <p className="text-sm">{diff.genericResult}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-green-600 mb-1">
                                    Control Plane
                                  </p>
                                  <p className="text-sm">{diff.controlPlaneResult}</p>
                                </div>
                              </div>
                              <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
                                <strong>Why it matters:</strong> {diff.whyItMatters}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>The Bottom Line</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-red-600">Rule-Based Automation</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Works for simple, well-defined scenarios</li>
                  <li>• Breaks down with complexity and context</li>
                  <li>• High false positive rates create noise</li>
                  <li>• Cannot explain why decisions were made</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-green-600">Control Plane Reasoning</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Handles complex, nuanced scenarios</li>
                  <li>• Understands context and trade-offs</li>
                  <li>• Learns from feedback and improves</li>
                  <li>• Explains every decision with evidence</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
