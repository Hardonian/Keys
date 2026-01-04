'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  preview_public: boolean;
  cover_path?: string;
  preview_html_path?: string;
  zip_path?: string;
  created_at: string;
  hasAccess?: boolean;
}

export default function PackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [pack, setPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchPack();
  }, [slug]);

  const checkAuth = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const fetchPack = async () => {
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

      const response = await fetch(`${apiUrl}/marketplace/packs/${slug}`, { headers });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Jupyter Key not found');
        }
        throw new Error('Failed to fetch Jupyter Key');
      }

      const data = await response.json();
      setPack(data.pack);
      setError(null);

      // Fetch preview if available
      if (data.pack.preview_html_path) {
        fetchPreview(data.pack.preview_public, session?.access_token);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load Jupyter Key');
    } finally {
      setLoading(false);
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
      const response = await fetch(`${apiUrl}/marketplace/packs/${slug}/download`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 403) {
          alert(error.message || 'You do not have access to this Jupyter Key. Please unlock it first.');
        } else {
          alert(error.message || 'Failed to download Jupyter Key');
        }
        return;
      }

      const data = await response.json();
      // Redirect to download URL
      window.location.href = data.downloadUrl;
    } catch (err: any) {
      alert(err.message || 'Failed to download Jupyter Key');
    } finally {
      setDownloading(false);
    }
  };

  const handlePurchase = () => {
    if (!isAuthenticated) {
      router.push(`/signin?returnUrl=/marketplace/${slug}`);
      return;
    }
    // TODO: Integrate with Stripe checkout
    alert('Purchase flow coming soon!');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading Jupyter Key...</div>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Error: {error || 'Jupyter Key not found'}</div>
        <button
          onClick={() => router.push('/marketplace')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Back to Jupyter Keys
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
        ← Back to Jupyter Keys
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {pack.cover_path && (
            <div className="w-full h-64 bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
              <span className="text-gray-400">Cover Image</span>
            </div>
          )}

          <h1 className="text-4xl font-bold mb-4">{pack.title}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            {pack.category && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
                {pack.category}
              </span>
            )}
            {pack.difficulty && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded">
                {pack.difficulty}
              </span>
            )}
            {pack.runtime_minutes && (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded">
                {pack.runtime_minutes} minutes
              </span>
            )}
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded">
              {pack.license_spdx}
            </span>
          </div>

          {pack.description && (
            <div className="prose mb-8">
              <p className="text-gray-700 whitespace-pre-wrap">{pack.description}</p>
            </div>
          )}

          {pack.tags && pack.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {pack.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <p className="text-sm text-gray-600 mb-2">
                This Jupyter Key unlocks the following workflow in Jupyter:
              </p>
              <iframe
                src={previewUrl}
                className="w-full h-96 border rounded-lg"
                title="Jupyter Key Preview"
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-4">
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Version</div>
              <div className="font-semibold">{pack.version}</div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">Status</div>
              {pack.hasAccess ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                  ✓ Key unlocked
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                  🔒 Key locked
                </span>
              )}
            </div>

            <div className="space-y-3">
              {pack.hasAccess ? (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {downloading ? 'Preparing download...' : 'Download Jupyter Key'}
                </button>
              ) : (
                <button
                  onClick={handlePurchase}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Unlock Jupyter Key
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
