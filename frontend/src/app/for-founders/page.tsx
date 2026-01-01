import Link from 'next/link';
import { Metadata } from 'next';
import { GuaranteeBadge } from '@/components/Features/GuaranteeBadge';
import { FeatureAvailabilityBadge } from '@/components/Features/FeatureAvailabilityBadge';

export const metadata: Metadata = {
  title: 'For Founders - Your AI Co-Founder for New Ventures | Keys',
  description: 'Keys is your AI co-founder for new ventures. Get strategic support, business automation, and venture planning—all without giving up equity.',
};

export default function ForFoundersPage() {
  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Your AI Co-Founder for New Ventures
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            Building a new venture? Keys is your operational AI co-founder that handles business automation, strategic planning, and operational intelligence—all without giving up equity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Why Founders Choose Keys
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">💼</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Equity Required
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get co-founder-level support for $29/month. No equity, no dilution, just results.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Strategic Support
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get help with business planning, market analysis, and growth strategy. <FeatureAvailabilityBadge status="coming-soon" className="ml-2" />
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Operational Automation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automate workflows, streamline processes, and focus on building while Keys handles operations.
              </p>
            </div>
          </div>
        </div>

        {/* Features for Founders */}
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
            Features Built for Founders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Business Planning
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Generate business plans, market analysis, and financial models. Get strategic insights for your venture.
              </p>
              <FeatureAvailabilityBadge status="coming-soon" />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Investor Pitch Decks
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Create compelling investor pitch decks with data-driven insights and professional formatting.
              </p>
              <FeatureAvailabilityBadge status="coming-soon" />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Market Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Get competitive analysis, market sizing, and growth opportunity identification.
              </p>
              <FeatureAvailabilityBadge status="coming-soon" />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Operational Automation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Automate workflows, streamline processes, and build institutional memory that scales with your venture.
              </p>
              <FeatureAvailabilityBadge status="available" />
            </div>
          </div>
        </div>

        {/* Guarantees */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
            Guarantees You Can Trust
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GuaranteeBadge type="security" />
            <GuaranteeBadge type="compliance" />
            <GuaranteeBadge type="quality" />
            <GuaranteeBadge type="sla" />
          </div>
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Why Guarantees Matter:</strong> As a founder, you can't afford security incidents or compliance violations. We're liable if we miss something. One prevented incident saves $10K-$100K+.
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Start with our Pro plan at $29/month. Get co-founder-level support without giving up equity.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            View Pricing Plans
          </Link>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-8 sm:p-12 text-white text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Build Your Venture?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of founders who trust Keys as their AI co-founder. Start your free trial today.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </main>
  );
}
