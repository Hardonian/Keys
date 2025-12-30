/**
 * Motion Tokens
 * 
 * Canonical timing, easing, and spring configurations for the motion system.
 * All animations should reference these tokens to ensure consistency.
 */

export const motionTokens = {
  /**
   * Duration tokens (in milliseconds)
   * Use these for CSS transitions and Framer Motion duration props
   */
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
    slowest: 1000,
  },

  /**
   * Easing functions
   * Use these for CSS transitions and Framer Motion ease props
   */
  easing: {
    // Standard easings
    linear: [0, 0, 1, 1] as const,
    easeIn: [0.4, 0, 1, 1] as const,
    easeOut: [0, 0, 0.2, 1] as const,
    easeInOut: [0.4, 0, 0.2, 1] as const,
    
    // Expressive easings
    easeOutCubic: [0.33, 1, 0.68, 1] as const,
    easeInOutCubic: [0.65, 0, 0.35, 1] as const,
    easeOutExpo: [0.19, 1, 0.22, 1] as const,
    easeInOutExpo: [0.87, 0, 0.13, 1] as const,
    
    // UI-specific easings
    enter: [0, 0, 0.2, 1] as const, // For entering elements
    exit: [0.4, 0, 1, 1] as const,  // For exiting elements
    attention: [0.34, 1.56, 0.64, 1] as const, // For attention-grabbing animations
  },

  /**
   * Spring configurations
   * Use these for Framer Motion spring animations
   */
  spring: {
    // Gentle spring for subtle animations
    gentle: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 25,
      mass: 1,
    },
    
    // Standard spring for most UI interactions
    standard: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
      mass: 1,
    },
    
    // Snappy spring for quick feedback
    snappy: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
      mass: 0.8,
    },
    
    // Bouncy spring for playful interactions (use sparingly)
    bouncy: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 20,
      mass: 1,
    },
  },

  /**
   * Stagger delays (in milliseconds)
   * Use these for staggered animations
   */
  stagger: {
    fast: 50,
    normal: 100,
    slow: 150,
  },
} as const;

/**
 * Reduced motion configuration
 * When prefers-reduced-motion is enabled, use these values
 */
export const reducedMotionTokens = {
  duration: {
    instant: 0,
    fast: 0,
    normal: 0,
    slow: 0,
    slower: 0,
    slowest: 0,
  },
  easing: motionTokens.easing.linear,
  spring: {
    type: 'tween' as const,
    duration: 0,
  },
  stagger: {
    fast: 0,
    normal: 0,
    slow: 0,
  },
} as const;

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get motion tokens respecting user preferences
 */
export function getMotionTokens() {
  if (prefersReducedMotion()) {
    return reducedMotionTokens;
  }
  return motionTokens;
}
