/**
 * UX Event System
 * 
 * Typed event logging system for UX interactions.
 * Logs locally in dev; stubs for backend integration.
 */

export type UXEventType =
  | 'step_viewed'
  | 'step_completed'
  | 'flow_completed'
  | 'flow_abandoned'
  | 'error_occurred'
  | 'retry_attempted'
  | 'success_celebrated'
  | 'interaction_started'
  | 'interaction_completed';

export interface UXEvent {
  type: UXEventType;
  timestamp: number;
  flowId?: string;
  stepId?: string;
  stepIndex?: number;
  totalSteps?: number;
  error?: {
    message: string;
    code?: string;
  };
  metadata?: Record<string, unknown>;
}

class UXEventLogger {
  private events: UXEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events in memory
  private isDev = process.env.NODE_ENV === 'development';

  /**
   * Log a UX event
   */
  log(event: Omit<UXEvent, 'timestamp'>): void {
    const fullEvent: UXEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Add to in-memory buffer
    this.events.push(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events.shift(); // Remove oldest event
    }

    // Log to console in dev
    if (this.isDev) {
      console.log('[UX Event]', fullEvent);
    }

    // Stub for backend integration
    // In production, this would send to analytics backend
    this.sendToBackend().catch((error) => {
      console.error('Failed to send UX event to backend:', error);
    });
  }

  /**
   * Get recent events (for dev inspector)
   */
  getRecentEvents(limit = 50): UXEvent[] {
    return this.events.slice(-limit).reverse();
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Stub for backend integration
   */
  private async sendToBackend(): Promise<void> {
    // In production, this would POST to analytics endpoint
    // For now, it's a no-op
    if (!this.isDev && process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true') {
      // Stub implementation
      // await fetch('/api/analytics/ux-events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event),
      // });
    }
  }
}

// Singleton instance
export const uxEventLogger = new UXEventLogger();

/**
 * Convenience functions for common events
 */
export const logUXEvent = {
  stepViewed: (flowId: string, stepId: string, stepIndex: number, totalSteps: number) => {
    uxEventLogger.log({
      type: 'step_viewed',
      flowId,
      stepId,
      stepIndex,
      totalSteps,
    });
  },

  stepCompleted: (flowId: string, stepId: string, stepIndex: number, totalSteps: number) => {
    uxEventLogger.log({
      type: 'step_completed',
      flowId,
      stepId,
      stepIndex,
      totalSteps,
    });
  },

  flowCompleted: (flowId: string, totalSteps: number) => {
    uxEventLogger.log({
      type: 'flow_completed',
      flowId,
      totalSteps,
    });
  },

  flowAbandoned: (flowId: string, stepIndex: number, totalSteps: number) => {
    uxEventLogger.log({
      type: 'flow_abandoned',
      flowId,
      stepIndex,
      totalSteps,
    });
  },

  errorOccurred: (flowId: string, error: Error, metadata?: Record<string, unknown>) => {
    uxEventLogger.log({
      type: 'error_occurred',
      flowId,
      error: {
        message: error.message,
        code: (error as { code?: string }).code,
      },
      metadata,
    });
  },

  retryAttempted: (flowId: string, retryCount: number) => {
    uxEventLogger.log({
      type: 'retry_attempted',
      flowId,
      metadata: { retryCount },
    });
  },

  successCelebrated: (flowId: string, metadata?: Record<string, unknown>) => {
    uxEventLogger.log({
      type: 'success_celebrated',
      flowId,
      metadata,
    });
  },
};
