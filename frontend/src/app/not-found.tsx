'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';

export default function NotFound() {
  const router = useRouter();
  const quickLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/chat', label: 'Chat' },
    { href: '/templates', label: 'Templates' },
    { href: '/profile/settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      <div className="text-center max-w-lg w-full">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-6">
            <span className="text-6xl" aria-hidden="true">🔍</span>
          </div>
          <h1 className="text-7xl sm:text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="mb-8">
          <SearchBar
            placeholder="Search for pages..."
            className="max-w-md mx-auto"
            results={quickLinks.map((link, idx) => ({
              id: idx.toString(),
              title: link.label,
              url: link.href,
              type: 'page' as const,
            }))}
            onResultSelect={(result) => {
              router.push(result.url);
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-8">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl active:scale-95"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
