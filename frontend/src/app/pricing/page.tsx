import Link from 'next/link';
import { Metadata } from 'next';
import { UpgradePrompt } from '@/components/Upsell/UpgradePrompt';

export const metadata: Metadata = {
  title: 'Pricing - Cursor Venture Companion',
  description: 'Choose the right plan for your needs. Free tier available, Pro for power users, Enterprise for teams.',
};

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out the platform',
      features: [
        '100 AI runs per month',
        '100K tokens per month',
        '10 custom templates',
        '5 exports per month',
        'Community support',
        'Basic analytics',
      ],
      cta: 'Get Started',
      ctaLink: '/signup',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      description: 'For power users and small teams',
      features: [
        '1,000 AI runs per month',
        '1M tokens per month',
        '100 custom templates',
        '50 exports per month',
        'Priority support',
        'Advanced analytics',
        'Template sharing',
        'Background suggestions',
      ],
      cta: 'Start Free Trial',
      ctaLink: '/signup?plan=pro',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For teams and organizations',
      features: [
        'Unlimited AI runs',
        'Unlimited tokens',
        'Unlimited templates',
        'Unlimited exports',
        'Multi-user organizations',
        'Dedicated support',
        'Custom integrations',
        'SLA guarantee',
        'SSO (coming soon)',
        'Audit logs (coming soon)',
      ],
      cta: 'Contact Sales',
      ctaLink: '/profile/settings?contact=sales',
      popular: false,
    },
  ];

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 sm:p-8 ${
                plan.popular
                  ? 'ring-2 ring-blue-500 scale-105 sm:scale-105'
                  : 'border border-gray-200 dark:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      /{plan.period}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaLink}
                className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Can I change plans later?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                What happens if I exceed my limits?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You'll receive a notification when you're approaching your limits. Once exceeded, you'll need to upgrade to continue using the feature.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, we offer a 14-day money-back guarantee for Pro plans. Enterprise plans are custom and refunds are handled on a case-by-case basis.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards via Stripe. Enterprise customers can arrange invoicing.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Still have questions?{' '}
            <Link href="/profile/settings" className="text-blue-600 dark:text-blue-400 hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
