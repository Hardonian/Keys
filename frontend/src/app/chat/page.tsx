'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatInterface } from '@/components/CompanionChat/ChatInterface';
import { useVibeConfig } from '@/hooks/useVibeConfig';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { toast } from '@/components/Toast';

// Force dynamic rendering since this page uses Supabase
export const dynamic = 'force-dynamic';

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;

  const { vibeConfig, loading } = useVibeConfig(userId || '');

  // Check for onboarding completion
  useEffect(() => {
    if (searchParams.get('onboarding') === 'complete') {
      toast.success('Welcome! Start chatting with your AI companion.');
      // Remove query param after showing message
      router.replace('/chat', { scroll: false });
    }
  }, [searchParams, router]);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin?returnUrl=/chat');
    }
  }, [user, authLoading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header 
        className="border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 sm:py-4 sticky top-0 z-10 shadow-sm"
        role="banner"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50">
                Cursor Venture Companion
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
                Your AI cofounder for the entire product lifecycle
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Navigation">
            <a
              href="/dashboard"
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/profile/settings"
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Settings
            </a>
            <ThemeSwitcher />
          </nav>
        </div>
      </header>
      <main id="main-content" className="flex-1 overflow-hidden min-h-0" role="main">
        {userId && (
          <ChatInterface
            userId={userId}
            initialVibeConfig={vibeConfig || undefined}
          />
        )}
      </main>
    </div>
  );
}

// Note: Metadata export doesn't work with 'use client', but we'll handle SEO via layout
export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
