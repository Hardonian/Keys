# Scaffold Templates Integration Guide

This document explains how the scaffold template system integrates with the existing prompt assembly engine.

## Architecture

The scaffold template system is integrated into the existing prompt assembly flow:

```
User Request → Prompt Assembly Service
                    ↓
            Detect Scaffold Task?
                    ↓
        Yes → Scaffold Template Service
                    ↓
        Generate Template-Based Prompt
                    ↓
        Apply Input Filters (if any)
                    ↓
        Return PromptAssemblyResult
```

## Integration Points

### 1. Prompt Assembly Service (`promptAssembly.ts`)

The `assemblePrompt` function now detects scaffold tasks and routes them to the scaffold template service:

```typescript
// Automatic detection
const isScaffoldTask = isScaffoldingTask(taskDescription);

if (isScaffoldTask) {
  return assembleScaffoldPrompt(userId, taskDescription, vibeConfig, inputFilter);
}
```

### 2. Scaffold Template Service (`scaffoldTemplateService.ts`)

The service provides:
- Template loading and filtering
- Template adaptation for different tech stacks
- Prompt generation from templates
- Integration with user profiles

### 3. API Routes (`scaffold-templates.ts`)

New endpoints:
- `GET /scaffold-templates` - List templates with filtering
- `GET /scaffold-templates/:id` - Get specific template
- `POST /scaffold-templates/generate` - Generate scaffold prompt
- `GET /scaffold-templates/recommended` - Get recommended templates

## Usage Examples

### Automatic Scaffold Detection

When a user requests scaffolding, it's automatically detected:

```bash
POST /assemble-prompt
{
  "userId": "...",
  "taskDescription": "Scaffold authentication middleware with JWT",
  "vibeConfig": {...}
}
```

The system will:
1. Detect this is a scaffold task
2. Load user profile
3. Get recommended templates (auth-jwt-middleware, etc.)
4. Adapt templates to user's stack
5. Generate system and user prompts
6. Return PromptAssemblyResult

### Manual Template Selection

```bash
POST /scaffold-templates/generate
{
  "taskDescription": "Setup API routes with validation",
  "templateIds": [
    "api-route-structure",
    "api-validation-middleware",
    "api-error-handling"
  ],
  "adaptationConfig": {
    "framework": "express",
    "database": "supabase",
    "authMethod": "jwt"
  }
}
```

### Template Filtering

```bash
GET /scaffold-templates?milestone=04-api-routes&stack=express&security_level=required
```

## Template Adaptation

Templates are automatically adapted based on:

1. **User Profile Stack**: Inferred from `userProfile.stack`
2. **Task Description**: Keywords detected (e.g., "supabase", "nextjs")
3. **Explicit Config**: Provided in `adaptationConfig`

### Framework Adaptations

- **Express**: Standard Express middleware patterns
- **Fastify**: Fastify plugin patterns
- **Next.js**: Next.js API route patterns

### Database Adaptations

- **PostgreSQL**: pg library patterns
- **Supabase**: Supabase client patterns
- **MongoDB**: MongoDB driver patterns

### Auth Method Adaptations

- **JWT**: jsonwebtoken library
- **OAuth**: OAuth2Client patterns
- **Session**: express-session patterns

## Template Structure

Templates are stored as YAML files in `templates/milestones/{milestone}/{template-id}.yaml`:

```yaml
id: template-id
milestone: 02-authentication
name: Template Name
description: What it does
priority: high|medium|low
dependencies: [other-template-ids]
tags: [relevant, tags]
stack: [express, typescript]
security_level: required|recommended|optional
optimization_level: required|recommended|optional
content: |
  Template code with {{placeholders}}
variables:
  - name: placeholder_name
    description: What this represents
    required: true
    default: default_value
```

## Security & Optimization

All templates include:
- **Security considerations**: Built into template content
- **Optimization notes**: Performance best practices
- **Security level**: Required/recommended/optional
- **Optimization level**: Required/recommended/optional

Templates are filtered by these levels when generating recommendations.

## Adding New Templates

1. Create YAML file in appropriate milestone directory
2. Add entry to `catalog.json`
3. Template will be automatically loaded on service startup
4. Use placeholders for adaptation: `{{framework}}`, `{{database}}`, etc.

## Future Enhancements

- Template versioning
- Template testing framework
- Template marketplace
- Community contributions
- Template analytics and success metrics
