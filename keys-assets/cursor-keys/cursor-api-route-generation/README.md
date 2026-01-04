# Cursor Keys: API Route Generation

**Version**: 1.0.0  
**Tool**: Cursor  
**Maturity**: Operator  
**Outcome**: Automation

---

## What This Key Unlocks

REST API route generation patterns for Cursor. This key unlocks:

- **CRUD Operation Scaffolding**: Complete Create, Read, Update, Delete routes
- **Request Validation Patterns**: Zod-based validation for all inputs
- **Error Handling Patterns**: Consistent error handling with proper HTTP status codes
- **Response Formatting Patterns**: Standardized API response structure
- **Type-Safe Routes**: Full TypeScript type safety

---

## Installation

1. **Copy the key** to your Cursor workspace:
   ```bash
   cp -r cursor-api-route-generation /path/to/your/project/.cursor/keys/
   ```

2. **Use in Cursor**:
   - Open Cursor Composer
   - Reference the prompt files when generating API routes
   - Use the composer instructions for guided generation

---

## Usage

### Using the Mega Prompt

1. **Open Cursor Composer**
2. **Reference the prompt file**:
   ```
   Use the API route generation patterns from prompts/api-route-generation.yaml
   ```
3. **Describe your resource**:
   ```
   Generate CRUD routes for a "products" resource with fields: name, price, description
   ```

### Using Composer Instructions

1. **Open Cursor Composer**
2. **Reference the instructions**:
   ```
   Follow the API route generation instructions from composer/instructions.md
   ```
3. **Ask for routes**:
   ```
   Generate REST API routes for users with authentication required
   ```

---

## Included Patterns

### CRUD Operations
- **Create**: POST /resource
- **Read**: GET /resource/:id
- **Update**: PUT /resource/:id
- **Delete**: DELETE /resource/:id
- **List**: GET /resource

### Validation Patterns
- Zod schemas for params, query, and body
- Descriptive error messages
- 400 Bad Request for invalid input

### Error Handling Patterns
- Try-catch blocks
- Appropriate HTTP status codes
- Error logging
- Consistent error response format

### Response Formatting Patterns
- Success: `{ success: true, data: T }`
- Error: `{ success: false, error: string }`
- Proper HTTP status codes

---

## Examples

### Example: User Routes

```typescript
// GET /api/users/:id
router.get(
  '/users/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = getUserParamsSchema.parse(req.params);
    const user = await db.users.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    res.json({ success: true, data: user });
  })
);
```

### Example: Create Route

```typescript
// POST /api/users
router.post(
  '/users',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userData = createUserSchema.parse(req.body);
    const existing = await db.users.findByEmail(userData.email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
      });
    }
    const user = await db.users.create(userData);
    res.status(201).json({ success: true, data: user });
  })
);
```

---

## Best Practices

1. **Always validate input** with Zod schemas
2. **Use TypeScript types** for type safety
3. **Handle errors gracefully** with try-catch
4. **Return consistent response format**
5. **Use async/await** for database operations
6. **Check authentication/authorization**
7. **Sanitize user inputs**
8. **Use parameterized queries** to prevent SQL injection

---

## Customization

Customize the prompts for your specific needs:

- **Framework**: Adjust for Express.js, Next.js, Fastify, etc.
- **Validation**: Modify Zod schemas for your validation needs
- **Error Handling**: Customize error response format
- **Authentication**: Adjust auth middleware usage

---

## Removal

To remove this key:

1. Delete the key directory from your workspace
2. Remove any references from Cursor settings

---

## Requirements

- Cursor IDE
- TypeScript project
- Express.js or Next.js
- Zod for validation (recommended)

---

## License

MIT
