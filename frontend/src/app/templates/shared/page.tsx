/**
 * Shared Templates Page
 * 
 * Browse and clone shared templates
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/Toast';
import Link from 'next/link';

interface SharedTemplate {
  id: string;
  owner_id: string;
  template_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  usage_count: number;
  rating_average?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  custom_variables: Record<string, any>;
  custom_instructions?: string;
  created_at: string;
}

export default function SharedTemplatesPage() {
  const [sharedTemplates, setSharedTemplates] = useState<SharedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'public' | 'mine'>('all');

  const loadSharedTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the shared templates API endpoint
      const params = new URLSearchParams();
      if (filter === 'public') params.append('isPublic', 'true');
      
      const response = await fetch(`/api/user-templates/shared?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to load shared templates');
      }
      
      const data = await response.json();
      let templates = data.shared || [];
      
      // Filter based on selection
      if (filter === 'public') {
        templates = templates.filter((t: SharedTemplate) => t.is_public);
      }
      
      setSharedTemplates(templates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load shared templates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadSharedTemplates();
  }, [loadSharedTemplates]);

  const handleClone = async (sharedId: string) => {
    try {
      const response = await fetch(`/api/user-templates/shared/${sharedId}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to clone template');
      }
      
      toast.success('Template cloned successfully!');
      // Optionally redirect to the template
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clone template';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return <div className="loading">Loading shared templates...</div>;
  }

  return (
    <div className="shared-templates-page">
      <div className="page-header">
        <div>
          <h1>Shared Templates</h1>
          <p>Browse templates shared by the community</p>
        </div>
        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'public' ? 'active' : ''}
            onClick={() => setFilter('public')}
          >
            Public
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading shared templates...</div>
      ) : sharedTemplates.length === 0 ? (
        <div className="empty-state">
          <h3>No shared templates available</h3>
          <p>Share your templates to help others!</p>
          <Link href="/templates" className="btn-primary">
            Browse Templates
          </Link>
        </div>
      ) : (
        <div className="shared-templates-grid">
          {sharedTemplates.map((template) => (
            <div key={template.id} className="shared-template-card">
              <div className="card-header">
                <h3>{template.name}</h3>
                {template.is_public && <span className="badge public">Public</span>}
              </div>
              {template.description && <p className="card-description">{template.description}</p>}
              <div className="card-meta">
                <span>Template: {template.template_id}</span>
                <span>Used: {template.usage_count} times</span>
                {template.rating_average && (
                  <span>Rating: {template.rating_average.toFixed(1)} ⭐</span>
                )}
              </div>
              <div className="card-actions">
                <Link href={`/templates/${template.template_id}`} className="btn-secondary">
                  View
                </Link>
                <button onClick={() => handleClone(template.id)} className="btn-primary">
                  Clone
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
