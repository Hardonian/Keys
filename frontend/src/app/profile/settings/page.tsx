'use client';

import React from 'react';
import { VibeTuner } from '@/components/ProfileSettings/VibeTuner';
import { VibePresets } from '@/components/ProfileSettings/VibePresets';
import { useVibeConfig } from '@/hooks/useVibeConfig';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function ProfileSettingsPage() {
  // TODO: Get userId from auth session
  const userId = 'demo-user'; // Replace with actual auth
  const { vibeConfig, updateVibeConfig, loading } = useVibeConfig(userId);
  const { profile } = useUserProfile(userId);

  const handleVibeChange = async (vibe: {
    playfulness: number;
    revenueFocus: number;
    investorPerspective: number;
  }) => {
    await updateVibeConfig({
      playfulness: vibe.playfulness,
      revenue_focus: vibe.revenueFocus,
      investor_perspective: vibe.investorPerspective,
    });
  };

  const handleLoadPreset = async (preset: {
    playfulness: number;
    revenue_focus: number;
    investor_perspective: number;
  }) => {
    await updateVibeConfig({
      playfulness: preset.playfulness,
      revenue_focus: preset.revenue_focus,
      investor_perspective: preset.investor_perspective,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

        <div className="space-y-8">
          {/* Vibe Tuner */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Vibe Configuration</h2>
            <VibeTuner
              playfulness={vibeConfig?.playfulness || 50}
              revenueFocus={vibeConfig?.revenue_focus || 60}
              investorPerspective={vibeConfig?.investor_perspective || 40}
              onChange={handleVibeChange}
            />
          </div>

          {/* Vibe Presets */}
          <div className="bg-white rounded-lg shadow p-6">
            <VibePresets
              userId={userId}
              currentVibe={{
                playfulness: vibeConfig?.playfulness || 50,
                revenue_focus: vibeConfig?.revenue_focus || 60,
                investor_perspective: vibeConfig?.investor_perspective || 40,
              }}
              onLoadPreset={handleLoadPreset}
            />
          </div>

          {/* Profile Info */}
          {profile && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Role</div>
                  <div className="font-medium capitalize">{profile.role || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Vertical</div>
                  <div className="font-medium capitalize">{profile.vertical || 'Not set'}</div>
                </div>
                {profile.brand_voice && (
                  <div>
                    <div className="text-sm text-gray-600">Brand Voice</div>
                    <div className="font-medium">{profile.brand_voice}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
