'use client';

import React from 'react';
import { useBackgroundEvents } from '@/hooks/useBackgroundEvents';
import { formatRelativeTime } from '@/utils/format';
import type { BackgroundEvent } from '@/types';

interface EventFeedProps {
  userId: string;
  maxEvents?: number;
}

export function EventFeed({ userId, maxEvents = 50 }: EventFeedProps) {
  const { events, loading, error } = useBackgroundEvents(userId);

  if (loading) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 dark:text-red-400">
        <p>Error loading events: {error.message}</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        <p>No events yet. Events will appear here as they occur.</p>
      </div>
    );
  }

  const displayEvents = events.slice(0, maxEvents);

  const getEventIcon = (source: BackgroundEvent['source']) => {
    switch (source) {
      case 'code_repo':
        return '📦';
      case 'issue_tracker':
        return '🎫';
      case 'ci_cd':
        return '⚙️';
      case 'infra':
        return '🏗️';
      case 'metrics':
        return '📊';
      case 'schedule':
        return '📅';
      default:
        return '📌';
    }
  };

  const getEventColor = (source: BackgroundEvent['source']) => {
    switch (source) {
      case 'code_repo':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'issue_tracker':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'ci_cd':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'infra':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'metrics':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300';
      case 'schedule':
        return 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-2">
      {displayEvents.map((event) => (
        <div
          key={event.id}
          className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl">{getEventIcon(event.source)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getEventColor(
                      event.source
                    )}`}
                  >
                    {event.source}
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                    {event.event_type}
                  </span>
                </div>
                {event.event_data && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {JSON.stringify(event.event_data).substring(0, 100)}
                    {JSON.stringify(event.event_data).length > 100 ? '...' : ''}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatRelativeTime(event.created_at)}
                  </span>
                  {event.suggestion_generated && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      ✓ Suggestion generated
                    </span>
                  )}
                  {event.user_actioned && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ Actioned
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
