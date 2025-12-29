/**
 * Client-side Providers
 * 
 * Wraps app with error boundary, auth context, toast container, and diagnostics
 */

'use client';

import ErrorBoundary from './ErrorBoundary';
import { ToastContainer } from './Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { DiagnosticsPanel } from './DiagnosticsPanel';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
        <ToastContainer />
        <DiagnosticsPanel />
      </AuthProvider>
    </ErrorBoundary>
  );
}
