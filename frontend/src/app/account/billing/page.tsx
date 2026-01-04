'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AccountBillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const openBillingPortal = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/signin?returnUrl=/account/billing');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/billing/portal?returnUrl=${encodeURIComponent(window.location.origin + '/account/billing')}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to open billing portal');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to open billing portal');
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    openBillingPortal();
  }, [openBillingPortal]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Opening billing portal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Error: {error}</div>
        <button
          onClick={() => router.push('/account')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Back to Account
        </button>
      </div>
    );
  }

  return null;
}
