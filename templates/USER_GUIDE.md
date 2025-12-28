# User Template Customization Guide

## Overview

The template system allows you to customize mega prompt templates to match your preferences. You start with default base templates and can modify them to create your own customized versions.

## How It Works

1. **Base Templates**: Default, comprehensive prompts for each milestone
2. **Customization**: Modify variables and instructions to match your needs
3. **Usage**: System automatically uses your customized version when generating prompts
4. **Revert**: Delete customization to return to base template

## Getting Started

### 1. View Base Template

First, see what the default template looks like:

```bash
GET /user-templates/:templateId/preview
```

Response shows:
- Base template (default version)
- Your customized version (if you've customized it)
- Whether you have customizations

### 2. Browse Templates by Milestone

See all templates for a milestone:

```bash
GET /user-templates/milestone/02-authentication
```

Shows all authentication templates with base and customized previews.

### 3. Customize a Template

Save your customizations:

```bash
POST /user-templates/:templateId/customize
{
  "customVariables": {
    "user_role": "staff-engineer",
    "security_focus": true,
    "performance_focus": true
  },
  "customInstructions": "Always include TypeScript types and error handling"
}
```

### 4. Use Your Customized Template

When you request a scaffold task, the system automatically uses your customized template:

```bash
POST /assemble-prompt
{
  "taskDescription": "Setup authentication middleware",
  ...
}
```

The system will:
- Detect it's a scaffold task
- Find recommended templates
- Use your customized versions if available
- Fall back to base templates if not customized

## Customization Options

### Custom Variables

Override template variables:

```json
{
  "customVariables": {
    "user_role": "backend-engineer",
    "framework": { "express": true },
    "database": { "supabase": true },
    "security_focus": true,
    "performance_focus": true
  }
}
```

### Custom Instructions

Add your own instructions:

```json
{
  "customInstructions": "Always use async/await, include JSDoc comments, and follow our company's coding standards"
}
```

## API Endpoints

### Get Template Preview
```bash
GET /user-templates/:templateId/preview
```
Shows base and customized versions side-by-side.

### Customize Template
```bash
POST /user-templates/:templateId/customize
{
  "customVariables": {...},
  "customInstructions": "..."
}
```
Saves your customization.

### Update Customization
```bash
PATCH /user-templates/:templateId/customize
{
  "customVariables": {...},
  "customInstructions": "...",
  "enabled": true
}
```
Updates existing customization.

### Delete Customization
```bash
DELETE /user-templates/:templateId/customize
```
Reverts to base template.

### Get All Customizations
```bash
GET /user-templates/customizations
```
Lists all your customizations.

### Reset All
```bash
POST /user-templates/reset
```
Deletes all customizations, reverts all to base.

### Generate Prompt
```bash
POST /user-templates/:templateId/generate
{
  "taskDescription": "...",
  "inputFilter": {...}
}
```
Generates prompt using your customized template (or base if not customized).

## Example Workflow

### Step 1: Explore Base Template
```bash
GET /user-templates/auth-jwt-middleware/preview
```

See the default authentication middleware template.

### Step 2: Customize It
```bash
POST /user-templates/auth-jwt-middleware/customize
{
  "customVariables": {
    "user_role": "security-engineer",
    "use_caching": true
  },
  "customInstructions": "Focus on security best practices and include rate limiting"
}
```

### Step 3: Verify Customization
```bash
GET /user-templates/auth-jwt-middleware/preview
```

Now shows your customized version.

### Step 4: Use It
```bash
POST /assemble-prompt
{
  "taskDescription": "Setup JWT authentication",
  ...
}
```

System automatically uses your customized template!

### Step 5: Revert if Needed
```bash
DELETE /user-templates/auth-jwt-middleware/customize
```

Back to base template.

## Best Practices

1. **Start with Base**: Always review the base template first
2. **Customize Gradually**: Make small changes and test
3. **Use Variables**: Leverage template variables for flexibility
4. **Add Instructions**: Use custom instructions for specific requirements
5. **Test Changes**: Generate prompts to see how customizations affect output
6. **Document**: Note why you customized (in customInstructions)

## Tips

- **Variables**: Override template variables to match your stack
- **Instructions**: Add company-specific or project-specific guidance
- **Enable/Disable**: Temporarily disable customizations without deleting
- **Multiple Templates**: Customize templates for different use cases
- **Reset**: Easy to revert if customization doesn't work out

## Security

- All customizations are user-specific
- Only you can see/modify your customizations
- Base templates remain unchanged
- Customizations are stored securely in database

## Support

If you have questions:
1. Check template documentation
2. Review base template structure
3. Test with small customizations first
4. Contact support if needed
