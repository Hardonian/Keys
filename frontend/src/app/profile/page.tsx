'use client';

import { ProfileOnboarding } from '@/components/ProfileSettings/ProfileOnboarding';
import { useRouter } from 'next/navigation';
import { profileService } from '@/services/profileService';

// Force dynamic rendering since this page uses Supabase
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const router = useRouter();
  // TODO: Get userId from auth session
  const userId = 'demo-user'; // Replace with actual auth

  const handleComplete = async (profile: Partial<import('@/types').UserProfile>) => {
    try {
      await profileService.createProfile(profile);
      router.push('/chat');
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-6 sm:py-8">
      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8" role="main">
        <ProfileOnboarding userId={userId} onComplete={handleComplete} />
      </main>
    </div>
  );
}
