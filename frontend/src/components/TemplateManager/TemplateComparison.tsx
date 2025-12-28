/**
 * Template Comparison Component
 * 
 * Side-by-side comparison of base and customized prompts
 */

'use client';

import { useState } from 'react';

interface ComparisonProps {
  basePrompt: string;
  customizedPrompt: string;
  comparison?: {
    added: string[];
    removed: string[];
    changed: Array<{ line: string; old: string; new: string }>;
    similarity: number;
  };
}

export function TemplateComparison({ basePrompt, customizedPrompt, comparison }: ComparisonProps) {
  const [view, setView] = useState<'side-by-side' | 'diff'>('side-by-side');

  return (
    <div className="template-comparison">
      <div className="comparison-header">
        <h2>Template Comparison</h2>
        <div className="view-toggle">
          <button
            className={view === 'side-by-side' ? 'active' : ''}
            onClick={() => setView('side-by-side')}
          >
            Side by Side
          </button>
          <button
            className={view === 'diff' ? 'active' : ''}
            onClick={() => setView('diff')}
          >
            Diff View
          </button>
        </div>
      </div>

      {comparison && (
        <div className="comparison-stats">
          <div className="stat">
            <strong>Similarity:</strong> {(comparison.similarity * 100).toFixed(1)}%
          </div>
          <div className="stat">
            <strong>Added:</strong> {comparison.added.length} lines
          </div>
          <div className="stat">
            <strong>Removed:</strong> {comparison.removed.length} lines
          </div>
          <div className="stat">
            <strong>Changed:</strong> {comparison.changed.length} lines
          </div>
        </div>
      )}

      {view === 'side-by-side' ? (
        <div className="side-by-side-view">
          <div className="prompt-column">
            <h3>Base Template</h3>
            <pre className="prompt-preview">{basePrompt}</pre>
          </div>
          <div className="prompt-column">
            <h3>Customized Template</h3>
            <pre className="prompt-preview customized">{customizedPrompt}</pre>
          </div>
        </div>
      ) : (
        <div className="diff-view">
          {comparison?.changed.map((change, i) => (
            <div key={i} className="diff-item">
              <div className="diff-line">{change.line}</div>
              <div className="diff-old">
                <strong>Old:</strong> {change.old}
              </div>
              <div className="diff-new">
                <strong>New:</strong> {change.new}
              </div>
            </div>
          ))}
          {comparison?.added.length > 0 && (
            <div className="diff-added">
              <h4>Added Lines</h4>
              {comparison.added.map((line, i) => (
                <div key={i} className="diff-line-added">+ {line}</div>
              ))}
            </div>
          )}
          {comparison?.removed.length > 0 && (
            <div className="diff-removed">
              <h4>Removed Lines</h4>
              {comparison.removed.map((line, i) => (
                <div key={i} className="diff-line-removed">- {line}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
