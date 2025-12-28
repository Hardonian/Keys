import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import type { PremiumFeatures } from '@/types/filters';

export function usePremiumFeatures(userId: string) {
  const [features, setFeatures] = useState<PremiumFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    async function fetchPremiumFeatures() {
      try {
        const data = await apiService.getPremiumFeatures();
        setFeatures(data.features);
        setIsPremium(data.features.voiceToText || data.features.advancedFilters);
      } catch {
        // Not premium or not authenticated
        setFeatures({
          voiceToText: false,
          increasedTokenLimit: 4000,
          advancedFilters: false,
          customPrompts: false,
        });
        setIsPremium(false);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchPremiumFeatures();
    }
  }, [userId]);

  return {
    features,
    isPremium,
    loading,
  };
}
