/**
 * LoadingSpinner
 * 
 * Accessible loading spinner with motion.
 */

'use client';

import { motion } from 'framer-motion';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className = '', label = 'Loading...' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} role="status" aria-live="polite" aria-busy="true">
      <motion.div
        className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
        aria-hidden="true"
      />
      {label && (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 sr-only">
          {label}
        </p>
      )}
    </div>
  );
}
