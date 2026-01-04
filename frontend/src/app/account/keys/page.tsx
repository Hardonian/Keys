'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { toast } from '@/components/Toast';
import { groupKeysBySituation, situationGroupLabels, getKeySituation } from '@/utils/keySituations';

interface Entitlement {
  keyId: string;
  packSlug: string;
  packTitle: string;
  status: string;
  expiresAt?: Date;
  keyType?: string;
  category?: string;
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

  const groupedEntitlements = groupKeysBySituation(
    entitlements.map(e => ({ slug: e.packSlug }))
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Your Keyring
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
          Keys you've equipped yourself with, organized by the situations they cover.
        </p>
      </div>

      {entitlements.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="mb-6 text-6xl" aria-hidden="true">🔑</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Your Keyring is ready
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            You don't have any Keys yet. Browse the marketplace to find Keys that help you prepare for situations you might face.
          </p>
          <Link
            href="/marketplace"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-10 sm:space-y-12">
          {Object.entries(groupedEntitlements).map(([group, groupKeys]) => {
            if (groupKeys.length === 0) return null;
            
            const groupEntitlements = entitlements.filter(e =>
              groupKeys.some(k => k.slug === e.packSlug)
            );
            
            return (
              <section key={group} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    You're covered for: {situationGroupLabels[group] || situationGroupLabels['other']}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {groupEntitlements.length} {groupEntitlements.length === 1 ? 'Key' : 'Keys'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {groupEntitlements.map((entitlement) => {
                    const situation = getKeySituation(entitlement.packSlug);
                    
                    return (
                      <div
                        key={entitlement.keyId}
                        className="border rounded-lg p-5 sm:p-6 hover:shadow-lg transition-all duration-200 dark:bg-slate-800 dark:border-slate-700 bg-white"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {entitlement.packTitle}
                          </h3>
                          <div className="ml-3 flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <span className="text-lg" aria-label="Key unlocked">🔑</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-4 space-y-2">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                              Reduces uncertainty around:
                            </p>
                            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                              {situation.whatThisPrevents}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            entitlement.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {entitlement.status === 'active' ? '✓ Active' : entitlement.status}
                          </span>
                          {entitlement.keyType && (
                            <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs">
                              {entitlement.keyType}
                            </span>
                          )}
                        </div>
                        
                        {entitlement.expiresAt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Expires: {new Date(entitlement.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                        
                        <Link
                          href={`/marketplace/${entitlement.packSlug}`}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                        >
                          View Key →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          
          {/* Coverage Summary */}
          <div className="mt-12 p-6 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Your preparedness coverage
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              You have {entitlements.length} {entitlements.length === 1 ? 'Key' : 'Keys'} in your Keyring, 
              covering {Object.keys(groupedEntitlements).filter(g => groupedEntitlements[g].length > 0).length} different situations.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              Most teams don't have this until it hurts. You're prepared.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
