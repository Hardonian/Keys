import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from '../../../src/utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log info messages', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('Test message', { userId: '123' });
    expect(consoleSpy).toHaveBeenCalled();
    const call = consoleSpy.mock.calls[0][0];
    expect(call).toContain('Test message');
    consoleSpy.mockRestore();
  });

  it('should log error messages with context', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');
    logger.error('Error occurred', error, { userId: '123' });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should respect log level', () => {
    process.env.LOG_LEVEL = 'error';
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('Should not log');
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
    delete process.env.LOG_LEVEL;
  });
});
