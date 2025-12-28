/**
 * Template Export/Import Hooks
 */

import { useState, useCallback } from 'react';
import { templateService } from '@/services/templateService';

export function useTemplateExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportCustomizations = useCallback(
    async (format: 'json' | 'yaml' | 'csv' = 'json', templateIds?: string[]) => {
      try {
        setLoading(true);
        setError(null);
        const data = await templateService.exportCustomizations(format);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to export');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const importCustomizations = useCallback(
    async (
      exportData: any,
      options: { overwriteExisting?: boolean; skipErrors?: boolean } = {}
    ) => {
      try {
        setLoading(true);
        setError(null);
        const result = await templateService.importCustomizations(exportData, options);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to import');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const downloadExport = useCallback(
    async (format: 'json' | 'yaml' | 'csv' = 'json', templateIds?: string[]) => {
      try {
        const data = await exportCustomizations(format, templateIds);
        const blob =
          format === 'json'
            ? new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            : new Blob([data], { type: format === 'csv' ? 'text/csv' : 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template-customizations-${Date.now()}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        throw err;
      }
    },
    [exportCustomizations]
  );

  return {
    loading,
    error,
    exportCustomizations,
    importCustomizations,
    downloadExport,
  };
}
