'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface HealthData {
  database: {
    connected: boolean;
    responseTime?: number;
  };
  webhooks: {
    stripe: {
      lastReceived?: string;
      status: 'ok' | 'error' | 'unknown';
    };
    github: {
      lastReceived?: string;
      status: 'ok' | 'error' | 'unknown';
    };
  };
  services: {
    redis: {
      connected: boolean;
    };
    stripe: {
      configured: boolean;
    };
  };
  system: {
    uptime: number;
    version: string;
  };
}

export default function AdminHealthPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    // Check if user is admin (you'd verify this server-side)
    const fetchHealth = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(`${API_BASE_URL}/admin/health`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHealthData(data);
        }
      } catch (error) {
        console.error('Failed to fetch health data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading system health...</p>
        </div>
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: 'ok' | 'error' | 'unknown' }) => {
    const colors = {
      ok: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">System Health</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Monitor system status and services</p>
        </header>

        {healthData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Database</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <StatusBadge status={healthData.database.connected ? 'ok' : 'error'} />
                </div>
                {healthData.database.responseTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {healthData.database.responseTime}ms
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Webhooks */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Webhooks</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stripe</span>
                    <StatusBadge status={healthData.webhooks.stripe.status} />
                  </div>
                  {healthData.webhooks.stripe.lastReceived && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last received: {new Date(healthData.webhooks.stripe.lastReceived).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub</span>
                    <StatusBadge status={healthData.webhooks.github.status} />
                  </div>
                  {healthData.webhooks.github.lastReceived && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last received: {new Date(healthData.webhooks.github.lastReceived).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Services</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Redis</span>
                  <StatusBadge status={healthData.services.redis.connected ? 'ok' : 'unknown'} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Stripe</span>
                  <StatusBadge status={healthData.services.stripe.configured ? 'ok' : 'error'} />
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">System</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {healthData.system.version}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {Math.floor(healthData.system.uptime / 3600)}h{' '}
                    {Math.floor((healthData.system.uptime % 3600) / 60)}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
            <p className="text-gray-600 dark:text-gray-400">Unable to load health data.</p>
          </div>
        )}
      </div>
    </div>
  );
}
