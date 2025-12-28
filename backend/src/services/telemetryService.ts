import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TelemetryEvent {
  userId: string;
  eventType: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface EngagementMetrics {
  userId: string;
  chatsPerWeek: number;
  sliderAdjustments: number;
  suggestionsApproved: number;
  suggestionsRejected: number;
  backgroundSuggestionsApproved: number;
  lastActiveAt: Date;
}

export class TelemetryService {
  /**
   * Log a telemetry event
   */
  async logEvent(event: TelemetryEvent): Promise<void> {
    try {
      // Store in agent_runs table with trigger='telemetry'
      await supabase.from('agent_runs').insert({
        user_id: event.userId,
        trigger: 'telemetry',
        trigger_data: {
          event_type: event.eventType,
          metadata: event.metadata || {},
          timestamp: (event.timestamp || new Date()).toISOString(),
        },
        agent_type: 'telemetry',
      });
    } catch (error) {
      console.error('Error logging telemetry event:', error);
      // Don't throw - telemetry failures shouldn't break the app
    }
  }

  /**
   * Track user engagement metrics
   */
  async trackEngagement(userId: string, action: string, metadata?: Record<string, any>): Promise<void> {
    await this.logEvent({
      userId,
      eventType: `engagement.${action}`,
      metadata,
    });
  }

  /**
   * Track slider adjustments
   */
  async trackSliderAdjustment(
    userId: string,
    sliderName: string,
    value: number,
    previousValue: number
  ): Promise<void> {
    await this.trackEngagement(userId, 'slider_adjustment', {
      slider_name: sliderName,
      value,
      previous_value: previousValue,
      delta: value - previousValue,
    });
  }

  /**
   * Track suggestion feedback
   */
  async trackSuggestionFeedback(
    userId: string,
    runId: string,
    feedback: 'approved' | 'rejected' | 'revised',
    source: 'manual' | 'background'
  ): Promise<void> {
    await this.trackEngagement(userId, 'suggestion_feedback', {
      run_id: runId,
      feedback,
      source,
    });
  }

  /**
   * Track chat message
   */
  async trackChatMessage(userId: string, messageLength: number): Promise<void> {
    await this.trackEngagement(userId, 'chat_message', {
      message_length: messageLength,
    });
  }

  /**
   * Get engagement metrics for a user
   */
  async getEngagementMetrics(userId: string, days: number = 7): Promise<EngagementMetrics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const { data: runs } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      const runsList = runs || [];

      const chatsPerWeek = runsList.filter((r) => r.trigger === 'chat_input').length;
      const suggestionsApproved = runsList.filter(
        (r) => r.user_feedback === 'approved'
      ).length;
      const suggestionsRejected = runsList.filter(
        (r) => r.user_feedback === 'rejected'
      ).length;

      const sliderAdjustments = runsList.filter(
        (r) => r.trigger_data?.event_type === 'engagement.slider_adjustment'
      ).length;

      const backgroundApproved = runsList.filter(
        (r) => r.trigger === 'event' && r.user_feedback === 'approved'
      ).length;

      const lastActive = runsList.length > 0
        ? new Date(Math.max(...runsList.map((r) => new Date(r.created_at).getTime())))
        : new Date();

      return {
        userId,
        chatsPerWeek,
        sliderAdjustments,
        suggestionsApproved,
        suggestionsRejected,
        backgroundSuggestionsApproved: backgroundApproved,
        lastActiveAt: lastActive,
      };
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      return {
        userId,
        chatsPerWeek: 0,
        sliderAdjustments: 0,
        suggestionsApproved: 0,
        suggestionsRejected: 0,
        backgroundSuggestionsApproved: 0,
        lastActiveAt: new Date(),
      };
    }
  }

  /**
   * Track cost per user
   */
  async trackCost(userId: string, costUsd: number, tokensUsed: number): Promise<void> {
    await this.logEvent({
      userId,
      eventType: 'cost.tracked',
      metadata: {
        cost_usd: costUsd,
        tokens_used: tokensUsed,
      },
    });
  }

  /**
   * Get total cost for a user in a time period
   */
  async getTotalCost(userId: string, days: number = 30): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const { data: runs } = await supabase
        .from('agent_runs')
        .select('cost_usd')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .not('cost_usd', 'is', null);

      return (runs || []).reduce((sum, r) => sum + (r.cost_usd || 0), 0);
    } catch (error) {
      console.error('Error getting total cost:', error);
      return 0;
    }
  }
}

export const telemetryService = new TelemetryService();
