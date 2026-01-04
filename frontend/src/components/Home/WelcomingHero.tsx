'use client';

import { motion } from 'framer-motion';
import { KeysLogo } from '@/components/Logo';

export function WelcomingHero() {
  return (
    <section className="max-w-4xl mx-auto mb-8 sm:mb-12 text-center" aria-labelledby="hero-heading">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 sm:mb-8"
      >
        <KeysLogo size={80} animated={false} />
      </motion.div>

      <motion.h1
        id="hero-heading"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 leading-tight"
      >
        You're not behind.
        <br />
        <span className="text-blue-600 dark:text-blue-400">You already have the tools.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed"
      >
        KEYS helps you unlock practical capability from the tools you already use—without competing with them.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg max-w-xl mx-auto"
      >
        <p className="text-sm sm:text-base text-blue-900 dark:text-blue-100 leading-relaxed">
          <strong className="font-semibold">What KEYS is:</strong> Structured assets (notebooks, prompts, workflows) that unlock capability in Cursor, Jupyter, GitHub, Stripe, and more.
        </p>
        <p className="text-sm sm:text-base text-blue-800 dark:text-blue-200 mt-3 leading-relaxed">
          <strong className="font-semibold">What KEYS isn't:</strong> A framework, an AI autopilot, or an execution engine. KEYS is the keyring—you own the tools.
        </p>
      </motion.div>
    </section>
  );
}
