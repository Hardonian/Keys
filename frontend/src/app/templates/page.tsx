/**
 * Templates Page
 * 
 * Main template browser and management page
 */

'use client';

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
    <div className="templates-page">
      <div className="page-header">
        <h1>Template Manager</h1>
        <div className="header-actions">
          <Link href="/templates/shared" className="btn-secondary">
            Shared Templates
          </Link>
          <Link href="/templates/presets" className="btn-secondary">
            Presets
          </Link>
          <Link href="/templates/analytics" className="btn-secondary">
            Analytics
          </Link>
        </div>
      </div>

      <div className="view-tabs">
        <button
          className={view === 'browse' ? 'active' : ''}
          onClick={() => setView('browse')}
        >
          Browse
        </button>
        <button
          className={view === 'recommended' ? 'active' : ''}
          onClick={() => setView('recommended')}
        >
          Recommended
        </button>
        <button
          className={view === 'customized' ? 'active' : ''}
          onClick={() => setView('customized')}
        >
          My Templates
        </button>
      </div>

      {view === 'browse' && (
        <div className="browse-view">
          <div className="filters">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select
              value={selectedMilestone}
              onChange={(e) => setSelectedMilestone(e.target.value)}
              className="milestone-select"
            >
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {templatesLoading ? (
            <div className="loading">Loading templates...</div>
          ) : (
            <TemplateBrowser />
          )}
        </div>
      )}

      {view === 'recommended' && (
        <div className="recommended-view">
          <h2>Recommended for You</h2>
          {recommendedLoading ? (
            <div className="loading">Loading recommendations...</div>
          ) : (
            <div className="templates-grid">
              {recommended.map((template) => (
                <TemplateCard key={template.templateId} template={template} />
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'customized' && (
        <div className="customized-view">
          <CustomizedTemplatesList />
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: any }) {
  return (
    <Link href={`/templates/${template.templateId}`} className="template-card">
      <h3>{template.name}</h3>
      <p>{template.description}</p>
      <div className="template-meta">
        <span className={`badge badge-${template.priority}`}>{template.priority}</span>
        <span className="tag">{template.milestone}</span>
      </div>
    </Link>
  );
}

function CustomizedTemplatesList() {
  const [customizations, setCustomizations] = useState<any[]>([]);
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
    } catch (error) {
      console.error('Failed to load customizations', error);
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
    } catch (error) {
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
            <h3>{customization.template_id}</h3>
            <span className={`badge ${customization.enabled ? 'enabled' : 'disabled'}`}>
              {customization.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="card-meta">
            <span>Updated: {new Date(customization.updated_at).toLocaleDateString()}</span>
          </div>
          <div className="card-actions">
            <Link
              href={`/templates/${customization.template_id}`}
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
              onClick={() => handleDelete(customization.template_id)}
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
