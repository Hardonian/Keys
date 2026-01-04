'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface PublishResult {
  slug: string;
  status: 'success' | 'error';
  message?: string;
}

export default function AdminMarketplacePage() {
  const router = useRouter();
  const [libraryJson, setLibraryJson] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<PublishResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    try {
      setPublishing(true);
      setError(null);
      setResults(null);

      // Parse JSON
      let parsedJson;
      try {
        parsedJson = JSON.parse(libraryJson);
      } catch {
        throw new Error('Invalid JSON format');
      }

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/signin?returnUrl=/admin/marketplace');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/marketplace/admin/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          libraryJson: parsedJson,
          dryRun,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to publish packs');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Marketplace Admin</h1>
      <p className="text-gray-600 mb-6">
        Publish notebook packs from library.json index file
      </p>

      <div className="max-w-4xl">
        <div className="mb-6">
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Dry run (validate only, don't publish)</span>
          </label>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            library.json Content
          </label>
          <textarea
            value={libraryJson}
            onChange={(e) => setLibraryJson(e.target.value)}
            placeholder='Paste library.json content here...'
            className="w-full h-96 p-4 border rounded-lg font-mono text-sm"
          />
        </div>

        <button
          onClick={handlePublish}
          disabled={publishing || !libraryJson.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {publishing ? 'Publishing...' : dryRun ? 'Validate' : 'Publish Packs'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
            Error: {error}
          </div>
        )}

        {results && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">
              Results ({results.filter((r) => r.status === 'success').length} / {results.length} successful)
            </h2>
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded ${
                    result.status === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <div className="font-semibold">{result.slug}</div>
                  {result.message && <div className="text-sm">{result.message}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
