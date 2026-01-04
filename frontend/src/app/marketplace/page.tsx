'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCard } from '@/systems/motion/primitives/AnimatedCard';
import { staggerContainerVariants, scaleVariants } from '@/systems/motion/variants';

interface Key {
  id: string;
  slug: string;
  title: string;
  description?: string;
  key_type: 'jupyter' | 'node' | 'next' | 'runbook';
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags: string[];
  version: string;
  license_spdx: string;
  outcome?: string;
  maturity?: 'starter' | 'operator' | 'scale' | 'enterprise';
  created_at: string;
}

interface DiscoveryRecommendation {
  id: string;
  slug: string;
  title: string;
  description?: string;
  key_type: string;
  version: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export default function MarketplacePage() {
  const router = useRouter();
  const [keys, setKeys] = useState<Key[]>([]);
  const [recommendations, setRecommendations] = useState<DiscoveryRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyTypeFilter, setKeyTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchKeys();
    fetchRecommendations();
  }, [keyTypeFilter, categoryFilter, searchQuery]);

  const checkAuth = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const params = new URLSearchParams();
      if (keyTypeFilter) params.append('key_type', keyTypeFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${apiUrl}/marketplace/keys?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch keys');
      }

      const data = await response.json();
      setKeys(data.keys || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!isAuthenticated) return;

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/marketplace/discover`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      // Silently fail - recommendations are optional
      console.error('Failed to fetch recommendations:', err);
    }
  };

  const recordDiscoveryClick = async (keyId: string, reason: string) => {
    if (!isAuthenticated) return;

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/marketplace/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          event_type: 'discovery_click',
          key_id: keyId,
          discovery_reason: reason,
        }),
      });
    } catch (err) {
      // Silently fail
      console.error('Failed to track discovery click:', err);
    }
  };

  const categories = Array.from(new Set(keys.map((k) => k.category).filter(Boolean))) as string[];
  const keyTypes: Array<'jupyter' | 'node' | 'next' | 'runbook'> = ['jupyter', 'node', 'next', 'runbook'];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400">Loading marketplace...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto"
        >
          <div className="mb-4 text-6xl" aria-hidden="true">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Unable to load marketplace
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setError(null);
              fetchKeys();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded">
        Skip to main content
      </a>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">KEYS Marketplace</h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 max-w-3xl">
          Discover and unlock practical capability in Cursor, Jupyter, Node.js, and more. 
          Each key unlocks a specific workflow, component, or runbook you can integrate into your projects.
        </p>

        {/* Discovery Recommendations */}
        <AnimatePresence>
          {isAuthenticated && recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8 p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Recommended for You</h2>
              <motion.div
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.id}
                    variants={scaleVariants}
                    custom={index}
                  >
                    <Link
                      href={`/marketplace/${rec.slug}`}
                      onClick={() => recordDiscoveryClick(rec.id, rec.reason)}
                      className="block border rounded-lg p-4 hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-800 dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm sm:text-base">{rec.title}</h3>
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          className={`px-2 py-1 text-xs rounded ${
                            rec.confidence === 'high' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            rec.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {rec.confidence}
                        </motion.span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                        {rec.description || 'No description available'}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 italic">{rec.reason}</p>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6"
        >
          <label htmlFor="search-keys" className="sr-only">
            Search keys
          </label>
          <motion.input
            id="search-keys"
            type="text"
            placeholder="Search keys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search keys"
            whileFocus={{ scale: 1.02 }}
            className="px-4 py-2 border rounded-lg flex-1 min-w-full sm:min-w-[200px] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
          <label htmlFor="key-type-filter" className="sr-only">
            Filter by key type
          </label>
          <motion.select
            id="key-type-filter"
            value={keyTypeFilter}
            onChange={(e) => setKeyTypeFilter(e.target.value)}
            aria-label="Filter by key type"
            whileFocus={{ scale: 1.02 }}
            className="px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          >
            <option value="">All Types</option>
            {keyTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </motion.select>
          {categories.length > 0 && (
            <>
              <label htmlFor="category-filter" className="sr-only">
                Filter by category
              </label>
              <motion.select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                whileFocus={{ scale: 1.02 }}
                className="px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </motion.select>
            </>
          )}
        </motion.div>
      </div>

      {/* Key Grid */}
      <main id="main-content">
        <AnimatePresence mode="wait">
          {keys.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-gray-500 dark:text-gray-400"
            >
              No keys found. Try adjusting your filters.
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              {keys.map((key, index) => (
                <motion.div
                  key={key.id}
                  variants={scaleVariants}
                  custom={index}
                  layout
                >
                  <Link
                    href={`/marketplace/${key.slug}`}
                    className="block border rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all duration-200 dark:bg-slate-800 dark:border-slate-700 group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {key.title}
                      </h3>
                      <motion.span
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded whitespace-nowrap ml-2"
                      >
                        {key.key_type}
                      </motion.span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {key.description || 'No description available'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {key.category && (
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                        >
                          {key.category}
                        </motion.span>
                      )}
                      {key.difficulty && (
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded"
                        >
                          {key.difficulty}
                        </motion.span>
                      )}
                      {key.maturity && (
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded"
                        >
                          {key.maturity}
                        </motion.span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Version {key.version} • {key.license_spdx}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bundles Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ delay: 0.2 }}
        className="mt-8 sm:mt-12"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Bundles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            { type: 'starter', title: 'Starter Bundle', desc: 'Essential keys for getting started', href: '/marketplace/bundles?type=starter' },
            { type: 'operator', title: 'Operator Bundle', desc: 'Runbooks and operational keys', href: '/marketplace/bundles?type=operator' },
            { type: 'pro', title: 'Pro Tier', desc: 'All keys, unlimited access', href: '/marketplace/bundles?type=pro', featured: true },
          ].map((bundle, index) => (
            <motion.div
              key={bundle.type}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <Link
                href={bundle.href}
                className={`block border rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all duration-200 ${
                  bundle.featured ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20' : 'dark:bg-slate-800 dark:border-slate-700'
                }`}
              >
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{bundle.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {bundle.desc}
                </p>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400"
                >
                  View {bundle.type === 'pro' ? 'Tier' : 'Bundle'} →
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
