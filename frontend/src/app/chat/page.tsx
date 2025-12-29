'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChatInterface } from '@/components/CompanionChat/ChatInterface';
import { useVibeConfig } from '@/hooks/useVibeConfig';
import { useAuth } from '@/contexts/AuthContext';

// Force dynamic rendering since this page uses Supabase
export const dynamic = 'force-dynamic';

// Note: Metadata export doesn't work with 'use client', but we'll handle SEO via layout
export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;

  const { vibeConfig, loading } = useVibeConfig(userId || '');

  // Redirect to signin if not authenticated
  React.useEffect(() => {
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
        className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10 shadow-sm"
        role="banner"
      >
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50">
          Cursor Venture Companion
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          Your AI cofounder for the entire product lifecycle
        </p>
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
