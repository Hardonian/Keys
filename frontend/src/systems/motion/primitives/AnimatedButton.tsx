/**
 * AnimatedButton
 * 
 * A button component with motion feedback that reflects state changes.
 * Motion is driven by props, not internal state.
 */

'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { motionTokens } from '../tokens';

export interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 focus:ring-slate-500',
      ghost: 'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
    
    const widthClass = fullWidth ? 'w-full' : '';
    
    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`.trim();

    return (
      <motion.button
        ref={ref}
        className={combinedClasses}
        disabled={isDisabled || isLoading}
        whileHover={!isDisabled && !isLoading ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled && !isLoading ? { scale: 0.98 } : undefined}
        transition={motionTokens.spring.snappy}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            />
            {children}
          </span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';
