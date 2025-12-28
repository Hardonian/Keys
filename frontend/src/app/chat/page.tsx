'use client';

import { ChatInterface } from '@/components/CompanionChat/ChatInterface';
import { useVibeConfig } from '@/hooks/useVibeConfig';

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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50">
          System Prompts
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          Cursor business and development operations companion
        </p>
      </header>
      <div className="flex-1 overflow-hidden min-h-0">
        <ChatInterface
          userId={userId}
          initialVibeConfig={vibeConfig || undefined}
        />
      </div>
    </div>
  );
}
