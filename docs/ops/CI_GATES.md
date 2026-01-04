# CI GATES DOCUMENTATION
**Date**: 2025-01-04  
**Purpose**: Prevent regressions through automated checks

## Required CI Gates

All pull requests must pass these gates before merge:

### 1. Lint Checks
**Command**: `npm run lint`
**Scope**: Frontend + Backend
**Failure Action**: Block merge

**Configuration**:
- Frontend: Next.js ESLint
- Backend: ESLint with TypeScript parser

**Status**: ⚠️ Needs ESLint v9 migration (backend)

---

### 2. Type Checking
**Command**: `npm run type-check`
**Scope**: Frontend + Backend
**Failure Action**: Block merge

**Configuration**:
- Frontend: `tsc --noEmit`
- Backend: `tsc --noEmit`

**Status**: ✅ Configured

---

### 3. Unit Tests
**Command**: `npm test`
**Scope**: Frontend + Backend
**Failure Action**: Block merge
**Coverage Target**: 70%+

**Configuration**:
- Frontend: Vitest
- Backend: Vitest

**Status**: ✅ Configured

---

### 4. Integration Tests
**Command**: `npm run test:integration` (backend)
**Scope**: Backend
**Failure Action**: Block merge

**Configuration**:
- Backend: Vitest integration config

**Status**: ✅ Configured

---

### 5. E2E Tests
**Command**: `npm run test:e2e` (frontend)
**Scope**: Frontend
**Failure Action**: Warn (not block)

**Configuration**:
- Frontend: Playwright

**Status**: ✅ Configured

---

### 6. Schema Validation
**Command**: `tsx keys-assets/tools/validate_assets.ts`
**Scope**: keys-assets directory
**Failure Action**: Block merge

**Purpose**: Validate key.json, pack.json, library.json schemas

**Status**: ⚠️ Needs CI integration

---

### 7. Security Checks

#### 7.1 Dependency Audit
**Command**: `npm audit --audit-level=moderate`
**Scope**: Frontend + Backend
**Failure Action**: Warn (not block initially)

**Status**: ⚠️ Needs CI integration

**Action Required**: Add to CI pipeline

#### 7.2 Secret Scanning
**Tool**: GitHub Secret Scanning (if available)
**Scope**: All files
**Failure Action**: Block merge

**Status**: ✅ Enabled (GitHub default)

---

### 8. Build Verification
**Command**: `npm run build`
**Scope**: Frontend + Backend
**Failure Action**: Block merge

**Status**: ✅ Configured

---

## CI Pipeline Structure

### Recommended GitHub Actions Workflow

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm audit --audit-level=moderate || true
      # Note: || true prevents failure, but warnings are shown

  schema-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm install -g tsx
      - run: tsx keys-assets/tools/validate_assets.ts
```

## Current Status

### ✅ Implemented
- Type checking
- Unit tests
- Integration tests
- E2E tests (frontend)
- Build verification

### ⚠️ Needs Implementation
- ESLint v9 migration (backend)
- Schema validation in CI
- Dependency audit in CI
- Test coverage reporting

### ❌ Not Implemented
- Secret scanning (GitHub default may be enabled)
- Performance regression tests
- Accessibility tests (axe-core)

## Recommendations

### High Priority
1. **Add Dependency Audit to CI**
   - Run `npm audit` on every PR
   - Fail on critical vulnerabilities
   - Warn on moderate vulnerabilities

2. **Add Schema Validation to CI**
   - Validate keys-assets on every PR
   - Fail if schemas invalid

3. **Fix ESLint Configuration**
   - Migrate backend to ESLint v9
   - Or downgrade to ESLint v8

### Medium Priority
4. **Add Test Coverage Reporting**
   - Use Codecov or similar
   - Require minimum coverage
   - Show coverage diff in PR

5. **Add Accessibility Tests**
   - Use @axe-core/react
   - Run in CI
   - Fail on violations

### Low Priority
6. **Add Performance Regression Tests**
   - Lighthouse CI
   - Track bundle size
   - Track API response times

## Enforcement

### Branch Protection Rules
Recommended settings for `main` branch:
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Required status checks:
  - `lint`
  - `type-check`
  - `test`
  - `build`
  - `schema-validation`

### Pre-commit Hooks (Optional)
Consider using Husky for pre-commit hooks:
- Lint staged files
- Type check staged files
- Run tests for changed files

## Monitoring

### CI Metrics to Track
1. **Build Time**
   - Target: < 5 minutes
   - Alert if > 10 minutes

2. **Test Duration**
   - Target: < 2 minutes
   - Alert if > 5 minutes

3. **Failure Rate**
   - Target: < 5%
   - Alert if > 10%

4. **Flaky Tests**
   - Track tests that fail intermittently
   - Fix or remove flaky tests

## Next Steps

1. ✅ Document CI gates (done)
2. ⏭️ Implement dependency audit in CI
3. ⏭️ Implement schema validation in CI
4. ⏭️ Fix ESLint configuration
5. ⏭️ Add test coverage reporting
