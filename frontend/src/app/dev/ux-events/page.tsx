/**
 * UX Events Inspector
 * 
 * Dev-only page for inspecting recent UX events.
 */

'use client';

import { useEffect, useState } from 'react';
import { uxEventLogger, type UXEvent } from '@/systems/analytics/uxEvents';
import { AnimatedCard, AnimatedButton } from '@/systems/motion';
import { Reveal } from '@/systems/motion';
import { PageWrapper } from '@/components/PageWrapper';

export default function UXEventsPage() {
  const [events, setEvents] = useState<UXEvent[]>([]);

  useEffect(() => {
    // Only show in dev
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const updateEvents = () => {
      setEvents(uxEventLogger.getRecentEvents(100));
    };

    updateEvents();
    const interval = setInterval(updateEvents, 1000);

    return () => clearInterval(interval);
  }, []);

  // Hide in production
  if (process.env.NODE_ENV !== 'development') {
    return (
      <PageWrapper className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">
          This page is only available in development mode.
        </p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Reveal direction="down">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                UX Events Inspector
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Development tool for inspecting UX interaction events
              </p>
            </div>
            <AnimatedButton
              variant="secondary"
              onClick={() => {
                uxEventLogger.clear();
                setEvents([]);
              }}
            >
              Clear Events
            </AnimatedButton>
          </div>
        </Reveal>

        <div className="space-y-4">
          {events.length === 0 ? (
            <Reveal direction="fade">
              <AnimatedCard variant="outlined" className="p-6 text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  No events logged yet. Interact with the app to see events here.
                </p>
              </AnimatedCard>
            </Reveal>
          ) : (
            events.map((event, index) => (
              <Reveal key={`${event.timestamp}-${index}`} direction="left" delay={index * 10}>
                <AnimatedCard variant="outlined" className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded">
                          {event.type}
                        </span>
                        {event.flowId && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded">
                            {event.flowId}
                          </span>
                        )}
                      </div>
                      {event.stepId && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                          Step: {event.stepId}
                          {event.stepIndex !== undefined && event.totalSteps !== undefined && (
                            <span className="ml-2">
                              ({event.stepIndex + 1}/{event.totalSteps})
                            </span>
                          )}
                        </p>
                      )}
                      {event.error && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                          Error: {event.error.message}
                        </p>
                      )}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                            Metadata
                          </summary>
                          <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </AnimatedCard>
              </Reveal>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
