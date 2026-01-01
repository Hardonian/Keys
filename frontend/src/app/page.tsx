import Link from 'next/link';
import { Metadata } from 'next';
import { SocialProofWithRealMetrics } from '@/components/CRO/SocialProofWithRealMetrics';
import { UpgradePrompt } from '@/components/Upsell/UpgradePrompt';
import { FeatureAvailabilityBadge } from '@/components/Features/FeatureAvailabilityBadge';

export const metadata: Metadata = {
  title: 'Keys - Holistic AI for Everything | Your Business Co-Founder & Venture Partner',
  description: 'Holistic AI that supports every step of the way. Business operations, image control, new ventures, and co-founder support—all in one comprehensive platform. While others stop at code, we support your entire business journey.',
  openGraph: {
    title: 'Keys - Holistic AI for Everything | Your Business Co-Founder',
    description: 'Your operational AI co-founder for business automation, image control, operations management, and venture strategy. Support every step of the way.',
  },
};

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section with Visual Impact */}
      <div className="max-w-6xl w-full">
        {/* Hero Image/Visual Section */}
        <div className="relative mb-8 sm:mb-12 rounded-2xl overflow-hidden">
          {/* Gradient Background with Animated Elements */}
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 sm:p-12 lg:p-16 rounded-2xl shadow-2xl">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-300 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 text-center space-y-6 sm:space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <span className="text-white text-sm font-semibold">🚀 Your Business Co-Founder & Venture Partner</span>
              </div>
              
              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
                Holistic AI for{' '}
                <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
                  Everything
                </span>
              </h1>
              
              {/* Subheading */}
              <p className="text-xl sm:text-2xl md:text-3xl text-white/95 max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-md">
                While others stop at code, we support{' '}
                <span className="text-yellow-200 font-bold">every step of the way</span>
              </p>
              
              {/* Value Proposition */}
              <div className="max-w-4xl mx-auto space-y-4">
                <p className="text-lg sm:text-xl text-white/90 leading-relaxed">
                  Your operational AI co-founder that handles business automation, process intelligence, 
                  image control, operations management, and venture strategy—all in one comprehensive platform.
                </p>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-6">
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 flex items-center gap-2">
                    <span className="text-white text-sm font-medium">🎯 Business Operations</span>
                    <FeatureAvailabilityBadge status="available" className="!text-xs !px-1.5 !py-0.5" />
                  </div>
                  <Link href="/image-control" className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 flex items-center gap-2 hover:bg-white/30 transition-colors">
                    <span className="text-white text-sm font-medium">🖼️ Image Control</span>
                    <FeatureAvailabilityBadge status="coming-soon" className="!text-xs !px-1.5 !py-0.5" />
                  </Link>
                  <Link href="/venture-strategy" className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 flex items-center gap-2 hover:bg-white/30 transition-colors">
                    <span className="text-white text-sm font-medium">🚀 New Ventures</span>
                    <FeatureAvailabilityBadge status="coming-soon" className="!text-xs !px-1.5 !py-0.5" />
                  </Link>
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 flex items-center gap-2">
                    <span className="text-white text-sm font-medium">💼 Co-Founder Support</span>
                    <FeatureAvailabilityBadge status="available" className="!text-xs !px-1.5 !py-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Message Section */}
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-8 sm:mb-12">
          <div className="p-6 sm:p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Support Every Step of the Way
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              From initial concept to scaling operations, Keys is your comprehensive AI partner. 
              We don't just automate—we understand your business, anticipate needs, and grow with you.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl mb-2">🎨</div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Creative & Design</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Image generation, visual assets, brand consistency</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl mb-2">⚙️</div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Operations & Process</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Workflow automation, process intelligence, efficiency</p>
              </div>
              <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                <div className="text-2xl mb-2">🚀</div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Strategy & Growth</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Venture planning, scaling strategies, business intelligence</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 max-w-2xl mx-auto">
            <p className="text-sm sm:text-base text-green-800 dark:text-green-200">
              <strong>Value:</strong> $29/month gets you a comprehensive AI co-founder for operational automation, 
              image control, and business strategy. <strong>No equity, just results.</strong>{' '}
              <Link href="/pricing#value-calculation" className="underline font-semibold hover:text-green-900 dark:hover:text-green-100">
                See pricing
              </Link>
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4">
          <Link
            href="/chat"
            className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 min-w-[200px] text-center"
            aria-label="Start chatting with your AI cofounder"
          >
            <span className="relative z-10">Start Chatting</span>
            <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" aria-hidden="true" />
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
            Comprehensive AI That Goes Beyond Code
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1">
              <div className="text-3xl mb-3" aria-hidden="true">🤖</div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Business Co-Founder</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your operational partner for new ventures. Strategic support, business automation, and co-founder-level intelligence—no equity required.
              </p>
            </div>
            <Link href="/image-control" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transform hover:-translate-y-1 relative block">
              <div className="absolute top-3 right-3">
                <FeatureAvailabilityBadge status="coming-soon" />
              </div>
              <div className="text-3xl mb-3" aria-hidden="true">🖼️</div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Image Control & Design</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete visual asset management. Generate, control, and optimize images for your brand. Beyond code—full creative control.
              </p>
            </Link>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-600 transform hover:-translate-y-1">
              <div className="text-3xl mb-3" aria-hidden="true">⚙️</div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Operations Management</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                End-to-end operational automation. Workflows, processes, and routine tasks handled intelligently. Support every step of the way.
              </p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 transform hover:-translate-y-1">
              <div className="text-3xl mb-3" aria-hidden="true">🧠</div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Institutional Memory</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Build knowledge that grows with you. Your processes, decisions, and patterns become reusable intelligence for smarter operations.
              </p>
            </div>
          </div>
          
          {/* Additional Holistic Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
            <Link href="/venture-strategy" className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl shadow-md border border-blue-200 dark:border-blue-800 relative block hover:shadow-lg transition-shadow">
              <div className="absolute top-3 right-3">
                <FeatureAvailabilityBadge status="coming-soon" />
              </div>
              <div className="text-2xl mb-2" aria-hidden="true">🚀</div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Venture Strategy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Strategic planning and growth intelligence for new ventures and scaling businesses.
              </p>
            </Link>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl shadow-md border border-purple-200 dark:border-purple-800">
              <div className="text-2xl mb-2" aria-hidden="true">🔗</div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Cursor Integration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seamlessly works with Cursor. Context-aware automation that understands your codebase and operational needs.
              </p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-6 rounded-xl shadow-md border border-pink-200 dark:border-pink-800">
              <div className="text-2xl mb-2" aria-hidden="true">💡</div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Holistic Intelligence</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI that understands your entire business—not just code, but operations, strategy, and growth.
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
