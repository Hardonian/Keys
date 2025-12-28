# Template Testing Framework

Comprehensive testing framework for validating mega prompt templates against all filter combinations and natural language inputs.

## Overview

The testing framework ensures that:
- ✅ Templates customize correctly with all filter combinations
- ✅ Natural language inputs are handled properly
- ✅ Variable replacement works as expected
- ✅ Conditional blocks render correctly
- ✅ Edge cases are handled gracefully

## Test Coverage

### Filter Combinations
- All style filters (concise, detailed, technical, etc.)
- All output formats (markdown, json, code, etc.)
- All tone variations
- Combined filter scenarios

### Natural Language Inputs
- Direct requests: "Setup authentication"
- Questions: "How do I setup authentication?"
- Imperatives: "Create authentication middleware"
- With context: "Setup authentication for my project"
- With requirements: "Create secure authentication"
- Casual: "Hey, can you setup authentication?"
- Formal: "I would like to request assistance..."

### User Profile Variations
- Minimal profile
- Backend engineer with Express
- Fullstack with Next.js + Supabase
- DevOps focused
- PM with context
- Complete profile with all fields

### Edge Cases
- Empty inputs
- Very long inputs
- Special characters
- Missing variables
- Invalid configurations

## Running Tests

### Test All Templates
```bash
npm test
```

### Comprehensive Testing
```bash
npm run test:comprehensive
```

### Test Single Template
```bash
npm run test:single auth-jwt-middleware
```

## Test Structure

### Test Case Format
```typescript
{
  name: "template_id_test_name",
  description: "What this test validates",
  templateId: "auth-jwt-middleware",
  userProfile: { role: "developer", stack: {} },
  inputFilter: { style: "technical" },
  taskDescription: "Setup authentication",
  expectedOutputs: {
    contains: ["authentication"],
    variableReplacements: { user_role: "developer" },
    conditionalBlocks: { shouldInclude: ["security"] }
  }
}
```

### Test Results
```typescript
{
  testCase: TestCase,
  passed: boolean,
  errors: string[],
  warnings: string[],
  actualOutput?: string,
  variableChecks?: Record<string, { expected, actual, passed }>
}
```

## Test Report

After running tests, a detailed report is generated in `test-report.md`:

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

## Adding New Tests

### Add Filter Combination
Edit `filter-combinations.ts`:
```typescript
combinations.push({
  name: 'new_filter',
  filter: { style: 'new_style' },
  description: 'New filter combination',
});
```

### Add Natural Language Variation
Edit `filter-combinations.ts`:
```typescript
const variations = [
  ...existingVariations,
  `New variation: ${baseTask}`,
];
```

### Add User Profile Variation
Edit `filter-combinations.ts`:
```typescript
profiles.push({
  name: 'new_profile',
  profile: { role: 'new_role', stack: {} },
});
```

## Validation Checks

The framework validates:

1. **Variable Replacement**: All `{{variable}}` placeholders are replaced
2. **Conditional Blocks**: `{{#if}}` blocks render correctly
3. **Expected Content**: Required strings appear in output
4. **Excluded Content**: Forbidden strings don't appear
5. **Error Handling**: Templates handle edge cases gracefully

## Continuous Testing

For CI/CD integration:

```yaml
# .github/workflows/test-templates.yml
name: Test Templates
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd templates/test && npm test
```

## Best Practices

1. **Test Comprehensively**: Cover all filter combinations
2. **Test Edge Cases**: Empty inputs, special chars, etc.
3. **Validate Variables**: Ensure all variables are replaced
4. **Check Conditionals**: Verify conditional blocks work
5. **Monitor Performance**: Track test execution time
6. **Update Tests**: Add tests when adding new templates

## Troubleshooting

### Tests Failing
1. Check template syntax (YAML valid?)
2. Verify variable names match
3. Check conditional block syntax
4. Review expected outputs

### Slow Tests
1. Reduce test case count
2. Test templates in parallel
3. Cache template loading
4. Optimize variable replacement

### False Positives
1. Review expected outputs
2. Check variable replacement logic
3. Verify conditional block logic
4. Test manually to confirm
