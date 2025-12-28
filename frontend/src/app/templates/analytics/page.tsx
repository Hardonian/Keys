/**
 * Template Analytics Page
 * 
 * View template usage analytics and metrics
 */

'use client';

import { useState, useEffect } from 'react';
import { templateService } from '@/services/templateService';

interface AnalyticsStats {
  total_uses: number;
  templates_used: number;
  average_success_rate: number;
  top_templates: Array<{ template_id: string; usage_count: number; success_rate: number }>;
}

export default function TemplateAnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await templateService.getUserUsageStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load analytics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (!stats) {
    return <div className="error">Failed to load analytics</div>;
  }

  return (
    <div className="template-analytics-page">
      <h1>Template Analytics</h1>

      <div className="stats-overview">
        <div className="stat-card">
          <h3>Total Uses</h3>
          <p className="stat-value">{stats.total_uses}</p>
        </div>
        <div className="stat-card">
          <h3>Templates Used</h3>
          <p className="stat-value">{stats.templates_used}</p>
        </div>
        <div className="stat-card">
          <h3>Success Rate</h3>
          <p className="stat-value">{(stats.average_success_rate * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="top-templates">
        <h2>Most Used Templates</h2>
        <div className="templates-list">
          {stats.top_templates.map((template) => (
            <div key={template.template_id} className="template-stat-item">
              <span className="template-name">{template.template_id}</span>
              <span className="usage-count">{template.usage_count} uses</span>
              <span className="success-rate">
                {(template.success_rate * 100).toFixed(1)}% success
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
