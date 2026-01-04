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
      {/* Keyring - Circular ring */}
      <motion.circle
        cx="60"
        cy="60"
        r="35"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        variants={animated ? ringVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
        className="text-blue-600 dark:text-blue-400"
      />
      
      {/* Keyring opening/gap */}
      <motion.path
        d="M 60 25 A 35 35 0 0 1 75 35"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        variants={animated ? ringVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
        className="text-blue-600 dark:text-blue-400"
        style={{ opacity: 0.3 }}
      />
      
      {/* Main Key - Large prominent key */}
      <motion.g
        variants={animated ? keyVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
      >
        {/* Key head (the part that goes on the keyring) */}
        <circle
          cx="60"
          cy="35"
          r="8"
          fill="currentColor"
          className="text-blue-600 dark:text-blue-400"
        />
        <circle
          cx="60"
          cy="35"
          r="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-white dark:text-slate-900"
        />
        
        {/* Key shaft */}
        <rect
          x="58"
          y="43"
          width="4"
          height="35"
          rx="2"
          fill="currentColor"
          className="text-blue-600 dark:text-blue-400"
        />
        
        {/* Key bit (the part that unlocks) */}
        <rect
          x="50"
          y="75"
          width="20"
          height="8"
          rx="2"
          fill="currentColor"
          className="text-blue-600 dark:text-blue-400"
        />
        {/* Key teeth */}
        <rect
          x="52"
          y="78"
          width="4"
          height="5"
          rx="1"
          fill="currentColor"
          className="text-white dark:text-slate-900"
        />
        <rect
          x="64"
          y="78"
          width="4"
          height="5"
          rx="1"
          fill="currentColor"
          className="text-white dark:text-slate-900"
        />
      </motion.g>
      
      {/* Secondary Key - Smaller key on keyring */}
      <motion.g
        variants={animated ? keyVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
        style={{ transformOrigin: '60px 60px', transform: 'rotate(120deg) translateY(-35px) rotate(-120deg)' }}
      >
        {/* Key head */}
        <circle
          cx="60"
          cy="25"
          r="5"
          fill="currentColor"
          className="text-purple-600 dark:text-purple-400"
        />
        <circle
          cx="60"
          cy="25"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-white dark:text-slate-900"
        />
        
        {/* Key shaft */}
        <rect
          x="59"
          y="30"
          width="2"
          height="20"
          rx="1"
          fill="currentColor"
          className="text-purple-600 dark:text-purple-400"
        />
        
        {/* Key bit */}
        <rect
          x="55"
          y="48"
          width="10"
          height="5"
          rx="1"
          fill="currentColor"
          className="text-purple-600 dark:text-purple-400"
        />
      </motion.g>
      
      {/* Third Key - Even smaller */}
      <motion.g
        variants={animated ? keyVariants : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
        style={{ transformOrigin: '60px 60px', transform: 'rotate(240deg) translateY(-35px) rotate(-240deg)' }}
      >
        {/* Key head */}
        <circle
          cx="60"
          cy="25"
          r="4"
          fill="currentColor"
          className="text-pink-600 dark:text-pink-400"
        />
        <circle
          cx="60"
          cy="25"
          r="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          className="text-white dark:text-slate-900"
        />
        
        {/* Key shaft */}
        <rect
          x="59.5"
          y="29"
          width="1"
          height="15"
          rx="0.5"
          fill="currentColor"
          className="text-pink-600 dark:text-pink-400"
        />
        
        {/* Key bit */}
        <rect
          x="57"
          y="42"
          width="6"
          height="4"
          rx="0.5"
          fill="currentColor"
          className="text-pink-600 dark:text-pink-400"
        />
      </motion.g>
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
