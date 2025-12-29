'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4" aria-hidden="true">⚠️</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Application Error
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
