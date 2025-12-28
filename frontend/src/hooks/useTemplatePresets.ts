/**
 * Template Presets Hooks
 */

import { useState, useCallback } from 'react';

export interface Preset {
  id: string;
  name: string;
  description?: string;
  category: string;
  template_ids: string[];
  custom_variables: Record<string, any>;
  custom_instructions?: string;
  is_system_preset: boolean;
  created_by?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export function useTemplatePresets() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getPresets = useCallback(
    async (options: { category?: string; includeSystem?: boolean } = {}) => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (options.category) params.append('category', options.category);
        if (options.includeSystem !== undefined)
          params.append('includeSystem', String(options.includeSystem));

        const response = await fetch(`/api/user-templates/presets?${params}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to load presets');
        const data = await response.json();
        return data.presets || [];
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load presets');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createPreset = useCallback(
    async (preset: {
      name: string;
      description?: string;
      category: string;
      templateIds: string[];
      customVariables?: Record<string, any>;
      customInstructions?: string;
    }) => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/user-templates/presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preset),
        });
        if (!response.ok) throw new Error('Failed to create preset');
        const data = await response.json();
        return data.preset;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create preset');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const applyPreset = useCallback(async (presetId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/user-templates/presets/${presetId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to apply preset');
      const data = await response.json();
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to apply preset');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getPresets,
    createPreset,
    applyPreset,
  };
}
