/**
 * ProgressIndicator
 * 
 * Displays step-based progress (e.g., "Step 2 of 5")
 * Used in multi-step flows like onboarding.
 */

'use client';

import { motion } from 'framer-motion';
import { motionTokens } from '@/systems/motion';

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  showLabels?: boolean;
  className?: string;
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
  showLabels = true,
  className = '',
}: ProgressIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabels && (
        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            duration: motionTokens.duration.normal / 1000,
            ease: motionTokens.easing.easeOut,
          }}
        />
      </div>
    </div>
  );
}
