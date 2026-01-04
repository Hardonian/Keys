# Cursor Keys

**Cursor Keys are structured prompt packs and Composer instructions that unlock practical, repeatable capability in Cursor.**

This directory contains Cursor Keys—prompt templates and Composer instructions that unlock advanced workflows, patterns, and capabilities in Cursor. You already have Cursor. These keys show you how to use it effectively.

## How Cursor Keys Work

1. **Base Keys**: Default, comprehensive prompt templates that unlock Cursor workflows
2. **Customize**: Modify variables and instructions to match your needs  
3. **Automatic Usage**: System uses your customized key when generating prompts in Cursor
4. **Easy Revert**: Delete customization to return to base key

**Remember**: Cursor Keys don't replace Cursor—they unlock capability in Cursor.

## User Flow

```
1. View Base Cursor Key
   ↓
2. See Default Prompt Pattern
   ↓
3. Customize Variables/Instructions
   ↓
4. Save Customization
   ↓
5. Use Cursor with Your Customized Key
   ↓
6. Unlock Capability in Cursor
   ↓
7. (Optional) Revert to Base Key
```

## Quick Start

### 1. View Base Template

```bash
GET /user-templates/auth-jwt-middleware/preview
```

**Response:**
```json
{
  "templateId": "auth-jwt-middleware",
  "name": "JWT Authentication Middleware",
  "basePrompt": "You are an expert... [default base template]",
  "customizedPrompt": null,
  "hasCustomization": false
}
```

### 2. Customize Template

```bash
POST /user-templates/auth-jwt-middleware/customize
{
  "customVariables": {
    "user_role": "security-engineer",
    "use_caching": true
  },
  "customInstructions": "Focus on security best practices"
}
```

**Response:**
```json
{
  "customization": { ... },
  "preview": {
    "basePrompt": "...",
    "customizedPrompt": "You are an expert security-engineer... [your customized version]",
    "hasCustomization": true
  }
}
```

### 3. Use Your Customized Template

When you request a scaffold task:

```bash
POST /assemble-prompt
{
  "taskDescription": "Setup JWT authentication",
  ...
}
```

The system automatically:
- ✅ Detects scaffold task
- ✅ Finds recommended templates
- ✅ Uses your customized version (if customized)
- ✅ Falls back to base (if not customized)

## API Endpoints

### User-Facing (Requires Auth)

- `GET /user-templates/milestone/:milestone` - Browse templates by milestone
- `GET /user-templates/:templateId/preview` - View base and customized versions
- `POST /user-templates/:templateId/customize` - Save customization
- `PATCH /user-templates/:templateId/customize` - Update customization
- `DELETE /user-templates/:templateId/customize` - Revert to base
- `GET /user-templates/customizations` - List all your customizations
- `POST /user-templates/reset` - Reset all customizations
- `POST /user-templates/:templateId/generate` - Generate prompt with your customization

### Internal/Admin (Requires Auth)

- `GET /scaffold-templates` - List all templates (admin)
- `GET /scaffold-templates/:id` - Get template details (admin)
- `POST /scaffold-templates/generate` - Generate prompt (admin)

## Template Structure

Templates are stored as `.prompt.yaml` files:

```yaml
id: template-id
milestone: 02-authentication
name: Template Name
description: What it does

mega_prompt: |
  You are an expert {{user_role|default:developer}}.
  
  {{#if security_focus}}
  Security Requirements: ...
  {{/if}}

variables:
  - name: user_role
    description: User's role
    default: "developer"
```

## Customization Options

### Custom Variables

Override template variables:

```json
{
  "customVariables": {
    "user_role": "backend-engineer",
    "framework": { "express": true },
    "security_focus": true
  }
}
```

### Custom Instructions

Add your own instructions:

```json
{
  "customInstructions": "Always use TypeScript, include error handling, follow our coding standards"
}
```

## Example Workflow

### Step 1: Explore
```bash
GET /user-templates/milestone/02-authentication
```
See all authentication templates with base versions.

### Step 2: Preview Base
```bash
GET /user-templates/auth-jwt-middleware/preview
```
Review the default template.

### Step 3: Customize
```bash
POST /user-templates/auth-jwt-middleware/customize
{
  "customVariables": { "user_role": "security-engineer" },
  "customInstructions": "Focus on security"
}
```

### Step 4: Verify
```bash
GET /user-templates/auth-jwt-middleware/preview
```
Now shows your customized version.

### Step 5: Use
```bash
POST /assemble-prompt
{
  "taskDescription": "Setup authentication"
}
```
System uses your customized template automatically!

## Benefits

✅ **Unlocks Cursor**: Provides keys to unlock advanced Cursor workflows  
✅ **User-Friendly**: Simple API, clear flow  
✅ **Flexible**: Customize variables and instructions  
✅ **Automatic**: System uses your customizations automatically  
✅ **Reversible**: Easy to revert to base  
✅ **Secure**: User-specific customizations  
✅ **Backend-Only**: All logic in backend, clean separation

**Key Principle**: Cursor Keys unlock capability in Cursor. They don't compete with Cursor—they amplify it.  

## Documentation

- **USER_GUIDE.md**: Detailed user guide
- **CONCEPT.md**: Mega prompt concept explanation
- **INTEGRATION.md**: Technical integration details
- **TESTING.md**: Testing framework documentation

## Security

- All customizations are user-specific
- Only you can see/modify your customizations
- Base templates remain unchanged
- RLS policies protect user data

## Next Steps

1. Review base templates
2. Customize templates to your needs
3. Use scaffold tasks - system uses your customizations
4. Iterate and refine customizations
