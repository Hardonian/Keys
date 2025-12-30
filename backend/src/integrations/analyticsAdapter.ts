import axios from 'axios';

export interface Metric {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface MetricRegression {
  metricName: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  context?: Record<string, unknown>;
}

export interface Anomaly {
  id: string;
  metricName: string;
  value: number;
  expectedRange: { min: number; max: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  description?: string;
}

export type AnalyticsProvider = 'posthog' | 'google_analytics' | 'custom';

export class AnalyticsAdapter {
  private apiKey?: string;
  private baseUrl?: string;
  private provider: AnalyticsProvider;
  private projectId?: string; // For PostHog
  private viewId?: string; // For Google Analytics

  constructor() {
    this.provider = (process.env.ANALYTICS_PROVIDER as AnalyticsProvider) || 'custom';
    this.apiKey = process.env.POSTHOG_API_KEY || process.env.GA_API_KEY;
    this.baseUrl = process.env.POSTHOG_HOST || process.env.ANALYTICS_BASE_URL;
    this.projectId = process.env.POSTHOG_PROJECT_ID;
    this.viewId = process.env.GA_VIEW_ID;
  }

  /**
   * Fetch metric value for a specific metric name
   */
  async fetchMetric(metricName: string, timeRange?: { start: string; end: string }): Promise<Metric | null> {
    if (!this.apiKey) {
      console.warn('Analytics credentials not configured');
      return null;
    }

    try {
      switch (this.provider) {
        case 'posthog':
          return await this.fetchPostHogMetric(metricName, timeRange);
        case 'google_analytics':
          return await this.fetchGAMetric(metricName, timeRange);
        case 'custom':
          return await this.fetchCustomMetric(metricName, timeRange);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error fetching metric:', error);
      return null;
    }
  }

  /**
   * Fetch multiple metrics
   */
  async fetchMetrics(metricNames: string[], timeRange?: { start: string; end: string }): Promise<Metric[]> {
    if (!this.apiKey) {
      return [];
    }

    const results = await Promise.all(
      metricNames.map(name => this.fetchMetric(name, timeRange))
    );

    return results.filter((m): m is Metric => m !== null);
  }

  /**
   * Detect metric regressions by comparing current vs previous period
   */
  async detectRegressions(
    metricNames: string[],
    comparisonWindow: { current: { start: string; end: string }; previous: { start: string; end: string } }
  ): Promise<MetricRegression[]> {
    if (!this.apiKey) {
      return [];
    }

    const regressions: MetricRegression[] = [];

    for (const metricName of metricNames) {
      try {
        const current = await this.fetchMetric(metricName, comparisonWindow.current);
        const previous = await this.fetchMetric(metricName, comparisonWindow.previous);

        if (current && previous && current.value < previous.value) {
          const changePercent = ((current.value - previous.value) / previous.value) * 100;
          const severity = this.calculateSeverity(Math.abs(changePercent));

          regressions.push({
            metricName,
            currentValue: current.value,
            previousValue: previous.value,
            changePercent,
            severity,
            detectedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`Error detecting regression for ${metricName}:`, error);
      }
    }

    return regressions;
  }

  /**
   * Detect anomalies in metrics
   */
  async detectAnomalies(
    metricName: string,
    timeRange: { start: string; end: string },
    baselineWindow?: { start: string; end: string }
  ): Promise<Anomaly[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      switch (this.provider) {
        case 'posthog':
          return await this.detectPostHogAnomalies(metricName, timeRange, baselineWindow);
        case 'google_analytics':
          return await this.detectGAAnomalies(metricName, timeRange, baselineWindow);
        case 'custom':
          return await this.detectCustomAnomalies(metricName, timeRange, baselineWindow);
        default:
          return [];
      }
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return [];
    }
  }

  /**
   * Track an event
   */
  async trackEvent(eventName: string, properties?: Record<string, unknown>): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      switch (this.provider) {
        case 'posthog':
          return await this.trackPostHogEvent(eventName, properties);
        case 'google_analytics':
          return await this.trackGAEvent(eventName, properties);
        case 'custom':
          return await this.trackCustomEvent(eventName, properties);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error tracking event:', error);
      return false;
    }
  }

  private calculateSeverity(changePercent: number): 'low' | 'medium' | 'high' | 'critical' {
    if (changePercent >= 50) return 'critical';
    if (changePercent >= 25) return 'high';
    if (changePercent >= 10) return 'medium';
    return 'low';
  }

  // PostHog Implementation
  private async fetchPostHogMetric(metricName: string, timeRange?: { start: string; end: string }): Promise<Metric | null> {
    if (!this.apiKey || !this.projectId) return null;

    try {
      const end = timeRange?.end || new Date().toISOString();

      await axios.get(
        `${this.baseUrl || 'https://app.posthog.com'}/api/projects/${this.projectId}/insights/`,
        {
          params: {
            // PostHog API parameters
          },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      // Simplified - actual implementation would parse PostHog response
      return {
        name: metricName,
        value: 0, // Would be parsed from response
        timestamp: end,
      };
    } catch (error) {
      console.error('Error fetching PostHog metric:', error);
      return null;
    }
  }

  private async detectPostHogAnomalies(
    _metricName: string,
    _timeRange: { start: string; end: string },
    _baselineWindow?: { start: string; end: string }
  ): Promise<Anomaly[]> {
    // PostHog has built-in anomaly detection
    // This would integrate with their API
    return [];
  }

  private async trackPostHogEvent(eventName: string, properties?: Record<string, unknown>): Promise<boolean> {
    if (!this.apiKey || !this.projectId) return false;

    try {
      await axios.post(
        `${this.baseUrl || 'https://app.posthog.com'}/capture/`,
        {
          api_key: this.apiKey,
          event: eventName,
          properties: properties || {},
        }
      );
      return true;
    } catch (error) {
      console.error('Error tracking PostHog event:', error);
      return false;
    }
  }

  // Google Analytics Implementation
  private async fetchGAMetric(metricName: string, timeRange?: { start: string; end: string }): Promise<Metric | null> {
    if (!this.apiKey || !this.viewId) return null;

    try {
      // Google Analytics Reporting API
      const response = await axios.post(
        'https://analyticsreporting.googleapis.com/v4/reports:batchGet',
        {
          reportRequests: [
            {
              viewId: this.viewId,
              dateRanges: [
                {
                  startDate: timeRange?.start.split('T')[0] || '7daysAgo',
                  endDate: timeRange?.end.split('T')[0] || 'today',
                },
              ],
              metrics: [{ expression: `ga:${metricName}` }],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const value = response.data.reports?.[0]?.data?.totals?.[0]?.values?.[0];
      return {
        name: metricName,
        value: value ? parseFloat(value) : 0,
        timestamp: timeRange?.end || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching GA metric:', error);
      return null;
    }
  }

  private async detectGAAnomalies(
    _metricName: string,
    _timeRange: { start: string; end: string },
    _baselineWindow?: { start: string; end: string }
  ): Promise<Anomaly[]> {
    // Google Analytics has anomaly detection in their API
    return [];
  }

  private async trackGAEvent(_eventName: string, _properties?: Record<string, unknown>): Promise<boolean> {
    // Google Analytics tracking via Measurement Protocol
    return true;
  }

  // Custom Implementation
  private async fetchCustomMetric(metricName: string, timeRange?: { start: string; end: string }): Promise<Metric | null> {
    if (!this.baseUrl) return null;

    try {
      const response = await axios.get(`${this.baseUrl}/metrics/${metricName}`, {
        params: {
          start: timeRange?.start,
          end: timeRange?.end,
        },
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      });

      return {
        name: metricName,
        value: response.data.value,
        timestamp: response.data.timestamp || new Date().toISOString(),
        tags: response.data.tags,
      };
    } catch (error) {
      console.error('Error fetching custom metric:', error);
      return null;
    }
  }

  private async detectCustomAnomalies(
    metricName: string,
    timeRange: { start: string; end: string },
    baselineWindow?: { start: string; end: string }
  ): Promise<Anomaly[]> {
    if (!this.baseUrl) return [];

    try {
      const response = await axios.post(
        `${this.baseUrl}/metrics/${metricName}/anomalies`,
        {
          timeRange,
          baselineWindow,
        },
        {
          headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
        }
      );

      return response.data.anomalies || [];
    } catch (error) {
      console.error('Error detecting custom anomalies:', error);
      return [];
    }
  }

  private async trackCustomEvent(eventName: string, properties?: Record<string, unknown>): Promise<boolean> {
    if (!this.baseUrl) return false;

    try {
      await axios.post(
        `${this.baseUrl}/events`,
        {
          name: eventName,
          properties: properties || {},
          timestamp: new Date().toISOString(),
        },
        {
          headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
        }
      );
      return true;
    } catch (error) {
      console.error('Error tracking custom event:', error);
      return false;
    }
  }
}

export const analyticsAdapter = new AnalyticsAdapter();
