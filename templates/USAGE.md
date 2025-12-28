# Scaffold Templates Usage Guide

## Overview

The scaffold template system provides reusable, milestone-based templates for scaffolding full-stack applications. Templates are automatically integrated into the prompt assembly engine and can be used through the API or directly in code.

## Quick Start

### 1. Automatic Usage (Recommended)

Simply describe a scaffolding task in your prompt request:

```bash
POST /assemble-prompt
{
  "userId": "user-uuid",
  "taskDescription": "Scaffold authentication middleware with JWT and rate limiting",
  "vibeConfig": {
    "playfulness": 30,
    "revenue_focus": 70
  }
}
```

The system will:
- Detect this is a scaffold task
- Load your user profile (stack, role, etc.)
- Recommend appropriate templates
- Adapt templates to your tech stack
- Generate optimized prompts

### 2. Manual Template Selection

Get recommended templates for a task:

```bash
GET /scaffold-templates/recommended?taskDescription=setup%20API%20routes
```

Generate prompt from specific templates:

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

## Template Filtering

Filter templates by various criteria:

```bash
# By milestone
GET /scaffold-templates?milestone=02-authentication,04-api-routes

# By tech stack
GET /scaffold-templates?stack=express,typescript

# By priority
GET /scaffold-templates?priority=high

# By security level
GET /scaffold-templates?security_level=required

# By tags
GET /scaffold-templates?tags=middleware,security

# Combined filters
GET /scaffold-templates?milestone=04-api-routes&stack=express&security_level=required&priority=high
```

## Milestones

Templates are organized by project milestones:

1. **01-initialization**: Project setup, structure, dependencies
2. **02-authentication**: Auth flows, tokens, sessions
3. **03-database-schema**: Tables, RLS policies, migrations
4. **04-api-routes**: REST endpoints, middleware, validation
5. **05-frontend-routes**: Pages, components, routing
6. **06-security-hardening**: Headers, CSRF, sanitization
7. **07-performance-optimization**: Caching, compression, optimization
8. **08-testing**: Unit, integration, E2E tests
9. **09-ci-cd**: GitHub Actions, quality gates
10. **10-deployment**: Docker, env configs, monitoring

## Template Adaptation

Templates automatically adapt to your tech stack:

### Framework Adaptation

- **Express**: Standard Express patterns
- **Fastify**: Fastify plugin patterns  
- **Next.js**: Next.js API route patterns

### Database Adaptation

- **PostgreSQL**: pg library with connection pooling
- **Supabase**: Supabase client with RLS
- **MongoDB**: MongoDB driver patterns

### Auth Method Adaptation

- **JWT**: jsonwebtoken with verification
- **OAuth**: OAuth2Client patterns
- **Session**: express-session with secure cookies

## Example Workflows

### Workflow 1: New Project Setup

```bash
# 1. Get initialization templates
GET /scaffold-templates?milestone=01-initialization

# 2. Generate setup prompt
POST /scaffold-templates/generate
{
  "taskDescription": "Initialize new Express + TypeScript + Supabase project",
  "templateIds": [
    "init-project-structure",
    "init-env-config",
    "init-typescript-config",
    "init-logging"
  ]
}
```

### Workflow 2: Authentication Setup

```bash
# 1. Get auth templates
GET /scaffold-templates?milestone=02-authentication&stack=express

# 2. Generate auth prompt
POST /scaffold-templates/generate
{
  "taskDescription": "Setup JWT authentication with role-based access control",
  "templateIds": [
    "auth-jwt-middleware",
    "auth-rbac-middleware"
  ],
  "adaptationConfig": {
    "framework": "express",
    "authMethod": "jwt"
  }
}
```

### Workflow 3: API Development

```bash
# 1. Get API templates
GET /scaffold-templates?milestone=04-api-routes&security_level=required

# 2. Generate API prompt
POST /scaffold-templates/generate
{
  "taskDescription": "Create REST API with validation, error handling, and rate limiting",
  "templateIds": [
    "api-route-structure",
    "api-validation-middleware",
    "api-error-handling",
    "api-rate-limiting"
  ]
}
```

### Workflow 4: Security Hardening

```bash
# 1. Get security templates
GET /scaffold-templates?milestone=06-security-hardening&security_level=required

# 2. Generate security prompt
POST /scaffold-templates/generate
{
  "taskDescription": "Implement security headers, CSRF protection, and input sanitization",
  "templateIds": [
    "security-headers",
    "security-csrf-protection",
    "security-input-sanitization"
  ]
}
```

## Template Variables

Templates support variables that can be customized:

```yaml
variables:
  - name: table_name
    description: Name of the table
    required: true
    default: "user_data"
    examples: ["profiles", "documents"]
```

Provide variables in `adaptationConfig.variables`:

```json
{
  "adaptationConfig": {
    "variables": {
      "table_name": "user_profiles",
      "api_domain": "api.example.com"
    }
  }
}
```

## Best Practices

1. **Start with Recommended Templates**: Use `/recommended` endpoint to get templates suited to your task
2. **Follow Milestone Order**: Templates are designed to be used in milestone order
3. **Check Dependencies**: Templates list their dependencies - ensure prerequisites are included
4. **Adapt to Your Stack**: Let the system infer your stack from profile, or provide explicit config
5. **Security First**: Always include security-level=required templates for production code
6. **Optimize Performance**: Include optimization-level=required templates for high-traffic apps

## Integration with Prompt Assembly

Scaffold templates are automatically integrated into the prompt assembly engine:

- Scaffold tasks are auto-detected
- Templates are recommended based on user profile
- Prompts are generated with security and optimization built-in
- Input filters can still be applied for style/format customization

## Error Handling

The system handles errors gracefully:

- Missing templates: Logged as warnings, service continues
- Invalid adaptations: Fallback to defaults
- Circular dependencies: Detected and reported
- Missing variables: Uses defaults or prompts for values

## Next Steps

- Review template catalog: `templates/catalog.json`
- Explore template files: `templates/milestones/`
- Check integration guide: `templates/INTEGRATION.md`
- Add custom templates: Follow template format and add to catalog
