# Visual Regression Testing Guide

This document explains how to use the visual regression testing system implemented for the Keys application.

## Quick Start

```bash
# Install dependencies
cd frontend
npm ci

# Install Playwright browsers
npx playwright install chromium

# Run visual tests
npm run test:visual

# Update baselines (after intentional UI changes)
npm run test:visual:update
```

## Available Commands

### Frontend (package.json)

| Command | Description |
|---------|-------------|
| `npm run test:visual` | Run all visual regression tests |
| `npm run test:visual:mobile` | Mobile viewport only (375×667) |
| `npm run test:visual:tablet` | Tablet viewport only (768×1024) |
| `npm run test:visual:desktop` | Desktop viewport only (1280×800) |
| `npm run test:visual:dark` | Dark mode tests |
| `npm run test:visual:update` | Update baseline screenshots |
| `npm run test:audit` | Run UI consistency audit |

### Root (package.json)

| Command | Description |
|---------|-------------|
| `npm run test:visual` | Run visual tests from root |
| `npm run test:visual:update` | Update baselines from root |
| `npm run test:audit` | Run audit from root |

## How It Works

### Stability Mechanisms

To ensure screenshots are deterministic:

1. **Frozen Time**: Date.now() returns fixed timestamp (1700000000000)
2. **Fixed Timezone**: All tests run in America/New_York
3. **Disabled Animations**: CSS injection disables all transitions/animations
4. **Reduced Motion**: Playwright forces prefers-reduced-motion: reduce
5. **Local Fonts**: Inter font loaded locally (no network requests)
6. **Consistent Viewports**: Fixed dimensions and deviceScaleFactor: 1

### Test Structure

```
e2e/
├── helpers/
│   └── visual-helpers.ts      # Stability utilities
├── public-routes.visual.spec.ts   # Public pages
├── protected-routes.visual.spec.ts # Auth-required pages
└── ui-consistency.audit.spec.ts   # Automated checks
```

### Screenshot Storage

Baselines stored at:
```
e2e/__screenshots__/
  └── [test-file]/
      └── [test-name]/
          └── [project-name].png
```

Example: `e2e/__screenshots__/public-routes.visual.spec.ts/home-loaded/visual-desktop.png`

## Adding New Visual Tests

### 1. Create Test File

```typescript
// e2e/my-feature.visual.spec.ts
import { test, expect } from '@playwright/test';
import { 
  screenshotPage, 
  mockAPIResponses,
  preparePageForScreenshot 
} from './helpers/visual-helpers';

test.describe('My Feature Visual', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIResponses(page);
  });

  test('feature - loaded state', async ({ page }) => {
    await page.goto('/my-feature');
    
    await screenshotPage(page, 'my-feature-loaded.png', {
      waitForSelector: '[data-testid="my-feature"]',
    });
  });

  test('feature - error state', async ({ page }) => {
    // Mock error
    await page.route('**/api/my-feature', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Failed' }),
      });
    });
    
    await page.goto('/my-feature');
    
    await screenshotPage(page, 'my-feature-error.png', {
      waitForSelector: '[data-testid="error"]',
    });
  });
});
```

### 2. Run to Generate Baselines

```bash
npm run test:visual:update
```

### 3. Commit Baselines

```bash
git add e2e/__screenshots__
git commit -m "Add visual baselines for my-feature"
```

### 4. Add to Audit

Edit `e2e/ui-consistency.audit.spec.ts`:

```typescript
const routesToAudit = [
  // ... existing routes
  { path: '/my-feature', name: 'My Feature' },
];
```

## CI/CD Integration

### GitHub Actions

**PR Workflow:** `.github/workflows/ci-visual.yml`

Runs on every PR:
1. Lint & Type Check
2. Build
3. Functional E2E Tests (Chromium, Firefox, WebKit)
4. Visual Regression Tests (all viewports)
5. UI Consistency Audit
6. Summary & Status Check

**Artifacts on Failure:**
- Playwright HTML report
- Screenshot diffs
- Trace files
- Audit JSON report

### Update Baselines

**Manual Workflow:** `.github/workflows/update-baselines.yml`

Only maintainers can trigger via GitHub UI:
1. Go to Actions → Update Visual Baselines
2. Select branch
3. Click "Run workflow"
4. Review the automated commit

## Debugging Failed Tests

### View Report Locally

```bash
npx playwright show-report
```

### Run Specific Test

```bash
npx playwright test public-routes.visual --project=visual-desktop
```

### Run with UI Mode

```bash
npx playwright test --ui
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Flaky fonts | Add `waitForFonts()` helper |
| Dynamic content | Use `data-testid` attributes |
| API timing | Mock responses with `page.route()` |
| Animations | Already disabled, but verify CSS loaded |
| Timestamp diffs | Check `freezeTime()` is called |

## Best Practices

### 1. Use Data Test IDs

```tsx
// Component
<button data-testid="submit-button">Submit</button>

// Test
await page.waitForSelector('[data-testid="submit-button"]');
```

### 2. Mock API Calls

Always mock APIs that return timestamps or random data:

```typescript
await page.route('**/api/data', async (route) => {
  await route.fulfill({
    body: JSON.stringify({ 
      timestamp: 1700000000000, // Fixed
      data: 'static'
    }),
  });
});
```

### 3. Test Multiple States

For each route, test:
- ✅ Loaded state (default)
- ⚠️ Empty state (no data)
- ❌ Error state (API failure)
- 🌓 Dark mode (if supported)

### 4. Commit Baselines

- Include baselines in Git
- Use Git LFS for large repositories
- Review visual diffs in PRs

## Troubleshooting

### Tests Pass Locally But Fail in CI

1. Check timezone settings
2. Verify fonts are loaded locally
3. Ensure no system-specific rendering
4. Check Playwright version match

### Screenshots Slightly Different

The config allows minor differences:
- `maxDiffPixels: 100`
- `threshold: 0.2`

If still failing, may need to:
- Increase wait time for fonts
- Add more masking for dynamic areas
- Verify no browser extensions interfering

### Baseline Update Workflow Failed

Check:
- Branch protection rules
- Token permissions
- Git LFS configuration

## Resources

- [Playwright Docs](https://playwright.dev/)
- [Visual Testing Guide](https://playwright.dev/docs/test-snapshots)
- [Best Practices](https://playwright.dev/docs/best-practices)

## Support

For issues with visual tests:
1. Check the Playwright report
2. Review the audit report (e2e/audit-report.json)
3. Compare screenshots in e2e/__screenshots__/
4. Run with --debug flag for detailed logging
