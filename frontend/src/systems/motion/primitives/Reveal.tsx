/**
 * Reveal
 * 
 * Wrapper component for entrance animations.
 * Use this to animate elements as they enter the viewport or mount.
 */

'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { fadeVariants, slideVariants } from '../variants';

export interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  delay?: number;
  duration?: number;
}

export const Reveal = forwardRef<HTMLDivElement, RevealProps>(
  (
    {
      children,
      direction = 'fade',
      delay = 0,
      duration,
      className = '',
      ...props
    },
    ref
  ) => {
    const variants = direction === 'fade' 
      ? fadeVariants 
      : slideVariants[direction === 'up' ? 'up' : direction === 'down' ? 'down' : direction === 'left' ? 'left' : 'right'];
    
    const customTransition = delay > 0 || duration !== undefined
      ? {
          delay: delay / 1000,
          duration: duration !== undefined ? duration / 1000 : undefined,
        }
      : undefined;

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={variants}
        initial="hidden"
        animate="visible"
        transition={customTransition}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Reveal.displayName = 'Reveal';
