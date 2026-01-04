'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Entitlement {
  packId: string;
  packSlug: string;
  packTitle: string;
  status: string;
  expiresAt?: Date;
}

export default function EntitlementsPage() {
  const router = useRouter();
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<{
    tenantId: string;
    tenantType: string;
  } | null>(null);

  useEffect(() => {
    fetchEntitlements();
  }, []);

  const fetchEntitlements = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/signin?returnUrl=/account/entitlements');
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
      setTenantInfo({
        tenantId: data.tenantId,
        tenantType: data.tenantType,
      });
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
        <div className="text-center">Loading entitlements...</div>
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
      <h1 className="text-4xl font-bold mb-4">My Entitlements</h1>
      {tenantInfo && (
        <p className="text-gray-600 mb-6">
          Viewing entitlements for {tenantInfo.tenantType === 'org' ? 'organization' : 'personal'} account
        </p>
      )}

      {entitlements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You don't have any pack entitlements yet.</p>
          <Link
            href="/marketplace"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entitlements.map((ent) => (
            <div key={ent.packId} className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">{ent.packTitle}</h3>
              <div className="mb-4">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    ent.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {ent.status}
                </span>
              </div>
              {ent.expiresAt && (
                <div className="text-sm text-gray-600 mb-4">
                  Expires: {new Date(ent.expiresAt).toLocaleDateString()}
                </div>
              )}
              <Link
                href={`/marketplace/${ent.packSlug}`}
                className="text-blue-600 hover:underline"
              >
                View Pack →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
