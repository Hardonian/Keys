/**
 * Templates Page
 * 
 * Main template browser and management page
 */

'use client';

import { useState, useEffect } from 'react';
import { useTemplates, useRecommendedTemplates } from '@/hooks/useTemplates';
import { TemplateBrowser } from '@/components/TemplateManager/TemplateBrowser';
import Link from 'next/link';
import { toast } from '@/components/Toast';

export default function TemplatesPage() {
  const [selectedMilestone, setSelectedMilestone] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'browse' | 'recommended' | 'customized'>('browse');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { templates, loading: templatesLoading } = useTemplates({
    query: searchQuery,
    milestone: selectedMilestone ? [selectedMilestone] : undefined,
  });

  const { templates: recommended, loading: recommendedLoading } = useRecommendedTemplates({
    limit: 10,
    basedOnUsage: true,
    basedOnStack: true,
  });

  const milestones = [
    { id: '', name: 'All Milestones' },
    { id: '01-initialization', name: 'Initialization' },
    { id: '02-authentication', name: 'Authentication' },
    { id: '03-database-schema', name: 'Database Schema' },
    { id: '04-api-routes', name: 'API Routes' },
    { id: '05-frontend-routes', name: 'Frontend Routes' },
    { id: '06-security-hardening', name: 'Security Hardening' },
    { id: '07-performance-optimization', name: 'Performance Optimization' },
    { id: '08-testing', name: 'Testing' },
    { id: '09-ci-cd', name: 'CI/CD' },
    { id: '10-deployment', name: 'Deployment' },
  ];

  return (
    <div className="templates-page p-4 sm:p-6 lg:p-8">
      <header className="page-header mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Template Manager
        </h1>
        <nav className="header-actions flex flex-wrap gap-2 sm:gap-3 mt-4" aria-label="Template navigation">
          <Link 
            href="/templates/shared" 
            className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Shared Templates
          </Link>
          <Link 
            href="/templates/presets" 
            className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Presets
          </Link>
          <Link 
            href="/templates/analytics" 
            className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Analytics
          </Link>
        </nav>
      </header>

      <div className="view-tabs flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700" role="tablist" aria-label="View selection">
        <button
          role="tab"
          aria-selected={view === 'browse'}
          aria-controls="browse-panel"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg ${
            view === 'browse' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          onClick={() => setView('browse')}
        >
          Browse
        </button>
        <button
          role="tab"
          aria-selected={view === 'recommended'}
          aria-controls="recommended-panel"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg ${
            view === 'recommended' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          onClick={() => setView('recommended')}
        >
          Recommended
        </button>
        <button
          role="tab"
          aria-selected={view === 'customized'}
          aria-controls="customized-panel"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg ${
            view === 'customized' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          onClick={() => setView('customized')}
        >
          My Templates
        </button>
      </div>

      {view === 'browse' && (
        <div 
          id="browse-panel"
          role="tabpanel"
          aria-labelledby="browse-tab"
          className="browse-view"
        >
          <div className="filters flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            <label htmlFor="search-input" className="sr-only">Search templates</label>
            <input
              id="search-input"
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search templates"
            />
            <label htmlFor="milestone-select" className="sr-only">Filter by milestone</label>
            <select
              id="milestone-select"
              value={selectedMilestone}
              onChange={(e) => setSelectedMilestone(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by milestone"
            >
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {templatesLoading ? (
            <div className="loading text-center py-12 text-gray-600 dark:text-gray-400" role="status" aria-live="polite">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p>Loading templates...</p>
            </div>
          ) : (
            <TemplateBrowser />
          )}
        </div>
      )}

      {view === 'recommended' && (
        <div 
          id="recommended-panel"
          role="tabpanel"
          aria-labelledby="recommended-tab"
          className="recommended-view"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Recommended for You</h2>
          {recommendedLoading ? (
            <div className="loading text-center py-12 text-gray-600 dark:text-gray-400" role="status" aria-live="polite">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p>Loading recommendations...</p>
            </div>
          ) : (
            <div className="templates-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recommended.map((template) => (
                <TemplateCard key={template.templateId} template={template} />
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'customized' && (
        <div 
          id="customized-panel"
          role="tabpanel"
          aria-labelledby="customized-tab"
          className="customized-view"
        >
          <CustomizedTemplatesList />
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: { templateId: string; name: string; description: string; priority: string; milestone: string } }) {
  return (
    <Link 
      href={`/templates/${template.templateId}`} 
      className="template-card bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{template.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{template.description}</p>
      <div className="template-meta flex flex-wrap gap-2">
        <span className={`badge px-2 py-1 text-xs font-medium rounded ${
          template.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
          template.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
        }`}>
          {template.priority}
        </span>
        <span className="tag px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs rounded">
          {template.milestone}
        </span>
      </div>
    </Link>
  );
}

interface CustomizationItem {
  id: string;
  templateId: string;
  template_id?: string;
  templateName?: string;
  milestone: string;
  updatedAt?: string;
  updated_at?: string;
  enabled?: boolean;
}

function CustomizedTemplatesList() {
  const [customizations, setCustomizations] = useState<CustomizationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomizations();
  }, []);

  const loadCustomizations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user-templates/customizations', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setCustomizations(data.customizations || []);
      }
    } catch {
      // Failed to load customizations
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Delete this customization?')) return;

    try {
      const response = await fetch(`/api/user-templates/${templateId}/customize`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadCustomizations();
        toast.success('Customization deleted');
      }
    } catch {
      toast.error('Failed to delete customization');
    }
  };

  if (loading) {
    return <div className="loading">Loading customizations...</div>;
  }

  if (customizations.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Customizations Yet</h3>
        <p>Start customizing templates to see them here.</p>
        <Link href="/templates" className="btn-primary">
          Browse Templates
        </Link>
      </div>
    );
  }

  return (
    <div className="customized-templates-list">
      {customizations.map((customization) => (
        <div key={customization.id} className="customization-card">
          <div className="card-header">
            <h3>{customization.template_id || customization.templateId}</h3>
            {customization.enabled !== undefined && (
              <span className={`badge ${customization.enabled ? 'enabled' : 'disabled'}`}>
                {customization.enabled ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>
          <div className="card-meta">
            <span>Updated: {new Date((customization.updated_at || customization.updatedAt || Date.now()) as number).toLocaleDateString()}</span>
          </div>
          <div className="card-actions">
            <Link
              href={`/templates/${customization.template_id || customization.templateId}`}
              className="btn-secondary"
            >
              View
            </Link>
            <Link
              href={`/templates/${customization.template_id}/customize`}
              className="btn-secondary"
            >
              Edit
            </Link>
            <button
              onClick={() => handleDelete(customization.template_id || customization.templateId)}
              className="btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
