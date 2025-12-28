import type { InputFilter } from '@/types/filters';

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filter: InputFilter;
  icon?: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'quick-answer',
    name: 'Quick Answer',
    description: 'Fast, concise responses',
    filter: {
      style: 'concise',
      outputFormat: 'plain_text',
      useProviderGuidelines: true,
    },
  },
  {
    id: 'detailed-analysis',
    name: 'Detailed Analysis',
    description: 'Comprehensive, thorough responses',
    filter: {
      style: 'detailed',
      outputFormat: 'markdown',
      useProviderGuidelines: true,
    },
  },
  {
    id: 'code-focused',
    name: 'Code Focused',
    description: 'Technical, code-oriented',
    filter: {
      style: 'technical',
      outputFormat: 'code',
      provider: 'anthropic',
      useProviderGuidelines: true,
    },
  },
  {
    id: 'structured-planning',
    name: 'Structured Planning',
    description: 'Organized, step-by-step',
    filter: {
      style: 'structured',
      outputFormat: 'markdown',
      useProviderGuidelines: true,
    },
  },
  {
    id: 'conversational',
    name: 'Conversational',
    description: 'Natural, friendly tone',
    filter: {
      style: 'conversational',
      outputFormat: 'markdown',
      useProviderGuidelines: true,
    },
  },
];

/**
 * Get preset by ID
 */
export function getPresetById(id: string): FilterPreset | undefined {
  return FILTER_PRESETS.find((p) => p.id === id);
}

/**
 * Find matching preset for a filter
 */
export function findMatchingPreset(filter: InputFilter): FilterPreset | null {
  for (const preset of FILTER_PRESETS) {
    const matches =
      preset.filter.style === filter.style &&
      preset.filter.outputFormat === filter.outputFormat &&
      (preset.filter.provider === filter.provider ||
        (!preset.filter.provider && !filter.provider));
    
    if (matches) {
      return preset;
    }
  }
  return null;
}
