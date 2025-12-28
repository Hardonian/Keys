/**
 * Client-side Providers
 * 
 * Wraps app with error boundary and toast container
 */

'use client';

import ErrorBoundary from './ErrorBoundary';
import { ToastContainer } from './Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
      <ToastContainer />
    </ErrorBoundary>
  );
}
