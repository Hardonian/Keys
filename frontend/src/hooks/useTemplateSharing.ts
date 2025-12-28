/**
 * Template Sharing Hooks
 */

import { useState, useCallback } from 'react';
import { templateService } from '@/services/templateService';

export interface SharedTemplate {
  id: string;
  owner_id: string;
  template_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  shared_with_user_ids: string[];
  shared_with_team_ids: string[];
  custom_variables: Record<string, any>;
  custom_instructions?: string;
  usage_count: number;
  rating_average?: number;
  created_at: string;
  updated_at: string;
}

export function useTemplateSharing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const shareTemplate = useCallback(
    async (
      templateId: string,
      options: {
        name: string;
        description?: string;
        isPublic?: boolean;
        sharedWithUserIds?: string[];
        sharedWithTeamIds?: string[];
      }
    ) => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/user-templates/${templateId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options),
        });
        if (!response.ok) throw new Error('Failed to share template');
        const data = await response.json();
        return data.shared;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to share template');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getAvailableSharedTemplates = useCallback(
    async (filters: {
      templateId?: string;
      isPublic?: boolean;
      ownerId?: string;
    } = {}) => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (filters.templateId) params.append('templateId', filters.templateId);
        if (filters.isPublic !== undefined) params.append('isPublic', String(filters.isPublic));
        if (filters.ownerId) params.append('ownerId', filters.ownerId);

        const response = await fetch(`/api/user-templates/shared?${params}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to load shared templates');
        const data = await response.json();
        return data.shared || [];
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load shared templates');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const cloneSharedTemplate = useCallback(async (sharedId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/user-templates/shared/${sharedId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to clone template');
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to clone template');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    shareTemplate,
    getAvailableSharedTemplates,
    cloneSharedTemplate,
  };
}
