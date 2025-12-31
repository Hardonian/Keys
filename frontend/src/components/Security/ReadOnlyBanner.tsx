'use client';

export function ReadOnlyBanner() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2.5" role="banner" aria-label="Security notice">
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-blue-800 dark:text-blue-200 font-medium">
          🔒 Read-only mode:
        </span>
        <span className="text-blue-700 dark:text-blue-300">
          This tool never writes to your codebase, repositories, or files. Safe to use in production environments.
        </span>
      </div>
    </div>
  );
}
