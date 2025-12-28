/**
 * Template Search Service
 * 
 * Provides search and discovery functionality for templates
 */

import { scaffoldTemplateService } from './scaffoldTemplateService.js';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TemplateSearchResult {
  templateId: string;
  name: string;
  description: string;
  milestone: string;
  tags: string[];
  stack: string[];
  priority: string;
  security_level: string;
  optimization_level: string;
  relevanceScore: number;
  matchReasons: string[];
}

export interface SearchFilters {
  query?: string;
  milestone?: string[];
  tags?: string[];
  stack?: string[];
  priority?: string[];
  security_level?: string[];
  optimization_level?: string[];
  hasCustomization?: boolean;
  userId?: string;
}

export class TemplateSearchService {
  /**
   * Search templates
   */
  async searchTemplates(
    filters: SearchFilters
  ): Promise<TemplateSearchResult[]> {
    // Get all templates
    const allTemplates = scaffoldTemplateService.filterTemplates({
      milestone: filters.milestone,
      stack: filters.stack,
      priority: filters.priority as any,
      security_level: filters.security_level as any,
      optimization_level: filters.optimization_level as any,
      tags: filters.tags,
    });

    // Filter by query if provided
    let results = allTemplates;
    if (filters.query) {
      results = this.filterByQuery(allTemplates, filters.query);
    }

    // Filter by customization status if provided
    if (filters.hasCustomization !== undefined && filters.userId) {
      const { data: customizations } = await supabase
        .from('user_template_customizations')
        .select('template_id')
        .eq('user_id', filters.userId);

      const customizedIds = new Set(
        (customizations || []).map((c) => c.template_id)
      );

      results = results.filter((t) => {
        const hasCustom = customizedIds.has(t.id);
        return filters.hasCustomization ? hasCustom : !hasCustom;
      });
    }

    // Calculate relevance scores
    const scoredResults = results.map((template) => {
      const score = this.calculateRelevanceScore(template, filters);
      return {
        templateId: template.id,
        name: template.name,
        description: template.description,
        milestone: template.milestone,
        tags: template.tags,
        stack: template.stack,
        priority: template.priority,
        security_level: template.security_level,
        optimization_level: template.optimization_level,
        relevanceScore: score.score,
        matchReasons: score.reasons,
      };
    });

    // Sort by relevance
    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return scoredResults;
  }

  /**
   * Filter templates by query string
   */
  private filterByQuery(
    templates: any[],
    query: string
  ): any[] {
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/);

    return templates.filter((template) => {
      const searchableText = [
        template.name,
        template.description,
        ...template.tags,
        ...template.stack,
        template.milestone,
      ]
        .join(' ')
        .toLowerCase();

      return queryWords.some((word) => searchableText.includes(word));
    });
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevanceScore(
    template: any,
    filters: SearchFilters
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Query match scoring
    if (filters.query) {
      const lowerQuery = filters.query.toLowerCase();
      const searchableText = [
        template.name,
        template.description,
        ...template.tags,
      ]
        .join(' ')
        .toLowerCase();

      if (template.name.toLowerCase().includes(lowerQuery)) {
        score += 10;
        reasons.push('Name matches query');
      }
      if (template.description.toLowerCase().includes(lowerQuery)) {
        score += 5;
        reasons.push('Description matches query');
      }
      if (template.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))) {
        score += 3;
        reasons.push('Tag matches query');
      }
    }

    // Priority scoring
    if (template.priority === 'high') {
      score += 5;
      reasons.push('High priority template');
    }

    // Security level scoring
    if (template.security_level === 'required') {
      score += 3;
      reasons.push('Security-focused');
    }

    // Stack match scoring
    if (filters.stack && filters.stack.length > 0) {
      const stackMatch = filters.stack.some((s) =>
        template.stack.some((ts: string) =>
          ts.toLowerCase().includes(s.toLowerCase())
        )
      );
      if (stackMatch) {
        score += 5;
        reasons.push('Stack matches');
      }
    }

    return { score, reasons };
  }

  /**
   * Get recommended templates for user
   */
  async getRecommendedTemplates(
    userId: string,
    options: {
      limit?: number;
      basedOnUsage?: boolean;
      basedOnStack?: boolean;
    } = {}
  ): Promise<TemplateSearchResult[]> {
    const limit = options.limit || 10;

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get user's most used templates
    let usageBased: string[] = [];
    if (options.basedOnUsage) {
      const { data: analytics } = await supabase
        .from('template_usage_analytics')
        .select('template_id, usage_count')
        .eq('user_id', userId)
        .order('usage_count', { ascending: false })
        .limit(5);

      usageBased = (analytics || []).map((a) => a.template_id);
    }

    // Get stack-based recommendations
    const stackBased: string[] = [];
    if (options.basedOnStack && profile?.stack) {
      const stackFilters: SearchFilters = {
        stack: Object.keys(profile.stack).filter(
          (key) => profile.stack[key] === true
        ),
      };
      const stackResults = await this.searchTemplates(stackFilters);
      stackBased.push(...stackResults.slice(0, 5).map((r) => r.templateId));
    }

    // Combine and deduplicate
    const recommendedIds = [
      ...new Set([...usageBased, ...stackBased]),
    ].slice(0, limit);

    // Get full template details
    const allTemplates = scaffoldTemplateService.filterTemplates({});
    const recommended = allTemplates
      .filter((t) => recommendedIds.includes(t.id))
      .map((template) => ({
        templateId: template.id,
        name: template.name,
        description: template.description,
        milestone: template.milestone,
        tags: template.tags,
        stack: template.stack,
        priority: template.priority,
        security_level: template.security_level,
        optimization_level: template.optimization_level,
        relevanceScore: 10,
        matchReasons: ['Recommended for you'],
      }));

    return recommended;
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit: number = 10): Promise<TemplateSearchResult[]> {
    const { data: analytics } = await supabase
      .from('template_usage_analytics')
      .select('template_id, usage_count')
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (!analytics || analytics.length === 0) {
      return [];
    }

    const templateIds = analytics.map((a) => a.template_id);
    const allTemplates = scaffoldTemplateService.filterTemplates({});

    return allTemplates
      .filter((t) => templateIds.includes(t.id))
      .map((template) => ({
        templateId: template.id,
        name: template.name,
        description: template.description,
        milestone: template.milestone,
        tags: template.tags,
        stack: template.stack,
        priority: template.priority,
        security_level: template.security_level,
        optimization_level: template.optimization_level,
        relevanceScore: analytics.find((a) => a.template_id === template.id)?.usage_count || 0,
        matchReasons: ['Popular template'],
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

export const templateSearchService = new TemplateSearchService();
