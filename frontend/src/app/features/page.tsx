import Link from 'next/link';
import { Metadata } from 'next';
import { FeatureAvailabilityMatrix } from '@/components/Features/FeatureAvailabilityMatrix';

export const metadata: Metadata = {
  title: 'Features - Complete Feature List | Keys',
  description: 'See all Keys features, their availability status, and which plan includes them. From business automation to venture strategy tools.',
};

export default function FeaturesPage() {
  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Complete Feature List
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            See all Keys features, their availability status, and which plan includes them. We&apos;re constantly adding new features based on your feedback.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              ✓ Available
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              🚀 Coming Soon
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              🧪 Beta
            </span>
          </div>
        </div>

        {/* Feature Matrix */}
        <div className="mb-12">
          <FeatureAvailabilityMatrix />
        </div>

        {/* Coming Soon Timeline */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Coming Soon Timeline
          </h2>
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Q1 2024: Image Control & Design
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete visual asset management with DALL-E integration, brand consistency enforcement, and image optimization workflows.
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Q1 2024: Venture Strategy Tools
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Business plan generation, market analysis, financial modeling, and investor pitch deck creation.
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Q2 2024: Team Collaboration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shared templates, team dashboards, collaboration features, and multi-user organizations.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Start with our free tier to explore available features, then upgrade when you&apos;re ready for more.
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
      </div>
    </main>
  );
}
