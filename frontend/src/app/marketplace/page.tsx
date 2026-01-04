'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

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
        <div className="text-center">Loading marketplace...</div>
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">KEYS Marketplace</h1>
        <p className="text-gray-600 mb-6">
          Discover and unlock practical capability in Cursor, Jupyter, Node.js, and more. 
          Each KEY unlocks a specific workflow, component, or runbook you can integrate into your projects.
        </p>

        {/* Discovery Recommendations */}
        {isAuthenticated && recommendations.length > 0 && (
          <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Recommended for You</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/marketplace/${rec.slug}`}
                  onClick={() => recordDiscoveryClick(rec.id, rec.reason)}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{rec.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      rec.confidence === 'high' ? 'bg-green-100 text-green-800' :
                      rec.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {rec.confidence}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {rec.description || 'No description available'}
                  </p>
                  <p className="text-xs text-blue-600 italic">{rec.reason}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search KEYS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
          />
          <select
            value={keyTypeFilter}
            onChange={(e) => setKeyTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Types</option>
            {keyTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Key Grid */}
      {keys.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No KEYS found. Try adjusting your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {keys.map((key) => (
            <Link
              key={key.id}
              href={`/marketplace/${key.slug}`}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold">{key.title}</h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                  {key.key_type}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {key.description || 'No description available'}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {key.category && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {key.category}
                  </span>
                )}
                {key.difficulty && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {key.difficulty}
                  </span>
                )}
                {key.maturity && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    {key.maturity}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Version {key.version} • {key.license_spdx}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bundles Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Bundles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/marketplace/bundles?type=starter"
            className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">Starter Bundle</h3>
            <p className="text-gray-600 text-sm mb-4">
              Essential KEYS for getting started
            </p>
            <div className="text-lg font-bold">View Bundle →</div>
          </Link>
          <Link
            href="/marketplace/bundles?type=operator"
            className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">Operator Bundle</h3>
            <p className="text-gray-600 text-sm mb-4">
              Runbooks and operational KEYS
            </p>
            <div className="text-lg font-bold">View Bundle →</div>
          </Link>
          <Link
            href="/marketplace/bundles?type=pro"
            className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-purple-50"
          >
            <h3 className="text-xl font-semibold mb-2">Pro Tier</h3>
            <p className="text-gray-600 text-sm mb-4">
              All KEYS, unlimited access
            </p>
            <div className="text-lg font-bold">View Tier →</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
