import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTemplates } from './useTemplates';

// Mock the template service
vi.mock('@/services/templateService', () => ({
  templateService: {
    searchTemplates: vi.fn(),
  },
}));

// Mock the public template service
vi.mock('@/services/publicTemplateService', () => ({
  fetchPublicTemplates: vi.fn(),
}));

import { templateService } from '@/services/templateService';
import { fetchPublicTemplates } from '@/services/publicTemplateService';

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

  it('should load templates successfully', async () => {
    const mockTemplates = [
      { id: '1', name: 'Template 1' },
      { id: '2', name: 'Template 2' },
    ];
    vi.mocked(templateService.searchTemplates).mockResolvedValue(mockTemplates as any);

    const { result } = renderHook(() => useTemplates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.templates).toEqual(mockTemplates);
    expect(result.current.error).toBeNull();
  });

  it('should fallback to public templates on error', async () => {
    const mockPublicTemplates = [
      { id: '3', name: 'Public Template' },
    ];
    vi.mocked(templateService.searchTemplates).mockRejectedValue(new Error('API Error'));
    vi.mocked(fetchPublicTemplates).mockResolvedValue(mockPublicTemplates as any);

    const { result } = renderHook(() => useTemplates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.templates).toEqual(mockPublicTemplates);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should refetch templates when called', async () => {
    const mockTemplates = [{ id: '1', name: 'Template 1' }];
    vi.mocked(templateService.searchTemplates).mockResolvedValue(mockTemplates as any);

    const { result } = renderHook(() => useTemplates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear mock to track new calls
    vi.mocked(templateService.searchTemplates).mockClear();
    
    await result.current.refetch();

    expect(templateService.searchTemplates).toHaveBeenCalledTimes(1);
  });
});
