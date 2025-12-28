import { useState } from 'react';
import { apiService } from '@/services/api';
import type { PromptAssembly, VibeConfig } from '@/types';
import type { InputFilter } from '@/types/filters';

export function usePromptAssembly() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [assembly, setAssembly] = useState<PromptAssembly | null>(null);

  const assemblePrompt = async (
    userId: string,
    taskDescription: string,
    vibeConfig: Partial<VibeConfig>,
    inputFilter?: InputFilter
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.assemblePrompt(userId, taskDescription, vibeConfig, inputFilter);
      setAssembly(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to assemble prompt');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    assemblePrompt,
    assembly,
    loading,
    error,
  };
}
