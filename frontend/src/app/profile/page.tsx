'use client';

import { ProfileOnboarding } from '@/components/ProfileSettings/ProfileOnboarding';
import { useRouter } from 'next/navigation';
import { profileService } from '@/services/profileService';

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
    <div className="min-h-screen bg-gray-50 py-8">
      <ProfileOnboarding userId={userId} onComplete={handleComplete} />
    </div>
  );
}
