'use client';

import React from 'react';
import { VibeTuner } from '@/components/ProfileSettings/VibeTuner';
import { VibePresets } from '@/components/ProfileSettings/VibePresets';
import { useVibeConfig } from '@/hooks/useVibeConfig';
import { useUserProfile } from '@/hooks/useUserProfile';

// Force dynamic rendering since this page uses Supabase
export const dynamic = 'force-dynamic';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center" role="status" aria-live="polite">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Profile Settings
          </h1>
        </header>

        <main id="main-content" className="space-y-6 sm:space-y-8" role="main">
          {/* Vibe Tuner */}
          <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-4 sm:p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Vibe Configuration</h2>
            <VibeTuner
              playfulness={vibeConfig?.playfulness || 50}
              revenueFocus={vibeConfig?.revenue_focus || 60}
              investorPerspective={vibeConfig?.investor_perspective || 40}
              onChange={handleVibeChange}
            />
          </section>

          {/* Vibe Presets */}
          <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-4 sm:p-6 border border-gray-200 dark:border-slate-700">
            <VibePresets
              userId={userId}
              currentVibe={{
                playfulness: vibeConfig?.playfulness || 50,
                revenue_focus: vibeConfig?.revenue_focus || 60,
                investor_perspective: vibeConfig?.investor_perspective || 40,
              }}
              onLoadPreset={handleLoadPreset}
            />
          </section>

          {/* Profile Info */}
          {profile && (
            <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-4 sm:p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Profile Information</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Role</dt>
                  <dd className="font-medium capitalize text-gray-900 dark:text-gray-100 mt-1">{profile.role || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Vertical</dt>
                  <dd className="font-medium capitalize text-gray-900 dark:text-gray-100 mt-1">{profile.vertical || 'Not set'}</dd>
                </div>
                {profile.brand_voice && (
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Brand Voice</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100 mt-1">{profile.brand_voice}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
