# Quick Start Guide - First Week Implementation

## Day 1: Testing Infrastructure Setup

### 1. Install Testing Dependencies

```bash
# Backend
cd backend
npm install -D vitest @vitest/ui @testing-library/jest-dom supertest msw

# Frontend  
cd frontend
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 2. Create Test Configuration

**backend/vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts'],
    },
  },
});
```

**frontend/vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

### 3. Write First Tests

**backend/__tests__/unit/services/promptAssembly.test.ts**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { assemblePrompt } from '../../../src/services/promptAssembly';

describe('promptAssembly', () => {
  it('should assemble prompt with user profile', async () => {
    // Test implementation
  });
});
```

### 4. Add Test Scripts

**backend/package.json**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## Day 2: Error Handling Enhancement

### 1. Create Error Types

**backend/src/types/errors.ts**
```typescript
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### 2. Enhance Error Middleware

**backend/src/middleware/errorHandler.ts** (update existing)
```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../types/errors';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        context: err.context,
      },
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  res.status(500).json({
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
  });
}
```

---

## Day 3: Input Validation

### 1. Create Validation Schemas

**backend/src/validation/schemas.ts**
```typescript
import { z } from 'zod';

export const createProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['founder', 'pm', 'staff_engineer', 'devops', 'cfo', 'investor']).optional(),
  vertical: z.enum(['software', 'agency', 'internal_tools', 'content', 'other']).optional(),
  stack: z.record(z.boolean()).optional(),
});

export const createVibeConfigSchema = z.object({
  playfulness: z.number().min(0).max(100),
  revenue_focus: z.number().min(0).max(100),
  investor_perspective: z.number().min(0).max(100),
  selected_atoms: z.array(z.string().uuid()).optional(),
});
```

### 2. Create Validation Middleware

**backend/src/middleware/validation.ts**
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError, ErrorCode } from '../types/errors';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Validation failed',
          400,
          { errors: error.errors }
        );
      }
      next(error);
    }
  };
}
```

---

## Day 4: CI/CD Pipeline

### 1. Create GitHub Actions Workflow

**.github/workflows/ci.yml**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm run lint
      - run: cd backend && npm run type-check
      - run: cd backend && npm test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run type-check
      - run: cd frontend && npm test
```

---

## Day 5: Monitoring Setup

### 1. Add Sentry

**backend/src/integrations/sentry.ts**
```typescript
import * as Sentry from '@sentry/node';

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }
}
```

**backend/src/index.ts** (add at top)
```typescript
import { initSentry } from './integrations/sentry';
initSentry();
```

### 2. Add Structured Logging

**backend/src/utils/logger.ts**
```typescript
export const logger = {
  info: (message: string, context?: Record<string, any>) => {
    console.log(JSON.stringify({ level: 'info', message, ...context }));
  },
  error: (message: string, error?: Error, context?: Record<string, any>) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      ...context,
    }));
  },
};
```

---

## Immediate Next Steps Checklist

- [ ] **Day 1**: Set up testing framework, write 5 unit tests
- [ ] **Day 2**: Enhance error handling, add error types
- [ ] **Day 3**: Add input validation with Zod
- [ ] **Day 4**: Set up CI/CD pipeline
- [ ] **Day 5**: Add monitoring (Sentry) and logging
- [ ] **Week 2**: Write integration tests, set up Docker
- [ ] **Week 3**: Add caching, optimize queries

---

## Environment Variables to Add

Update `.env.example`:
```env
# Testing
NODE_ENV=development
LOG_LEVEL=debug

# Monitoring
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=development

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

This quick start guide gets you through the first week of critical improvements. Each day focuses on one key area that will significantly improve code quality and production readiness.
