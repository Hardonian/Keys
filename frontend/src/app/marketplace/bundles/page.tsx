'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface Bundle {
  id: string;
  slug: string;
  title: string;
  description?: string;
  bundle_type: 'starter' | 'operator' | 'pro';
  price_cents: number;
  key_ids: string[];
  keys?: Array<{ id: string; slug: string; title: string; key_type: string }>;
}

interface BundleDiscount {
  originalPrice: number;
  discount: number;
  finalPrice: number;
  ownedKeys: string[];
}

export default function BundlesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bundleType = searchParams.get('type');
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [discounts, setDiscounts] = useState<Record<string, BundleDiscount>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchBundles();
  }, [bundleType]);

  const checkAuth = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const params = new URLSearchParams();
      if (bundleType) params.append('bundle_type', bundleType);

      const response = await fetch(`${apiUrl}/marketplace/bundles?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bundles');
      }

      const data = await response.json();
      setBundles(data.bundles || []);

      // Fetch discounts for authenticated users
      if (isAuthenticated) {
        fetchDiscounts(data.bundles || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load bundles');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscounts = async (bundlesList: Bundle[]) => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const discountMap: Record<string, BundleDiscount> = {};

    for (const bundle of bundlesList) {
      try {
        const response = await fetch(`${apiUrl}/marketplace/bundles/${bundle.slug}/discount`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const discount = await response.json();
          discountMap[bundle.id] = discount;
        }
      } catch (err) {
        // Silently fail
      }
    }

    setDiscounts(discountMap);
  };

  const handlePurchase = async (bundleSlug: string) => {
    if (!isAuthenticated) {
      router.push(`/signin?returnUrl=/marketplace/bundles`);
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/signin?returnUrl=/marketplace/bundles`);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const returnUrl = `${window.location.origin}/account/keys?purchased=true`;
      
      const response = await fetch(`${apiUrl}/marketplace/bundles/${bundleSlug}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          successUrl: returnUrl,
          cancelUrl: `${window.location.origin}/marketplace/bundles`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || 'Failed to start purchase');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading bundles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bundles</h1>
      <p className="text-gray-600 mb-8">
        Save by purchasing multiple KEYS together. Already own some KEYS? 
        Your discount is automatically applied.
      </p>

      {bundles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No bundles found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bundles.map((bundle) => {
            const discount = discounts[bundle.id];
            const displayPrice = discount ? discount.finalPrice : bundle.price_cents;
            const hasDiscount = discount && discount.discount > 0;

            return (
              <div
                key={bundle.id}
                className={`border rounded-lg p-6 ${
                  bundle.bundle_type === 'pro'
                    ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
                    : ''
                }`}
              >
                <h3 className="text-xl font-semibold mb-2">{bundle.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{bundle.description}</p>

                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    {hasDiscount && (
                      <span className="text-lg text-gray-400 line-through">
                        ${(discount.originalPrice / 100).toFixed(2)}
                      </span>
                    )}
                    <span className="text-2xl font-bold">
                      ${(displayPrice / 100).toFixed(2)}
                    </span>
                  </div>
                  {hasDiscount && (
                    <p className="text-sm text-green-600 mt-1">
                      Save ${(discount.discount / 100).toFixed(2)} (you own {discount.ownedKeys.length} KEYS)
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2">Includes:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {bundle.keys?.map((key) => (
                      <li key={key.id}>• {key.title}</li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePurchase(bundle.slug)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Purchase Bundle
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
