/**
 * AnimatedCard
 * 
 * A card component with entrance animations and hover feedback.
 */

'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { motionTokens } from '../tokens';
import { scaleVariants } from '../variants';

export interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  hoverable?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      children,
      variant = 'default',
      hoverable = false,
      className = '',
      initial = 'hidden',
      animate = 'visible',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'rounded-lg transition-colors';
    
    const variantClasses = {
      default: 'bg-white dark:bg-slate-800',
      elevated: 'bg-white dark:bg-slate-800 shadow-lg',
      outlined: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    };
    
    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

    return (
      <motion.div
        ref={ref}
        className={combinedClasses}
        variants={scaleVariants}
        initial={initial}
        animate={animate}
        whileHover={hoverable ? { 
          y: -4,
          transition: motionTokens.spring.gentle,
        } : undefined}
        transition={motionTokens.spring.gentle}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';
