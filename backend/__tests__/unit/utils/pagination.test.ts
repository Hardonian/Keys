import { describe, it, expect } from 'vitest';
import { getPaginationParams, createPaginatedResponse } from '../../../src/utils/pagination';

describe('Pagination Utils', () => {
  describe('getPaginationParams', () => {
    it('should return default values when no query params', () => {
      const params = getPaginationParams({});
      expect(params.page).toBe(1);
      expect(params.limit).toBe(20);
    });

    it('should parse query params correctly', () => {
      const params = getPaginationParams({ page: '2', limit: '10' });
      expect(params.page).toBe(2);
      expect(params.limit).toBe(10);
    });

    it('should enforce minimum values', () => {
      const params = getPaginationParams({ page: '0', limit: '-5' });
      expect(params.page).toBe(1);
      expect(params.limit).toBe(1);
    });

    it('should enforce maximum limit', () => {
      const params = getPaginationParams({ limit: '200' });
      expect(params.limit).toBe(100);
    });
  });

  describe('createPaginatedResponse', () => {
    it('should create correct pagination metadata', () => {
      const data = [1, 2, 3];
      const response = createPaginatedResponse(data, 100, { page: 2, limit: 10 });
      
      expect(response.data).toEqual(data);
      expect(response.pagination.page).toBe(2);
      expect(response.pagination.limit).toBe(10);
      expect(response.pagination.total).toBe(100);
      expect(response.pagination.totalPages).toBe(10);
      expect(response.pagination.hasNext).toBe(true);
      expect(response.pagination.hasPrev).toBe(true);
    });

    it('should handle first page correctly', () => {
      const response = createPaginatedResponse([1, 2], 10, { page: 1, limit: 10 });
      expect(response.pagination.hasPrev).toBe(false);
      expect(response.pagination.hasNext).toBe(false);
    });
  });
});
