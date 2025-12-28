'use client';

import React from 'react';
import { useBackgroundEvents } from '@/hooks/useBackgroundEvents';
import { SuggestionCard } from '../OutputPanel/SuggestionCard';
import { apiService } from '@/services/api';
import type { AgentOutput } from '@/types';
import { formatRelativeTime } from '@/utils/format';

interface ProactiveSuggestionsProps {
  userId: string;
  onSuggestionAction?: (suggestionId: string, action: 'approved' | 'rejected') => void;
}

export function ProactiveSuggestions({
  userId,
  onSuggestionAction,
}: ProactiveSuggestionsProps) {
  const { events } = useBackgroundEvents(userId);

  // Filter events that have suggestions but haven't been actioned
  const suggestions = events.filter(
    (event) => event.suggestion_generated && !event.user_actioned && event.suggestion_id
  );

  const handleApprove = async (suggestionId: string) => {
    try {
      await apiService.submitFeedback(suggestionId, 'approved');
      // Update event to mark as actioned
      onSuggestionAction?.(suggestionId, 'approved');
    } catch (error) {
      console.error('Error approving suggestion:', error);
    }
  };

  const handleReject = async (suggestionId: string) => {
    try {
      await apiService.submitFeedback(suggestionId, 'rejected');
      onSuggestionAction?.(suggestionId, 'rejected');
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No proactive suggestions at the moment.</p>
        <p className="text-sm mt-2">
          Suggestions will appear here when background events trigger them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Proactive Suggestions ({suggestions.length})
        </h3>
        <p className="text-sm text-gray-500">
          Based on your background events
        </p>
      </div>

      {suggestions.map((event) => {
        // In a real app, you'd fetch the actual agent run/output here
        // For now, we'll create a placeholder output
        const output: AgentOutput = {
          outputType: 'content_generation',
          content: event.event_data || {},
          requiresApproval: true,
          editableFields: ['content'],
          generatedAt: event.created_at,
          modelUsed: 'gpt-4-turbo',
          tokensUsed: 0,
          costUsd: 0,
        };

        return (
          <div key={event.id} className="border border-primary-200 rounded-lg p-4 bg-primary-50">
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-primary-800">
                  {event.event_type}
                </span>
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(event.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Triggered by: {event.source}
              </p>
            </div>

            {event.suggestion_id && (
              <SuggestionCard
                output={output}
                onApprove={() => handleApprove(event.suggestion_id!)}
                onReject={() => handleReject(event.suggestion_id!)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
