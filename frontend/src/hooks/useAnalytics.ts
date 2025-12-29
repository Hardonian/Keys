'use client';

export interface AnalyticsEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: unknown;
}

export function useAnalytics() {
  const trackEvent = (event: AnalyticsEvent) => {
    if (typeof window === 'undefined') return;

    // Google Analytics 4
    if ('gtag' in window) {
      const gtag = (window as { gtag?: (event: string, action: string, params: Record<string, unknown>) => void }).gtag;
      if (gtag) {
        gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          ...event,
        });
      }
    }

    // Plausible Analytics
    if ('plausible' in window) {
      const plausible = (window as { plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void }).plausible;
      if (plausible) {
        plausible(event.action, {
          props: {
            category: event.category,
            label: event.label,
            ...event,
          },
        });
      }
    }

    // PostHog
    if ('posthog' in window) {
      const posthog = (window as { posthog?: { capture: (event: string, params: Record<string, unknown>) => void } }).posthog;
      if (posthog) {
        posthog.capture(event.action, event);
      }
    }

    // Custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {
        // Silently fail
      });
    }
  };

  const trackPageView = (path: string, title?: string) => {
    trackEvent({
      action: 'page_view',
      category: 'navigation',
      label: path,
      page_title: title,
      page_path: path,
    });
  };

  const trackConversion = (conversionType: string, value?: number) => {
    trackEvent({
      action: 'conversion',
      category: 'conversion',
      label: conversionType,
      value,
      conversion_type: conversionType,
    });
  };

  const trackUpgradeIntent = (source: string, feature?: string) => {
    trackEvent({
      action: 'upgrade_intent',
      category: 'upsell',
      label: source,
      feature,
      source,
    });
  };

  return {
    trackEvent,
    trackPageView,
    trackConversion,
    trackUpgradeIntent,
  };
}
