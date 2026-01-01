'use client';

import { FeatureAvailabilityBadge } from './FeatureAvailabilityBadge';

interface Feature {
  name: string;
  description: string;
  status: 'available' | 'coming-soon' | 'beta';
  tier?: 'free' | 'pro' | 'pro-plus' | 'enterprise';
}

const features: Feature[] = [
  {
    name: 'Business Operations Automation',
    description: 'Automate workflows, streamline processes, and handle routine operational tasks',
    status: 'available',
    tier: 'pro',
  },
  {
    name: 'Institutional Memory',
    description: 'Build knowledge that grows with you. Your failures become prevention rules',
    status: 'available',
    tier: 'pro',
  },
  {
    name: 'Image Control & Design',
    description: 'Complete visual asset management. Generate, control, and optimize images',
    status: 'coming-soon',
    tier: 'pro',
  },
  {
    name: 'Venture Strategy Tools',
    description: 'Business planning, market analysis, financial modeling, and investor pitch decks',
    status: 'coming-soon',
    tier: 'pro',
  },
  {
    name: 'Cursor Integration',
    description: 'Seamless integration with Cursor IDE for context-aware automation',
    status: 'available',
    tier: 'pro-plus',
  },
  {
    name: 'CI/CD Integration',
    description: 'GitHub Actions integration for automated code reviews and security checks',
    status: 'available',
    tier: 'pro-plus',
  },
  {
    name: 'Security Guarantee',
    description: 'We scan all outputs for vulnerabilities. We\'re liable if we miss something',
    status: 'available',
    tier: 'pro',
  },
  {
    name: 'Compliance Guarantee',
    description: 'All outputs meet GDPR/SOC 2 standards. We guarantee compliance',
    status: 'available',
    tier: 'pro',
  },
  {
    name: 'SLA Guarantee',
    description: '99.9% uptime or 10% refund. Enterprise-only guarantee',
    status: 'available',
    tier: 'enterprise',
  },
  {
    name: 'Team Collaboration',
    description: 'Shared templates, team dashboards, and collaboration features',
    status: 'coming-soon',
    tier: 'pro-plus',
  },
];

export function FeatureAvailabilityMatrix() {
  return (
    <div className="space-y-4">
      {features.map((feature, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {feature.name}
                </h3>
                <FeatureAvailabilityBadge status={feature.status} />
                {feature.tier && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {feature.tier === 'pro-plus' ? 'Pro+' : feature.tier === 'enterprise' ? 'Enterprise' : feature.tier === 'pro' ? 'Pro' : 'Free'}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
