import Link from 'next/link';
import { Metadata } from 'next';
import { HeroSection } from '@/components/HeroSection';
import { FileText, BookOpen, ClipboardList, Play, Network, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Keys - Open Source Knowledge & Artifact Library',
  description: 'Keys is an open source library of prompts, notebooks, and runbooks. Use it as a starting point and adapt each artifact to your context.',
  openGraph: {
    title: 'Keys - Open Source Knowledge & Artifact Library',
    description: 'A curated, open source library of prompts, notebooks, and runbooks for modern software and operations workflows.',
  },
};

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <HeroSection />

      {/* Control Plane Feature Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-10">
            <p className="text-sm uppercase tracking-[0.2em] text-purple-700 dark:text-purple-300">
              New: Control Plane
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Mission Control for AI Agents
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Deterministic, explainable, and safe multi-agent orchestration. See exactly what happens, why it happens, and what agents can (and cannot) touch.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 mb-10">
            <Link href="/demo" className="group">
              <div className="h-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-purple-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Run a Live Demo
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  See agents in action with zero setup. Watch real-time execution, policy enforcement, and evidence generation.
                </p>
                <span className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                  Try it now <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </div>
            </Link>

            <Link href="/brain" className="group">
              <div className="h-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Network className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Explore System Brain
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Visualize the entire agent ecosystem. Click any node to inspect code, prompts, policies, and decision logs.
                </p>
                <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                  View visualization <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </div>
            </Link>

            <div className="group">
              <div className="h-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Enterprise Safety
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Blast radius constraints, policy enforcement, and complete audit trails. Every action is explainable and reproducible.
                </p>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Built-in guardrails
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white">
            <div className="grid sm:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">What This System Refuses To Do</h3>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <span>No silent failures — every error is logged and explained</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <span>No unbounded operations — strict limits on everything</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <span>No black box decisions — full reasoning traces</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <span>No data exfiltration — your data stays local</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 font-mono text-sm">
                <div className="text-slate-500 mb-2">// Example: Blast Radius</div>
                <div className="text-green-400">canTouch:</div>
                <div className="text-slate-300 ml-4">- Database (Read-Only)</div>
                <div className="text-slate-300 ml-4">- Tables: users, projects</div>
                <div className="text-slate-300 ml-4">- Max 100 rows per query</div>
                <div className="text-red-400 mt-3">cannotTouch:</div>
                <div className="text-slate-300 ml-4">- Production writes</div>
                <div className="text-slate-300 ml-4">- User credentials</div>
                <div className="text-slate-300 ml-4">- External APIs</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Original content sections below hero */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
              Open Source Knowledge & Artifact Library
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100">
              Keys is a curated library of prompts, notebooks, and runbooks.
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Use Keys as a starting point. Every artifact is designed for adaptation, local judgment, and responsible use.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/library"
                className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Browse the library
              </Link>
              <Link
                href="/what-is-keys"
                className="px-6 py-3 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-200 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                How to use Keys
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-8 pb-6 sm:pb-10">
        <div className="max-w-7xl mx-auto grid gap-6 sm:gap-8 sm:grid-cols-2">
          <div className="bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">What Keys is</h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• A curated library of prompts, notebooks, and runbooks.</li>
              <li>• Clear starting points, not final answers.</li>
              <li>• Designed to be adapted to your tools and constraints.</li>
            </ul>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">What Keys is not</h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• Not a model or a decision engine.</li>
              <li>• Not a guarantee of outcomes.</li>
              <li>• Not a replacement for understanding.</li>
            </ul>
          </div>
        </div>
      </section>

<section className="w-full px-4 sm:px-6 lg:px-8 pb-10">
        <div className="max-w-7xl mx-auto grid gap-6 sm:grid-cols-3">
          {[
          {
            title: 'Prompts',
            body: 'Reusable prompt patterns with context and guardrails.',
            icon: FileText,
            iconBg: 'bg-blue-100 dark:bg-blue-500/10',
            iconColor: 'text-blue-600 dark:text-blue-400',
          },
          {
            title: 'Notebooks',
            body: 'Exploration and analysis templates you can fork.',
            icon: BookOpen,
            iconBg: 'bg-purple-100 dark:bg-purple-500/10',
            iconColor: 'text-purple-600 dark:text-purple-400',
          },
          {
            title: 'Runbooks',
            body: 'Operational playbooks for real-world workflows.',
            icon: ClipboardList,
            iconBg: 'bg-orange-100 dark:bg-orange-500/10',
            iconColor: 'text-orange-600 dark:text-orange-400',
          },
        ].map((item) => {
          const IconComponent = item.icon;
          return (
            <div key={item.title} className="bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
              <div className={`w-10 h-10 rounded-lg ${item.iconBg} ${item.iconColor} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <IconComponent className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.body}</p>
            </div>
          );
        })}
        </div>
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto grid gap-6 sm:grid-cols-2">
        <div className="bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Open source by default</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Keys is open source under the MIT license. All artifacts are reviewed through a governance process before publication. 
            Your organization retains full ownership of any adapted versions.
          </p>
          <Link href="/open-source" className="text-blue-700 dark:text-blue-200 font-semibold hover:underline">
            Review the open source model →
          </Link>
        </div>
        <div className="bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Enterprise is optional</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Teams can use the library directly or choose a managed distribution for centralized access, 
            access controls, and support. No lock-in—artifacts remain portable.
          </p>
         <Link href="/enterprise" className="text-blue-700 dark:text-blue-200 font-semibold hover:underline">
            Explore managed distribution →
          </Link>
        </div>
        </div>
      </section>

      <nav className="pb-12" aria-label="Primary navigation">
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { href: '/what-is-keys', label: 'What is Keys' },
            { href: '/library', label: 'Library' },
            { href: '/docs', label: 'Docs' },
            { href: '/governance', label: 'Governance' },
            { href: '/about', label: 'About' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
