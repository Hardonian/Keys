# Example Workflow: Customizing Templates

This guide walks through a complete example of customizing and using templates.

## Scenario

You're a backend engineer working on a new Express + Supabase project. You want to customize the authentication middleware template to match your team's standards.

## Step 1: Browse Templates

First, see what templates are available for authentication:

```bash
GET /user-templates/milestone/02-authentication
```

**Response:**
```json
{
  "milestone": "02-authentication",
  "templates": [
    {
      "templateId": "auth-jwt-middleware",
      "name": "JWT Authentication Middleware",
      "description": "Comprehensive prompt for implementing secure JWT authentication",
      "basePrompt": "You are an expert developer...",
      "hasCustomization": false
    },
    {
      "templateId": "auth-rbac-middleware",
      "name": "Role-Based Access Control",
      "hasCustomization": false
    }
  ]
}
```

## Step 2: Preview Base Template

Review the default template:

```bash
GET /user-templates/auth-jwt-middleware/preview
```

**Response:**
```json
{
  "templateId": "auth-jwt-middleware",
  "milestone": "02-authentication",
  "name": "JWT Authentication Middleware",
  "description": "Comprehensive prompt for implementing secure JWT authentication",
  "basePrompt": "You are an expert developer.\n\nRole: developer\nFramework: Express\n\n## Task: JWT Authentication Middleware Implementation\n\nImplement a production-ready JWT authentication middleware...",
  "customizedPrompt": null,
  "hasCustomization": false
}
```

You can see the base template uses generic defaults.

## Step 3: Customize Template

Now customize it for your needs:

```bash
POST /user-templates/auth-jwt-middleware/customize
{
  "customVariables": {
    "user_role": "backend-engineer",
    "framework": {
      "express": true
    },
    "database": {
      "supabase": true
    },
    "use_caching": true,
    "security_focus": true,
    "performance_focus": true
  },
  "customInstructions": "Always use TypeScript strict mode, include comprehensive error handling, add request ID logging, and follow our team's coding standards. Include JSDoc comments for all functions."
}
```

**Response:**
```json
{
  "customization": {
    "id": "custom-id",
    "user_id": "your-user-id",
    "template_id": "auth-jwt-middleware",
    "custom_variables": {
      "user_role": "backend-engineer",
      "framework": { "express": true },
      "database": { "supabase": true },
      "use_caching": true,
      "security_focus": true,
      "performance_focus": true
    },
    "custom_instructions": "Always use TypeScript strict mode...",
    "enabled": true
  },
  "preview": {
    "basePrompt": "...",
    "customizedPrompt": "You are an expert backend-engineer.\n\nRole: backend-engineer\nFramework: Express\nDatabase: Supabase\n\n## Task: JWT Authentication Middleware Implementation\n\nImplement a production-ready JWT authentication middleware...\n\nPerformance: Cache token verification\n\nAdditional Instructions: Always use TypeScript strict mode, include comprehensive error handling...",
    "hasCustomization": true
  }
}
```

Notice how the customized prompt now:
- Uses "backend-engineer" instead of generic "developer"
- Specifies Express framework
- Includes Supabase database
- Shows caching performance note
- Includes your custom instructions

## Step 4: Verify Customization

Check your customization:

```bash
GET /user-templates/auth-jwt-middleware/preview
```

You'll see both base and customized versions side-by-side.

## Step 5: Use Your Customized Template

Now when you request a scaffold task:

```bash
POST /assemble-prompt
{
  "userId": "your-user-id",
  "taskDescription": "Setup JWT authentication middleware with rate limiting",
  "vibeConfig": {
    "playfulness": 20,
    "revenue_focus": 80
  },
  "inputFilter": {
    "style": "technical",
    "outputFormat": "code"
  }
}
```

**What Happens:**
1. System detects "authentication" keyword → scaffold task
2. Finds recommended templates → includes "auth-jwt-middleware"
3. Checks for your customization → finds it!
4. Uses your customized template → generates prompt with your settings
5. Applies input filters → technical style, code format

**Response:**
```json
{
  "systemPrompt": "You are an expert backend-engineer.\n\nRole: backend-engineer\nFramework: Express\nDatabase: Supabase\n\n[Your customized template content]\n\nAdditional Instructions: Always use TypeScript strict mode...",
  "userPrompt": "Task: Setup JWT authentication middleware with rate limiting\n\n[Technical style applied]",
  "context": {
    "userRole": "backend-engineer",
    "executionConstraints": {
      "templates": [
        {
          "id": "auth-jwt-middleware",
          "name": "JWT Authentication Middleware",
          "milestone": "02-authentication"
        }
      ]
    }
  }
}
```

The system automatically used your customized template!

## Step 6: Update Customization

Later, you want to add more instructions:

```bash
PATCH /user-templates/auth-jwt-middleware/customize
{
  "customInstructions": "Always use TypeScript strict mode, include comprehensive error handling, add request ID logging, follow our team's coding standards, include JSDoc comments, and add unit tests for all middleware functions."
}
```

## Step 7: Temporarily Disable

Want to test base template again?

```bash
PATCH /user-templates/auth-jwt-middleware/customize
{
  "enabled": false
}
```

Now system uses base template.

## Step 8: Re-enable

```bash
PATCH /user-templates/auth-jwt-middleware/customize
{
  "enabled": true
}
```

Back to your customization.

## Step 9: Revert to Base

If customization doesn't work out:

```bash
DELETE /user-templates/auth-jwt-middleware/customize
```

**Response:**
```json
{
  "message": "Customization deleted, reverted to base template",
  "preview": {
    "basePrompt": "...",
    "customizedPrompt": null,
    "hasCustomization": false
  }
}
```

## Step 10: View All Customizations

See all your customizations:

```bash
GET /user-templates/customizations
```

**Response:**
```json
{
  "customizations": [
    {
      "template_id": "auth-jwt-middleware",
      "custom_variables": {...},
      "custom_instructions": "...",
      "enabled": true,
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "template_id": "api-validation-middleware",
      "custom_variables": {...},
      "enabled": true
    }
  ],
  "count": 2
}
```

## Step 11: Reset All

Start fresh:

```bash
POST /user-templates/reset
```

**Response:**
```json
{
  "message": "All customizations reset to base templates"
}
```

All templates revert to base versions.

## Key Takeaways

1. **Start with Base**: Always review base template first
2. **Customize Gradually**: Make small changes and test
3. **Automatic Usage**: System uses your customizations automatically
4. **Easy Revert**: Delete customization anytime
5. **User-Specific**: Your customizations don't affect others
6. **Backend-Only**: All logic happens in backend

## Best Practices

- ✅ Review base template before customizing
- ✅ Start with small customizations
- ✅ Test with actual scaffold tasks
- ✅ Use variables for flexibility
- ✅ Add clear custom instructions
- ✅ Document why you customized (in instructions)
- ✅ Iterate based on results
