'use client';

import { motion } from 'framer-motion';

interface ValueReminderProps {
  keyTitle: string;
  lastUsed?: Date;
  version?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ValueReminder({ keyTitle: _keyTitle, lastUsed: _lastUsed, version }: ValueReminderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700"
    >
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
          <strong className="font-semibold">This still applies.</strong> This Key remains available in your Keyring 
          and continues to provide value whenever you need these patterns.
        </p>
        {version && (
          <p className="text-xs text-green-700 dark:text-green-300 mt-2">
            Current version: {version}
          </p>
        )}
      </div>
    </motion.div>
  );
}
