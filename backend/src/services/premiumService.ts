import { createClient } from '@supabase/supabase-js';
import type { PremiumFeatures } from '../types/filters.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class PremiumService {
  /**
   * Check if user has premium features
   */
  async isPremiumUser(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('premium_features')
        .eq('user_id', userId)
        .single();

      return profile?.premium_features?.enabled === true || false;
    } catch (error) {
      logger.error('Error checking premium status', error as Error, { userId });
      return false;
    }
  }

  /**
   * Get premium features for user
   */
  async getPremiumFeatures(userId: string): Promise<PremiumFeatures> {
    const isPremium = await this.isPremiumUser(userId);

    if (!isPremium) {
      return {
        voiceToText: false,
        increasedTokenLimit: 4000, // Default limit
        advancedFilters: false,
        customPrompts: false,
      };
    }

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('premium_features')
        .eq('user_id', userId)
        .single();

      const premiumConfig = profile?.premium_features || {};

      return {
        voiceToText: premiumConfig.voiceToText !== false,
        increasedTokenLimit: premiumConfig.tokenLimit || 16000,
        advancedFilters: premiumConfig.advancedFilters !== false,
        customPrompts: premiumConfig.customPrompts !== false,
      };
    } catch (error) {
      logger.error('Error fetching premium features', error as Error, { userId });
      return {
        voiceToText: false,
        increasedTokenLimit: 4000,
        advancedFilters: false,
        customPrompts: false,
      };
    }
  }

  /**
   * Check token usage against limit
   */
  async checkTokenLimit(
    userId: string,
    estimatedTokens: number
  ): Promise<{ allowed: boolean; limit: number; remaining: number }> {
    const features = await this.getPremiumFeatures(userId);
    const limit = features.increasedTokenLimit;

    // Get current usage (would track in database)
    const currentUsage = await this.getCurrentTokenUsage(userId);

    const remaining = limit - currentUsage;
    const allowed = estimatedTokens <= remaining;

    return {
      allowed,
      limit,
      remaining: Math.max(0, remaining),
    };
  }

  /**
   * Get current token usage for user (daily/monthly)
   */
  private async getCurrentTokenUsage(userId: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: runs } = await supabase
        .from('agent_runs')
        .select('tokens_used')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());

      return runs?.reduce((sum, run) => sum + (run.tokens_used || 0), 0) || 0;
    } catch (error) {
      logger.error('Error fetching token usage', error as Error, { userId });
      return 0;
    }
  }
}

export const premiumService = new PremiumService();
