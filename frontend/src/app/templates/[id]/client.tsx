'use client';

/**
 * Template Detail Page (client)
 *
 * View and customize a specific template
 */

import { useParams } from 'next/navigation';
import {
  useTemplatePreview,
  useTemplateCustomization,
  useTemplateValidation,
  useTemplateTesting,
  useTemplateHistory,
} from '@/hooks/useTemplates';
import type { TemplatePreview, TemplateVariables } from '@/services/templateService';
import { TemplateEditor } from '@/components/TemplateManager/TemplateEditor';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from '@/components/Toast';
import { TemplateComparison } from '@/components/TemplateManager/TemplateComparison';
import { templateService } from '@/services/templateService';
import { useAuth } from '@/contexts/AuthContext';

export default function TemplateDetailClient({ id }: { id?: string }) {
  const params = useParams();
  const templateId = (id ?? (params.id as string)) as string;

  const { preview, publicTemplate, loading: previewLoading } = useTemplatePreview(templateId);
  useTemplateCustomization(templateId);
  useTemplateValidation(templateId);
  const { testResult, test } = useTemplateTesting(templateId);
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;

  const [activeTab, setActiveTab] = useState<'preview' | 'customize' | 'test' | 'history' | 'compare'>('preview');
  const [comparison, setComparison] = useState<{
    added?: string[];
    removed?: string[];
    changed?: Array<{ line: string; old: string; new: string }>;
    similarity?: number;
  } | null>(null);

  if (previewLoading || authLoading) {
    return <div className="loading">Loading template...</div>;
  }

  if (!isAuthenticated) {
    if (!publicTemplate) {
      return (
        <div className="template-detail-page">
          <div className="error">Template details are unavailable.</div>
          <Link href="/signin?returnUrl=/templates" className="btn-primary">
            Sign in to access templates
          </Link>
        </div>
      );
    }

    return (
      <div className="template-detail-page">
        <div className="page-header">
          <h1>{publicTemplate.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {publicTemplate.description}
          </p>
        </div>

        <div className="template-meta">
          <div className="template-tags">
            {publicTemplate.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
          <div className="template-tags">
            {publicTemplate.stack.map((item) => (
              <span key={item} className="tag">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="preview-tab mt-6">
          <div className="prompt-section">
            <h2>Template Summary</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Sign in to view the full prompt, customize variables, and run validation tests.
            </p>
          </div>
        </div>

        <Link href={`/signin?returnUrl=/templates/${templateId}`} className="btn-primary mt-4 inline-block">
          Sign in to customize
        </Link>
      </div>
    );
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
          <button
            onClick={() => setActiveTab('customize')}
            className={activeTab === 'customize' ? 'active' : ''}
          >
            Customize
          </button>
          <button onClick={() => setActiveTab('test')} className={activeTab === 'test' ? 'active' : ''}>
            Test
          </button>
          <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}>
            History
          </button>
          <button onClick={() => setActiveTab('compare')} className={activeTab === 'compare' ? 'active' : ''}>
            Compare
          </button>
        </div>
      </div>

      {activeTab === 'compare' && (
        <div className="compare-tab">
          <CompareView
            templateId={templateId}
            preview={preview}
            comparison={comparison}
            setComparison={setComparison}
          />
        </div>
      )}

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

      {activeTab === 'customize' && <TemplateEditor templateId={templateId} />}

      {activeTab === 'test' && (
        <div className="test-tab">
          <TestTemplateView testResult={testResult} onTest={test} />
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

function TestTemplateView({
  testResult,
  onTest,
}: {
  testResult: {
    success: boolean;
    renderedPrompt?: string;
    validationResult?: { errors: Array<{ message: string }> };
    metadata?: { variablesUsed: string[]; promptLength: number; conditionalsEvaluated: number };
  } | null;
  onTest: (vars: Record<string, unknown>, instructions?: string) => Promise<unknown>;
}) {
  const [customVariables, setCustomVariables] = useState<TemplateVariables>({});
  const [customInstructions, setCustomInstructions] = useState('');
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    try {
      setTesting(true);
      await onTest(customVariables, customInstructions);
    } catch {
      toast.error('Test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="test-view">
      <h2>Test Template</h2>
      <p>Test your customization before saving</p>

      <div className="test-inputs">
        <div className="test-variables">
          <h3>Test Variables</h3>
          <textarea
            value={JSON.stringify(customVariables, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value) as unknown;
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                  setCustomVariables(parsed as TemplateVariables);
                }
              } catch {
                // Invalid JSON, ignore
              }
            }}
            placeholder='{"user_role": "developer", "security_focus": true}'
            rows={5}
            className="json-input"
          />
        </div>

        <div className="test-instructions">
          <h3>Test Instructions</h3>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Add custom instructions..."
            rows={3}
          />
        </div>
      </div>

      <button onClick={handleTest} className="btn-primary" disabled={testing}>
        {testing ? 'Testing...' : 'Run Test'}
      </button>

      {testResult && (
        <div className="test-result">
          <h3>Test Result</h3>
          {testResult.success ? (
            <div className="test-success">
              <p>✅ Template rendered successfully</p>
              <pre className="rendered-prompt">{testResult.renderedPrompt}</pre>
              <div className="test-metadata">
                <p>
                  <strong>Variables Used:</strong> {testResult.metadata?.variablesUsed.join(', ') || 'None'}
                </p>
                <p>
                  <strong>Prompt Length:</strong> {testResult.metadata?.promptLength || 0} characters
                </p>
                <p>
                  <strong>Conditionals Evaluated:</strong> {testResult.metadata?.conditionalsEvaluated || 0}
                </p>
              </div>
            </div>
          ) : (
            <div className="test-error">
              <p>❌ Template test failed</p>
              {testResult.validationResult?.errors && (
                <div className="errors">
                  {testResult.validationResult.errors.map((err: { message: string }, i: number) => (
                    <div key={i} className="error">
                      {err.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompareView({
  templateId,
  preview,
  comparison,
  setComparison,
}: {
  templateId: string;
  preview: TemplatePreview | null;
  comparison: {
    added?: string[];
    removed?: string[];
    changed?: Array<{ line: string; old: string; new: string }>;
    similarity?: number;
  } | null;
  setComparison: (comp: {
    added?: string[];
    removed?: string[];
    changed?: Array<{ line: string; old: string; new: string }>;
    similarity?: number;
  } | null) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const loadComparison = useCallback(async () => {
    if (!preview?.hasCustomization) {
      toast.info('No customization to compare');
      return;
    }

    try {
      setIsLoading(true);
      const result = await templateService.comparePrompts(
        templateId,
        preview.customVariables || {},
        preview.customInstructions
      );
      setComparison(result.comparison);
    } catch {
      toast.error('Failed to load comparison');
    } finally {
      setIsLoading(false);
    }
  }, [templateId, preview, setComparison]);

  useEffect(() => {
    if (preview?.hasCustomization && !comparison) {
      loadComparison();
    }
  }, [preview, comparison, loadComparison]);

  if (!preview?.hasCustomization) {
    return (
      <div className="empty-state">
        <p>No customization to compare. Customize the template first.</p>
        <Link href={`/templates/${templateId}/customize`} className="btn-primary">
          Customize Template
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="loading">Loading comparison...</div>;
  }

  if (!comparison) {
    return (
      <div>
        <button onClick={loadComparison} className="btn-primary">
          Load Comparison
        </button>
      </div>
    );
  }

  return (
    <TemplateComparison basePrompt={preview.basePrompt} customizedPrompt={preview.customizedPrompt || ''} comparison={comparison} />
  );
}

function TemplateHistoryView({ templateId }: { templateId: string }) {
  const { history, loading, rollback } = useTemplateHistory(templateId);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  if (loading) {
    return <div className="loading">Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="empty-state">
        <p>No history available for this template.</p>
      </div>
    );
  }

  return (
    <div className="history-view">
      <h2>Customization History</h2>
      <div className="history-list">
        {history.map((entry) => (
          <div key={entry.id} className="history-entry">
            <div className="history-header">
              <span className="change-type">{entry.change_type}</span>
              <span className="history-date">{new Date(entry.created_at).toLocaleString()}</span>
            </div>
            {entry.change_reason && <p className="change-reason">{entry.change_reason}</p>}
            <div className="history-actions">
              <button onClick={() => setSelectedEntry(entry.id)} className="btn-secondary">
                View Details
              </button>
              <button onClick={() => rollback(entry.id)} className="btn-primary">
                Rollback to This
              </button>
            </div>
            {selectedEntry === entry.id && (
              <div className="history-details">
                <h4>Custom Variables:</h4>
                <pre>{JSON.stringify(entry.custom_variables, null, 2)}</pre>
                {entry.custom_instructions && (
                  <>
                    <h4>Custom Instructions:</h4>
                    <p>{entry.custom_instructions}</p>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
