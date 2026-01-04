import { describe, it, expect } from 'vitest';

describe('createRLSPolicies', () => {
  it('should throw error when DATABASE_URL is missing', async () => {
    const { createRLSPolicies } = await import('../src/handlers/rls');
    
    await expect(createRLSPolicies({ databaseUrl: '' })).rejects.toThrow(
      'DATABASE_URL is required'
    );
  });
});
