/**
 * ErrorToast
 * 
 * Error notification with retry option.
 * Used for error feedback that requires user attention.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { fadeVariants } from '@/systems/motion';
import { AnimatedButton } from '@/systems/motion';

export interface ErrorToastProps {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
}

export function ErrorToast({
  message,
  isVisible,
  onDismiss,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
  className = '',
}: ErrorToastProps) {
  const canRetry = onRetry && retryCount < maxRetries;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`fixed bottom-4 right-4 z-50 max-w-sm ${className}`}
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {message}
                </p>
              </div>
              <button
                onClick={onDismiss}
                className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                aria-label="Dismiss error"
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
            {canRetry && (
              <div className="flex gap-2 ml-8">
                <AnimatedButton
                  variant="danger"
                  size="sm"
                  onClick={onRetry}
                >
                  Retry ({maxRetries - retryCount} left)
                </AnimatedButton>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
