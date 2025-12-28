import { useState, useEffect } from 'react';
import { profileService } from '@/services/profileService';
import type { UserProfile } from '@/types';

export function useUserProfile(userId: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        setLoading(true);
        if (!userId) {
          setLoading(false);
          return;
        }
        const data = await profileService.getProfile(userId);
        setProfile(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) return;

    try {
      const updated = await profileService.updateProfile(userId, updates);
      if (updated) {
        setProfile(updated);
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      throw err;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
  };
}
