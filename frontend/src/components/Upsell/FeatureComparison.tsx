'use client';

interface Feature {
  name: string;
  free: boolean | string;
  premium: boolean | string;
  highlight?: boolean;
}

interface FeatureComparisonProps {
  features?: Feature[];
  showUpgradeButton?: boolean;
}

const defaultFeatures: Feature[] = [
  { name: 'Basic AI Models', free: true, premium: true },
  { name: 'Advanced Models (GPT-4, Claude Opus)', free: false, premium: true, highlight: true },
  { name: 'Prompt Templates', free: '10', premium: 'Unlimited', highlight: true },
  { name: 'Voice Input/Output', free: false, premium: true, highlight: true },
  { name: 'Custom Integrations', free: false, premium: true },
  { name: 'Team Collaboration', free: false, premium: true, highlight: true },
  { name: 'Priority Support', free: false, premium: true },
  { name: 'Usage Analytics', free: 'Basic', premium: 'Advanced' },
  { name: 'Export Options', free: 'Limited', premium: 'All Formats' },
];

export function FeatureComparison({ features = defaultFeatures, showUpgradeButton = true }: FeatureComparisonProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Compare Plans</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">See what&apos;s included in each plan</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Feature</th>
              <th className="text-center p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Free</th>
              <th className="text-center p-4 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                Premium
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, idx) => (
              <tr
                key={idx}
                className={`border-b border-slate-100 dark:border-slate-700/50 ${
                  feature.highlight ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                <td className="p-4 text-sm text-slate-900 dark:text-slate-50 font-medium">{feature.name}</td>
                <td className="p-4 text-center">
                  {typeof feature.free === 'boolean' ? (
                    feature.free ? (
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    <span className="text-sm text-slate-600 dark:text-slate-400">{feature.free}</span>
                  )}
                </td>
                <td className="p-4 text-center bg-blue-50/30 dark:bg-blue-900/5">
                  {typeof feature.premium === 'boolean' ? (
                    feature.premium ? (
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{feature.premium}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showUpgradeButton && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-t border-slate-200 dark:border-slate-700">
          <a
            href="/profile/settings?upgrade=true"
            className="block w-full text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            Upgrade to Premium
          </a>
        </div>
      )}
    </div>
  );
}
