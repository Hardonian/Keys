'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { KeysLogo } from '@/components/Logo';
import { FeatureAvailabilityBadge } from '@/components/Features/FeatureAvailabilityBadge';

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 15,
        duration: 0.8,
      },
    },
  };

  const gradientVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1,
        ease: [0.4, 0, 1, 1] as const,
      },
    },
  };

  return (
    <div className="max-w-6xl w-full">
      {/* Hero Image/Visual Section */}
      <div className="relative mb-8 sm:mb-12 rounded-2xl overflow-hidden">
        {/* Gradient Background with Animated Elements */}
        <motion.div
          className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 sm:p-12 lg:p-16 rounded-2xl shadow-2xl"
          variants={gradientVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <motion.div
              className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.25, 0.1],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-300 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
          </div>

          {/* Content */}
          <motion.div
            className="relative z-10 text-center space-y-6 sm:space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Logo */}
            <motion.div
              variants={logoVariants}
              className="flex justify-center mb-4"
            >
              <div className="relative">
                <KeysLogo size={120} animated={true} />
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-full blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            </motion.div>

            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30"
            >
              <span className="text-white text-sm font-semibold">🔑 The Keyring to Modern Tools</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg"
            >
              You Already Have{' '}
              <motion.span
                className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent inline-block"
                animate={{
                  backgroundPosition: ['0%', '100%', '0%'],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  backgroundSize: '200%',
                }}
              >
                The Tools
              </motion.span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={itemVariants}
              className="text-xl sm:text-2xl md:text-3xl text-white/95 max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-md"
            >
              Here are{' '}
              <motion.span
                className="text-yellow-200 font-bold inline-block"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                the keys to unlock them
              </motion.span>
            </motion.p>

            {/* Value Proposition */}
            <motion.div
              variants={itemVariants}
              className="max-w-4xl mx-auto space-y-4"
            >
              <p className="text-lg sm:text-xl text-white/90 leading-relaxed">
                KEYS is a marketplace of structured assets (notebooks, prompts, workflows, playbooks)
                that unlock practical, repeatable capability from external tools—without competing with them.
              </p>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-6">
                <Link
                  href="/marketplace"
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 flex items-center gap-2 hover:bg-white/30 transition-all hover:scale-105"
                >
                  <span className="text-white text-sm font-medium">🔧 Cursor Keys</span>
                  <FeatureAvailabilityBadge status="available" className="!text-xs !px-1.5 !py-0.5" />
                </Link>
                <Link
                  href="/marketplace"
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 flex items-center gap-2 hover:bg-white/30 transition-all hover:scale-105"
                >
                  <span className="text-white text-sm font-medium">📊 Jupyter Keys</span>
                  <FeatureAvailabilityBadge status="available" className="!text-xs !px-1.5 !py-0.5" />
                </Link>
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 flex items-center gap-2">
                  <span className="text-white text-sm font-medium">⚙️ GitHub Keys</span>
                  <FeatureAvailabilityBadge status="coming-soon" className="!text-xs !px-1.5 !py-0.5" />
                </div>
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 flex items-center gap-2">
                  <span className="text-white text-sm font-medium">💳 Stripe Keys</span>
                  <FeatureAvailabilityBadge status="coming-soon" className="!text-xs !px-1.5 !py-0.5" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
