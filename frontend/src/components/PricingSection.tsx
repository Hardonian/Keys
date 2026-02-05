'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Building2, Github, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';

const pricingPlans = {
  monthly: {
    community: { price: '$0', period: '/ forever' },
    managed: { price: '$29', period: '/ user / mo' },
  },
  yearly: {
    community: { price: '$0', period: '/ forever' },
    managed: { price: '$23', period: '/ user / mo' },
  },
};

const communityFeatures = [
  { icon: Check, text: 'Self-hostable', highlight: true },
  { icon: Check, text: 'Unlimited users & projects' },
  { icon: Check, text: 'All Core Integrations' },
  { icon: Check, text: 'Community Support' },
  { icon: Check, text: 'Standard Access Control' },
];

const managedFeatures = [
  { icon: Check, text: 'Everything in Community, plus:', isHeader: true },
  { icon: Check, text: 'Fully Managed Infrastructure' },
  { icon: Check, text: 'Advanced Audit Logs & Security' },
  { icon: Check, text: 'SSO & SAML Integration' },
  { icon: Check, text: 'Priority Email & Slack Support' },
];

const faqs = [
  {
    question: 'Can I self-host the Community Edition?',
    answer: 'Yes. The Community Edition is open source under the MIT license. You can deploy using our Docker image on infrastructure you control.',
  },
  {
    question: 'What happens if I migrate from Managed Cloud to self-hosted?',
    answer: 'Both versions use the same underlying artifacts. You can export your configuration and deploy a self-hosted instance using standard processes.',
  },
  {
    question: 'Do you offer discounts for organizations?',
    answer: 'We offer consideration for qualified organizations. Contact us to discuss specific requirements.',
  },
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const currentPricing = pricingPlans[billingCycle];

  return (
    <section className="py-24 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 relative">
      {/* Background grid pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Distribution options
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Use the open source edition directly, or choose managed cloud for infrastructure management and support. All options use the same artifacts.
          </p>
          
          {/* Billing Toggle */}
          <div className="mt-8 inline-flex bg-gray-200 dark:bg-slate-800 p-1 rounded-full relative border border-transparent dark:border-white/10">
            <motion.div
              className="absolute top-1 bottom-1 bg-white dark:bg-slate-600 rounded-full shadow-sm"
              initial={false}
              animate={{ 
                x: billingCycle === 'monthly' ? 0 : '100%',
                width: '50%'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`relative z-10 px-6 py-2 text-sm font-semibold rounded-full focus:outline-none transition-colors ${
                billingCycle === 'monthly' 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`relative z-10 px-6 py-2 text-sm font-medium rounded-full focus:outline-none transition-colors ${
                billingCycle === 'yearly' 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Yearly
              <span className="text-green-600 dark:text-green-400 text-xs ml-1">-20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Community Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-transparent hover:border-gray-200 dark:border-white/5 dark:hover:border-white/10 shadow-sm dark:shadow-none transition-all duration-300 flex flex-col relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 dark:bg-white/5 rounded-bl-full -mr-8 -mt-8 z-0" />
            <div className="relative z-10">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  Community (OSS)
                  <Github className="w-4 h-4 text-gray-500" />
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {currentPricing.community.price}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    {currentPricing.community.period}
                  </span>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm h-10">
                  For teams that want full control over their infrastructure and prefer self-hosted deployment.
                </p>
              </div>
              
              <div className="flex-grow space-y-2 mb-8">
                {communityFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {feature.highlight ? <strong>{feature.text}</strong> : feature.text}
                    </span>
                  </motion.div>
                ))}
              </div>
              
              <a
                href="https://github.com/anomalyco/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center py-3 px-6 rounded-xl border-2 border-gray-900 dark:border-white/20 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                Deploy Now
              </a>
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
                MIT Licensed. You own the data.
              </p>
            </div>
          </motion.div>

          {/* Managed Cloud Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20 transition-all duration-300 flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-lg z-20">
              MANAGED
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 z-0" />
            <div className="relative z-10">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  Managed Cloud
                  <Cloud className="w-4 h-4 text-blue-500" />
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">
                    Cloud
                  </span>
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {currentPricing.managed.price}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    {currentPricing.managed.period}
                  </span>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm h-10">
                  For teams that need managed infrastructure, access controls, and support for their deployment.
                </p>
              </div>
              
              <div className="flex-grow space-y-2 mb-8">
                {managedFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                      feature.isHeader 
                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/10' 
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <feature.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      feature.isHeader 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-blue-600 dark:text-blue-400'
                    }`} />
                    <span className={`text-sm ${
                      feature.isHeader 
                        ? 'text-gray-700 dark:text-gray-200 font-semibold' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {feature.text}
                    </span>
                  </motion.div>
                ))}
              </div>
              
              <Link
                href="/signup"
                className="w-full block text-center py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-slate-900 font-bold shadow-lg hover:shadow-blue-500/30 dark:shadow-blue-500/20 transition-all"
              >
                Start Evaluation
              </Link>
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
                Trial requires authentication. No credit card required.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mt-12 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">Enterprise requirements?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">For custom deployments, VPC options, and organizational access controls.</p>
          </div>
          </div>
          <Link
            href="/enterprise"
            className="whitespace-nowrap px-6 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            Contact Sales
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export function PricingFAQ() {
  return (
    <section className="py-20 bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-white/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border-b border-gray-200 dark:border-white/10 pb-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
