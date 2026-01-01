import Link from 'next/link';
import { Metadata } from 'next';
import { GuaranteeBadge } from '@/components/Features/GuaranteeBadge';
import { FeatureAvailabilityBadge } from '@/components/Features/FeatureAvailabilityBadge';

export const metadata: Metadata = {
  title: 'For Developers - AI Co-Founder with Code Integration | Keys',
  description: 'Keys integrates seamlessly with Cursor and VS Code. Get AI-powered code assistance, operational automation, and institutional memory for your development workflow.',
};

export default function ForDevelopersPage() {
  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            AI Co-Founder for Developers
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            Keys integrates seamlessly with Cursor and VS Code. Get AI-powered code assistance, operational automation, and institutional memory—all in your development workflow.
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

        {/* Integration Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="text-4xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Cursor Integration
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Keys works seamlessly with Cursor. Get context-aware automation that understands your codebase and operational needs.
            </p>
            <FeatureAvailabilityBadge status="available" />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="text-4xl mb-4">⚙️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              CI/CD Integration
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              GitHub Actions integration for automated code reviews, security checks, and deployment workflows.
            </p>
            <FeatureAvailabilityBadge status="available" />
          </div>
        </div>

        {/* Developer Features */}
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
            Features Built for Developers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700">
              <div className="text-3xl mb-3">💻</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Code Assistance
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get AI-powered code suggestions, reviews, and optimizations. Context-aware assistance that understands your stack.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Security Scanning
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatic security scanning of all code outputs. We guarantee security—we're liable if we miss vulnerabilities.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700">
              <div className="text-3xl mb-3">🧠</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Institutional Memory
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remember what didn't work. Your failures become prevention rules. Never repeat the same mistakes.
              </p>
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
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-8 sm:p-12 text-white text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Level Up Your Development?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of developers who trust Keys for AI-powered code assistance and operational automation.
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
