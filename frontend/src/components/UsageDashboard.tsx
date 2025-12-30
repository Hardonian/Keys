'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface UsageData {
  user: {
    subscriptionTier: string;
    subscriptionStatus: string;
  };
  usage: {
    runs: { current: number; limit: number; remaining: number; percentage: number };
    tokens: { current: number; limit: number; remaining: number; percentage: number };
    templates: { current: number; limit: number; remaining: number; percentage: number };
    exports: { current: number; limit: number; remaining: number; percentage: number };
  };
  engagement: {
    chatsPerWeek: number;
    sliderAdjustments: number;
    suggestionsApproved: number;
    suggestionsRejected: number;
    backgroundSuggestionsApproved: number;
    lastActiveAt: string;
  };
  totals: {
    promptsGenerated: number;
    templatesCreated: number;
    totalCost: number;
  };
}

export function UsageDashboard() {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchUsage = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE_URL}/metrics/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUsageData(data);
        }
      } catch (error) {
        console.error('Failed to fetch usage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [user]);

  const getAuthToken = async () => {
    // Get token from Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
        <p className="text-gray-600 dark:text-gray-400">Unable to load usage data.</p>
      </div>
    );
  }

  const UsageBar = ({
    label,
    current,
    limit,
    remaining,
    percentage,
  }: {
    label: string;
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
  }) => {
    const isUnlimited = limit === -1;
    const isNearLimit = !isUnlimited && percentage >= 80;
    const isOverLimit = !isUnlimited && percentage >= 100;

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isUnlimited ? (
              'Unlimited'
            ) : (
              <>
                {current.toLocaleString()} / {limit.toLocaleString()} ({remaining.toLocaleString()} remaining)
              </>
            )}
          </span>
        </div>
        {!isUnlimited && (
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isOverLimit
                  ? 'bg-red-500'
                  : isNearLimit
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        )}
        {isNearLimit && !isOverLimit && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            You're approaching your limit. Consider upgrading.
          </p>
        )}
        {isOverLimit && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            You've exceeded your limit. Upgrade to continue.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Usage & Limits</h2>
        {usageData.user.subscriptionTier !== 'enterprise' && (
          <Link
            href="/pricing"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Upgrade
          </Link>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Subscription
          </span>
          <span className="text-sm font-semibold capitalize text-gray-900 dark:text-gray-100">
            {usageData.user.subscriptionTier} ({usageData.user.subscriptionStatus})
          </span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <UsageBar
          label="AI Runs"
          current={usageData.usage.runs.current}
          limit={usageData.usage.runs.limit}
          remaining={usageData.usage.runs.remaining}
          percentage={usageData.usage.runs.percentage}
        />
        <UsageBar
          label="Tokens"
          current={usageData.usage.tokens.current}
          limit={usageData.usage.tokens.limit}
          remaining={usageData.usage.tokens.remaining}
          percentage={usageData.usage.tokens.percentage}
        />
        <UsageBar
          label="Templates"
          current={usageData.usage.templates.current}
          limit={usageData.usage.templates.limit}
          remaining={usageData.usage.templates.remaining}
          percentage={usageData.usage.templates.percentage}
        />
        <UsageBar
          label="Exports"
          current={usageData.usage.exports.current}
          limit={usageData.usage.exports.limit}
          remaining={usageData.usage.exports.remaining}
          percentage={usageData.usage.exports.percentage}
        />
      </div>

      <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Your Activity
        </h3>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-600 dark:text-gray-400">Prompts Generated</dt>
            <dd className="font-semibold text-gray-900 dark:text-gray-100">
              {usageData.totals.promptsGenerated.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-600 dark:text-gray-400">Templates Created</dt>
            <dd className="font-semibold text-gray-900 dark:text-gray-100">
              {usageData.totals.templatesCreated.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-600 dark:text-gray-400">Chats This Week</dt>
            <dd className="font-semibold text-gray-900 dark:text-gray-100">
              {usageData.engagement.chatsPerWeek}
            </dd>
          </div>
          <div>
            <dt className="text-gray-600 dark:text-gray-400">Suggestions Approved</dt>
            <dd className="font-semibold text-gray-900 dark:text-gray-100">
              {usageData.engagement.suggestionsApproved}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
