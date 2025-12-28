/**
 * Share Template Page
 * 
 * Share a template customization with team or public
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTemplatePreview } from '@/hooks/useTemplates';
import { useTemplateSharing } from '@/hooks/useTemplateSharing';
import { toast } from '@/components/Toast';

export default function ShareTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const { preview } = useTemplatePreview(templateId);
  const { shareTemplate, loading } = useTemplateSharing();

  const [shareOptions, setShareOptions] = useState({
    name: preview?.name || '',
    description: '',
    isPublic: false,
    sharedWithUserIds: [] as string[],
    sharedWithTeamIds: [] as string[],
  });

  const handleShare = async () => {
    if (!shareOptions.name.trim()) {
      toast.error('Please provide a name for the shared template');
      return;
    }

    if (!preview?.hasCustomization) {
      toast.error('You must customize the template before sharing');
      return;
    }

    try {
      await shareTemplate(templateId, shareOptions);
      toast.success('Template shared successfully!');
      router.push('/templates/shared');
    } catch (error) {
      toast.error('Failed to share template');
    }
  };

  if (!preview) {
    return <div className="loading">Loading template...</div>;
  }

  if (!preview.hasCustomization) {
    return (
      <div className="share-template-page">
        <div className="error-banner">
          You must customize this template before sharing it.
        </div>
        <button onClick={() => router.push(`/templates/${templateId}/customize`)} className="btn-primary">
          Customize Template
        </button>
      </div>
    );
  }

  return (
    <div className="share-template-page">
      <div className="page-header">
        <h1>Share Template: {preview.name}</h1>
        <button onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>

      <div className="share-form">
        <div className="form-group">
          <label>
            Name <span className="required">*</span>
          </label>
          <input
            type="text"
            value={shareOptions.name}
            onChange={(e) => setShareOptions({ ...shareOptions, name: e.target.value })}
            placeholder="Give your shared template a name"
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={shareOptions.description}
            onChange={(e) => setShareOptions({ ...shareOptions, description: e.target.value })}
            placeholder="Describe what this template does..."
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={shareOptions.isPublic}
              onChange={(e) => setShareOptions({ ...shareOptions, isPublic: e.target.checked })}
            />
            Make this template public
          </label>
          <p className="form-help">
            Public templates can be viewed and cloned by anyone. Private templates are only visible to users you share with.
          </p>
        </div>

        {!shareOptions.isPublic && (
          <div className="form-group">
            <label>Share with User IDs (comma-separated)</label>
            <input
              type="text"
              value={shareOptions.sharedWithUserIds.join(', ')}
              onChange={(e) =>
                setShareOptions({
                  ...shareOptions,
                  sharedWithUserIds: e.target.value.split(',').map((id) => id.trim()).filter(Boolean),
                })
              }
              placeholder="user-id-1, user-id-2"
            />
          </div>
        )}

        <div className="form-actions">
          <button onClick={handleShare} className="btn-primary" disabled={loading}>
            {loading ? 'Sharing...' : 'Share Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
