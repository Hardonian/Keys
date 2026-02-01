'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Github, Map, Code2, Users, CheckCircle } from 'lucide-react';

interface HeroSectionProps {
  className?: string;
}

// Check if visuals are disabled via env (for rollback)
const visualsDisabled = process.env.NEXT_PUBLIC_DISABLE_VISUALS === '1';

export function HeroSection({ className = '' }: HeroSectionProps) {
  return (
    <section className={`relative pt-20 pb-16 overflow-hidden ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 text-xs font-semibold uppercase tracking-wide mb-6 border border-blue-200 dark:border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            Open Source First
          </div>
          
          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white">
            Transparency is our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              key feature.
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            KEYS is built in public. We believe that critical developer tools should be open, 
            auditable, and community-driven. You own your keys; we just help you turn them.
          </p>
          
          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/anomalyco/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl dark:shadow-white/5"
            >
              <Github className="w-5 h-5" aria-hidden="true" />
              View on GitHub
            </a>
            <Link
              href="/roadmap"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
            >
              <Map className="w-5 h-5" aria-hidden="true" />
              See Roadmap
            </Link>
          </div>
        </div>

        {/* Hero Visual - Network illustration */}
        {!visualsDisabled && (
          <div className="relative w-full max-w-4xl mx-auto mb-16">
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-blue-950/20 dark:via-slate-900 dark:to-purple-950/20 border border-gray-200 dark:border-white/10 shadow-lg">
              <Image
                src="/assets/visuals/hero-visual.webp"
                alt="Abstract illustration of interconnected knowledge nodes representing the Keys library"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
                className="object-contain p-4"
                style={{ 
                  filter: 'drop-shadow(0 4px 20px rgba(37, 99, 235, 0.15))' 
                }}
              />
            </div>
            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl -z-10" />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 border-y border-gray-200 dark:border-white/10 py-10 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-xl md:rounded-none">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">12k+</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">GitHub Stars</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">450+</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Contributors</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">2.5M+</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Docker Pulls</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">99.9%</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Uptime (Managed)</div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8" id="roadmap">
          {/* Contribute Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:border-white/20 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Code2 className="w-32 h-32 text-orange-500 -mr-4 -mt-4 transform rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6 border border-orange-200 dark:border-orange-500/20">
                <Code2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Contribute to Core</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Help us build the standard for tool orchestration. We have issues tagged for 
                beginners and detailed contribution guidelines.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                  Detailed setup documentation
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                  Weekly office hours for contributors
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                  Swag for first-time mergers
                </li>
              </ul>
            </div>
          </div>

          {/* Community Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:border-white/20 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-32 h-32 text-blue-500 -mr-4 -mt-4 transform rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 border border-blue-200 dark:border-blue-500/20">
                <Users className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Join the Community</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect with thousands of developers using KEYS. Share workflows, ask questions, 
                and get help from the core team.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                  Active Discord community
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                  Monthly community calls
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                  Regional meetups
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
