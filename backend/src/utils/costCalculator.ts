import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CostBreakdown {
  total: number;
  byModel: Record<string, number>;
  byType: Record<string, number>;
  byUser?: Record<string, number>;
  averagePerRun: number;
  tokenCost: number;
}

export interface ModelPricing {
  inputCostPer1k: number;
  outputCostPer1k: number;
}

// Pricing per 1k tokens (as of 2024, adjust as needed)
const MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-4-turbo-preview': {
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.03,
  },
  'gpt-4': {
    inputCostPer1k: 0.03,
    outputCostPer1k: 0.06,
  },
  'gpt-3.5-turbo': {
    inputCostPer1k: 0.0005,
    outputCostPer1k: 0.0015,
  },
  'claude-3-opus': {
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.075,
  },
  'claude-3-sonnet': {
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
  },
  'claude-3-haiku': {
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.00125,
  },
};

export class CostCalculator {
  /**
   * Calculate cost for a model based on input/output tokens
   */
  calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4-turbo-preview'];

    const inputCost = (inputTokens / 1000) * pricing.inputCostPer1k;
    const outputCost = (outputTokens / 1000) * pricing.outputCostPer1k;

    return inputCost + outputCost;
  }

  /**
   * Estimate cost from total tokens (if input/output split unknown)
   */
  estimateCost(model: string, totalTokens: number): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4-turbo-preview'];
    // Assume 70% input, 30% output
    const inputTokens = totalTokens * 0.7;
    const outputTokens = totalTokens * 0.3;

    return this.calculateCost(model, inputTokens, outputTokens);
  }

  /**
   * Get cost breakdown for a time period
   */
  async getCostBreakdown(
    userId?: string,
    days: number = 30
  ): Promise<CostBreakdown> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('agent_runs')
      .select('cost_usd, tokens_used, model_used, agent_type, user_id')
      .gte('created_at', startDate.toISOString())
      .not('cost_usd', 'is', null);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: runs } = await query;

    const runsList = runs || [];

    const total = runsList.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
    const totalTokens = runsList.reduce((sum, r) => sum + (r.tokens_used || 0), 0);

    // Breakdown by model
    const byModel: Record<string, number> = {};
    runsList.forEach((run) => {
      const model = run.model_used || 'unknown';
      byModel[model] = (byModel[model] || 0) + (run.cost_usd || 0);
    });

    // Breakdown by type
    const byType: Record<string, number> = {};
    runsList.forEach((run) => {
      const type = run.agent_type || 'unknown';
      byType[type] = (byType[type] || 0) + (run.cost_usd || 0);
    });

    // Breakdown by user (if not filtering by user)
    const byUser: Record<string, number> = {};
    if (!userId) {
      runsList.forEach((run) => {
        const uid = run.user_id || 'unknown';
        byUser[uid] = (byUser[uid] || 0) + (run.cost_usd || 0);
      });
    }

    const averagePerRun = runsList.length > 0 ? total / runsList.length : 0;

    return {
      total,
      byModel,
      byType,
      ...(Object.keys(byUser).length > 0 && { byUser }),
      averagePerRun,
      tokenCost: totalTokens > 0 ? total / totalTokens : 0,
    };
  }

  /**
   * Get monthly cost for a user
   */
  async getMonthlyCost(userId: string): Promise<number> {
    return (await this.getCostBreakdown(userId, 30)).total;
  }

  /**
   * Check if user is within cost limits
   */
  async checkCostLimit(userId: string, limitUsd: number = 100): Promise<{
    withinLimit: boolean;
    currentCost: number;
    remaining: number;
    percentageUsed: number;
  }> {
    const currentCost = await this.getMonthlyCost(userId);

    return {
      withinLimit: currentCost < limitUsd,
      currentCost,
      remaining: Math.max(0, limitUsd - currentCost),
      percentageUsed: (currentCost / limitUsd) * 100,
    };
  }

  /**
   * Get cost per token for a model
   */
  getCostPerToken(model: string): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4-turbo-preview'];
    // Average of input and output
    return (pricing.inputCostPer1k + pricing.outputCostPer1k) / 2000;
  }
}

export const costCalculator = new CostCalculator();
