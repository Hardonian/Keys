'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainerVariants, scaleVariants } from '@/systems/motion/variants';
import Script from 'next/script';
import { toast } from '@/components/Toast';
import { getDemoKey, DEMO_KEYS, type DemoKey } from '@/services/demoData';

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
  preview_public: boolean;
  cover_path?: string;
  preview_html_path?: string;
  zip_path?: string;
  outcome?: string;
  maturity?: 'starter' | 'operator' | 'scale' | 'enterprise';
  hasAccess?: boolean;
  relatedKeys?: Array<{ id: string; slug: string; title: string; reason: string }>;
  versions?: Array<{ version: string; created_at: string; changelog_md_path?: string }>;
  price_cents?: number;
  isDemo?: boolean;
}

export default function KeyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const [key, setKey] = useState<Key | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>('');

  useEffect(() => {
    checkAuth();
    fetchKey();
    
    // Handle purchase completion
    if (searchParams?.get('purchased') === 'true') {
      toast.success('Purchase successful! Your KEY is now unlocked.');
      // Refetch to update access status
      setTimeout(() => {
        fetchKey();
      }, 1000);
    }
  }, [slug, searchParams]);

  const checkAuth = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const fetchKey = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Try API first
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`${apiUrl}/marketplace/keys/${slug}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setKey(data.key);
          setSelectedVersion(data.key.version);
          setError(null);

          // Track view analytics
          if (session && data.key.id) {
            trackView(data.key.id, session.access_token);
          }

          // Fetch preview if available
          if (data.key.preview_html_path) {
            fetchPreview(data.key.preview_public, session?.access_token);
          }
          return;
        }
      } catch (apiErr) {
        // Fall through to demo data
      }

      // Fallback to demo data
      const demoKey = getDemoKey(slug);
      if (demoKey) {
        // Get related demo keys (exclude current)
        const relatedDemoKeys = DEMO_KEYS.filter(k => k.id !== demoKey.id).slice(0, 3).map(k => ({
          id: k.id,
          slug: k.slug,
          title: k.title,
          reason: `Similar ${k.key_type} key for ${k.category.toLowerCase()}`,
        }));

        const convertedKey: Key = {
          ...demoKey,
          hasAccess: false,
          relatedKeys: relatedDemoKeys,
          versions: [{ version: demoKey.version, created_at: new Date().toISOString() }],
          price_cents: demoKey.price_cents,
          isDemo: true,
        };
        setKey(convertedKey);
        setSelectedVersion(demoKey.version);
        setError(null);
        return;
      }

      // If not found in demo data and API failed, show error
      throw new Error('KEY not found');
    } catch (err: any) {
      setError(err.message || 'Failed to load KEY');
    } finally {
      setLoading(false);
    }
  };

  const trackView = async (keyId: string, token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/marketplace/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_type: 'view',
          key_id: keyId,
        }),
      });
    } catch (err) {
      // Silently fail
    }
  };

  const fetchPreview = async (isPublic: boolean, token?: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const headers: HeadersInit = {};
      if (!isPublic && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/marketplace/packs/${slug}/preview`, { headers });
      if (response.ok) {
        const data = await response.json();
        setPreviewUrl(data.previewUrl);
      }
    } catch (err) {
      console.error('Failed to fetch preview:', err);
    }
  };

  const handleDownload = async () => {
    if (!isAuthenticated) {
      router.push(`/signin?returnUrl=/marketplace/${slug}`);
      return;
    }

    try {
      setDownloading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/signin?returnUrl=/marketplace/${slug}`);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/marketplace/keys/${slug}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          version: selectedVersion || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 403) {
          toast.error(error.message || 'You do not have access to this KEY. Please unlock it first.');
        } else {
          toast.error(error.message || 'Failed to download KEY');
        }
        return;
      }

      const data = await response.json();
      toast.success('Download starting...');
      window.location.href = data.downloadUrl;
    } catch (err: any) {
      toast.error(err.message || 'Failed to download KEY');
    } finally {
      setDownloading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push(`/signin?returnUrl=/marketplace/${slug}`);
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/signin?returnUrl=/marketplace/${slug}`);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const returnUrl = `${window.location.origin}/marketplace/${slug}?purchased=true`;
      
      const response = await fetch(`${apiUrl}/marketplace/keys/${slug}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          successUrl: returnUrl,
          cancelUrl: `${window.location.origin}/marketplace/${slug}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      toast.info('Redirecting to checkout...');
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || 'Failed to start purchase. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
          <p className="text-gray-600 dark:text-gray-400">Loading key...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !key) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto"
        >
          <div className="mb-4 text-6xl" aria-hidden="true">🔍</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error?.includes('not found') || !key ? 'KEY not found' : 'Unable to load KEY'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The KEY you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setError(null);
                fetchKey();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/marketplace')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Browse Marketplace
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: key.title,
    description: key.description || `A ${key.key_type} key for ${key.category || 'development'}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: key.key_type === 'jupyter' ? 'Jupyter' : key.key_type === 'node' ? 'Node.js' : 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      ratingCount: '1',
    },
  };

  return (
    <>
      <Script
        id="key-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          onClick={() => router.push('/marketplace')}
          className="mb-4 sm:mb-6 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 transition-colors"
        >
          <span>←</span> Back to Marketplace
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          {key.cover_path && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full h-48 sm:h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 sm:mb-6 flex items-center justify-center overflow-hidden"
            >
              <span className="text-gray-400 dark:text-gray-500">Cover Image</span>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4"
          >
            {key.title}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-4 sm:mb-6"
          >
            {[
              { label: key.key_type, className: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' },
              key.category && { label: key.category, className: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' },
              key.difficulty && { label: key.difficulty, className: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' },
              key.maturity && { label: key.maturity, className: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' },
              { label: key.license_spdx, className: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' },
            ].filter(Boolean).map((badge, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded ${badge.className}`}
              >
                {badge.label}
              </motion.span>
            ))}
          </motion.div>

          {key.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="prose dark:prose-invert mb-6 sm:mb-8 max-w-none"
            >
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                {key.description}
              </p>
            </motion.div>
          )}

          {key.tags && key.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6 sm:mb-8"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-2 dark:text-gray-200">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {key.tags.map((tag, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + idx * 0.03 }}
                    whileHover={{ scale: 1.05 }}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs sm:text-sm"
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Versions */}
          {key.versions && key.versions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mb-6 sm:mb-8"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-gray-200">Versions</h3>
              <motion.select
                whileFocus={{ scale: 1.02 }}
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                {key.versions.map((v) => (
                  <option key={v.version} value={v.version}>
                    {v.version} ({new Date(v.created_at).toLocaleDateString()})
                  </option>
                ))}
              </motion.select>
            </motion.div>
          )}

          {/* Preview */}
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 sm:mb-8"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-gray-200">Preview</h3>
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="w-full h-64 sm:h-96 border rounded-lg overflow-hidden dark:border-slate-700"
              >
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  title={`${key.title} Preview`}
                  loading="lazy"
                />
              </motion.div>
            </motion.div>
          )}

          {/* Related Keys */}
          {key.relatedKeys && key.relatedKeys.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mb-6 sm:mb-8"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-gray-200">Related Keys</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {key.relatedKeys.map((related, idx) => (
                  <motion.div
                    key={related.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + idx * 0.1 }}
                    whileHover={{ y: -2, scale: 1.02 }}
                  >
                    <Link
                      href={`/marketplace/${related.slug}`}
                      className="block border rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all duration-200 dark:bg-slate-800 dark:border-slate-700"
                    >
                      <h4 className="font-semibold mb-1 text-sm sm:text-base dark:text-gray-200">{related.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic">{related.reason}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <div className="border rounded-lg p-4 sm:p-6 sticky top-4 dark:bg-slate-800 dark:border-slate-700">
            {/* Pricing */}
            {!key.hasAccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 }}
                className="mb-4 pb-4 border-b dark:border-slate-700"
              >
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Price</div>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                  className="text-xl sm:text-2xl font-bold dark:text-white"
                >
                  ${((key as any).price_cents || 9900) / 100}
                </motion.div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">One-time purchase, perpetual access</div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-4"
            >
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Version</div>
              <div className="font-semibold text-sm sm:text-base dark:text-white">{selectedVersion || key.version}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mb-4 sm:mb-6"
            >
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Status</div>
              {key.hasAccess ? (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs sm:text-sm"
                >
                  <span>✓</span> KEY unlocked
                </motion.span>
              ) : (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs sm:text-sm"
                >
                  <span>🔒</span> KEY locked
                </motion.span>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              {key.hasAccess ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
                  >
                    {downloading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Preparing download...
                      </span>
                    ) : (
                      'Download KEY'
                    )}
                  </motion.button>
                  {key.versions && key.versions.length > 1 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Select a version above to download a specific release
                    </p>
                  )}
                </>
              ) : (
                <>
                  {isAuthenticated ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePurchase}
                        className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
                      >
                        Unlock KEY for ${((key as any).price_cents || 9900) / 100}
                      </motion.button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Secure checkout via Stripe
                      </p>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-3"
                      >
                        <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                          <strong>Demo Preview:</strong> This is a sample KEY for showcase.
                        </p>
                        <Link
                          href="/signup"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                        >
                          Sign up to unlock →
                        </Link>
                      </motion.div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/signin?returnUrl=' + encodeURIComponent(`/marketplace/${slug}`))}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium text-sm sm:text-base"
                      >
                        Sign In to Unlock
                      </motion.button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Unlock for ${((key as any).price_cents || 9900) / 100}
                      </p>
                    </>
                  )}
                </>
              )}
            </motion.div>

            {/* What This Unlocks */}
            {key.outcome && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="mt-6 pt-6 border-t dark:border-slate-700"
              >
                <div className="text-xs sm:text-sm font-semibold mb-2 dark:text-gray-200">What This Unlocks</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{key.outcome}</div>
              </motion.div>
            )}

            {/* Prerequisites */}
            {key.maturity && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4"
              >
                <div className="text-xs sm:text-sm font-semibold mb-2 dark:text-gray-200">Maturity Level</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 capitalize">{key.maturity}</div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
      </div>
    </>
  );
}
