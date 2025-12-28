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
    <div className="templates-layout">
      <nav className="templates-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? 'active' : ''}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="templates-content">
        {children}
      </main>
    </div>
  );
}
