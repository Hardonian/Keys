/**
 * Template Detail Page
 * 
 * View and customize a specific template
 */

'use client';

import { useParams } from 'next/navigation';
import { useTemplatePreview, useTemplateCustomization, useTemplateValidation, useTemplateTesting } from '@/hooks/useTemplates';
import { TemplateEditor } from '@/components/TemplateManager/TemplateEditor';
import { useState } from 'react';

export default function TemplateDetailPage() {
  const params = useParams();
  const templateId = params.id as string;

  const { preview, loading: previewLoading } = useTemplatePreview(templateId);
  const { saveCustomization, updateCustomization, deleteCustomization } = useTemplateCustomization(templateId);
  const { validation, availableVariables, validate } = useTemplateValidation(templateId);
  const { testResult, test } = useTemplateTesting(templateId);

  const [customVariables, setCustomVariables] = useState<Record<string, any>>({});
  const [customInstructions, setCustomInstructions] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'customize' | 'test' | 'history'>('preview');

  if (previewLoading) {
    return <div className="loading">Loading template...</div>;
  }

  if (!preview) {
    return <div className="error">Template not found</div>;
  }

  return (
    <div className="template-detail-page">
      <div className="page-header">
        <h1>{preview.name}</h1>
        <div className="header-actions">
          <button onClick={() => setActiveTab('preview')} className={activeTab === 'preview' ? 'active' : ''}>
            Preview
          </button>
          <button onClick={() => setActiveTab('customize')} className={activeTab === 'customize' ? 'active' : ''}>
            Customize
          </button>
          <button onClick={() => setActiveTab('test')} className={activeTab === 'test' ? 'active' : ''}>
            Test
          </button>
          <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}>
            History
          </button>
        </div>
      </div>

      {activeTab === 'preview' && (
        <div className="preview-tab">
          <div className="prompt-section">
            <h2>Base Template</h2>
            <pre className="prompt-preview">{preview.basePrompt}</pre>
          </div>
          {preview.hasCustomization && preview.customizedPrompt && (
            <div className="prompt-section">
              <h2>Your Customized Version</h2>
              <pre className="prompt-preview customized">{preview.customizedPrompt}</pre>
            </div>
          )}
        </div>
      )}

      {activeTab === 'customize' && (
        <TemplateEditor templateId={templateId} />
      )}

      {activeTab === 'test' && (
        <div className="test-tab">
          <TestTemplateView
            templateId={templateId}
            testResult={testResult}
            onTest={test}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-tab">
          <TemplateHistoryView templateId={templateId} />
        </div>
      )}
    </div>
  );
}

function TestTemplateView({ templateId, testResult, onTest }: any) {
  return (
    <div>
      <h2>Test Template</h2>
      <button onClick={() => onTest({}, '')}>Run Test</button>
      {testResult && (
        <div>
          <h3>Test Result</h3>
          <pre>{testResult.renderedPrompt}</pre>
        </div>
      )}
    </div>
  );
}

function TemplateHistoryView({ templateId }: { templateId: string }) {
  // TODO: Implement history view
  return <div>History view coming soon...</div>;
}
