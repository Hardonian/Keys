import Link from 'next/link';
import { Metadata } from 'next';
import { SocialProofWithRealMetrics } from '@/components/CRO/SocialProofWithRealMetrics';

export const metadata: Metadata = {
  title: 'Keys - Logic Injection for Operations',
  description: 'Eliminate data discrepancies by ensuring every team uses the exact same definitions, everywhere.',
  openGraph: {
    title: 'Keys - Logic Injection for Operations',
    description: 'The logic injection engine that eliminates data discrepancies.',
  },
};

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-slate-900">
      
      {/* Hero Section */}
      <div className="w-full max-w-4xl mx-auto py-16 sm:py-24 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
          Make conflicting numbers <br/>
          <span className="text-blue-600">disappear.</span>
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          The logic injection engine that ensures every team uses the exact same definitions, everywhere. No more manual reconciliation.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/templates"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[200px]"
          >
            Enter Library
          </Link>
          <Link
            href="/signin"
            className="px-8 py-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-lg font-semibold text-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-w-[200px]"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* The Problem / Solution Block */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
        <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 uppercase tracking-wide">The Pain</h3>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">The "Monday Morning Metrics Fight"</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The CRO shows Churn at 5%. The CFO says 8%. The meeting stops. You spend 6 hours digging through SQL queries and CSVs to find the difference.
          </p>
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg text-sm text-red-800 dark:text-red-200">
            ❌ Loss of credibility<br/>
            ❌ Manual stitching<br/>
            ❌ Coordination debt
          </div>
        </div>

        <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm">
          <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 uppercase tracking-wide">The Relief</h3>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Verified Logic Injection</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Define "Churn" once. Lock it. Analysts inject the verified logic directly into Metabase, Salesforce, or Excel with one command.
          </p>
          <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg text-sm text-green-800 dark:text-green-200">
            ✅ Single Source of Truth<br/>
            ✅ Zero Reconciliation<br/>
            ✅ Total Governance
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="w-full max-w-6xl mx-auto mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">How it works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">1. Define</h3>
            <p className="text-gray-600 dark:text-gray-400">Create verified Keys for your core metrics (SQL, Python, Excel formulas).</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">💉</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">2. Inject</h3>
            <p className="text-gray-600 dark:text-gray-400">Team members type <code>/keys churn</code> to inject the verified logic into any tool.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">3. Govern</h3>
            <p className="text-gray-600 dark:text-gray-400">Track who used which version of which Key, and when. Full audit trail.</p>
          </div>
        </div>
      </div>

      <SocialProofWithRealMetrics />

      {/* Footer / Quick Links */}
      <nav className="mt-24 pt-8 border-t border-gray-200 dark:border-slate-800 w-full max-w-4xl flex justify-center gap-8 text-sm text-gray-500">
        <Link href="/templates" className="hover:text-gray-900 dark:hover:text-gray-300">Library</Link>
        <Link href="/signin" className="hover:text-gray-900 dark:hover:text-gray-300">Sign In</Link>
        <Link href="/docs/TERMS_OF_SERVICE.md" className="hover:text-gray-900 dark:hover:text-gray-300">Terms</Link>
      </nav>

    </main>
  );
}
