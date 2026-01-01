'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FeatureAvailabilityBadge } from '@/components/Features/FeatureAvailabilityBadge';

export default function VentureStrategyPage() {
  const [ventureType, setVentureType] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    // Placeholder for future implementation
    setTimeout(() => {
      setGenerating(false);
      alert('Venture Strategy Tools are coming soon! This will include business plan generation, market analysis, and investor pitch decks.');
    }, 1000);
  };

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Venture Strategy Tools
            </h1>
            <FeatureAvailabilityBadge status="coming-soon" />
          </div>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            Strategic planning and growth intelligence for new ventures and scaling businesses. Get help with business plans, market analysis, and investor pitch decks.
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🚀</div>
            <div>
              <h2 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Coming Soon in Q1 2024
              </h2>
              <p className="text-purple-800 dark:text-purple-200 mb-4">
                Venture Strategy Tools are currently in development. This feature will include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-purple-800 dark:text-purple-200">
                <li>Business plan generation</li>
                <li>Market analysis and competitive research</li>
                <li>Financial modeling assistance</li>
                <li>Investor pitch deck creation</li>
                <li>Go-to-market strategy planning</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Preview Interface */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Preview Interface
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Venture Type
              </label>
              <select
                value={ventureType}
                onChange={(e) => setVentureType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select venture type...</option>
                <option value="saas">SaaS Startup</option>
                <option value="ecommerce">E-commerce</option>
                <option value="marketplace">Marketplace</option>
                <option value="mobile">Mobile App</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || !ventureType}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {generating ? 'Generating...' : 'Generate Business Plan (Coming Soon)'}
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Business Planning
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate comprehensive business plans with market analysis, financial projections, and growth strategies.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Market Analysis
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get competitive analysis, market sizing, and growth opportunity identification for your venture.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700">
            <div className="text-3xl mb-3">💼</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Investor Pitch Decks
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create compelling investor pitch decks with data-driven insights and professional formatting.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Get Notified When Venture Strategy Tools Launch
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Sign up for Keys to be notified when Venture Strategy Tools become available. Start using other features today.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Sign Up for Updates
          </Link>
        </div>
      </div>
    </main>
  );
}
