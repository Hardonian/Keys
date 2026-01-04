import Link from 'next/link';
import { Metadata } from 'next';
import { SocialProofWithRealMetrics } from '@/components/CRO/SocialProofWithRealMetrics';
import { UpgradePrompt } from '@/components/Upsell/UpgradePrompt';
import { FeatureAvailabilityBadge } from '@/components/Features/FeatureAvailabilityBadge';
import { KeysLogo } from '@/components/Logo';
import { HeroSection } from '@/components/Hero/HeroSection';

export const metadata: Metadata = {
  title: 'KEYS - The Keyring to Modern Tools',
  description: 'You already have the tools. Here are the keys to unlock them. KEYS is a marketplace of structured assets (notebooks, prompts, workflows) that unlock practical capability in Cursor, Jupyter, GitHub, Stripe, and more.',
  openGraph: {
    title: 'KEYS - The Keyring to Modern Tools',
    description: 'Unlock practical, repeatable capability from external tools. Cursor Keys, Jupyter Keys, GitHub Keys, and more.',
  },
};

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section with Visual Impact */}
      <HeroSection />

        {/* Supporting Message Section */}
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-8 sm:mb-12">
          <div className="p-6 sm:p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              The Toolshed Metaphor
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              Imagine a modern toolshed filled with powerful tools: Cursor, Jupyter, GitHub, Stripe, Supabase, and more. 
              Each tool provides raw capability—but capability alone isn't enough. You need to know how to use them effectively. 
              <strong> KEYS is the keyring.</strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl mb-2">🔧</div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Cursor Keys</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unlock advanced workflows, prompt patterns, and code generation strategies in Cursor</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Jupyter Keys</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unlock data science workflows, analysis patterns, and validation harnesses in Jupyter</p>
              </div>
              <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                <div className="text-2xl mb-2">⚙️</div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">GitHub Keys</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unlock workflow automation, CI/CD patterns, and repository structures in GitHub</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 max-w-2xl mx-auto">
            <p className="text-sm sm:text-base text-green-800 dark:text-green-200">
              <strong>Remember:</strong> KEYS is not an AI tool. KEYS is the keyring to modern tools. 
              You already own the tools—KEYS gives you the keys to unlock them.{' '}
              <Link href="/pricing" className="underline font-semibold hover:text-green-900 dark:hover:text-green-100">
                See pricing
              </Link>
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4">
          <Link
            href="/marketplace"
            className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 min-w-[200px] text-center"
            aria-label="Browse the keyring"
          >
            <span className="relative z-10">Browse Keys</span>
            <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" aria-hidden="true" />
          </Link>
          <Link
            href="/marketplace?demo=true"
            className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 min-w-[200px] text-center border-2 border-white/20"
            aria-label="Try demo preview"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span>✨</span>
              <span>Try Demo</span>
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" aria-hidden="true" />
          </Link>
          <Link
            href="/profile"
            className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-base sm:text-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-700 min-w-[200px] text-center"
            aria-label="Setup your profile to personalize your experience"
          >
            Setup Profile
          </Link>
        </div>

        {/* Feature Cards - Holistic AI Capabilities */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
            Keys That Unlock Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Link href="/marketplace" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1 relative block">
              <div className="text-3xl mb-3" aria-hidden="true">🔧</div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Cursor Keys</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unlock advanced workflows, prompt patterns, and code generation strategies in Cursor. Prompt packs and Composer instructions.
              </p>
            </Link>
            <Link href="/marketplace" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transform hover:-translate-y-1 relative block">
              <div className="text-3xl mb-3" aria-hidden="true">📊</div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Jupyter Keys</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unlock data science workflows, analysis patterns, and validation harnesses in Jupyter. Notebook packs and analysis templates.
              </p>
            </Link>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-600 transform hover:-translate-y-1">
              <div className="absolute top-3 right-3">
                <FeatureAvailabilityBadge status="coming-soon" />
              </div>
              <div className="text-3xl mb-3" aria-hidden="true">⚙️</div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">GitHub Keys</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unlock workflow automation, CI/CD patterns, and repository structures in GitHub. Workflow templates and starter repos.
              </p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 transform hover:-translate-y-1">
              <div className="absolute top-3 right-3">
                <FeatureAvailabilityBadge status="coming-soon" />
              </div>
              <div className="text-3xl mb-3" aria-hidden="true">💳</div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Stripe Keys</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unlock payment flows, subscription management, and billing patterns in Stripe. Payment workflows and subscription templates.
              </p>
            </div>
          </div>
          
          {/* Additional Key Types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl shadow-md border border-blue-200 dark:border-blue-800">
              <div className="text-2xl mb-2" aria-hidden="true">🔑</div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Tool-Agnostic</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Keys work with tools you already own. No lock-in, no platform requirements.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl shadow-md border border-purple-200 dark:border-purple-800">
              <div className="text-2xl mb-2" aria-hidden="true">📦</div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Reusable Assets</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Keys are structured, reusable, and updatable. Not one-off solutions—proven patterns.
              </p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-6 rounded-xl shadow-md border border-pink-200 dark:border-pink-800">
              <div className="text-2xl mb-2" aria-hidden="true">🎯</div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Outcome-Driven</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Every key unlocks a specific, practical outcome. No vague promises—tangible results.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <nav className="pt-8 sm:pt-12" aria-label="Quick navigation links">
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/profile/settings"
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
            >
              Settings
            </Link>
            <Link
              href="/templates"
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
            >
              Templates
            </Link>
            <Link
              href="/pricing"
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/compare"
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
            >
              Compare
            </Link>
            <Link
              href="/features"
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
            >
              Features
            </Link>
            <Link
              href="/docs/TERMS_OF_SERVICE.md"
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
            >
              Terms
            </Link>
          </div>
        </nav>
      </div>

      {/* Social Proof Section */}
      <SocialProofWithRealMetrics />

      {/* Upgrade Prompt */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <UpgradePrompt variant="inline" />
      </div>
    </main>
  );
}
