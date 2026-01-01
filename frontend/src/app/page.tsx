import Link from 'next/link';
import { Metadata } from 'next';
import { SocialProofWithRealMetrics } from '@/components/CRO/SocialProofWithRealMetrics';
import { UpgradePrompt } from '@/components/Upsell/UpgradePrompt';

export const metadata: Metadata = {
  title: 'Never Ship Insecure Code Again - Keys Security & Compliance',
  description: 'Your institutional memory prevents failures before they happen. Automatic security scanning, compliance checking, and failure pattern detection. We guarantee outputs meet security and compliance standards.',
  openGraph: {
    title: 'Never Ship Insecure Code Again - Keys Security & Compliance',
    description: 'Your institutional memory prevents failures before they happen. Automatic security scanning and compliance checking.',
  },
};

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="max-w-4xl w-full text-center space-y-6 sm:space-y-8">
        {/* Main Heading */}
        <div className="space-y-4 sm:space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            Never Ship Insecure Code Again
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed font-semibold">
            Your institutional memory prevents failures before they happen. Automatic security scanning, compliance checking, and failure pattern detection.
          </p>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            We guarantee outputs meet security and compliance standards. Your failures become prevention rules. Your successes become best practices.
          </p>
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

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700">
            <div className="text-3xl mb-3" aria-hidden="true">🛡️</div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Automatic Security Scanning</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Every output is scanned for SQL injection, XSS, secret exposure, and other vulnerabilities. We block dangerous outputs before you see them.
            </p>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700">
            <div className="text-3xl mb-3" aria-hidden="true">✅</div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Compliance Guarantees</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All outputs meet GDPR, SOC 2, and HIPAA standards. We're liable if we miss a compliance issue.
            </p>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700">
            <div className="text-3xl mb-3" aria-hidden="true">🧠</div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Institutional Memory</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your failures become prevention rules. Your successes become best practices. Never repeat mistakes.
            </p>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700">
            <div className="text-3xl mb-3" aria-hidden="true">🔗</div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">IDE & CI/CD Integration</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatic context injection in VS Code/Cursor. PR checks in GitHub Actions. Can't deploy without Keys.
            </p>
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
