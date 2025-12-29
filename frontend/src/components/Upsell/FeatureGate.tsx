'use client';

import Link from 'next/link';

interface FeatureGateProps {
  featureName: string;
  isPremium?: boolean;
  children: React.ReactNode;
  upgradeMessage?: string;
  showUpgradeButton?: boolean;
}

export function FeatureGate({
  featureName,
  isPremium = false,
  children,
  upgradeMessage,
  showUpgradeButton = true,
}: FeatureGateProps) {

  if (!isPremium) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl">
          <div className="text-center p-6 max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Premium Feature</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {upgradeMessage || `${featureName} is available with a Premium subscription.`}
            </p>
            {showUpgradeButton && (
              <Link
                href="/profile/settings?upgrade=true"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
                onClick={() => {
                  // Track upgrade intent
                  if (typeof window !== 'undefined' && 'gtag' in window) {
                    const gtag = (window as { gtag?: (event: string, action: string, params: Record<string, unknown>) => void }).gtag;
                    if (gtag) {
                      gtag('event', 'upgrade_click', {
                        feature: featureName,
                        location: 'feature_gate',
                      });
                    }
                  }
                }}
              >
                <span>Upgrade to Premium</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
