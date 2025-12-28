/**
 * Template Hooks
 * 
 * React hooks for template management
 */

import { useState, useEffect, useCallback } from 'react';
import { templateService } from '@/services/templateService';
import type {
  Template,
  TemplatePreview,
  Customization,
  ValidationResult,
  TestResult,
  HistoryEntry,
  Analytics,
  SearchFilters,
} from '@/services/templateService';

export function useTemplates(filters: SearchFilters = {}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [JSON.stringify(filters)]);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await templateService.searchTemplates(filters);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load templates'));
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  return {
    templates,
    loading,
    error,
    refetch: loadTemplates,
  };
}

export function useTemplatePreview(templateId: string | null) {
  const [preview, setPreview] = useState<TemplatePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!templateId) {
      setLoading(false);
      return;
    }
    loadPreview();
  }, [templateId]);

  const loadPreview = useCallback(async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await templateService.getTemplatePreview(templateId);
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load template preview'));
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  return {
    preview,
    loading,
    error,
    refetch: loadPreview,
  };
}

export function useTemplateCustomization(templateId: string | null) {
  const [customization, setCustomization] = useState<Customization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveCustomization = useCallback(
    async (customVariables: Record<string, any>, customInstructions?: string) => {
      if (!templateId) return;

      try {
        setLoading(true);
        setError(null);
        const result = await templateService.saveCustomization(templateId, customVariables, customInstructions);
        setCustomization(result.customization);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to save customization');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [templateId]
  );

  const updateCustomization = useCallback(
    async (updates: {
      customVariables?: Record<string, any>;
      customInstructions?: string;
      enabled?: boolean;
    }) => {
      if (!templateId) return;

      try {
        setLoading(true);
        setError(null);
        const result = await templateService.updateCustomization(templateId, updates);
        setCustomization(result.customization);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update customization');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [templateId]
  );

  const deleteCustomization = useCallback(async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      setError(null);
      await templateService.deleteCustomization(templateId);
      setCustomization(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete customization');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  return {
    customization,
    loading,
    error,
    saveCustomization,
    updateCustomization,
    deleteCustomization,
  };
}

export function useTemplateValidation(templateId: string | null) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableVariables, setAvailableVariables] = useState<any[]>([]);

  useEffect(() => {
    if (templateId) {
      loadVariables();
    }
  }, [templateId]);

  const loadVariables = useCallback(async () => {
    if (!templateId) return;

    try {
      const variables = await templateService.getAvailableVariables(templateId);
      setAvailableVariables(variables);
    } catch (err) {
      console.error('Failed to load variables', err);
    }
  }, [templateId]);

  const validate = useCallback(
    async (customVariables: Record<string, any>, customInstructions?: string) => {
      if (!templateId) return null;

      try {
        setLoading(true);
        const result = await templateService.validateCustomization(templateId, customVariables, customInstructions);
        setValidation(result);
        return result;
      } catch (err) {
        console.error('Validation failed', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [templateId]
  );

  return {
    validation,
    loading,
    availableVariables,
    validate,
  };
}

export function useTemplateTesting(templateId: string | null) {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const test = useCallback(
    async (
      customVariables: Record<string, any>,
      customInstructions?: string,
      inputFilter?: any,
      taskDescription?: string
    ) => {
      if (!templateId) return;

      try {
        setLoading(true);
        setError(null);
        const result = await templateService.testTemplate(
          templateId,
          customVariables,
          customInstructions,
          inputFilter,
          taskDescription
        );
        setTestResult(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to test template');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [templateId]
  );

  return {
    testResult,
    loading,
    error,
    test,
  };
}

export function useTemplateHistory(templateId: string | null) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadHistory = useCallback(async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await templateService.getCustomizationHistory(templateId);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load history'));
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  const rollback = useCallback(
    async (historyId: string) => {
      if (!templateId) return;

      try {
        setLoading(true);
        setError(null);
        await templateService.rollbackToHistory(templateId, historyId);
        await loadHistory();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to rollback');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [templateId, loadHistory]
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    loading,
    error,
    rollback,
    refetch: loadHistory,
  };
}

export function useTemplateAnalytics(templateId: string | null) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await templateService.getTemplateAnalytics(templateId);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load analytics'));
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: loadAnalytics,
  };
}

export function useRecommendedTemplates(options: {
  limit?: number;
  basedOnUsage?: boolean;
  basedOnStack?: boolean;
} = {}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadRecommended();
  }, [JSON.stringify(options)]);

  const loadRecommended = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await templateService.getRecommendedTemplates(options);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load recommended templates'));
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  return {
    templates,
    loading,
    error,
    refetch: loadRecommended,
  };
}
