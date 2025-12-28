# Mega Prompt Template Concept

## Overview

Mega prompts are **static, comprehensive prompt templates** that serve as trainable bases for AI models. They get dynamically modified with user inputs and filters to create optimized prompts for specific tasks.

## Why Mega Prompts?

### Problem with Dynamic Prompts

Traditional approaches generate prompts dynamically, which means:
- ❌ Inconsistent outputs across similar tasks
- ❌ Hard to train/fine-tune models
- ❌ Difficult to optimize and improve
- ❌ No reusable base structure

### Solution: Static Mega Prompts

Mega prompts provide:
- ✅ Consistent base structure
- ✅ Trainable templates
- ✅ Reusable across projects
- ✅ Easy to optimize and version
- ✅ Dynamic modification when needed

## Architecture

```
┌─────────────────────────────────────┐
│   Static Mega Prompt Template       │
│   (Comprehensive, Well-Structured)  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Variable Replacement Engine       │
│   - User Profile Data               │
│   - Input Filters                   │
│   - Custom Variables                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Final Optimized Prompt            │
│   (Ready for Model Training/Use)    │
└─────────────────────────────────────┘
```

## Template Structure

### Static Base

```yaml
mega_prompt: |
  You are an expert {{user_role}}.
  
  ## Context
  Framework: {{framework}}
  Database: {{database}}
  
  ## Task
  {{task_description}}
  
  ## Requirements
  {{#if security_focus}}
  - Security best practices required
  {{/if}}
  
  {{#if performance_focus}}
  - Performance optimization required
  {{/if}}
```

### Dynamic Modification

```javascript
// User Profile
{
  role: "backend-engineer",
  stack: { express: true, supabase: true }
}

// Input Filter
{
  style: "technical",
  outputFormat: "code"
}

// Result
"You are an expert backend-engineer.
 Framework: Express
 Database: Supabase
 ...
 [Technical style applied]"
```

## Benefits

### 1. Trainability

Static bases allow:
- Fine-tuning models on consistent prompts
- A/B testing different template versions
- Measuring improvement over time
- Creating specialized models per template

### 2. Consistency

Same base ensures:
- Similar tasks get similar structure
- Best practices always included
- Security considerations never missed
- Performance hints always present

### 3. Maintainability

Update once, affect all:
- Fix security issue in template
- Add new best practice
- Update framework patterns
- All uses automatically updated

### 4. Flexibility

Dynamic modification enables:
- Adapt to any tech stack
- Customize for user preferences
- Apply different styles/formats
- Override defaults when needed

## Variable System

### Simple Variables
```yaml
{{variable_name}}
{{variable_name|default:fallback}}
```

### Conditional Logic
```yaml
{{#if condition}}
  Show if true
{{/if}}

{{#unless condition}}
  Show if false
{{/unless}}
```

### Nested Access
```yaml
{{user.profile.role}}
{{stack.frontend.framework}}
```

## Modification Flow

1. **Load Template**: Read static mega prompt
2. **Extract Variables**: Identify all placeholders
3. **Gather Data**: From user profile, filters, custom vars
4. **Replace Variables**: Apply Handlebars-like replacement
5. **Apply Filters**: Style, format, tone modifications
6. **Final Prompt**: Ready for model use

## Training Workflow

```
1. Collect Mega Prompts
   ↓
2. Fine-tune Model on Templates
   ↓
3. Test with Dynamic Modifications
   ↓
4. Measure Performance
   ↓
5. Iterate on Templates
   ↓
6. Re-train Model
```

## Example: Authentication Template

### Static Base
```yaml
mega_prompt: |
  You are an expert security engineer.
  
  Implement JWT authentication for {{framework}}.
  
  Security Requirements:
  - Token validation
  - Error handling
  - User context extraction
  
  {{#if use_caching}}
  Performance: Cache token verification
  {{/if}}
```

### Modified for Express + Caching
```
You are an expert security engineer.

Implement JWT authentication for Express.

Security Requirements:
- Token validation
- Error handling
- User context extraction

Performance: Cache token verification
```

### Modified for Fastify + No Caching
```
You are an expert security engineer.

Implement JWT authentication for Fastify.

Security Requirements:
- Token validation
- Error handling
- User context extraction
```

## Best Practices

1. **Comprehensive Base**: Include all relevant context
2. **Clear Variables**: Well-documented placeholders
3. **Conditional Logic**: Use for optional features
4. **Defaults**: Always provide fallback values
5. **Security First**: Always include security considerations
6. **Performance Hints**: Include optimization notes
7. **Examples**: Show usage patterns
8. **Documentation**: Explain template purpose

## Future Enhancements

- Template versioning
- A/B testing framework
- Performance metrics per template
- Community template marketplace
- Template analytics dashboard
- Automated template optimization
