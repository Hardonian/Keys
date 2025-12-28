'use client';

import { ChatInterface } from '@/components/CompanionChat/ChatInterface';
import { useVibeConfig } from '@/hooks/useVibeConfig';

// Force dynamic rendering since this page uses Supabase
export const dynamic = 'force-dynamic';

// Note: Metadata export doesn't work with 'use client', but we'll handle SEO via layout
export default function ChatPage() {
  // TODO: Get userId from auth session
  const userId = 'demo-user'; // Replace with actual auth
  const { vibeConfig, loading } = useVibeConfig(userId);

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
        <ChatInterface
          userId={userId}
          initialVibeConfig={vibeConfig || undefined}
        />
      </main>
    </div>
  );
}
