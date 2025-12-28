import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface BehaviorData {
  userId: string;
  actions: Array<{
    type: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }>;
  preferences?: Record<string, any>;
}

export class EmbeddingService {
  private readonly embeddingModel = 'text-embedding-3-small';
  private readonly embeddingDimensions = 1536;

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate behavior embedding from user actions and preferences
   */
  async generateBehaviorEmbedding(data: BehaviorData): Promise<number[]> {
    // Create a text representation of user behavior
    const behaviorText = this.createBehaviorText(data);

    // Generate embedding
    return this.generateEmbedding(behaviorText);
  }

  /**
   * Create text representation of behavior for embedding
   */
  private createBehaviorText(data: BehaviorData): string {
    const parts: string[] = [];

    // Add action types
    const actionTypes = data.actions.map((a) => a.type).join(', ');
    parts.push(`Actions: ${actionTypes}`);

    // Add preferences
    if (data.preferences) {
      const prefs = Object.entries(data.preferences)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      parts.push(`Preferences: ${prefs}`);
    }

    // Add metadata summaries
    const metadataKeys = new Set<string>();
    data.actions.forEach((a) => {
      if (a.metadata) {
        Object.keys(a.metadata).forEach((key) => metadataKeys.add(key));
      }
    });
    if (metadataKeys.size > 0) {
      parts.push(`Metadata keys: ${Array.from(metadataKeys).join(', ')}`);
    }

    return parts.join('. ');
  }

  /**
   * Update user profile with behavior embedding
   */
  async updateUserBehaviorEmbedding(userId: string): Promise<void> {
    try {
      // Get user's recent actions
      const { data: runs } = await supabase
        .from('agent_runs')
        .select('trigger, user_feedback, created_at, trigger_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, vertical, tone, kpi_focus, perspective, stack')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        return;
      }

      // Create behavior data
      const behaviorData: BehaviorData = {
        userId,
        actions:
          runs?.map((run) => ({
            type: run.trigger || 'unknown',
            timestamp: new Date(run.created_at),
            metadata: {
              feedback: run.user_feedback,
              ...run.trigger_data,
            },
          })) || [],
        preferences: {
          role: profile.role,
          vertical: profile.vertical,
          tone: profile.tone,
          kpi_focus: profile.kpi_focus,
          perspective: profile.perspective,
          stack: profile.stack,
        },
      };

      // Generate embedding
      const embedding = await this.generateBehaviorEmbedding(behaviorData);

      // Update profile
      await supabase
        .from('user_profiles')
        .update({
          behavior_embedding: embedding,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating behavior embedding:', error);
    }
  }

  /**
   * Find similar users based on behavior embeddings
   */
  async findSimilarUsers(userId: string, limit: number = 5): Promise<string[]> {
    try {
      // Get user's embedding
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('behavior_embedding')
        .eq('user_id', userId)
        .single();

      if (!userProfile?.behavior_embedding) {
        return [];
      }

      // Use pgvector similarity search (if available)
      // For now, return empty array - would need pgvector extension
      // This is a placeholder for when pgvector is properly configured
      return [];
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Recommend atoms based on similar user behavior
   */
  async recommendAtoms(userId: string, limit: number = 5): Promise<string[]> {
    try {
      // Get user's embedding
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('behavior_embedding, role, vertical')
        .eq('user_id', userId)
        .single();

      if (!userProfile) {
        return [];
      }

      // Get atoms that similar users have had success with
      // This is a simplified version - in production, would use vector similarity
      const { data: successfulAtoms } = await supabase
        .from('prompt_atoms')
        .select('id, name, success_rate, target_roles, target_verticals')
        .eq('active', true)
        .gte('success_rate', 0.7)
        .order('success_rate', { ascending: false })
        .limit(limit * 2);

      // Filter by role and vertical compatibility
      const compatibleAtoms = (successfulAtoms || []).filter((atom) => {
        if (userProfile.role && atom.target_roles) {
          if (!atom.target_roles.includes(userProfile.role)) {
            return false;
          }
        }
        if (userProfile.vertical && atom.target_verticals) {
          if (!atom.target_verticals.includes(userProfile.vertical)) {
            return false;
          }
        }
        return true;
      });

      return compatibleAtoms.slice(0, limit).map((a) => a.id);
    } catch (error) {
      console.error('Error recommending atoms:', error);
      return [];
    }
  }
}

export const embeddingService = new EmbeddingService();
