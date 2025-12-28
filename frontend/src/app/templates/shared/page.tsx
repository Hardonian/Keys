/**
 * Shared Templates Page
 * 
 * Browse and clone shared templates
 */

'use client';

import { useState, useEffect } from 'react';
import { templateService } from '@/services/templateService';

export default function SharedTemplatesPage() {
  const [sharedTemplates, setSharedTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedTemplates();
  }, []);

  const loadSharedTemplates = async () => {
    try {
      // Note: This endpoint needs to be implemented in the backend
      // For now, using a placeholder
      setLoading(false);
    } catch (error) {
      console.error('Failed to load shared templates', error);
      setLoading(false);
    }
  };

  const handleClone = async (sharedId: string) => {
    try {
      // Clone shared template
      // Implementation needed
      alert('Template cloned successfully!');
    } catch (error) {
      console.error('Failed to clone template', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading shared templates...</div>;
  }

  return (
    <div className="shared-templates-page">
      <h1>Shared Templates</h1>
      <p>Browse templates shared by the community</p>
      
      {sharedTemplates.length === 0 ? (
        <div className="empty-state">
          <p>No shared templates available yet.</p>
          <p>Share your templates to help others!</p>
        </div>
      ) : (
        <div className="shared-templates-grid">
          {sharedTemplates.map((template) => (
            <div key={template.id} className="shared-template-card">
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <div className="template-meta">
                <span>By: {template.owner_id}</span>
                <span>Used: {template.usage_count} times</span>
              </div>
              <button onClick={() => handleClone(template.id)} className="btn-primary">
                Clone Template
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
