'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface SituationKeyCardProps {
  id: string;
  slug: string;
  title: string;
  description?: string;
  whenYouNeedThis: string;
  whatThisPrevents: string;
  hasAccess: boolean;
  keyType: string;
  category?: string;
  index?: number;
}

export function SituationKeyCard({
  id: _id, // eslint-disable-line @typescript-eslint/no-unused-vars
  slug,
  title,
  description,
  whenYouNeedThis,
  whatThisPrevents,
  hasAccess,
  keyType,
  category,
  index = 0,
}: SituationKeyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link
        href={`/marketplace/${slug}`}
        className="group block border rounded-lg p-5 sm:p-6 hover:shadow-lg transition-all duration-200 dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
      >
        {/* Header with lock/key affordance */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
              {title}
            </h3>
            {category && (
              <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded mb-2">
                {category}
              </span>
            )}
          </div>
          <div className="ml-4 flex-shrink-0" aria-label={hasAccess ? 'Key unlocked' : 'Key locked'}>
            {hasAccess ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center"
              >
                <span className="text-xl sm:text-2xl" aria-hidden="true">🔑</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
              >
                <span className="text-xl sm:text-2xl" aria-hidden="true">🔒</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Situation context */}
        <div className="space-y-3 mb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              When you need this:
            </p>
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              {whenYouNeedThis}
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
              What this prevents:
            </p>
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
              {whatThisPrevents}
            </p>
          </div>
        </div>

        {/* Description if available */}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {keyType}
          </span>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
            {hasAccess ? 'View Key' : 'Add to Keyring'}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
