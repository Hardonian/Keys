'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

interface SituationTile {
  id: string;
  situation: string;
  description: string;
  icon: string;
  route: string;
  filters?: Record<string, string>;
}

const situations: SituationTile[] = [
  {
    id: 'responsible-breaking',
    situation: "I'm responsible for something breaking",
    description: 'Find Keys that help you respond calmly and systematically when things go wrong.',
    icon: '🛡️',
    route: '/marketplace',
    filters: { situation: 'incident-response', category: 'runbook' },
  },
  {
    id: 'ship-faster',
    situation: 'I want to ship faster without messing things up',
    description: 'Discover Keys that help you move quickly while maintaining quality and avoiding common pitfalls.',
    icon: '⚡',
    route: '/marketplace',
    filters: { situation: 'shipping', category: 'workflow' },
  },
  {
    id: 'inherited-system',
    situation: "I inherited a system I don&apos;t fully trust",
    description: 'Get Keys that help you understand, document, and safely modify systems you didn&apos;t build.',
    icon: '🔍',
    route: '/marketplace',
    filters: { situation: 'understanding', category: 'documentation' },
  },
  {
    id: 'only-understander',
    situation: "I don&apos;t want to be the only one who understands this",
    description: 'Find Keys that help you share knowledge and reduce single points of failure.',
    icon: '👥',
    route: '/marketplace',
    filters: { situation: 'knowledge-sharing', category: 'documentation' },
  },
];

export function SituationEntryTiles() {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <section className="max-w-5xl mx-auto mb-12 sm:mb-16" aria-labelledby="situation-heading">
      <h2 id="situation-heading" className="sr-only">
        Choose your situation
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {situations.map((situation, index) => {
          const href = `${situation.route}?${new URLSearchParams(situation.filters).toString()}`;
          
          return (
            <motion.div
              key={situation.id}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { delay: index * 0.1, duration: 0.4 }}
            >
              <Link
                href={href}
                className="group block p-6 sm:p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl sm:text-5xl flex-shrink-0" aria-hidden="true">
                    {situation.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {situation.situation}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                      {situation.description}
                    </p>
                    <div className="mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Explore Keys →
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
