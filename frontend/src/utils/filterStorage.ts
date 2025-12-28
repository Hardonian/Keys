import type { InputFilter } from '@/types/filters';

const STORAGE_KEY = 'cursor-venture-companion-filters';
const STORAGE_VERSION = '1.0';

interface StoredFilters {
  version: string;
  filters: InputFilter;
  lastUpdated: string;
}

/**
 * Save filter preferences to localStorage
 */
export function saveFilterPreferences(filters: InputFilter): void {
  try {
    const stored: StoredFilters = {
      version: STORAGE_VERSION,
      filters,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.warn('Failed to save filter preferences:', error);
  }
}

/**
 * Load filter preferences from localStorage
 */
export function loadFilterPreferences(): InputFilter | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed: StoredFilters = JSON.parse(stored);
    
    // Validate version (for future migrations)
    if (parsed.version !== STORAGE_VERSION) {
      return null;
    }

    // Check if preferences are less than 30 days old
    const lastUpdated = new Date(parsed.lastUpdated);
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate > 30) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.filters;
  } catch (error) {
    console.warn('Failed to load filter preferences:', error);
    return null;
  }
}

/**
 * Clear stored filter preferences
 */
export function clearFilterPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear filter preferences:', error);
  }
}

/**
 * Get smart defaults based on user profile
 */
export function getSmartDefaults(
  userRole?: string,
  userVertical?: string
): InputFilter {
  // Role-based defaults
  const roleDefaults: Record<string, Partial<InputFilter>> = {
    founder: {
      provider: 'openai',
      style: 'detailed',
      outputFormat: 'markdown',
      useProviderGuidelines: true,
    },
    pm: {
      provider: 'openai',
      style: 'structured',
      outputFormat: 'markdown',
      useProviderGuidelines: true,
    },
    staff_engineer: {
      provider: 'anthropic',
      style: 'technical',
      outputFormat: 'code',
      useProviderGuidelines: true,
    },
    devops: {
      provider: 'anthropic',
      style: 'technical',
      outputFormat: 'structured_prompt',
      useProviderGuidelines: true,
    },
    cfo: {
      provider: 'openai',
      style: 'concise',
      outputFormat: 'markdown',
      useProviderGuidelines: true,
    },
    investor: {
      provider: 'openai',
      style: 'concise',
      outputFormat: 'markdown',
      useProviderGuidelines: true,
    },
  };

  // Vertical-based adjustments
  const verticalAdjustments: Record<string, Partial<InputFilter>> = {
    software: {
      outputFormat: 'code',
    },
    agency: {
      style: 'detailed',
      outputFormat: 'markdown',
    },
    internal_tools: {
      style: 'technical',
      outputFormat: 'code',
    },
    content: {
      style: 'conversational',
      outputFormat: 'markdown',
    },
  };

  const defaults: InputFilter = {
    provider: 'openai',
    style: 'conversational',
    outputFormat: 'markdown',
    tone: 'balanced',
    temperature: 0.7,
    useProviderGuidelines: true,
  };

  // Apply role defaults
  if (userRole && roleDefaults[userRole]) {
    Object.assign(defaults, roleDefaults[userRole]);
  }

  // Apply vertical adjustments
  if (userVertical && verticalAdjustments[userVertical]) {
    Object.assign(defaults, verticalAdjustments[userVertical]);
  }

  return defaults;
}
