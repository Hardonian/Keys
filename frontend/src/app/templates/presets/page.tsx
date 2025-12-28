/**
 * Template Presets Page
 * 
 * Browse and apply template presets
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/Toast';

interface Preset {
  id: string;
  name: string;
  description?: string;
  category: string;
  template_ids: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  custom_variables: Record<string, any>;
  custom_instructions?: string;
  is_system_preset: boolean;
  usage_count: number;
}

export default function TemplatePresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const loadPresets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      params.append('includeSystem', 'true');
      
      const response = await fetch(`/api/user-templates/presets?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to load presets');
      }
      
      const data = await response.json();
      setPresets(data.presets || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load presets';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const handleApply = async (presetId: string) => {
    try {
      setApplying(presetId);
      
      const response = await fetch(`/api/user-templates/presets/${presetId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply preset');
      }
      
      const data = await response.json();
      toast.success(`Preset applied! ${data.applied.length} templates customized.`);
      
      if (data.failed.length > 0) {
        toast.warning(`${data.failed.length} templates failed to apply.`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply preset';
      toast.error(errorMessage);
    } finally {
      setApplying(null);
    }
  };

  const categories = Array.from(new Set(presets.map(p => p.category))).filter(Boolean);

  if (loading) {
    return <div className="loading">Loading presets...</div>;
  }

  return (
    <div className="template-presets-page">
      <div className="page-header">
        <div>
          <h1>Template Presets</h1>
          <p>Quick-start configurations for common scenarios</p>
        </div>
        <div className="category-filter">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading presets...</div>
      ) : presets.length === 0 ? (
        <div className="empty-state">
          <h3>No presets available</h3>
          <p>Create your own preset or wait for system presets to be added.</p>
        </div>
      ) : (
        <div className="presets-grid">
          {presets.map((preset) => (
            <div key={preset.id} className="preset-card">
              <div className="card-header">
                <h3>{preset.name}</h3>
                {preset.is_system_preset && <span className="badge system">System</span>}
              </div>
              {preset.description && (
                <p className="card-description">{preset.description}</p>
              )}
              <div className="preset-meta">
                <span className="meta-item">
                  <strong>Category:</strong> {preset.category}
                </span>
                <span className="meta-item">
                  <strong>Templates:</strong> {preset.template_ids?.length || 0}
                </span>
                <span className="meta-item">
                  <strong>Used:</strong> {preset.usage_count} times
                </span>
              </div>
              <div className="preset-templates">
                <strong>Includes:</strong>
                <div className="template-tags">
                  {preset.template_ids.slice(0, 5).map((id) => (
                    <span key={id} className="tag">
                      {id}
                    </span>
                  ))}
                  {preset.template_ids.length > 5 && (
                    <span className="tag">+{preset.template_ids.length - 5} more</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleApply(preset.id)}
                className="btn-primary"
                disabled={applying === preset.id}
              >
                {applying === preset.id ? 'Applying...' : 'Apply Preset'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
