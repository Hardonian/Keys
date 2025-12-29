'use client';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
}

interface SocialProofProps {
  testimonials?: Testimonial[];
  stats?: Array<{ label: string; value: string; icon?: React.ReactNode }>;
  showLiveActivity?: boolean;
}

const defaultTestimonials: Testimonial[] = [
  {
    name: 'Alex Chen',
    role: 'Founder',
    company: 'TechStart',
    content: 'This AI companion transformed how we build products. From ideation to launch, it\'s like having a cofounder who never sleeps.',
    rating: 5,
  },
  {
    name: 'Sarah Martinez',
    role: 'Product Manager',
    company: 'ScaleUp Inc',
    content: 'The prompt engineering and template system saved us weeks of work. Our team ships faster and smarter.',
    rating: 5,
  },
  {
    name: 'Jordan Kim',
    role: 'CTO',
    company: 'InnovateLabs',
    content: 'Best AI tool for technical founders. It understands context, provides actionable insights, and scales with our needs.',
    rating: 5,
  },
];

const defaultStats = [
  { label: 'Active Users', value: '10K+' },
  { label: 'Prompts Generated', value: '500K+' },
  { label: 'Templates Created', value: '5K+' },
  { label: 'Avg. Time Saved', value: '15hrs/week' },
];

export function SocialProof({ testimonials = defaultTestimonials, stats = defaultStats, showLiveActivity = true }: SocialProofProps) {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="text-center p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700"
            >
              {stat.icon && <div className="mb-2 flex justify-center">{stat.icon}</div>}
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4 text-slate-900 dark:text-slate-50">
            Loved by builders worldwide
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-8 sm:mb-12">
            Join thousands of founders, developers, and product teams
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-xl shadow-sm hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700 group"
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 mb-4 line-clamp-4">
                &quot;{testimonial.content}&quot;
              </p>
              <div className="flex items-center gap-3">
                {testimonial.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-50">{testimonial.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Activity */}
        {showLiveActivity && (
          <div className="mt-12 sm:mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                <span className="font-semibold">127</span> people using this right now
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
