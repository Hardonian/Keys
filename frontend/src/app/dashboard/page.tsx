'use client';

import React from 'react';
import { RunAnalytics } from '@/components/Admin/RunAnalytics';
import { ActionHistory } from '@/components/BackgroundAgent/ActionHistory';
import { ProactiveSuggestions } from '@/components/BackgroundAgent/ProactiveSuggestions';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function DashboardPage() {
  // TODO: Get userId from auth session
  const userId = 'demo-user'; // Replace with actual auth
  const { profile, loading: profileLoading } = useUserProfile(userId);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back{profile?.name ? `, ${profile.name}` : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analytics */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Analytics</h2>
              <RunAnalytics />
            </div>

            {/* Action History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <ActionHistory userId={userId} limit={10} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Proactive Suggestions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Suggestions</h2>
              <ProactiveSuggestions userId={userId} />
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
              <div className="space-y-4">
                {profile && (
                  <>
                    <div>
                      <div className="text-sm text-gray-600">Role</div>
                      <div className="font-medium capitalize">{profile.role || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Vertical</div>
                      <div className="font-medium capitalize">{profile.vertical || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Stack</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Object.entries(profile.stack || {})
                          .filter(([, enabled]) => enabled)
                          .map(([key]) => (
                            <span
                              key={key}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {key}
                            </span>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
