/**
 * Failure Pattern Service
 * 
 * Core defensive moat: Institutional memory that prevents repeat mistakes.
 * Tracks failures, detects similar patterns, and prevents them from recurring.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface FailurePattern {
  id: string;
  user_id: string;
  created_at: string;
  pattern_type: 'security' | 'quality' | 'compliance' | 'performance' | 'architecture' | 'best_practice' | 'user_rejection' | 'user_revision';
  pattern_description: string;
  pattern_signature: string;
  detected_in?: string;
  original_output?: string;
  failure_reason: string;
  prevention_rule: string;
  prevention_prompt_addition: string;
  context_snapshot?: Record<string, any>;
  template_id?: string;
  vibe_config_snapshot?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolved_at?: string;
  occurrence_count: number;
  last_occurrence: string;
}

export interface SuccessPattern {
  id: string;
  user_id: string;
  created_at: string;
  pattern_type: 'security' | 'quality' | 'compliance' | 'performance' | 'architecture' | 'best_practice' | 'user_approval' | 'production_ready';
  pattern_description: string;
  pattern_signature: string;
  context: string;
  outcome: string;
  success_factors: string[];
  template_id?: string;
  vibe_config_snapshot?: Record<string, any>;
  context_snapshot?: Record<string, any>;
  output_example?: string;
  usage_count: number;
  success_rate: number;
  last_used: string;
}

export interface PatternMatch {
  pattern_id: string;
  pattern_type: 'failure' | 'success';
  match_type: 'exact' | 'similar' | 'prevented';
  match_confidence: number;
  action_taken?: 'warned' | 'blocked' | 'suggested' | 'applied';
}

export class FailurePatternService {
  /**
   * Record a failure pattern from user feedback
   */
  async recordFailure(
    userId: string,
    failure: {
      pattern_type: FailurePattern['pattern_type'];
      pattern_description: string;
      original_output: string;
      failure_reason: string;
      detected_in?: string;
      context_snapshot?: Record<string, any>;
      template_id?: string;
      vibe_config_snapshot?: Record<string, any>;
      severity?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<FailurePattern> {
    // Generate pattern signature for matching
    const pattern_signature = this.generateSignature(
      failure.pattern_description,
      failure.original_output,
      failure.context_snapshot
    );

    // Check if similar pattern already exists
    const existingPattern = await this.findSimilarFailure(userId, pattern_signature);
    
    if (existingPattern) {
      // Update existing pattern (increment count, update last occurrence)
      const { data, error } = await supabase
        .from('failure_patterns')
        .update({
          occurrence_count: existingPattern.occurrence_count + 1,
          last_occurrence: new Date().toISOString(),
          failure_reason: failure.failure_reason, // Update with latest reason
        })
        .eq('id', existingPattern.id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update failure pattern', error);
        throw error;
      }

      logger.info('Updated existing failure pattern', {
        userId,
        patternId: existingPattern.id,
        occurrenceCount: existingPattern.occurrence_count + 1,
      });

      return data as FailurePattern;
    }

    // Generate prevention rule
    const prevention_rule = this.generatePreventionRule(failure);
    const prevention_prompt_addition = this.generatePreventionPrompt(failure);

    // Create new pattern
    const { data, error } = await supabase
      .from('failure_patterns')
      .insert({
        user_id: userId,
        pattern_type: failure.pattern_type,
        pattern_description: failure.pattern_description,
        pattern_signature,
        detected_in: failure.detected_in,
        original_output: failure.original_output,
        failure_reason: failure.failure_reason,
        prevention_rule,
        prevention_prompt_addition,
        context_snapshot: failure.context_snapshot,
        template_id: failure.template_id,
        vibe_config_snapshot: failure.vibe_config_snapshot,
        severity: failure.severity || 'medium',
        resolved: false,
        occurrence_count: 1,
        last_occurrence: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create failure pattern', error);
      throw error;
    }

    logger.info('Created new failure pattern', {
      userId,
      patternId: data.id,
      patternType: failure.pattern_type,
    });

    return data as FailurePattern;
  }

  /**
   * Record a success pattern from user approval/production usage
   */
  async recordSuccess(
    userId: string,
    success: {
      pattern_type: SuccessPattern['pattern_type'];
      pattern_description: string;
      context: string;
      outcome: string;
      success_factors: string[];
      template_id?: string;
      vibe_config_snapshot?: Record<string, any>;
      context_snapshot?: Record<string, any>;
      output_example?: string;
    }
  ): Promise<SuccessPattern> {
    const pattern_signature = this.generateSignature(
      success.pattern_description,
      success.output_example || '',
      success.context_snapshot
    );

    // Check if similar pattern exists
    const existingPattern = await this.findSimilarSuccess(userId, pattern_signature);

    if (existingPattern) {
      // Update existing pattern
      const { data, error } = await supabase
        .from('success_patterns')
        .update({
          usage_count: existingPattern.usage_count + 1,
          last_used: new Date().toISOString(),
          success_rate: (existingPattern.success_rate * existingPattern.usage_count + 1) / (existingPattern.usage_count + 1),
        })
        .eq('id', existingPattern.id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update success pattern', error);
        throw error;
      }

      return data as SuccessPattern;
    }

    // Create new pattern
    const { data, error } = await supabase
      .from('success_patterns')
      .insert({
        user_id: userId,
        pattern_type: success.pattern_type,
        pattern_description: success.pattern_description,
        pattern_signature,
        context: success.context,
        outcome: success.outcome,
        success_factors: success.success_factors,
        template_id: success.template_id,
        vibe_config_snapshot: success.vibe_config_snapshot,
        context_snapshot: success.context_snapshot,
        output_example: success.output_example,
        usage_count: 1,
        success_rate: 1.0,
        last_used: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create success pattern', error);
      throw error;
    }

    return data as SuccessPattern;
  }

  /**
   * Check if current output matches any failure patterns
   */
  async checkForSimilarFailures(
    userId: string,
    output: string,
    context?: Record<string, any>
  ): Promise<PatternMatch[]> {
    const signature = this.generateSignature('', output, context);
    
    // Find similar failure patterns
    const { data: failures, error } = await supabase
      .from('failure_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('resolved', false)
      .order('severity', { ascending: false })
      .order('occurrence_count', { ascending: false });

    if (error) {
      logger.error('Failed to fetch failure patterns', error);
      return [];
    }

    const matches: PatternMatch[] = [];

    for (const pattern of failures || []) {
      const similarity = this.calculateSimilarity(signature, pattern.pattern_signature);
      
      if (similarity > 0.6) { // 60% similarity threshold
        matches.push({
          pattern_id: pattern.id,
          pattern_type: 'failure',
          match_type: similarity > 0.9 ? 'exact' : 'similar',
          match_confidence: similarity,
        });
      }
    }

    return matches;
  }

  /**
   * Get prevention rules for a given context
   */
  async getPreventionRules(
    userId: string,
    context?: Record<string, any>
  ): Promise<string[]> {
    const { data: patterns, error } = await supabase
      .from('failure_patterns')
      .select('prevention_prompt_addition')
      .eq('user_id', userId)
      .eq('resolved', false)
      .order('severity', { ascending: false })
      .order('occurrence_count', { ascending: false })
      .limit(10); // Top 10 most relevant

    if (error) {
      logger.error('Failed to fetch prevention rules', error);
      return [];
    }

    return (patterns || [])
      .map(p => p.prevention_prompt_addition)
      .filter((rule): rule is string => !!rule);
  }

  /**
   * Get success patterns to apply
   */
  async getSuccessPatterns(
    userId: string,
    context?: Record<string, any>
  ): Promise<SuccessPattern[]> {
    const { data: patterns, error } = await supabase
      .from('success_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('success_rate', { ascending: false })
      .order('usage_count', { ascending: false })
      .limit(5); // Top 5 most successful

    if (error) {
      logger.error('Failed to fetch success patterns', error);
      return [];
    }

    return (patterns || []) as SuccessPattern[];
  }

  /**
   * Generate pattern signature for matching
   */
  private generateSignature(
    description: string,
    output: string,
    context?: Record<string, any>
  ): string {
    // Create a normalized signature from key elements
    const elements = [
      description.toLowerCase(),
      output.substring(0, 200).toLowerCase(), // First 200 chars
      context ? JSON.stringify(context).substring(0, 200) : '',
    ].join('|');

    // Simple hash-like signature (in production, use proper hashing)
    return Buffer.from(elements).toString('base64').substring(0, 64);
  }

  /**
   * Calculate similarity between two signatures
   */
  private calculateSimilarity(sig1: string, sig2: string): number {
    // Simple similarity calculation (in production, use proper similarity algorithm)
    if (sig1 === sig2) return 1.0;
    
    // Calculate character overlap
    const set1 = new Set(sig1.split(''));
    const set2 = new Set(sig2.split(''));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Find similar failure pattern
   */
  private async findSimilarFailure(
    userId: string,
    signature: string
  ): Promise<FailurePattern | null> {
    const { data: patterns, error } = await supabase
      .from('failure_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('resolved', false);

    if (error || !patterns) return null;

    for (const pattern of patterns) {
      const similarity = this.calculateSimilarity(signature, pattern.pattern_signature);
      if (similarity > 0.7) {
        return pattern as FailurePattern;
      }
    }

    return null;
  }

  /**
   * Find similar success pattern
   */
  private async findSimilarSuccess(
    userId: string,
    signature: string
  ): Promise<SuccessPattern | null> {
    const { data: patterns, error } = await supabase
      .from('success_patterns')
      .select('*')
      .eq('user_id', userId);

    if (error || !patterns) return null;

    for (const pattern of patterns) {
      const similarity = this.calculateSimilarity(signature, pattern.pattern_signature);
      if (similarity > 0.7) {
        return pattern as SuccessPattern;
      }
    }

    return null;
  }

  /**
   * Generate prevention rule from failure
   */
  private generatePreventionRule(failure: {
    pattern_type: string;
    pattern_description: string;
    failure_reason: string;
  }): string {
    // Generate a rule that prevents this failure
    return `Prevent ${failure.pattern_type} failures: ${failure.pattern_description}. Reason: ${failure.failure_reason}`;
  }

  /**
   * Generate prevention prompt addition
   */
  private generatePreventionPrompt(failure: {
    pattern_type: string;
    pattern_description: string;
    failure_reason: string;
  }): string {
    // Generate prompt text that prevents this failure
    const typeMap: Record<string, string> = {
      security: 'Ensure all security best practices are followed. Scan for vulnerabilities.',
      quality: 'Ensure code quality standards are met. Follow best practices.',
      compliance: 'Ensure compliance with GDPR, SOC 2, and other relevant standards.',
      performance: 'Optimize for performance. Avoid performance anti-patterns.',
      architecture: 'Follow architectural best practices. Avoid anti-patterns.',
      best_practice: 'Follow industry best practices.',
      user_rejection: `Avoid: ${failure.failure_reason}`,
      user_revision: `Ensure: ${failure.pattern_description}`,
    };

    return typeMap[failure.pattern_type] || `Avoid: ${failure.failure_reason}`;
  }
}

export const failurePatternService = new FailurePatternService();
