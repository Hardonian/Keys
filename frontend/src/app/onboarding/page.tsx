'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileOnboarding } from '@/components/ProfileSettings/ProfileOnboarding';
import { profileService } from '@/services/profileService';
import { toast } from '@/components/Toast';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin?returnUrl=/onboarding');
    }
  }, [user, authLoading, router]);

  const handleComplete = async (profile: Partial<import('@/types').UserProfile>) => {
    if (!userId) return;
    try {
      await profileService.createProfile(profile);
      toast.success('Profile created successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile. Please try again.');
    }
  };

  if (authLoading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-6 sm:py-8">
      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8" role="main">
        <ProfileOnboarding userId={userId} onComplete={handleComplete} />
      </main>
    </div>
  );
}
