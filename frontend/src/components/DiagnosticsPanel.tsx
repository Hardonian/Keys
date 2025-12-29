'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface DiagnosticsPanelProps {
  className?: string;
}

export function DiagnosticsPanel({ className = '' }: DiagnosticsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, session } = useAuth();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set';

  // Only show in development or for admins
  const isDev = process.env.NODE_ENV === 'development';
  const isAdmin = user?.user_metadata?.role === 'admin';

  if (!isDev && !isAdmin) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 dark:bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors text-sm font-mono"
        aria-label="Toggle diagnostics panel"
      >
        {isOpen ? '▼' : '▲'} Diagnostics
      </button>
      
      {isOpen && (
        <div className="mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-4 max-w-md text-xs font-mono">
          <div className="space-y-2">
            <div>
              <span className="text-gray-500 dark:text-gray-400">User ID:</span>
              <div className="text-gray-900 dark:text-white break-all">{user?.id || 'Not authenticated'}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Email:</span>
              <div className="text-gray-900 dark:text-white">{user?.email || 'N/A'}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Session:</span>
              <div className="text-gray-900 dark:text-white">{session ? 'Active' : 'Inactive'}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">API Base URL:</span>
              <div className="text-gray-900 dark:text-white break-all">{apiBaseUrl}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Supabase URL:</span>
              <div className="text-gray-900 dark:text-white break-all">{supabaseUrl}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Environment:</span>
              <div className="text-gray-900 dark:text-white">{process.env.NODE_ENV}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Feature Flags:</span>
              <div className="text-gray-900 dark:text-white">None configured</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
