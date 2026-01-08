/* Runtime UI banner (config-driven, safe defaults) */
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRuntimeUiConfig } from '@/runtime-ui-config/client';

function toneClasses(tone: 'info' | 'warning' | 'success' | 'danger') {
  switch (tone) {
    case 'success':
      return 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-900';
    case 'warning':
      return 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-900';
    case 'danger':
      return 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-100 dark:border-rose-900';
    case 'info':
    default:
      return 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-900';
  }
}

export function RuntimeUiBanner() {
  const { config } = useRuntimeUiConfig();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('runtime_ui_banner_dismissed') === '1';
    } catch {
      return false;
    }
  });

  const banner = config.banner;
  const isVisible = !!banner?.enabled && !!banner?.text && !(banner.dismissible && dismissed);

  const cls = useMemo(() => toneClasses(banner?.tone || 'info'), [banner?.tone]);

  if (!isVisible) return null;

  return (
    <div className={`border-b ${cls}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 flex items-start gap-3">
        <div className="text-sm leading-5 flex-1">
          {banner.href ? (
            <Link href={banner.href} className="underline underline-offset-4">
              {banner.text}
            </Link>
          ) : (
            <span>{banner.text}</span>
          )}
        </div>
        {banner.dismissible ? (
          <button
            type="button"
            className="text-xs px-2 py-1 rounded-md border border-current/20 hover:border-current/40"
            onClick={() => {
              try {
                sessionStorage.setItem('runtime_ui_banner_dismissed', '1');
              } catch {
                // ignore
              }
              setDismissed(true);
            }}
            aria-label="Dismiss announcement"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}

