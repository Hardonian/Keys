import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTemplates } from './useTemplates';

// Mock the template service
vi.mock('@/services/templateService', () => ({
  templateService: {
    searchTemplates: vi.fn().mockResolvedValue([]),
  },
}));

// Mock the public template service
vi.mock('@/services/publicTemplateService', () => ({
  fetchPublicTemplates: vi.fn().mockResolvedValue([]),
}));

describe('useTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useTemplates());
    expect(result.current.loading).toBe(true);
    expect(result.current.templates).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should have refetch function', () => {
    const { result } = renderHook(() => useTemplates());
    expect(typeof result.current.refetch).toBe('function');
  });
});
