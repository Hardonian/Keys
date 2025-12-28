/**
 * Templates Layout
 * 
 * Layout for template pages with navigation
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/templates', label: 'Browse' },
    { href: '/templates/shared', label: 'Shared' },
    { href: '/templates/presets', label: 'Presets' },
    { href: '/templates/analytics', label: 'Analytics' },
  ];

  return (
    <div className="templates-layout min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <nav 
        className="templates-nav bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 shadow-sm"
        role="navigation"
        aria-label="Templates navigation"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              pathname === item.href 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main id="main-content" className="templates-content" role="main">
        {children}
      </main>
    </div>
  );
}
