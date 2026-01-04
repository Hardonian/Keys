'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface Pack {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  runtime_minutes?: number;
  tags: string[];
  version: string;
  license_spdx: string;
  cover_path?: string;
  created_at: string;
}

export default function MarketplacePage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPacks();
  }, [categoryFilter, difficultyFilter, searchQuery]);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (difficultyFilter) params.append('difficulty', difficultyFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${apiUrl}/marketplace/packs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch packs');
      }

      const data = await response.json();
      setPacks(data.packs || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(packs.map((p) => p.category).filter(Boolean))) as string[];
  const difficulties: Array<'beginner' | 'intermediate' | 'advanced' | 'expert'> = [
    'beginner',
    'intermediate',
    'advanced',
    'expert',
  ];

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
        <h1 className="text-4xl font-bold mb-4">Notebook Pack Library</h1>
        <p className="text-gray-600 mb-6">
          Discover and download premium notebook packs for your projects
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search packs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
          />
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
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Difficulties</option>
            {difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pack Grid */}
      {packs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No packs found. Try adjusting your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <Link
              key={pack.id}
              href={`/marketplace/${pack.slug}`}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              {pack.cover_path && (
                <div className="w-full h-48 bg-gray-200 rounded mb-4 flex items-center justify-center">
                  <span className="text-gray-400">Cover Image</span>
                </div>
              )}
              <h3 className="text-xl font-semibold mb-2">{pack.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {pack.description || 'No description available'}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {pack.category && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {pack.category}
                  </span>
                )}
                {pack.difficulty && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {pack.difficulty}
                  </span>
                )}
                {pack.runtime_minutes && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                    {pack.runtime_minutes} min
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Version {pack.version} • {pack.license_spdx}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
