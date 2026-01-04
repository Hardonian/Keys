# Quick Start: Cursor API Route Generation

Generate production-ready API routes in Cursor in 2 minutes.

---

## Step 1: Copy Key to Cursor

Copy the key to your Cursor workspace:

```bash
cp -r cursor-api-route-generation ~/.cursor/keys/
```

---

## Step 2: Open Cursor Composer

Open Cursor Composer (Cmd/Ctrl + I)

---

## Step 3: Generate Routes

### Option A: Use Mega Prompt

```
Use the API route generation patterns from prompts/api-route-generation.yaml

Generate CRUD routes for a "products" resource with:
- name (string, required)
- price (number, required)
- description (string, optional)
- Authentication required
```

### Option B: Use Composer Instructions

```
Follow the API route generation instructions from composer/instructions.md

Generate REST API routes for users with:
- email (string, email, required)
- name (string, required)
- role (enum: 'user' | 'admin', default: 'user')
- Authentication required
```

---

## Step 4: Review Generated Code

Cursor will generate:
- ✅ Complete CRUD routes
- ✅ Zod validation schemas
- ✅ Error handling
- ✅ TypeScript types
- ✅ Consistent response format

---

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Customize prompts for your framework
- Generate routes for other resources

---

**That's it!** You now have production-ready API routes.
