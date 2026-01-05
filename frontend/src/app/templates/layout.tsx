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
    { href: '/templates', label: 'Library' },
    { href: '/templates/analytics', label: 'Governance' },
  ];

  return (
    <div className="keys-layout min-h-screen bg-gray-50 dark:bg-slate-900">
      <nav 
        className="keys-nav bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm"
        role="navigation"
        aria-label="Keys navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900 dark:text-white">Keys</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === item.href 
                        ? 'border-blue-500 text-gray-900 dark:text-white' 
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    aria-current={pathname === item.href ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
               <div className="flex-shrink-0">
                  {/* Action buttons could go here */}
               </div>
            </div>
          </div>
        </div>
      </nav>
      <main id="main-content" className="keys-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        {children}
      </main>
    </div>
  );
}
