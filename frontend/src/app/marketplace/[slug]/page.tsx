'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  preview_public: boolean;
  cover_path?: string;
  preview_html_path?: string;
  zip_path?: string;
  outcome?: string;
  maturity?: 'starter' | 'operator' | 'scale' | 'enterprise';
  hasAccess?: boolean;
  relatedKeys?: Array<{ id: string; slug: string; title: string; reason: string }>;
  versions?: Array<{ version: string; created_at: string; changelog_md_path?: string }>;
}

export default function KeyDetailPage() {
  const params = useParams();
  const router = useRouter();
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
  }, [slug]);

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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${apiUrl}/marketplace/keys/${slug}`, { headers });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('KEY not found');
        }
        throw new Error('Failed to fetch KEY');
      }

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
          alert(error.message || 'You do not have access to this KEY. Please unlock it first.');
        } else {
          alert(error.message || 'Failed to download KEY');
        }
        return;
      }

      const data = await response.json();
      window.location.href = data.downloadUrl;
    } catch (err: any) {
      alert(err.message || 'Failed to download KEY');
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
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || 'Failed to start purchase');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading KEY...</div>
      </div>
    );
  }

  if (error || !key) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Error: {error || 'KEY not found'}</div>
        <button
          onClick={() => router.push('/marketplace')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.push('/marketplace')}
        className="mb-6 text-blue-600 hover:underline"
      >
        ← Back to Marketplace
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {key.cover_path && (
            <div className="w-full h-64 bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
              <span className="text-gray-400">Cover Image</span>
            </div>
          )}

          <h1 className="text-4xl font-bold mb-4">{key.title}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded">
              {key.key_type}
            </span>
            {key.category && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
                {key.category}
              </span>
            )}
            {key.difficulty && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded">
                {key.difficulty}
              </span>
            )}
            {key.maturity && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded">
                {key.maturity}
              </span>
            )}
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded">
              {key.license_spdx}
            </span>
          </div>

          {key.description && (
            <div className="prose mb-8">
              <p className="text-gray-700 whitespace-pre-wrap">{key.description}</p>
            </div>
          )}

          {key.tags && key.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {key.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Versions */}
          {key.versions && key.versions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Versions</h3>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                {key.versions.map((v) => (
                  <option key={v.version} value={v.version}>
                    {v.version} ({new Date(v.created_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <iframe
                src={previewUrl}
                className="w-full h-96 border rounded-lg"
                title="KEY Preview"
              />
            </div>
          )}

          {/* Related Keys */}
          {key.relatedKeys && key.relatedKeys.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Related KEYS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {key.relatedKeys.map((related) => (
                  <Link
                    key={related.id}
                    href={`/marketplace/${related.slug}`}
                    className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <h4 className="font-semibold mb-1">{related.title}</h4>
                    <p className="text-sm text-gray-600 italic">{related.reason}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-4">
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Version</div>
              <div className="font-semibold">{selectedVersion || key.version}</div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">Status</div>
              {key.hasAccess ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                  ✓ KEY unlocked
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                  🔒 KEY locked
                </span>
              )}
            </div>

            <div className="space-y-3">
              {key.hasAccess ? (
                <>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {downloading ? 'Preparing download...' : 'Download KEY'}
                  </button>
                  {key.versions && key.versions.length > 1 && (
                    <p className="text-xs text-gray-500 text-center">
                      Select a version above to download a specific release
                    </p>
                  )}
                </>
              ) : (
                <button
                  onClick={handlePurchase}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Unlock KEY
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
