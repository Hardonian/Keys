# Cursor Composer Instructions: API Route Generation

## Context
You are helping generate production-ready REST API routes with CRUD operations, validation, error handling, and proper response formatting.

## Requirements

### 1. Route Structure
- Use Express.js Router or Next.js API route handler
- Follow RESTful conventions (GET, POST, PUT, DELETE)
- Include proper TypeScript types
- Use async/await for all async operations

### 2. Request Validation
- Use Zod for request body/query/params validation
- Create separate schemas for each route
- Return 400 Bad Request for invalid input
- Include descriptive error messages

### 3. Error Handling
- Use try-catch blocks or asyncHandler wrapper
- Return appropriate HTTP status codes:
  - 200: Success
  - 201: Created
  - 204: No Content (for DELETE)
  - 400: Bad Request (validation errors)
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found
  - 409: Conflict (duplicate entries)
  - 500: Internal Server Error
- Include error logging
- Return consistent error response format

### 4. Response Formatting
- Use consistent response structure:
  ```typescript
  {
    success: boolean;
    data?: T;
    error?: string;
  }
  ```
- Set proper Content-Type headers
- Include appropriate status codes

### 5. Database Operations
- Use async/await
- Handle database errors gracefully
- Return 404 for not found resources
- Return 409 for conflicts (e.g., duplicate entries)
- Use transactions for multi-step operations

### 6. Security
- Validate user authentication (if required)
- Check authorization/permissions
- Sanitize inputs
- Use parameterized queries (prevent SQL injection)
- Validate user ownership of resources

## Example Structure

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Validation schemas
const createSchema = z.object({
  // Define fields
});

const updateSchema = z.object({
  // Define fields (all optional)
});

const paramsSchema = z.object({
  id: z.string().uuid(),
});

// Routes
router.post(
  '/resource',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    // Implementation
  })
);

router.get(
  '/resource/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = paramsSchema.parse(req.params);
    // Implementation
  })
);

router.put(
  '/resource/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = paramsSchema.parse(req.params);
    const updates = updateSchema.parse(req.body);
    // Implementation
  })
);

router.delete(
  '/resource/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = paramsSchema.parse(req.params);
    // Implementation
  })
);

export default router;
```

## When Generating Routes

1. **Ask for**: Resource name, fields, authentication requirements
2. **Generate**: Complete CRUD routes with validation
3. **Include**: Error handling, response formatting, TypeScript types
4. **Test**: Ensure all routes handle errors correctly

## Common Patterns

### Create Route (POST)
- Validate input with Zod
- Check for duplicates (return 409)
- Create resource
- Return 201 with created resource

### Read Route (GET)
- Validate params (UUID, etc.)
- Fetch resource
- Return 404 if not found
- Return 200 with resource

### Update Route (PUT)
- Validate params and body
- Check resource exists (return 404)
- Update resource
- Return 200 with updated resource

### Delete Route (DELETE)
- Validate params
- Check resource exists (return 404)
- Delete resource
- Return 204 No Content

### List Route (GET)
- Validate query params (pagination, filters)
- Fetch resources with pagination
- Return 200 with list and metadata
