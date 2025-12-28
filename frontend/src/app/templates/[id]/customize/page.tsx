/**
 * Template Customization Page
 * 
 * Full-featured template customization interface
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTemplatePreview, useTemplateCustomization, useTemplateValidation, useTemplateTesting } from '@/hooks/useTemplates';
import { templateService } from '@/services/templateService';

export default function TemplateCustomizePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const { preview, refetch: refetchPreview } = useTemplatePreview(templateId);
  const { saveCustomization, updateCustomization, deleteCustomization } = useTemplateCustomization(templateId);
  const { validation, availableVariables, validate } = useTemplateValidation(templateId);
  const { testResult, test, loading: testing } = useTemplateTesting(templateId);

  const [customVariables, setCustomVariables] = useState<Record<string, any>>({});
  const [customInstructions, setCustomInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preview) {
      setCustomVariables(preview.customVariables || {});
      setCustomInstructions(preview.customInstructions || '');
    }
  }, [preview]);

  const handleValidate = async () => {
    await validate(customVariables, customInstructions);
  };

  const handleTest = async () => {
    await test(customVariables, customInstructions);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate first
      const validationResult = await validate(customVariables, customInstructions);
      if (!validationResult?.valid) {
        setError(`Validation failed: ${validationResult?.errors.map(e => e.message).join(', ')}`);
        return;
      }

      if (preview?.hasCustomization) {
        await updateCustomization({
          customVariables,
          customInstructions,
        });
      } else {
        await saveCustomization(customVariables, customInstructions);
      }

      await refetchPreview();
      router.push(`/templates/${templateId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customization');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this customization and revert to base template?')) {
      return;
    }

    try {
      await deleteCustomization();
      router.push(`/templates/${templateId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customization');
    }
  };

  if (!preview) {
    return <div className="loading">Loading template...</div>;
  }

  return (
    <div className="template-customize-page">
      <div className="page-header">
        <h1>Customize: {preview.name}</h1>
        <div className="header-actions">
          <button onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="customize-content">
        <div className="variables-section">
          <h2>Custom Variables</h2>
          {availableVariables.map((variable) => (
            <div key={variable.name} className="variable-input">
              <label>
                {variable.name}
                {variable.required && <span className="required">*</span>}
              </label>
              <input
                type="text"
                value={customVariables[variable.name] || variable.default || ''}
                onChange={(e) =>
                  setCustomVariables({
                    ...customVariables,
                    [variable.name]: e.target.value,
                  })
                }
                placeholder={variable.default}
              />
              {variable.description && (
                <p className="variable-description">{variable.description}</p>
              )}
              {variable.examples && (
                <p className="variable-examples">
                  Examples: {variable.examples.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="instructions-section">
          <h2>Custom Instructions</h2>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Add custom instructions..."
            rows={10}
          />
        </div>

        <div className="actions-section">
          <button onClick={handleValidate} className="btn-secondary">
            Validate
          </button>
          <button onClick={handleTest} className="btn-secondary" disabled={testing}>
            {testing ? 'Testing...' : 'Test'}
          </button>
          {preview.hasCustomization && (
            <button onClick={handleDelete} className="btn-danger">
              Delete Customization
            </button>
          )}
        </div>

        {validation && (
          <div className={`validation-result ${validation.valid ? 'valid' : 'invalid'}`}>
            <h3>Validation Result</h3>
            {validation.errors.length > 0 && (
              <div className="errors">
                {validation.errors.map((err, i) => (
                  <div key={i} className="error">
                    {err.message}
                  </div>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="warnings">
                {validation.warnings.map((warning, i) => (
                  <div key={i} className="warning">
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {testResult && (
          <div className="test-result">
            <h3>Test Result</h3>
            <pre className="rendered-prompt">{testResult.renderedPrompt}</pre>
            <div className="test-metadata">
              <p>Variables Used: {testResult.metadata.variablesUsed.join(', ')}</p>
              <p>Prompt Length: {testResult.metadata.promptLength} characters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
