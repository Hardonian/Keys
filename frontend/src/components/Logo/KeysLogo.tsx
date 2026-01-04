'use client';

import { motion } from 'framer-motion';

interface KeysLogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function KeysLogo({ size = 64, animated = true, className = '' }: KeysLogoProps) {
  const logoVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  const keyVariants = {
    initial: { rotate: -45, scale: 0 },
    animate: {
      rotate: 0,
      scale: 1,
      transition: {
        delay: 0.2,
        type: 'spring' as const,
        stiffness: 200,
        damping: 15,
      },
    },
  };

  const ringVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.4,
        type: 'spring' as const,
        stiffness: 150,
        damping: 12,
      },
    },
  };

  const LogoContent = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Ring */}
      <motion.circle
        cx="60"
        cy="60"
        r="55"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        variants={animated ? ringVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
        className="text-blue-600 dark:text-blue-400"
      />
      
      {/* Inner Ring */}
      <motion.circle
        cx="60"
        cy="60"
        r="40"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        variants={animated ? ringVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
        className="text-purple-600 dark:text-purple-400"
        style={{ opacity: 0.6 }}
      />
      
      {/* Key 1 - Top */}
      <motion.g
        variants={animated ? keyVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
      >
        <rect
          x="55"
          y="15"
          width="10"
          height="25"
          rx="2"
          fill="currentColor"
          className="text-yellow-400"
        />
        <circle cx="60" cy="25" r="4" fill="currentColor" className="text-yellow-400" />
      </motion.g>
      
      {/* Key 2 - Right */}
      <motion.g
        variants={animated ? keyVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
        style={{ transformOrigin: '60px 60px' }}
      >
        <rect
          x="80"
          y="55"
          width="25"
          height="10"
          rx="2"
          fill="currentColor"
          className="text-pink-400"
        />
        <circle cx="95" cy="60" r="4" fill="currentColor" className="text-pink-400" />
      </motion.g>
      
      {/* Key 3 - Bottom */}
      <motion.g
        variants={animated ? keyVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
        style={{ transformOrigin: '60px 60px' }}
      >
        <rect
          x="55"
          y="80"
          width="10"
          height="25"
          rx="2"
          fill="currentColor"
          className="text-purple-400"
        />
        <circle cx="60" cy="95" r="4" fill="currentColor" className="text-purple-400" />
      </motion.g>
      
      {/* Key 4 - Left */}
      <motion.g
        variants={animated ? keyVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
        style={{ transformOrigin: '60px 60px' }}
      >
        <rect
          x="15"
          y="55"
          width="25"
          height="10"
          rx="2"
          fill="currentColor"
          className="text-blue-400"
        />
        <circle cx="25" cy="60" r="4" fill="currentColor" className="text-blue-400" />
      </motion.g>
      
      {/* Center Circle */}
      <motion.circle
        cx="60"
        cy="60"
        r="12"
        fill="currentColor"
        variants={animated ? ringVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
        className="text-white dark:text-slate-900"
      />
    </svg>
  );

  if (animated) {
    return (
      <motion.div
        variants={logoVariants}
        initial="initial"
        animate="animate"
        className="inline-block"
      >
        <LogoContent />
      </motion.div>
    );
  }

  return <LogoContent />;
}
