/**
 * Client-side Providers
 * 
 * Wraps app with error boundary, auth context, toast container, and diagnostics
 */

'use client';

import { useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { ToastContainer } from './Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { RuntimeUiBanner } from './RuntimeUiBanner';
import { useAnalytics } from '@/hooks/useAnalytics';
import { KeyboardShortcutsHelp } from './KeyboardShortcuts';
import { useKeyboardShortcuts, defaultShortcuts } from '@/hooks/useKeyboardShortcuts';

function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    // Track initial page view
    trackPageView(window.location.pathname, document.title);

    // Track navigation
    const handleRouteChange = () => {
      trackPageView(window.location.pathname, document.title);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [trackPageView]);

  return <>{children}</>;
}

function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts(defaultShortcuts, true);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AnalyticsProvider>
          <KeyboardShortcutsProvider>
            <RuntimeUiBanner />
            {children}
            <ToastContainer />
            <DiagnosticsPanel />
            <KeyboardShortcutsHelp />
          </KeyboardShortcutsProvider>
        </AnalyticsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
