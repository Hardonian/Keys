/**
 * Motion Variants
 * 
 * Reusable animation variants for common UI patterns.
 * These variants reflect state changes, never invent state.
 */

import { Variants } from 'framer-motion';
import { motionTokens, getMotionTokens } from './tokens';

/**
 * Fade variants (opacity transitions)
 */
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: motionTokens.duration.normal / 1000,
      ease: motionTokens.easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: motionTokens.duration.fast / 1000,
      ease: motionTokens.easing.easeIn,
    },
  },
};

/**
 * Slide variants (translateX/Y transitions)
 */
export const slideVariants = {
  // Horizontal slides
  left: {
    hidden: { x: -20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        duration: motionTokens.duration.normal / 1000,
        ease: motionTokens.easing.easeOut,
      },
    },
    exit: {
      x: -20,
      opacity: 0,
      transition: {
        duration: motionTokens.duration.fast / 1000,
        ease: motionTokens.easing.easeIn,
      },
    },
  },
  right: {
    hidden: { x: 20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        duration: motionTokens.duration.normal / 1000,
        ease: motionTokens.easing.easeOut,
      },
    },
    exit: {
      x: 20,
      opacity: 0,
      transition: {
        duration: motionTokens.duration.fast / 1000,
        ease: motionTokens.easing.easeIn,
      },
    },
  },
  // Vertical slides
  up: {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: motionTokens.duration.normal / 1000,
        ease: motionTokens.easing.easeOut,
      },
    },
    exit: {
      y: 20,
      opacity: 0,
      transition: {
        duration: motionTokens.duration.fast / 1000,
        ease: motionTokens.easing.easeIn,
      },
    },
  },
  down: {
    hidden: { y: -20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: motionTokens.duration.normal / 1000,
        ease: motionTokens.easing.easeOut,
      },
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: {
        duration: motionTokens.duration.fast / 1000,
        ease: motionTokens.easing.easeIn,
      },
    },
  },
} as const;

/**
 * Scale variants (zoom transitions)
 */
export const scaleVariants: Variants = {
  hidden: {
    scale: 0.95,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: motionTokens.duration.normal / 1000,
      ease: motionTokens.easing.easeOutCubic,
    },
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    transition: {
      duration: motionTokens.duration.fast / 1000,
      ease: motionTokens.easing.easeIn,
    },
  },
};

/**
 * Attention variants (for drawing focus)
 * Use sparingly - only when state change requires immediate attention
 */
export const attentionVariants: Variants = {
  idle: {
    scale: 1,
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: motionTokens.duration.slow / 1000,
      ease: motionTokens.easing.attention,
      repeat: 1,
    },
  },
  bounce: {
    scale: [1, 1.1, 1],
    transition: {
      duration: motionTokens.duration.normal / 1000,
      ease: motionTokens.easing.attention,
    },
  },
};

/**
 * Success variants (for positive feedback)
 */
export const successVariants: Variants = {
  idle: {
    scale: 1,
    opacity: 1,
  },
  celebrate: {
    scale: [1, 1.2, 1],
    opacity: [1, 1, 1],
    transition: {
      duration: motionTokens.duration.slow / 1000,
      ease: motionTokens.easing.easeOutExpo,
    },
  },
  checkmark: {
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      duration: motionTokens.duration.normal / 1000,
      ease: motionTokens.easing.easeOut,
    },
  },
};

/**
 * Page transition variants (for route changes)
 */
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.normal / 1000,
      ease: motionTokens.easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: motionTokens.duration.fast / 1000,
      ease: motionTokens.easing.easeIn,
    },
  },
};

/**
 * Stagger container variants
 * Use with staggerChildren for list animations
 */
export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: motionTokens.stagger.normal / 1000,
      delayChildren: 0.1,
    },
  },
};

/**
 * Get variants respecting reduced motion preferences
 */
export function getVariants<T extends Variants>(variants: T): T {
  const tokens = getMotionTokens();
  
  if (tokens === motionTokens) {
    return variants;
  }
  
  // Return instant/no-op variants for reduced motion
  const reduced: Variants = {};
  for (const [key, value] of Object.entries(variants)) {
    reduced[key] = {
      ...value,
      transition: {
        duration: 0,
      },
    };
  }
  return reduced as T;
}
