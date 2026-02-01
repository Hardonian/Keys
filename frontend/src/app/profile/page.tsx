'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProfileOnboarding } from '@/components/ProfileSettings/ProfileOnboarding';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/contexts/AuthContext';

// Force dynamic rendering since this page uses Supabase auth
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;

  // Redirect to signin if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin?returnUrl=/profile');
    }
  }, [user, authLoading, router]);

  const handleComplete = async (profile: Partial<import('@/types').UserProfile>) => {
    if (!userId) return;
    try {
      await profileService.createProfile(profile);
      router.push('/chat');
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  if (authLoading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
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
