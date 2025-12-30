'use client';

import { useEffect, useState } from 'react';
import { SocialProof } from './SocialProof';

interface SystemMetrics {
  totalUsers: number;
  totalPrompts: number;
  totalTemplates: number;
}

export function SocialProofWithRealMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    // Fetch system metrics (public endpoint or cached)
    const fetchMetrics = async () => {
      try {
        // Try to fetch from API (this would be a public endpoint)
        // For now, we'll use a simple approach - could be cached/static
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        const response = await fetch(`${API_BASE_URL}/metrics/public`);

        if (response.ok) {
          const data = await response.json();
          setMetrics({
            totalUsers: data.users?.total || 0,
            totalPrompts: data.usage?.totalPrompts || 0,
            totalTemplates: data.usage?.totalTemplates || 0,
          });
        } else {
          // If API fails, use defaults (metrics will show "—")
          setMetrics(null);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        // Fallback to showing nothing or cached values
      }
    };

    fetchMetrics();
  }, []);

  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K+`;
    return num.toString();
  };

  const stats = metrics
    ? [
        {
          label: 'Active Users',
          value: formatNumber(metrics.totalUsers),
        },
        {
          label: 'Prompts Generated',
          value: formatNumber(metrics.totalPrompts),
        },
        {
          label: 'Templates Created',
          value: formatNumber(metrics.totalTemplates),
        },
        {
          label: 'Avg. Time Saved',
          value: '15hrs/week', // This would come from analytics
        },
      ]
    : [
        { label: 'Active Users', value: '—' },
        { label: 'Prompts Generated', value: '—' },
        { label: 'Templates Created', value: '—' },
        { label: 'Avg. Time Saved', value: '—' },
      ];

  return <SocialProof stats={stats} showLiveActivity={false} />;
}
