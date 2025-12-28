/**
 * Template Service
 * 
 * API client for template management
 */

import api from './api';

export interface Template {
  templateId: string;
  milestone: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  stack: string[];
  security_level: 'required' | 'recommended' | 'optional';
  optimization_level: 'required' | 'recommended' | 'optional';
}

export interface TemplatePreview {
  templateId: string;
  milestone: string;
  name: string;
  description: string;
  basePrompt: string;
  customizedPrompt?: string;
  hasCustomization: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customVariables?: Record<string, any>;
  customInstructions?: string;
}

export interface Customization {
  id: string;
  user_id: string;
  template_id: string;
  milestone: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  custom_variables: Record<string, any>;
  custom_instructions?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string; code: string }>;
  warnings: string[];
  availableVariables?: Array<{
    name: string;
    description: string;
    type?: string;
    required: boolean;
    default?: string;
    examples?: string[];
  }>;
}

export interface TestResult {
  success: boolean;
  renderedPrompt: string;
  validationResult: ValidationResult;
  variableReplacements: Record<string, { expected: string; actual: string; replaced: boolean }>;
  conditionalBlocks: {
    rendered: string[];
    skipped: string[];
  };
  metadata: {
    templateId: string;
    variablesUsed: string[];
    conditionalsEvaluated: number;
    promptLength: number;
  };
}

export interface HistoryEntry {
  id: string;
  customization_id: string;
  user_id: string;
  template_id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  custom_variables: Record<string, any>;
  custom_instructions?: string;
  enabled: boolean;
  change_type: 'created' | 'updated' | 'deleted';
  change_reason?: string;
  created_at: string;
  changed_by: string;
}

export interface Analytics {
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

export interface SearchFilters {
  query?: string;
  milestone?: string[];
  tags?: string[];
  stack?: string[];
  priority?: string[];
  security_level?: string[];
  optimization_level?: string[];
  hasCustomization?: boolean;
}

export const templateService = {
  // Browse templates
  async getMilestoneTemplates(milestone: string): Promise<TemplatePreview[]> {
    const response = await api.get(`/user-templates/milestone/${milestone}`);
    return response.data.templates || [];
  },

  // Get template preview
  async getTemplatePreview(templateId: string): Promise<TemplatePreview> {
    const response = await api.get(`/user-templates/${templateId}/preview`);
    return response.data;
  },

  // Search templates
  async searchTemplates(filters: SearchFilters = {}): Promise<Template[]> {
    const params = new URLSearchParams();
    if (filters.query) params.append('query', filters.query);
    if (filters.milestone) params.append('milestone', filters.milestone.join(','));
    if (filters.tags) params.append('tags', filters.tags.join(','));
    if (filters.stack) params.append('stack', filters.stack.join(','));
    if (filters.priority) params.append('priority', filters.priority.join(','));
    if (filters.security_level) params.append('security_level', filters.security_level.join(','));
    if (filters.optimization_level) params.append('optimization_level', filters.optimization_level.join(','));
    if (filters.hasCustomization !== undefined) params.append('hasCustomization', String(filters.hasCustomization));

    const response = await api.get(`/user-templates/search?${params}`);
    return response.data.results || [];
  },

  // Get recommended templates
  async getRecommendedTemplates(options: {
    limit?: number;
    basedOnUsage?: boolean;
    basedOnStack?: boolean;
  } = {}): Promise<Template[]> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', String(options.limit));
    if (options.basedOnUsage) params.append('basedOnUsage', 'true');
    if (options.basedOnStack) params.append('basedOnStack', 'true');

    const response = await api.get(`/user-templates/recommended?${params}`);
    return response.data.recommended || [];
  },

  // Get popular templates
  async getPopularTemplates(limit?: number): Promise<Template[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/user-templates/popular${params}`);
    return response.data.popular || [];
  },

  // Validate customization
  async validateCustomization(
    templateId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customVariables: Record<string, any>,
    customInstructions?: string
  ): Promise<ValidationResult> {
    const response = await api.post(`/user-templates/${templateId}/validate`, {
      customVariables,
      customInstructions,
    });
    return response.data;
  },

  // Get available variables
  async getAvailableVariables(templateId: string): Promise<Array<{
    name: string;
    description: string;
    type?: string;
    required: boolean;
    default?: string;
    examples?: string[];
  }>> {
    const response = await api.get(`/user-templates/${templateId}/variables`);
    return response.data.variables || [];
  },

  // Test template
  async testTemplate(
    templateId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customVariables: Record<string, any>,
    customInstructions?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputFilter?: any,
    taskDescription?: string
  ): Promise<TestResult> {
    const response = await api.post(`/user-templates/${templateId}/test`, {
      customVariables,
      customInstructions,
      inputFilter,
      taskDescription,
    });
    return response.data;
  },

  // Compare prompts
  async comparePrompts(
    templateId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customVariables: Record<string, any>,
    customInstructions?: string
  ): Promise<{
    basePrompt: string;
    customizedPrompt: string;
    comparison: {
      added: string[];
      removed: string[];
      changed: Array<{ line: string; old: string; new: string }>;
      similarity: number;
    };
    testResult: TestResult;
  }> {
    const response = await api.post(`/user-templates/${templateId}/compare`, {
      customVariables,
      customInstructions,
    });
    return response.data;
  },

  // Save customization
  async saveCustomization(
    templateId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customVariables: Record<string, any>,
    customInstructions?: string
  ): Promise<{ customization: Customization; preview: TemplatePreview }> {
    const response = await api.post(`/user-templates/${templateId}/customize`, {
      customVariables,
      customInstructions,
    });
    return response.data;
  },

  // Update customization
  async updateCustomization(
    templateId: string,
    updates: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customVariables?: Record<string, any>;
      customInstructions?: string;
      enabled?: boolean;
    }
  ): Promise<{ customization: Customization; preview: TemplatePreview }> {
    const response = await api.patch(`/user-templates/${templateId}/customize`, updates);
    return response.data;
  },

  // Delete customization
  async deleteCustomization(templateId: string): Promise<{ message: string; preview: TemplatePreview }> {
    const response = await api.delete(`/user-templates/${templateId}/customize`);
    return response.data;
  },

  // Get customization history
  async getCustomizationHistory(templateId: string): Promise<HistoryEntry[]> {
    const response = await api.get(`/user-templates/${templateId}/history`);
    return response.data.history || [];
  },

  // Rollback to history entry
  async rollbackToHistory(
    templateId: string,
    historyId: string
  ): Promise<{ message: string; preview: TemplatePreview }> {
    const response = await api.post(`/user-templates/${templateId}/history/${historyId}/rollback`);
    return response.data;
  },

  // Get history diff
  async getHistoryDiff(
    templateId: string,
    entryId1: string,
    entryId2: string
  ): Promise<{
    entry1: HistoryEntry;
    entry2: HistoryEntry;
    diff: {
      variables: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        added: Record<string, any>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        removed: Record<string, any>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changed: Array<{ key: string; oldValue: any; newValue: any }>;
      };
      instructions: {
        changed: boolean;
        oldValue?: string;
        newValue?: string;
      };
      enabled: {
        changed: boolean;
        oldValue: boolean;
        newValue: boolean;
      };
    };
  }> {
    const response = await api.get(
      `/user-templates/${templateId}/history/diff?entryId1=${entryId1}&entryId2=${entryId2}`
    );
    return response.data;
  },

  // Get analytics
  async getTemplateAnalytics(templateId: string): Promise<Analytics | null> {
    const response = await api.get(`/user-templates/${templateId}/analytics`);
    return response.data.analytics;
  },

  // Get user usage stats
  async getUserUsageStats(): Promise<{
    total_uses: number;
    unique_users: number;
    templates_used: number;
    average_success_rate: number;
    top_templates: Array<{
      template_id: string;
      usage_count: number;
      success_rate: number;
    }>;
  }> {
    const response = await api.get('/user-templates/analytics/stats');
    return response.data.stats;
  },

  // Submit feedback
  async submitFeedback(
    templateId: string,
    rating: number,
    comment?: string,
    suggestions?: string
  ): Promise<void> {
    await api.post(`/user-templates/${templateId}/feedback`, {
      rating,
      comment,
      suggestions,
    });
  },

  // Get feedback
  async getTemplateFeedback(templateId: string): Promise<Array<{
    user_id: string;
    rating: number;
    comment?: string;
    suggestions?: string;
    created_at: string;
  }>> {
    const response = await api.get(`/user-templates/${templateId}/feedback`);
    return response.data.feedback || [];
  },

  // Get all customizations
  async getUserCustomizations(): Promise<Customization[]> {
    const response = await api.get('/user-templates/customizations');
    return response.data.customizations || [];
  },

  // Reset all customizations
  async resetAllCustomizations(): Promise<void> {
    await api.post('/user-templates/reset');
  },

  // Generate prompt
  async generatePrompt(
    templateId: string,
    taskDescription: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputFilter?: any
  ): Promise<{
    prompt: string;
    isCustomized: boolean;
    templateId: string;
    message: string;
  }> {
    const response = await api.post(`/user-templates/${templateId}/generate`, {
      taskDescription,
      inputFilter,
    });
    return response.data;
  },

  // Export customizations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async exportCustomizations(format: 'json' | 'yaml' | 'csv' = 'json'): Promise<any> {
    const response = await api.get(`/user-templates/export?format=${format}`, {
      responseType: format === 'json' ? 'json' : 'text',
    });
    return response.data;
  },

  // Import customizations
  async importCustomizations(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exportData: any,
    options: {
      overwriteExisting?: boolean;
      skipErrors?: boolean;
    } = {}
  ): Promise<{
    imported: string[];
    skipped: string[];
    errors: Array<{ templateId: string; error: string }>;
  }> {
    const response = await api.post('/user-templates/import', {
      exportData,
      ...options,
    });
    return response.data;
  },
};
