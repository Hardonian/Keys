'use client';

import React, { useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import { formatRelativeTime } from '@/utils/format';
import type { AgentRun } from '@/types';

interface ActionHistoryProps {
  userId: string;
  limit?: number;
}

export function ActionHistory({ userId, limit = 20 }: ActionHistoryProps) {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  React.useEffect(() => {
    async function fetchRuns() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('agent_runs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;
        setRuns(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch runs'));
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchRuns();
    }
  }, [userId, limit]);

  const getStatusColor = (feedback?: string) => {
    switch (feedback) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'revised':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'manual':
        return '👆';
      case 'event':
        return '⚡';
      case 'schedule':
        return '⏰';
      case 'chat_input':
        return '💬';
      default:
        return '📌';
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Loading action history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Error loading history: {error.message}</p>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No actions yet. Your agent runs will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Action History</h3>
        <span className="text-sm text-gray-500">{runs.length} runs</span>
      </div>

      {runs.map((run) => (
        <div
          key={run.id}
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getTriggerIcon(run.trigger)}</span>
              <div>
                <span className="text-sm font-medium text-gray-900">
                  {run.agent_type}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {formatRelativeTime(run.created_at)}
                </span>
              </div>
            </div>
            {run.user_feedback && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                  run.user_feedback
                )}`}
              >
                {run.user_feedback}
              </span>
            )}
          </div>

          {run.model_used && (
            <div className="text-xs text-gray-500 mb-2">
              Model: {run.model_used} • Tokens: {run.tokens_used || 'N/A'} • Cost:{' '}
              ${run.cost_usd?.toFixed(4) || '0.0000'}
            </div>
          )}

          {run.generated_content && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                  View generated content
                </summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                  {typeof run.generated_content === 'string'
                    ? run.generated_content
                    : JSON.stringify(run.generated_content, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {run.feedback_detail && (
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">Feedback:</span> {run.feedback_detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
