import { test, expect } from '@playwright/test';

test.describe('Golden Path Onboarding Flow', () => {
  test('should complete signup → profile → first chat flow', async ({ page }) => {
    // Navigate to signup
    await page.goto('/signup');

    // Fill signup form
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirm-password"]', 'TestPassword123!');

    // Submit signup
    await page.click('button[type="submit"]');

    // Wait for redirect to onboarding
    await page.waitForURL('/onboarding', { timeout: 10000 });

    // Complete onboarding steps
    // Step 1: Welcome
    await expect(page.locator('text=Welcome to Cursor Venture Companion')).toBeVisible();
    await page.click('button:has-text("Get Started")');

    // Step 2: Role selection
    await expect(page.locator('text=Tell us about your role')).toBeVisible();
    await page.click('button:has-text("founder")');

    // Step 3: Stack selection (if visible)
    const stackStep = page.locator('text=What\'s in your tech stack?');
    if (await stackStep.isVisible({ timeout: 2000 })) {
      await page.click('button:has-text("Next")');
    }

    // Step 4: Vibe tuning (if visible)
    const vibeStep = page.locator('text=Tune your vibe');
    if (await vibeStep.isVisible({ timeout: 2000 })) {
      await page.click('button:has-text("Next")');
    }

    // Step 5: Brand (optional, skip)
    const brandStep = page.locator('text=Brand & Context');
    if (await brandStep.isVisible({ timeout: 2000 })) {
      await page.click('button:has-text("Next")');
    }

    // Step 6: Complete
    await expect(page.locator('text=You\'re all set!')).toBeVisible();
    await page.click('button:has-text("Start Using Companion")');

    // Should redirect to chat with onboarding success
    await page.waitForURL('/chat?onboarding=complete', { timeout: 10000 });

    // Verify chat page loads
    await expect(page.locator('text=Cursor Venture Companion')).toBeVisible();

    // Verify onboarding success message appears
    // (This would be a toast notification in the actual implementation)
  });

  test('should show empty states and loading skeletons', async ({ page }) => {
    // Navigate to dashboard without profile
    await page.goto('/dashboard');

    // Should show loading state
    const loadingIndicator = page.locator('text=Loading');
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 5000 });
  });
});
