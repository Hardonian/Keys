'use client';

import { useState } from 'react';
import Link from 'next/link';

interface UpgradePromptProps {
  variant?: 'banner' | 'modal' | 'inline';
  title?: string;
  description?: string;
  features?: string[];
  ctaText?: string;
  onDismiss?: () => void;
}

const defaultFeatures = [
  'Unlimited prompts & templates',
  'Advanced AI models (GPT-4, Claude Opus)',
  'Voice input & output',
  'Priority support',
  'Custom integrations',
  'Team collaboration',
];

export function UpgradePrompt({
  variant = 'banner',
  title = 'Unlock Premium Features',
  description = 'Get more power, flexibility, and support with Premium.',
  features = defaultFeatures,
  ctaText = 'Upgrade Now',
  onDismiss,
}: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed && variant === 'banner') return null;

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-4 sm:p-5 rounded-xl shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDMuMzE0LTIuNjg2IDYtNiA2cy02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNnoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold mb-1">{title}</h3>
            <p className="text-sm sm:text-base text-blue-50">{description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/profile/settings?upgrade=true"
              className="px-5 py-2.5 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all active:scale-95 shadow-md hover:shadow-lg whitespace-nowrap"
              onClick={() => {
                if (typeof window !== 'undefined' && 'gtag' in window) {
                  const gtag = (window as { gtag?: (event: string, action: string, params?: Record<string, unknown>) => void }).gtag;
                  if (gtag) {
                    gtag('event', 'upgrade_click', { location: 'banner' });
                  }
                }
              }}
            >
              {ctaText}
            </Link>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{description}</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {features.slice(0, 4).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/profile/settings?upgrade=true"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all active:scale-95 shadow-md hover:shadow-lg"
            >
              {ctaText}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
