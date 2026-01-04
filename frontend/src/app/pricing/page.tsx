import Link from 'next/link';
import { Metadata } from 'next';
import { GuaranteeBadge } from '@/components/Features/GuaranteeBadge';

export const metadata: Metadata = {
  title: 'Pricing - Keys: Your AI Co-Founder for Operational Automation',
  description: 'Choose the plan that fits your operational needs. Your AI co-founder for business automation, process intelligence, and institutional memory.',
};

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Try Keys risk-free. Build your institutional memory.',
      features: [
        '50 AI runs per month',
        '50K tokens per month',
        '5 custom templates',
        '2 exports per month',
        'Community support',
        'Basic analytics',
        '✅ Failure pattern tracking (unlimited)',
        '✅ Basic safety checks',
        '✅ Pattern matching (unlimited)',
      ],
      guarantees: [],
      cta: 'Get Started',
      ctaLink: '/signup',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      description: 'Your operational AI co-founder. Automate workflows and build institutional memory.',
      features: [
        '1,000 AI runs per month',
        '1M tokens per month',
        '100 custom templates',
        '50 exports per month',
        'Priority support',
        'Advanced analytics',
        'Template sharing',
        'Background suggestions',
        '✅ Unlimited operational automation',
        '✅ Unlimited institutional memory',
      ],
      guarantees: ['security', 'compliance', 'quality'],
      cta: 'Start Free Trial',
      ctaLink: '/signup?plan=pro',
      popular: true,
    },
    {
      name: 'Pro+',
      price: '$79',
      period: 'per month',
      description: 'Power users running daily operations. Full Cursor integration included.',
      features: [
        'Everything in Pro',
        '5,000 AI runs per month',
        '5M tokens per month',
        'Unlimited templates',
        'Unlimited exports',
        '✅ Cursor Integration (VS Code/Cursor)',
        '✅ CI/CD Integration (GitHub Actions)',
        '✅ Advanced operational intelligence',
        '✅ Cross-project learning',
      ],
      guarantees: ['security', 'compliance', 'quality'],
      cta: 'Upgrade to Pro+',
      ctaLink: '/signup?plan=pro-plus',
      popular: false,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Teams that need scale, SLAs, and dedicated support.',
      features: [
        'Everything in Pro+',
        'Unlimited AI runs',
        'Unlimited tokens',
        'Unlimited templates',
        'Unlimited exports',
        'Multi-user organizations',
        'Dedicated support',
        'Custom integrations',
        '✅ SLA Guarantee (99.9% uptime)',
        '✅ Advanced operational analytics',
        '✅ Custom workflow automation',
        '✅ Audit Logs',
        '✅ SSO (enterprise security)',
        '💰 Usage-based pricing available',
      ],
      guarantees: ['security', 'compliance', 'quality', 'sla'],
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
            Your AI Co-Founder for Operational Automation
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your operational needs. Your AI co-founder works alongside Cursor to automate business operations and build institutional memory.
          </p>
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 max-w-2xl mx-auto">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Value:</strong> $29/month gets you an AI co-founder for operational automation. <strong>No equity, just results.</strong> See{' '}
              <Link href="#value-calculation" className="underline font-semibold">
                value calculation
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12">
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

              <ul className="space-y-3 mb-6">
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

              {plan.guarantees && plan.guarantees.length > 0 && (
                <div className="mb-6 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Included Guarantees:
                  </h4>
                  {plan.guarantees.map((guarantee) => (
                    <GuaranteeBadge
                      key={guarantee}
                      type={guarantee as 'security' | 'compliance' | 'sla' | 'quality'}
                      className="!p-2"
                    />
                  ))}
                </div>
              )}

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
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we&apos;ll prorate any charges.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                What happens if I exceed my limits?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You&apos;ll receive a notification when you&apos;re approaching your limits. Once exceeded, you&apos;ll need to upgrade to continue using the feature.
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
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                What are your guarantees?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Pro and Pro+ plans include security, compliance, and quality guarantees. Enterprise plans add SLA guarantees. See our{' '}
                <Link href="/docs/TERMS_OF_SERVICE.md" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Terms of Service
                </Link>
                {' '}for details.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <GuaranteeBadge type="security" />
                <GuaranteeBadge type="compliance" />
                <GuaranteeBadge type="quality" />
                <GuaranteeBadge type="sla" />
              </div>
            </div>
            <div id="value-calculation" className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                What value does Keys provide?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                $29/month gets you an AI co-founder for operational automation:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                <li>Operational automation: Automate workflows and routine tasks</li>
                <li>Institutional memory: Build knowledge that scales with your business</li>
                <li>Process intelligence: Learn from your operations to improve efficiency</li>
                <li>Cursor integration: Works seamlessly with your development workflow</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-3">
                <strong>Value:</strong> Focus on building while Keys handles operational automation. <strong>No equity, just results.</strong>
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
