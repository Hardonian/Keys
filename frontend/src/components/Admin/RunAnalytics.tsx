'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { AgentRun } from '@/types';
import { formatCurrency } from '@/utils/format';

interface AnalyticsData {
  totalRuns: number;
  approvedRuns: number;
  rejectedRuns: number;
  revisedRuns: number;
  totalCost: number;
  totalTokens: number;
  avgLatency: number;
  runsByType: Record<string, number>;
  runsByModel: Record<string, number>;
}

export function RunAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const dateFilter = getDateFilter(dateRange);

      const { data: runs, error } = await supabase
        .from('agent_runs')
        .select('*')
        .gte('created_at', dateFilter);

      if (error) throw error;

      const analyticsData: AnalyticsData = {
        totalRuns: runs?.length || 0,
        approvedRuns: runs?.filter((r) => r.user_feedback === 'approved').length || 0,
        rejectedRuns: runs?.filter((r) => r.user_feedback === 'rejected').length || 0,
        revisedRuns: runs?.filter((r) => r.user_feedback === 'revised').length || 0,
        totalCost: runs?.reduce((sum, r) => sum + (r.cost_usd || 0), 0) || 0,
        totalTokens: runs?.reduce((sum, r) => sum + (r.tokens_used || 0), 0) || 0,
        avgLatency:
          runs && runs.length > 0
            ? runs.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / runs.length
            : 0,
        runsByType: {},
        runsByModel: {},
      };

      // Count runs by type
      runs?.forEach((run) => {
        analyticsData.runsByType[run.agent_type] =
          (analyticsData.runsByType[run.agent_type] || 0) + 1;
        if (run.model_used) {
          analyticsData.runsByModel[run.model_used] =
            (analyticsData.runsByModel[run.model_used] || 0) + 1;
        }
      });

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function getDateFilter(range: string): string {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return '1970-01-01T00:00:00Z';
    }
  }

  const approvalRate =
    analytics && analytics.totalRuns > 0
      ? ((analytics.approvedRuns / analytics.totalRuns) * 100).toFixed(1)
      : '0';

  if (loading) {
    return <div className="p-4">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-4">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Run Analytics</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Runs</div>
          <div className="text-2xl font-bold">{analytics.totalRuns}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Approval Rate</div>
          <div className="text-2xl font-bold">{approvalRate}%</div>
          <div className="text-xs text-gray-500 mt-1">
            {analytics.approvedRuns} approved
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Cost</div>
          <div className="text-2xl font-bold">{formatCurrency(analytics.totalCost)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {analytics.totalTokens.toLocaleString()} tokens
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Avg Latency</div>
          <div className="text-2xl font-bold">{Math.round(analytics.avgLatency)}ms</div>
        </div>
      </div>

      {/* Feedback Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Feedback Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Approved</div>
            <div className="text-xl font-bold text-green-600">
              {analytics.approvedRuns}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Rejected</div>
            <div className="text-xl font-bold text-red-600">
              {analytics.rejectedRuns}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Revised</div>
            <div className="text-xl font-bold text-yellow-600">
              {analytics.revisedRuns}
            </div>
          </div>
        </div>
      </div>

      {/* Runs by Type */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Runs by Type</h3>
        <div className="space-y-2">
          {Object.entries(analytics.runsByType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="capitalize">{type}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Runs by Model */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Runs by Model</h3>
        <div className="space-y-2">
          {Object.entries(analytics.runsByModel).map(([model, count]) => (
            <div key={model} className="flex items-center justify-between">
              <span>{model}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
