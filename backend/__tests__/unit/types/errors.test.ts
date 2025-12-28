import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ErrorCode,
} from '../../../src/types/errors';

describe('Error Types', () => {
  it('should create AppError with correct properties', () => {
    const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error', 400, { field: 'name' });
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.context).toEqual({ field: 'name' });
  });

  it('should create ValidationError', () => {
    const error = new ValidationError('Invalid input', { field: 'email' });
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
  });

  it('should create AuthenticationError', () => {
    const error = new AuthenticationError();
    expect(error.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
    expect(error.statusCode).toBe(401);
  });

  it('should create AuthorizationError', () => {
    const error = new AuthorizationError();
    expect(error.code).toBe(ErrorCode.AUTHORIZATION_ERROR);
    expect(error.statusCode).toBe(403);
  });

  it('should create NotFoundError', () => {
    const error = new NotFoundError('User');
    expect(error.message).toBe('User not found');
    expect(error.statusCode).toBe(404);
  });
});
