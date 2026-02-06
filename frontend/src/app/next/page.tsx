'use client';

/**
 * Second Win Page (/next)
 * 
 * Shows contextual suggestions after runs
 * "Based on what just happened, here's what you should do next"
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Shield,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Suggestion, SuggestionType, SuggestionPriority } from '@/lib/second-win';

// Mock suggestions for demo
const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: 'sugg_001',
    type: 'automation',
    priority: 'high',
    title: 'Schedule recurring security scans',
    description: 'This audit found 12 issues. Automate weekly scans to catch new vulnerabilities early.',
    reasoning: 'Security audits should be recurring, not one-time. Based on 12 findings in this scan, a weekly cadence would reduce mean-time-to-detection by 7x.',
    confidence: 0.92,
    evidence: [
      { source: 'current_audit', observation: '12 security findings detected', relevance: 0.95 },
      { source: 'industry_baseline', observation: 'Weekly scans reduce MTTD by 7x vs monthly', relevance: 0.80 },
    ],
    action: {
      type: 'schedule',
      label: 'Schedule Weekly Scans',
      target: '/automation/schedule',
      parameters: { template: 'security_audit', frequency: 'weekly' },
    },
    triggeredBy: 'bundle_001',
    suggestedAt: new Date(),
    category: 'security',
    status: 'pending',
  },
  {
    id: 'sugg_002',
    type: 'risk',
    priority: 'critical',
    title: '3 dependencies are critically outdated',
    description: 'These versions have known CVEs. Upgrade recommended within 48 hours.',
    reasoning: 'Dependencies with known CVEs in production create measurable security risk. These 3 packages are 2+ major versions behind.',
    confidence: 0.88,
    evidence: [
      { source: 'dependency_scan', observation: '3 packages with CVEs detected', relevance: 0.95 },
      { source: 'security_db', observation: 'CVE-2024-XXXX rated HIGH', relevance: 0.90 },
    ],
    action: {
      type: 'view',
      label: 'View Update Plan',
      target: '/dependencies/outdated',
    },
    triggeredBy: 'bundle_001',
    suggestedAt: new Date(),
    category: 'dependencies',
    status: 'pending',
  },
  {
    id: 'sugg_003',
    type: 'optimization',
    priority: 'medium',
    title: 'Enable parallel execution to save 45 minutes/week',
    description: 'Your scans are sequential but could run 3 agents in parallel safely.',
    reasoning: 'Analysis shows your workload has 3 independent workstreams. Parallel execution would reduce runtime from 2.3 min to 45s.',
    confidence: 0.78,
    evidence: [
      { source: 'execution_trace', observation: 'Sequential execution took 2.3min', relevance: 0.90 },
      { source: 'dependency_analysis', observation: '3 agents have no interdependencies', relevance: 0.85 },
    ],
    action: {
      type: 'configure',
      label: 'Enable Parallel Mode',
      target: '/settings/execution',
    },
    triggeredBy: 'bundle_001',
    suggestedAt: new Date(),
    category: 'performance',
    status: 'pending',
  },
];

const TYPE_ICONS: Record<SuggestionType, React.ReactNode> = {
  automation: <Zap className="w-5 h-5" />,
  insight: <Lightbulb className="w-5 h-5" />,
  risk: <AlertTriangle className="w-5 h-5" />,
  optimization: <TrendingUp className="w-5 h-5" />,
  exploration: <BookOpen className="w-5 h-5" />,
  validation: <Shield className="w-5 h-5" />,
};

const PRIORITY_COLORS: Record<SuggestionPriority, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export default function SecondWinPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(MOCK_SUGGESTIONS);
  const [acceptedCount, setAcceptedCount] = useState(0);

  const handleAccept = (id: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'accepted' } : s
    ));
    setAcceptedCount(prev => prev + 1);
  };

  const handleDismiss = (id: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'dismissed' } : s
    ));
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            <h1 className="text-3xl font-bold">What to Do Next</h1>
          </div>
          <p className="text-muted-foreground">
            Based on your recent activity, here are contextual suggestions to compound your value
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{pendingSuggestions.length}</div>
              <p className="text-sm text-muted-foreground">Pending suggestions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{acceptedCount}</div>
              <p className="text-sm text-muted-foreground">Actions taken</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {Math.round(suggestions.filter(s => s.status === 'accepted').reduce((sum, s) => sum + s.confidence, 0) / (acceptedCount || 1) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Avg confidence</p>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions List */}
        <div className="space-y-4">
          <AnimatePresence>
            {pendingSuggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-l-4 ${PRIORITY_COLORS[suggestion.priority].replace('bg-', '').split(' ')[0].replace('500/10', '500')}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {TYPE_ICONS[suggestion.type]}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                          <CardDescription>{suggestion.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={PRIORITY_COLORS[suggestion.priority]}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Reasoning */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Why this matters:</strong> {suggestion.reasoning}
                      </p>
                    </div>

                    {/* Evidence */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Evidence</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestion.evidence.map((e, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {e.source}: {e.observation}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${suggestion.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                      <Button onClick={() => handleAccept(suggestion.id)}>
                        {suggestion.action.label}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button variant="outline" onClick={() => handleDismiss(suggestion.id)}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Dismiss
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Clock className="w-4 h-4 mr-2" />
                        Snooze
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {pendingSuggestions.length === 0 && (
            <Card className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">All caught up!</h3>
              <p className="text-muted-foreground">
                You have no pending suggestions. Complete more tasks to see new recommendations.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
