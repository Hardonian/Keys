/**
 * Moat Metrics Service
 * 
 * Tracks metrics for defensive moat effectiveness
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface MoatMetrics {
  userId: string;
  period: {
    start: string;
    end: string;
  };
  failureMemory: {
    totalFailurePatterns: number;
    totalSuccessPatterns: number;
    failuresPrevented: number;
    preventionRuleEffectiveness: number; // 0-1
  };
  safetyEnforcement: {
    outputsBlocked: number;
    warningsIssued: number;
    securityIssuesDetected: number;
    complianceIssuesDetected: number;
  };
  workflowLockIn: {
    dailyUsageRate: number; // 0-1
    ideIntegrationUsage: number;
    cicdIntegrationUsage: number;
  };
  dataGravity: {
    totalPatterns: number;
    exportValue: number; // Estimated value of exported data
    switchingCost: number; // Estimated cost of switching
  };
}

export class MoatMetricsService {
  /**
   * Get moat metrics for a user
   */
  async getMoatMetrics(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<MoatMetrics> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    // Failure memory metrics
    const { data: failurePatterns } = await supabase
      .from('failure_patterns')
      .select('id, occurrence_count')
      .eq('user_id', userId)
      .eq('resolved', false);

    const { data: successPatterns } = await supabase
      .from('success_patterns')
      .select('id, success_rate')
      .eq('user_id', userId);

    const { data: patternMatches } = await supabase
      .from('pattern_matches')
      .select('id, match_type, action_taken')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lte('created_at', end);

    const failuresPrevented = patternMatches?.filter(
      m => m.action_taken === 'blocked' || m.action_taken === 'warned'
    ).length || 0;

    const totalMatches = patternMatches?.length || 1;
    const preventionRuleEffectiveness = failuresPrevented / totalMatches;

    // Safety enforcement metrics
    const { data: agentRuns } = await supabase
      .from('agent_runs')
      .select('safety_checks_passed, safety_check_results')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lte('created_at', end);

    const outputsBlocked = agentRuns?.filter(
      r => r.safety_check_results && !r.safety_checks_passed
    ).length || 0;

    const securityIssues = agentRuns?.reduce((acc, run) => {
      const results = run.safety_check_results as any;
      if (results?.security?.vulnerabilities) {
        return acc + results.security.vulnerabilities.length;
      }
      return acc;
    }, 0) || 0;

    const complianceIssues = agentRuns?.reduce((acc, run) => {
      const results = run.safety_check_results as any;
      if (results?.compliance?.violations) {
        return acc + results.compliance.violations.length;
      }
      return acc;
    }, 0) || 0;

    // Workflow lock-in metrics
    const { data: ideRuns } = await supabase
      .from('agent_runs')
      .select('id')
      .eq('user_id', userId)
      .eq('trigger', 'ide_integration')
      .gte('created_at', start)
      .lte('created_at', end);

    const { data: cicdRuns } = await supabase
      .from('agent_runs')
      .select('id')
      .eq('user_id', userId)
      .eq('trigger', 'cicd_pr_check')
      .gte('created_at', start)
      .lte('created_at', end);

    const totalRuns = agentRuns?.length || 1;
    const dailyUsageRate = Math.min(1, totalRuns / 30); // Normalize to daily rate

    // Data gravity metrics
    const totalPatterns = (failurePatterns?.length || 0) + (successPatterns?.length || 0);
    const exportValue = totalPatterns * 10; // Estimated value per pattern
    const switchingCost = exportValue * 0.3; // 30% of export value

    return {
      userId,
      period: { start, end },
      failureMemory: {
        totalFailurePatterns: failurePatterns?.length || 0,
        totalSuccessPatterns: successPatterns?.length || 0,
        failuresPrevented,
        preventionRuleEffectiveness,
      },
      safetyEnforcement: {
        outputsBlocked,
        warningsIssued: securityIssues + complianceIssues,
        securityIssuesDetected: securityIssues,
        complianceIssuesDetected: complianceIssues,
      },
      workflowLockIn: {
        dailyUsageRate,
        ideIntegrationUsage: ideRuns?.length || 0,
        cicdIntegrationUsage: cicdRuns?.length || 0,
      },
      dataGravity: {
        totalPatterns,
        exportValue,
        switchingCost,
      },
    };
  }

  /**
   * Track moat event
   */
  async trackMoatEvent(
    userId: string,
    eventType: 'failure_prevented' | 'output_blocked' | 'pattern_created' | 'export_requested',
    metadata?: Record<string, any>
  ): Promise<void> {
    await supabase
      .from('agent_runs')
      .insert({
        user_id: userId,
        trigger: 'moat_event',
        trigger_data: {
          eventType,
          metadata,
        },
        agent_type: 'orchestrator',
      });

    logger.info('Moat event tracked', { userId, eventType, metadata });
  }
}

export const moatMetricsService = new MoatMetricsService();
