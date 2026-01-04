'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { toast } from '@/components/Toast';

interface Entitlement {
  keyId: string;
  packSlug: string;
  packTitle: string;
  status: string;
  expiresAt?: Date;
}

export default function AccountKeysPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntitlements();
    
    // Handle purchase completion
    if (searchParams?.get('purchased') === 'true') {
      toast.success('Purchase successful! Your KEYS are now unlocked.');
      // Refetch to show new entitlements
      setTimeout(() => {
        fetchEntitlements();
      }, 1000);
    }
  }, [searchParams]);

  const fetchEntitlements = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/signin?returnUrl=/account/keys');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/marketplace/entitlements`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch entitlements');
      }

      const data = await response.json();
      setEntitlements(data.entitlements || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load entitlements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading your Keys...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-4 text-6xl" aria-hidden="true">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Unable to load your Keys
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              fetchEntitlements();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Keys</h1>

      {entitlements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You don't have any unlocked keys yet.</p>
          <Link
            href="/marketplace"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entitlements.map((entitlement) => (
            <div
              key={entitlement.keyId}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">{entitlement.packTitle}</h3>
              <div className="mb-4">
                <span className={`px-2 py-1 rounded text-xs ${
                  entitlement.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {entitlement.status}
                </span>
                {entitlement.expiresAt && (
                  <p className="text-sm text-gray-600 mt-2">
                    Expires: {new Date(entitlement.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Link
                href={`/marketplace/${entitlement.packSlug}`}
                className="text-blue-600 hover:underline"
              >
                View KEY →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
