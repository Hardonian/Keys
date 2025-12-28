import { createClient } from '@supabase/supabase-js';
import type { PromptAtom, AgentRun } from '../types/index.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Recommendation {
  atomId: string;
  atomName: string;
  score: number;
  reason: string;
}

export interface SuggestionScore {
  suggestionId: string;
  score: number;
  factors: {
    userHistory: number;
    atomSuccessRate: number;
    timing: number;
    relevance: number;
  };
}

export class RecommendationEngine {
  /**
   * Score a suggestion based on multiple factors
   */
  async scoreSuggestion(
    userId: string,
    runId: string,
    selectedAtomIds: string[]
  ): Promise<SuggestionScore> {
    // Get user's history
    const userHistory = await this.getUserHistory(userId);

    // Get atom success rates
    const atomScores = await this.getAtomScores(selectedAtomIds);

    // Calculate factors
    const userHistoryScore = this.calculateUserHistoryScore(userId, selectedAtomIds, userHistory);
    const atomSuccessRateScore = this.calculateAtomSuccessScore(atomScores);
    const timingScore = this.calculateTimingScore(userHistory);
    const relevanceScore = this.calculateRelevanceScore(userId, selectedAtomIds);

    // Weighted average
    const score =
      userHistoryScore * 0.3 +
      atomSuccessRateScore * 0.3 +
      timingScore * 0.2 +
      relevanceScore * 0.2;

    return {
      suggestionId: runId,
      score: Math.min(100, Math.max(0, score * 100)), // Scale to 0-100
      factors: {
        userHistory: userHistoryScore * 100,
        atomSuccessRate: atomSuccessRateScore * 100,
        timing: timingScore * 100,
        relevance: relevanceScore * 100,
      },
    };
  }

  /**
   * Recommend atoms for a user
   */
  async recommendAtoms(
    userId: string,
    limit: number = 5
  ): Promise<Recommendation[]> {
    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, vertical, stack')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return [];
    }

    // Get user's successful atom combinations
    const { data: successfulRuns } = await supabase
      .from('agent_runs')
      .select('selected_atoms')
      .eq('user_id', userId)
      .eq('user_feedback', 'approved')
      .not('selected_atoms', 'is', null)
      .limit(50);

    // Count atom usage in successful runs
    const atomUsage: Record<string, number> = {};
    successfulRuns?.forEach((run) => {
      if (run.selected_atoms) {
        run.selected_atoms.forEach((atomId: string) => {
          atomUsage[atomId] = (atomUsage[atomId] || 0) + 1;
        });
      }
    });

    // Get all active atoms
    const { data: allAtoms } = await supabase
      .from('prompt_atoms')
      .select('*')
      .eq('active', true);

    if (!allAtoms) {
      return [];
    }

    // Score atoms
    const recommendations: Recommendation[] = allAtoms
      .filter((atom) => {
        // Filter by compatibility
        if (profile.role && atom.target_roles && atom.target_roles.length > 0) {
          if (!atom.target_roles.includes(profile.role)) {
            return false;
          }
        }
        if (profile.vertical && atom.target_verticals && atom.target_verticals.length > 0) {
          if (!atom.target_verticals.includes(profile.vertical)) {
            return false;
          }
        }
        return true;
      })
      .map((atom) => {
        const usageCount = atomUsage[atom.id] || 0;
        const successRate = atom.success_rate || 0.5;
        const score = (usageCount * 0.4 + successRate * 0.6) * 100;

        return {
          atomId: atom.id,
          atomName: atom.name,
          score,
          reason: this.generateReason(atom, usageCount, successRate),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return recommendations;
  }

  /**
   * Get user's history
   */
  private async getUserHistory(userId: string): Promise<AgentRun[]> {
    const { data } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    return (data as AgentRun[]) || [];
  }

  /**
   * Get atom scores
   */
  private async getAtomScores(atomIds: string[]): Promise<Record<string, PromptAtom>> {
    if (atomIds.length === 0) {
      return {};
    }

    const { data } = await supabase
      .from('prompt_atoms')
      .select('*')
      .in('id', atomIds);

    const scores: Record<string, PromptAtom> = {};
    (data || []).forEach((atom) => {
      scores[atom.id] = atom;
    });

    return scores;
  }

  /**
   * Calculate user history score
   */
  private calculateUserHistoryScore(
    userId: string,
    atomIds: string[],
    history: AgentRun[]
  ): number {
    // Check how often user approved similar atom combinations
    const similarRuns = history.filter((run) => {
      if (!run.selected_atoms) return false;
      const overlap = run.selected_atoms.filter((id: string) => atomIds.includes(id)).length;
      return overlap > 0 && run.user_feedback === 'approved';
    });

    const approvalRate = history.length > 0 ? similarRuns.length / history.length : 0;
    return Math.min(1, approvalRate * 2); // Scale up if user has good history
  }

  /**
   * Calculate atom success score
   */
  private calculateAtomSuccessScore(atomScores: Record<string, PromptAtom>): number {
    if (Object.keys(atomScores).length === 0) {
      return 0.5; // Default
    }

    const avgSuccessRate =
      Object.values(atomScores).reduce((sum, atom) => sum + (atom.success_rate || 0.5), 0) /
      Object.values(atomScores).length;

    return avgSuccessRate;
  }

  /**
   * Calculate timing score (recent activity is better)
   */
  private calculateTimingScore(history: AgentRun[]): number {
    if (history.length === 0) {
      return 0.5; // Neutral
    }

    const recentRuns = history.filter((run) => {
      const runDate = new Date(run.created_at);
      const daysAgo = (Date.now() - runDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo < 7; // Last week
    });

    return Math.min(1, recentRuns.length / 10); // More recent activity = higher score
  }

  /**
   * Calculate relevance score
   */
  private async calculateRelevanceScore(userId: string, atomIds: string[]): Promise<number> {
    // Check if atoms match user's profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, vertical, stack')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return 0.5;
    }

    const { data: atoms } = await supabase
      .from('prompt_atoms')
      .select('target_roles, target_verticals')
      .in('id', atomIds);

    if (!atoms || atoms.length === 0) {
      return 0.5;
    }

    let relevanceCount = 0;
    atoms.forEach((atom) => {
      if (profile.role && atom.target_roles && atom.target_roles.includes(profile.role)) {
        relevanceCount++;
      }
      if (profile.vertical && atom.target_verticals && atom.target_verticals.includes(profile.vertical)) {
        relevanceCount++;
      }
    });

    return Math.min(1, relevanceCount / (atoms.length * 2)); // Max 2 relevance factors per atom
  }

  /**
   * Generate recommendation reason
   */
  private generateReason(atom: PromptAtom, usageCount: number, successRate: number): string {
    const reasons: string[] = [];

    if (usageCount > 0) {
      reasons.push(`Used successfully ${usageCount} time${usageCount > 1 ? 's' : ''}`);
    }

    if (successRate > 0.7) {
      reasons.push(`High success rate (${Math.round(successRate * 100)}%)`);
    }

    if (atom.target_roles && atom.target_roles.length > 0) {
      reasons.push(`Recommended for ${atom.target_roles.join(', ')} roles`);
    }

    return reasons.length > 0 ? reasons.join(' • ') : 'General recommendation';
  }
}

export const recommendationEngine = new RecommendationEngine();
