'use client';

import { motion } from 'framer-motion';

interface PreCheckoutSummaryProps {
  keyTitle: string;
  priceCents: number;
  whatUnlocks: string;
}

export function PreCheckoutSummary({ keyTitle, priceCents, whatUnlocks }: PreCheckoutSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-6"
    >
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
        What you're equipping yourself with
      </h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            This unlocks:
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
            {whatUnlocks}
          </p>
        </div>
        
        <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            What does NOT happen:
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>No code runs automatically</li>
            <li>No credentials are stored</li>
            <li>No changes to your existing tools</li>
            <li>No ongoing subscription required</li>
          </ul>
        </div>
        
        <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Ownership:</strong> Once added to your Keyring, this Key is yours permanently. 
            You can download it anytime, and updates are included.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
