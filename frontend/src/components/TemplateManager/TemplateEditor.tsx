/**
 * Template Editor Component
 * 
 * Edit template customizations with validation and testing
 */

'use client';

import { useState, useEffect } from 'react';
import {
  useTemplatePreview,
  useTemplateCustomization,
  useTemplateValidation,
  useTemplateTesting,
} from '@/hooks/useTemplates';
import { toast } from '@/components/Toast';
import { useRouter } from 'next/navigation';

export function TemplateEditor({ templateId }: { templateId: string }) {
  const router = useRouter();
  const { preview, refetch: refetchPreview } = useTemplatePreview(templateId);
  const { availableVariables } = useTemplateValidation(templateId);
  const { validation, validate } = useTemplateValidation(templateId);
  const { testResult, test } = useTemplateTesting(templateId);
  const { saveCustomization, updateCustomization, deleteCustomization } =
    useTemplateCustomization(templateId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customVariables, setCustomVariables] = useState<Record<string, any>>({});
  const [customInstructions, setCustomInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

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
    try {
      setTesting(true);
      await test(customVariables, customInstructions);
    } catch {
      toast.error('Test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate first
      const validationResult = await validate(customVariables, customInstructions);
      if (!validationResult?.valid) {
        toast.error(`Validation failed: ${validationResult?.errors.map((e) => e.message).join(', ')}`);
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
      toast.success('Customization saved successfully!');
      router.push(`/templates/${templateId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save customization');
    } finally {
      setSaving(false);
    }
  };

  if (!preview) {
    return <div className="loading">Loading template...</div>;
  }

  return (
    <div className="template-editor">
      <h2>{preview.name}</h2>

      <div className="editor-tabs">
        <button>Variables</button>
        <button>Instructions</button>
        <button>Preview</button>
        <button>Compare</button>
      </div>

      <div className="variables-section">
        <h3>Custom Variables</h3>
        {availableVariables.map((variable) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const v = variable as any;
          return (
            <div key={v.name} className="variable-input">
              <label>
                {v.name}
                {v.required && <span className="required">*</span>}
              </label>
              <input
                type="text"
                value={customVariables[v.name] || v.default || ''}
                onChange={(e) =>
                  setCustomVariables({
                    ...customVariables,
                    [v.name]: e.target.value,
                  })
                }
              />
              {v.description && (
                <p className="variable-description">{v.description}</p>
              )}
              {v.examples && (
                <p className="variable-examples">
                  Examples: {v.examples.join(', ')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="instructions-section">
        <h3>Custom Instructions</h3>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="Add custom instructions..."
          rows={5}
        />
      </div>

      <div className="actions">
        <button onClick={handleValidate} className="btn-secondary">
          Validate
        </button>
        <button onClick={handleTest} className="btn-secondary" disabled={testing}>
          {testing ? 'Testing...' : 'Test'}
        </button>
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        {preview.hasCustomization && (
          <button
            onClick={async () => {
              if (confirm('Delete this customization?')) {
                try {
                  await deleteCustomization();
                  toast.success('Customization deleted');
                  router.push(`/templates/${templateId}`);
                } catch {
                  toast.error('Failed to delete customization');
                }
              }
            }}
            className="btn-danger"
          >
            Delete
          </button>
        )}
      </div>

      {validation && (
        <div className={`validation-result ${validation.valid ? 'valid' : 'invalid'}`}>
          <h4>Validation Result</h4>
          {validation.errors.length > 0 && (
            <div className="errors">
              {validation.errors.map((error: { message: string }, i: number) => (
                <div key={i} className="error">
                  {error.message}
                </div>
              ))}
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div className="warnings">
              {validation.warnings.map((warning: string, i: number) => (
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
          <h4>Test Result</h4>
          <pre>{testResult.renderedPrompt}</pre>
        </div>
      )}
    </div>
  );
}
