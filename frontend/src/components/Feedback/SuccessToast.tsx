/**
 * SuccessToast
 * 
 * Success notification with auto-dismiss.
 * Used for positive feedback after successful operations.
 */

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeVariants } from '@/systems/motion';

export interface SuccessToastProps {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
  duration?: number;
  className?: string;
}

export function SuccessToast({
  message,
  isVisible,
  onDismiss,
  duration = 5000,
  className = '',
}: SuccessToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`fixed bottom-4 right-4 z-50 max-w-sm ${className}`}
          role="status"
          aria-live="polite"
        >
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-4 flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {message}
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
              aria-label="Dismiss notification"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
