import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { VibeConfig } from '@/types';

export function useVibeConfig(userId: string | null) {
  const [vibeConfig, setVibeConfig] = useState<VibeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchVibeConfig() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('vibe_configs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          throw fetchError;
        }

        if (data) {
          setVibeConfig(data);
        } else {
          // Create default vibe config
          const defaultConfig: Partial<VibeConfig> = {
            user_id: userId || undefined,
            playfulness: 50,
            revenue_focus: 60,
            investor_perspective: 40,
            auto_suggest: true,
            approval_required: true,
            logging_level: 'standard',
          };

          const { data: newData, error: createError } = await supabase
            .from('vibe_configs')
            .insert(defaultConfig)
            .select()
            .single();

          if (createError) throw createError;
          if (newData) setVibeConfig(newData);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch vibe config'));
      } finally {
        setLoading(false);
      }
    }

    fetchVibeConfig();
  }, [userId]);

  const updateVibeConfig = async (updates: Partial<VibeConfig>) => {
    if (!userId || !vibeConfig) return;

    try {
      const { data, error: updateError } = await supabase
        .from('vibe_configs')
        .update(updates)
        .eq('id', vibeConfig.id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (data) {
        setVibeConfig(data);
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update vibe config'));
      throw err;
    }
  };

  return {
    vibeConfig,
    loading,
    error,
    updateVibeConfig,
  };
}
