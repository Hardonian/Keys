# Node / Next.js KEY QA Process

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — QA requirements for all Node/Next KEYS  
**Purpose**: Ensure KEYS are production-ready and safe to integrate

---

## Core Principle

**Every Node / Next.js KEY must pass all QA checks before being marketplace-ready.**

QA is not optional. It is mandatory.

---

## QA Checklist

### 1. Structure Validation

**Requirement**: KEY must follow canonical structure.

**Checks**:
- [ ] All required files exist (README.md, quickstart.md, key.json, src/index.ts, CHANGELOG.md, LICENSE.txt)
- [ ] `key.json` is valid JSON
- [ ] `src/index.ts` exists and exports at least one function
- [ ] Structure matches canonical format exactly

**Validation Script**:
```bash
npm run validate-key-structure <key-slug>
```

---

### 2. Metadata Validation

**Requirement**: `key.json` must be valid and complete.

**Checks**:
- [ ] All required fields present
- [ ] Field types are correct
- [ ] Version is valid semver
- [ ] Side effects are explicitly declared
- [ ] Required env vars are listed
- [ ] Routes are declared (if route key)
- [ ] Tenant scope is specified
- [ ] Compatibility requirements are specified

**Validation Script**:
```bash
npm run validate-key-metadata <key-slug>
```

---

### 3. Compilation Check

**Requirement**: KEY must compile without errors.

**Checks**:
- [ ] TypeScript compiles without errors
- [ ] No type errors
- [ ] No import errors
- [ ] All dependencies are declared

**Validation Script**:
```bash
cd node-keys/<key-slug>
npm install
npm run build
```

---

### 4. Test Suite

**Requirement**: KEY must have passing tests.

**Checks**:
- [ ] Unit tests exist and pass
- [ ] Integration tests exist (if applicable)
- [ ] Failure mode tests exist
- [ ] Test coverage is adequate (>80%)

**Validation Script**:
```bash
cd node-keys/<key-slug>
npm test
npm run test:coverage
```

---

### 5. Host App Compatibility

**Requirement**: KEY must not break host app.

**Checks**:
- [ ] Host app builds successfully with KEY integrated
- [ ] Host app tests pass with KEY integrated
- [ ] No conflicting dependencies
- [ ] No global state pollution
- [ ] No side effects on import

**Validation Script**:
```bash
# Create test host app
npm run test-host-app <key-slug>
```

---

### 6. Removal Test

**Requirement**: KEY must be removable without breaking host app.

**Checks**:
- [ ] KEY can be removed cleanly
- [ ] Host app builds after removal
- [ ] Host app tests pass after removal
- [ ] No leftover files or dependencies
- [ ] No broken imports

**Validation Script**:
```bash
# Integrate KEY
npm run integrate-key <key-slug>

# Remove KEY
npm run remove-key <key-slug>

# Verify host app still works
npm run verify-host-app
```

---

### 7. Security Validation

**Requirement**: KEY must meet security requirements.

**Checks**:
- [ ] Tenant isolation enforced
- [ ] Auth validated server-side
- [ ] Input validation on all inputs
- [ ] Never trusts client claims
- [ ] Fails closed on uncertainty
- [ ] Webhook signatures verified (if applicable)
- [ ] API keys never exposed client-side
- [ ] Errors don't leak sensitive information

**Validation Script**:
```bash
npm run validate-key-security <key-slug>
```

---

### 8. Failure Mode Testing

**Requirement**: KEY must handle failures gracefully.

**Checks**:
- [ ] Missing env vars → Clear error
- [ ] Database error → Graceful error response
- [ ] External API error → Fail closed or graceful error
- [ ] Invalid input → 400 error
- [ ] Missing dependencies → Clear error on import
- [ ] Host app never crashes

**Validation Script**:
```bash
npm run test-failure-modes <key-slug>
```

---

### 9. Documentation Completeness

**Requirement**: Documentation must be complete and accurate.

**Checks**:
- [ ] README.md has all required sections
- [ ] quickstart.md has minimal working example
- [ ] Code examples are accurate
- [ ] Configuration is documented
- [ ] Removal steps are documented
- [ ] Troubleshooting section exists

**Validation Script**:
```bash
npm run validate-key-docs <key-slug>
```

---

### 10. Performance Check

**Requirement**: KEY must not degrade host app performance.

**Checks**:
- [ ] No blocking operations
- [ ] No memory leaks
- [ ] No excessive CPU usage
- [ ] Response times are acceptable
- [ ] No unnecessary dependencies

**Validation Script**:
```bash
npm run benchmark-key <key-slug>
```

---

## Automated QA Scripts

### Full QA Run

```bash
# Run all QA checks
npm run qa-key <key-slug>
```

**Output**:
```
✅ Structure validation: PASSED
✅ Metadata validation: PASSED
✅ Compilation check: PASSED
✅ Test suite: PASSED (95% coverage)
✅ Host app compatibility: PASSED
✅ Removal test: PASSED
✅ Security validation: PASSED
✅ Failure mode testing: PASSED
✅ Documentation completeness: PASSED
✅ Performance check: PASSED

QA Status: READY FOR MARKETPLACE
```

---

### Individual Checks

```bash
# Structure validation
npm run validate-key-structure <key-slug>

# Metadata validation
npm run validate-key-metadata <key-slug>

# Compilation check
npm run validate-key-compile <key-slug>

# Test suite
npm run validate-key-tests <key-slug>

# Host app compatibility
npm run validate-key-host-app <key-slug>

# Removal test
npm run validate-key-removal <key-slug>

# Security validation
npm run validate-key-security <key-slug>

# Failure mode testing
npm run validate-key-failure-modes <key-slug>

# Documentation validation
npm run validate-key-docs <key-slug>

# Performance check
npm run validate-key-performance <key-slug>
```

---

## QA Failure Handling

### If QA Fails

1. **Review Failure Report**: Check which checks failed
2. **Fix Issues**: Address all failures
3. **Re-run QA**: Verify fixes
4. **Document Changes**: Update CHANGELOG.md

### QA Failure Report Example

```
❌ Structure validation: FAILED
   - Missing: quickstart.md
   - Invalid: key.json (missing 'tenant_scope' field)

❌ Metadata validation: FAILED
   - Missing required field: tenant_scope
   - Invalid version: "1.0" (must be semantic version)

❌ Test suite: FAILED
   - 3 tests failing
   - Coverage: 45% (minimum: 80%)

QA Status: NOT READY FOR MARKETPLACE
```

---

## Pre-Marketplace Checklist

Before a KEY can be published to the marketplace:

- [ ] All QA checks pass
- [ ] Documentation is complete
- [ ] Tests pass with >80% coverage
- [ ] Security validation passes
- [ ] Removal test passes
- [ ] Host app compatibility verified
- [ ] CHANGELOG.md is up to date
- [ ] License is specified
- [ ] Author information is provided

---

## Continuous QA

**QA runs automatically**:
- On every commit (via CI/CD)
- Before marketplace submission
- On version updates

**QA must pass** before:
- Merging to main branch
- Publishing to marketplace
- Creating new version

---

## QA Tools

### Validation Scripts

Located in `/scripts/validate-keys/`:

- `validate-structure.ts`: Structure validation
- `validate-metadata.ts`: Metadata validation
- `validate-compile.ts`: Compilation check
- `validate-tests.ts`: Test suite validation
- `validate-host-app.ts`: Host app compatibility
- `validate-removal.ts`: Removal test
- `validate-security.ts`: Security validation
- `validate-failure-modes.ts`: Failure mode testing
- `validate-docs.ts`: Documentation validation
- `validate-performance.ts`: Performance check

### Test Host App

Located in `/scripts/test-host-app/`:

- Minimal Next.js app for compatibility testing
- Tests KEY integration and removal
- Verifies host app sovereignty

---

## Version History

- **1.0.0** (2024-12-30): Initial QA process definition
