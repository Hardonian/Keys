'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface PerformanceStats {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  count: number;
  errorRate: number;
}

interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  recent: Array<{
    errorType: string;
    errorMessage: string;
    timestamp: string;
  }>;
  groups: Array<{
    errorType: string;
    errorMessage: string;
    count: number;
    firstSeen: string;
    lastSeen: string;
  }>;
  budget: {
    errorRate: number;
    threshold: number;
    status: 'healthy' | 'warning' | 'exceeded';
  };
}

export default function APMPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    const fetchAPMData = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const [perfRes, errorRes] = await Promise.all([
          fetch(`${API_BASE_URL}/apm/performance`, {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          }),
          fetch(`${API_BASE_URL}/apm/errors`, {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          }),
        ]);

        if (perfRes.ok) {
          const perfData = await perfRes.json();
          setPerformanceStats(perfData);
        }

        if (errorRes.ok) {
          const errorData = await errorRes.json();
          setErrorStats(errorData);
        }
      } catch (error) {
        console.error('Failed to fetch APM data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAPMData();
    const interval = setInterval(fetchAPMData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading APM data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Application Performance Monitoring</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Real-time performance and error tracking</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Performance Metrics</h2>
            {performanceStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">P50 Latency</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {performanceStats.p50.toFixed(0)}ms
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">P95 Latency</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {performanceStats.p95.toFixed(0)}ms
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">P99 Latency</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {performanceStats.p99.toFixed(0)}ms
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Average</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {performanceStats.avg.toFixed(0)}ms
                    </dd>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Requests</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {performanceStats.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Error Rate</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {performanceStats.errorRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No performance data available</p>
            )}
          </div>

          {/* Error Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Error Tracking</h2>
            {errorStats ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Errors</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {errorStats.total}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Error Budget</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        errorStats.budget.status === 'healthy'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : errorStats.budget.status === 'warning'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {errorStats.budget.status.toUpperCase()} ({errorStats.budget.errorRate.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                {errorStats.groups.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Top Error Groups
                    </h3>
                    <div className="space-y-2">
                      {errorStats.groups.slice(0, 5).map((group, idx) => (
                        <div key={idx} className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {group.errorType}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 truncate">
                              {group.errorMessage}
                            </div>
                          </div>
                          <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                            {group.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No error data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
