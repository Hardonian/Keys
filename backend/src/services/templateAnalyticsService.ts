/**
 * Template Analytics Service
 * 
 * Tracks template usage, performance, and quality metrics
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TemplateAnalytics {
  template_id: string;
  usage_count: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  average_rating?: number;
  total_ratings: number;
  average_tokens_used?: number;
  average_latency_ms?: number;
  first_used_at?: string;
  last_used_at?: string;
}

export interface TemplateUsageStats {
  total_uses: number;
  unique_users: number;
  templates_used: number;
  average_success_rate: number;
  top_templates: Array<{
    template_id: string;
    usage_count: number;
    success_rate: number;
  }>;
}

export class TemplateAnalyticsService {
  /**
   * Track template usage
   */
  async trackUsage(
    userId: string,
    templateId: string,
    options: {
      success?: boolean;
      tokens_used?: number;
      latency_ms?: number;
    } = {}
  ): Promise<void> {
    try {
      await supabase.rpc('track_template_usage', {
        p_user_id: userId,
        p_template_id: templateId,
        p_success: options.success ?? true,
        p_tokens_used: options.tokens_used ?? null,
        p_latency_ms: options.latency_ms ?? null,
      });
    } catch (error) {
      logger.error('Failed to track template usage', error as Error);
      // Don't throw - analytics failures shouldn't break the flow
    }
  }

  /**
   * Get analytics for a template
   */
  async getTemplateAnalytics(
    userId: string,
    templateId: string
  ): Promise<TemplateAnalytics | null> {
    const { data, error } = await supabase
      .from('template_usage_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('template_id', templateId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No analytics yet
      }
      throw new Error(`Failed to get analytics: ${error.message}`);
    }

    const analytics = data as any;
    const successRate =
      analytics.usage_count > 0
        ? analytics.success_count / analytics.usage_count
        : 0;

    return {
      template_id: templateId,
      usage_count: analytics.usage_count || 0,
      success_count: analytics.success_count || 0,
      failure_count: analytics.failure_count || 0,
      success_rate: successRate,
      average_rating: analytics.average_rating,
      total_ratings: analytics.total_ratings || 0,
      average_tokens_used: analytics.average_tokens_used,
      average_latency_ms: analytics.average_latency_ms,
      first_used_at: analytics.first_used_at,
      last_used_at: analytics.last_used_at,
    };
  }

  /**
   * Get user's usage statistics
   */
  async getUserUsageStats(userId: string): Promise<TemplateUsageStats> {
    const { data, error } = await supabase
      .from('template_usage_analytics')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get usage stats: ${error.message}`);
    }

    const analytics = (data || []) as any[];

    const totalUses = analytics.reduce((sum, a) => sum + (a.usage_count || 0), 0);
    const templatesUsed = analytics.length;
    const totalSuccess = analytics.reduce((sum, a) => sum + (a.success_count || 0), 0);
    const averageSuccessRate =
      totalUses > 0 ? totalSuccess / totalUses : 0;

    // Top templates by usage
    const topTemplates = analytics
      .map((a) => ({
        template_id: a.template_id,
        usage_count: a.usage_count || 0,
        success_rate:
          (a.usage_count || 0) > 0
            ? (a.success_count || 0) / (a.usage_count || 0)
            : 0,
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);

    return {
      total_uses: totalUses,
      unique_users: 1, // This user
      templates_used: templatesUsed,
      average_success_rate: averageSuccessRate,
      top_templates: topTemplates,
    };
  }

  /**
   * Submit feedback/rating for a template
   */
  async submitFeedback(
    userId: string,
    templateId: string,
    rating: number,
    comment?: string,
    suggestions?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('template_feedback')
      .upsert(
        {
          user_id: userId,
          template_id: templateId,
          rating,
          comment,
          suggestions,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,template_id',
        }
      );

    if (error) {
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }

    // Update average rating in analytics
    await this.updateAverageRating(templateId);
  }

  /**
   * Update average rating for a template
   */
  private async updateAverageRating(templateId: string): Promise<void> {
    const { data: feedbacks, error } = await supabase
      .from('template_feedback')
      .select('rating')
      .eq('template_id', templateId)
      .not('rating', 'is', null);

    if (error || !feedbacks || feedbacks.length === 0) {
      return;
    }

    const ratings = feedbacks.map((f) => f.rating).filter((r) => r !== null) as number[];
    const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

    // Update all user analytics for this template
    const { data: analytics } = await supabase
      .from('template_usage_analytics')
      .select('user_id')
      .eq('template_id', templateId);

    if (analytics) {
      for (const analytic of analytics) {
        await supabase
          .from('template_usage_analytics')
          .update({
            average_rating: average,
            total_ratings: ratings.length,
          })
          .eq('user_id', analytic.user_id)
          .eq('template_id', templateId);
      }
    }
  }

  /**
   * Get feedback for a template
   */
  async getTemplateFeedback(templateId: string): Promise<Array<{
    user_id: string;
    rating: number;
    comment?: string;
    suggestions?: string;
    created_at: string;
  }>> {
    const { data, error } = await supabase
      .from('template_feedback')
      .select('user_id, rating, comment, suggestions, created_at')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get feedback: ${error.message}`);
    }

    return (data || []) as any[];
  }
}

export const templateAnalyticsService = new TemplateAnalyticsService();
