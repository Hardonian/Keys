import Link from 'next/link';
import { Metadata } from 'next';
import { HeroSection } from '@/components/HeroSection';
import { FileText, BookOpen, ClipboardList } from 'lucide-react';

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
            Keys is open source with a transparent contribution and review process. See how licensing, governance,
            and community review work.
          </p>
          <Link href="/open-source" className="text-blue-700 dark:text-blue-200 font-semibold hover:underline">
            Read the open source model →
          </Link>
        </div>
        <div className="bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Enterprise is optional</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Teams can use the library directly or choose a managed distribution for procurement, access control,
            and support.
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
