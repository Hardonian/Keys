/**
 * Template Browser Component
 * 
 * Browse and search templates by milestone, tags, stack, etc.
 */

'use client';

import { useState } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import Link from 'next/link';

interface Template {
  templateId: string;
  name: string;
  description: string;
  milestone: string;
  tags: string[];
  stack: string[];
  priority: string;
  security_level: string;
  optimization_level: string;
  hasCustomization?: boolean;
}

export function TemplateBrowser() {
  const [selectedMilestone, setSelectedMilestone] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { templates, loading } = useTemplates({
    query: searchQuery || undefined,
    milestone: selectedMilestone ? [selectedMilestone] : undefined,
  });

  const milestones = [
    { id: '', name: 'All Milestones' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'sales', name: 'Sales' },
    { id: 'finance', name: 'Finance' },
    { id: 'product', name: 'Product' },
    { id: 'engineering', name: 'Engineering' },
    { id: 'operations', name: 'Operations' },
  ];

  return (
    <div className="template-browser">
      <div className="filters-panel">
        <input
          type="text"
          placeholder="Search keys..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <select
          value={selectedMilestone}
          onChange={(e) => setSelectedMilestone(e.target.value)}
          className="milestone-select"
        >
          <option value="">All Domains</option>
          {milestones.map((milestone) => (
            <option key={milestone.id} value={milestone.id}>
              {milestone.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading keys...</div>
      ) : templates.length === 0 ? (
        <div className="empty-state">
          <p>No verified keys found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.map((template) => (
            <TemplateCard key={template.templateId} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <Link href={`/templates/${template.templateId}`} className="template-card">
      <h3>{template.name}</h3>
      <p>{template.description}</p>
      <div className="template-meta">
        {/* <span className={`badge badge-${template.priority}`}>
          {template.priority}
        </span>
        <span className={`badge security-${template.security_level}`}>
          {template.security_level}
        </span> */}
        {template.hasCustomization && (
          <span className="badge customized">Customized</span>
        )}
         <span className="badge verified">Verified</span>
      </div>
      <div className="template-tags">
        {template.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
        {template.tags.length > 3 && (
          <span className="tag">+{template.tags.length - 3}</span>
        )}
      </div>
    </Link>
  );
}
