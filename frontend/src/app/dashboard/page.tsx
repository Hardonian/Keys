'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RunAnalytics } from '@/components/Admin/RunAnalytics';
import { ActionHistory } from '@/components/BackgroundAgent/ActionHistory';
import { ProactiveSuggestions } from '@/components/BackgroundAgent/ProactiveSuggestions';
import { UsageDashboard } from '@/components/UsageDashboard';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { PageWrapper } from '@/components/PageWrapper';
import { LoadingSpinner } from '@/components/Loading';
import { Reveal, AnimatedCard } from '@/systems/motion';

// Force dynamic rendering since this page uses Supabase
export const dynamic = 'force-dynamic';

// Note: Metadata export doesn't work with 'use client', but we'll handle SEO via layout
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;

  const { profile, loading: profileLoading } = useUserProfile(userId || '');

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin?returnUrl=/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || !userId) {
    return (
      <PageWrapper className="min-h-screen flex items-center justify-center">
        <LoadingSpinner label="Loading dashboard..." />
      </PageWrapper>
    );
  }

  if (profileLoading) {
    return (
      <PageWrapper className="min-h-screen flex items-center justify-center">
        <LoadingSpinner label="Loading dashboard..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="mt-2 text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Welcome back{profile?.name ? `, ${profile.name}` : ''}
          </p>
        </header>

        <main id="main-content" className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Analytics */}
          <section className="lg:col-span-2 space-y-4 sm:space-y-6" aria-label="Analytics and activity">
            <Reveal direction="left" delay={0}>
              <AnimatedCard variant="elevated" hoverable className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Analytics</h2>
                <RunAnalytics />
              </AnimatedCard>
            </Reveal>

            {/* Action History */}
            <Reveal direction="left" delay={100}>
              <AnimatedCard variant="elevated" hoverable className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Recent Activity</h2>
                <ActionHistory userId={userId} limit={10} />
              </AnimatedCard>
            </Reveal>
          </section>

          {/* Sidebar */}
          <aside className="space-y-4 sm:space-y-6" aria-label="Quick information">
            {/* Usage Dashboard */}
            <Reveal direction="right" delay={0}>
              <UsageDashboard />
            </Reveal>

            {/* Proactive Suggestions */}
            <Reveal direction="right" delay={100}>
              <AnimatedCard variant="elevated" hoverable className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Suggestions</h2>
                <ProactiveSuggestions userId={userId} />
              </AnimatedCard>
            </Reveal>

            {/* Quick Stats */}
            <Reveal direction="right" delay={200}>
              <AnimatedCard variant="elevated" hoverable className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Quick Stats</h2>
              <dl className="space-y-4">
                {profile && (
                  <>
                    <div>
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Role</dt>
                      <dd className="font-medium capitalize text-gray-900 dark:text-gray-100 mt-1">{profile.role || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Vertical</dt>
                      <dd className="font-medium capitalize text-gray-900 dark:text-gray-100 mt-1">{profile.vertical || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600 dark:text-gray-400 mb-2">Stack</dt>
                      <dd>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(profile.stack || {})
                            .filter(([, enabled]) => enabled)
                            .map(([key]) => (
                              <span
                                key={key}
                                className="px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-lg font-medium"
                              >
                                {key}
                              </span>
                            ))}
                        </div>
                      </dd>
                    </div>
                  </>
                )}
              </dl>
              </AnimatedCard>
            </Reveal>
          </aside>
        </main>
      </div>
    </PageWrapper>
  );
}
