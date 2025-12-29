'use client';

import { useState, useEffect, useMemo } from 'react';
import type { InputFilter, LLMProvider, InputStyle, OutputFormat } from '@/types/filters';
import { loadFilterPreferences, saveFilterPreferences, getSmartDefaults } from '@/utils/filterStorage';
import { findMatchingPreset } from '@/utils/filterPresets';
import type { UserProfile } from '@/types';

interface InputFiltersProps {
  onFilterChange: (filter: InputFilter) => void;
  initialFilter?: InputFilter;
  isPremium?: boolean;
  userProfile?: Partial<UserProfile>;
}

export function InputFilters({ 
  onFilterChange, 
  initialFilter, 
  isPremium = false,
  userProfile 
}: InputFiltersProps) {
  // Load saved preferences or use smart defaults
  const savedPrefs = useMemo(() => loadFilterPreferences(), []);
  const smartDefaults = useMemo(
    () => getSmartDefaults(userProfile?.role || undefined, userProfile?.vertical || undefined),
    [userProfile?.role, userProfile?.vertical]
  );

  const [filter, setFilter] = useState<InputFilter>(() => {
    // Priority: initialFilter > savedPrefs > smartDefaults
    return initialFilter || savedPrefs || smartDefaults;
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Save preferences when filter changes (debounced)
  useEffect(() => {
    if (hasChanges && Object.keys(filter).length > 0) {
      const timeoutId = setTimeout(() => {
        saveFilterPreferences(filter);
        setHasChanges(false);
      }, 1000); // Debounce by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [filter, hasChanges]);

  // Notify parent of changes
  useEffect(() => {
    onFilterChange(filter);
  }, [filter, onFilterChange]);

  const updateFilter = (updates: Partial<InputFilter>) => {
    setFilter((prev) => {
      const newFilter = { ...prev, ...updates };
      setHasChanges(true);
      return newFilter;
    });
  };

  const resetToDefaults = () => {
    const defaults = getSmartDefaults(userProfile?.role, userProfile?.vertical);
    setFilter(defaults);
    setHasChanges(true);
  };

  // Only show essential filters by default
  const hasNonDefaultFilters = useMemo(() => {
    const defaults = getSmartDefaults(userProfile?.role, userProfile?.vertical);
    return (
      filter.provider !== defaults.provider ||
      filter.style !== defaults.style ||
      filter.outputFormat !== defaults.outputFormat ||
      filter.useProviderGuidelines !== defaults.useProviderGuidelines ||
      (filter.temperature !== undefined && filter.temperature !== defaults.temperature)
    );
  }, [filter, userProfile]);

  // Find matching preset
  const matchingPreset = useMemo(() => findMatchingPreset(filter), [filter]);

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 sm:px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {matchingPreset ? matchingPreset.name : 'Response Style'}
          </h3>
          {matchingPreset && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {matchingPreset.description}
            </span>
          )}
          {hasNonDefaultFilters && !matchingPreset && (
            <button
              type="button"
              onClick={resetToDefaults}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              title="Reset to defaults"
            >
              Reset
            </button>
          )}
        </div>
        {!showAdvanced && (
          <button
            type="button"
            onClick={() => setShowAdvanced(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            More options
          </button>
        )}
      </div>

      {/* Essential Filters - Always Visible */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
        {/* Style Selection - Most Important */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Style
          </label>
          <select
            value={filter.style || 'conversational'}
            onChange={(e) => updateFilter({ style: e.target.value as InputStyle })}
            className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-1 focus:ring-blue-500"
          >
            <option value="conversational">Conversational</option>
            <option value="concise">Concise</option>
            <option value="detailed">Detailed</option>
            <option value="technical">Technical</option>
            <option value="structured">Structured</option>
            {isPremium && (
              <>
                <option value="prompt_engineering">Advanced</option>
                <option value="chain_of_thought">Step-by-step</option>
              </>
            )}
          </select>
        </div>

        {/* Output Format */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Format
          </label>
          <select
            value={filter.outputFormat || 'markdown'}
            onChange={(e) => updateFilter({ outputFormat: e.target.value as OutputFormat })}
            className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-1 focus:ring-blue-500"
          >
            <option value="markdown">Markdown</option>
            <option value="code">Code</option>
            <option value="plain_text">Plain Text</option>
            <option value="json">JSON</option>
            {isPremium && (
              <>
                <option value="structured_prompt">Structured</option>
              </>
            )}
          </select>
        </div>

        {/* Provider - Only show if changed from default */}
        {(showAdvanced || filter.provider !== smartDefaults.provider) && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Provider
            </label>
            <select
              value={filter.provider || 'openai'}
              onChange={(e) => updateFilter({ provider: e.target.value as LLMProvider })}
              className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-1 focus:ring-blue-500"
            >
              <optgroup label="Cloud Providers">
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
              </optgroup>
              <optgroup label="Local / Open Source">
                <option value="ollama">Ollama</option>
                <option value="lmstudio">LM Studio</option>
                <option value="vllm">vLLM</option>
                <option value="meta">Meta (Local)</option>
              </optgroup>
              <optgroup label="Other Providers">
                <option value="together">Together AI</option>
                <option value="groq">Groq</option>
                <option value="mistral">Mistral</option>
                <option value="cohere">Cohere</option>
                <option value="perplexity">Perplexity</option>
              </optgroup>
              <option value="custom">Custom</option>
            </select>
          </div>
        )}
      </div>

      {/* Advanced Options - Collapsible */}
      {showAdvanced && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Advanced</span>
            <button
              type="button"
              onClick={() => setShowAdvanced(false)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Hide
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Provider Guidelines - Enabled by default, hidden unless disabled */}
            {filter.useProviderGuidelines === false && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="providerGuidelines"
                  checked={filter.useProviderGuidelines || false}
                  onChange={(e) => updateFilter({ useProviderGuidelines: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
                <label htmlFor="providerGuidelines" className="text-xs text-slate-600 dark:text-slate-400">
                  Use Provider Best Practices
                </label>
              </div>
            )}

            {isPremium && filter.usePromptEngineering && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="promptEngineering"
                  checked={filter.usePromptEngineering || false}
                  onChange={(e) => updateFilter({ usePromptEngineering: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
                <label htmlFor="promptEngineering" className="text-xs text-slate-600 dark:text-slate-400">
                  Advanced Techniques
                </label>
              </div>
            )}

            {/* Temperature - Only show if changed from default */}
            {(filter.temperature !== undefined && filter.temperature !== 0.7) && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Creativity: {filter.temperature?.toFixed(1) || '0.7'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={filter.temperature || 0.7}
                  onChange={(e) => updateFilter({ temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}

            {/* Model Selection - Only in advanced */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Model
              </label>
              <select
                value={filter.model || ''}
                onChange={(e) => updateFilter({ model: e.target.value || undefined })}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
              >
                <option value="">Auto (Recommended)</option>
                {filter.provider === 'openai' && (
                  <>
                    <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </>
                )}
                {filter.provider === 'anthropic' && (
                  <>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
