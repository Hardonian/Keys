# Template Testing Guide

## Overview

The template testing framework validates that mega prompt templates:
- ✅ Customize correctly with all filter combinations
- ✅ Handle natural language inputs properly
- ✅ Replace variables correctly
- ✅ Render conditional blocks appropriately
- ✅ Handle edge cases gracefully

## Quick Start

```bash
cd templates/test
npm install
npm test
```

## Test Structure

### 1. Basic Template Tests (`template-test-framework.ts`)

Core testing framework that:
- Generates test cases for templates
- Runs individual test cases
- Validates expected outputs
- Generates test reports

### 2. Filter Combinations (`filter-combinations.ts`)

Generates all possible filter combinations:
- Style filters (8 variations)
- Output formats (6 variations)
- Tone variations (5 variations)
- Combined scenarios (100+ combinations)

### 3. Comprehensive Tests (`comprehensive-test.ts`)

Tests templates against:
- All filter combinations
- Natural language variations
- User profile variations
- Edge cases

## Running Tests

### Test All Templates
```bash
npm test
```
Runs basic tests for all templates and generates a report.

### Comprehensive Testing
```bash
npm run test:comprehensive
```
Runs exhaustive tests covering all combinations.

### Test Single Template
```bash
npm run test:single auth-jwt-middleware
```
Tests a specific template in detail.

## Test Coverage

### Filter Coverage
- ✅ All style filters (concise, detailed, technical, etc.)
- ✅ All output formats (markdown, json, code, etc.)
- ✅ All tone variations
- ✅ Combined filter scenarios
- ✅ Special flags (usePromptEngineering, etc.)

### Input Coverage
- ✅ Direct requests
- ✅ Question forms
- ✅ Imperative forms
- ✅ With context
- ✅ With requirements
- ✅ Casual language
- ✅ Formal language
- ✅ Urgent requests
- ✅ Constrained requests

### Profile Coverage
- ✅ Minimal profiles
- ✅ Role variations
- ✅ Stack combinations
- ✅ With company context
- ✅ With brand voice
- ✅ Complete profiles

### Edge Cases
- ✅ Empty inputs
- ✅ Very long inputs
- ✅ Special characters
- ✅ Missing variables
- ✅ Invalid configurations

## Test Validation

### Variable Replacement
Validates that all `{{variable}}` placeholders are replaced:
```typescript
expectedOutputs: {
  variableReplacements: {
    user_role: 'backend-engineer'
  }
}
```

### Conditional Blocks
Validates that `{{#if}}` blocks render correctly:
```typescript
expectedOutputs: {
  conditionalBlocks: {
    shouldInclude: ['security', 'Security'],
    shouldExclude: ['placeholder']
  }
}
```

### Content Validation
Checks for required/excluded content:
```typescript
expectedOutputs: {
  contains: ['authentication', 'middleware'],
  notContains: ['PLACEHOLDER', '{{variable}}']
}
```

## Test Report

After running tests, a detailed report is generated:

```markdown
# Template Test Report

## auth-jwt-middleware
**Status**: 45/50 passed

### Failed Tests (5)
- auth-jwt-middleware_style_technical: Variable replacement failed
  - Errors: Variable user_role not replaced

## Summary
- Total Tests: 500
- Passed: 485 (97.0%)
- Failed: 15 (3.0%)
```

## Adding Test Cases

### Add Filter Combination
```typescript
// In filter-combinations.ts
combinations.push({
  name: 'new_filter',
  filter: { style: 'new_style' },
  description: 'New filter combination',
});
```

### Add Natural Language Variation
```typescript
// In filter-combinations.ts
const variations = [
  ...existingVariations,
  `New variation: ${baseTask}`,
];
```

### Add User Profile
```typescript
// In filter-combinations.ts
profiles.push({
  name: 'new_profile',
  profile: { role: 'new_role', stack: {} },
});
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test-templates.yml
name: Test Templates
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd templates/test && npm install && npm test
```

## Best Practices

1. **Test Comprehensively**: Cover all filter combinations
2. **Test Edge Cases**: Empty inputs, special chars, etc.
3. **Validate Variables**: Ensure all variables are replaced
4. **Check Conditionals**: Verify conditional blocks work
5. **Monitor Performance**: Track test execution time
6. **Update Tests**: Add tests when adding new templates
7. **Review Failures**: Investigate and fix failing tests
8. **Document Changes**: Update tests when templates change

## Troubleshooting

### Tests Failing
- Check template YAML syntax
- Verify variable names match
- Review conditional block syntax
- Check expected outputs

### Slow Tests
- Reduce test case count
- Test templates in parallel
- Cache template loading
- Optimize variable replacement

### False Positives
- Review expected outputs
- Check variable replacement logic
- Verify conditional block logic
- Test manually to confirm

## Next Steps

1. Run initial test suite
2. Review test report
3. Fix any failing tests
4. Add tests for new templates
5. Integrate into CI/CD pipeline
6. Monitor test results over time
