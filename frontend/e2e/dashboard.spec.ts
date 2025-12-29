import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // In a real test, you'd authenticate here
    // For now, we'll just check that protected routes redirect
    await page.goto('/dashboard');
  });

  test('should redirect to signin when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/\/signin/);
  });

  // These tests would require authentication setup
  // test('should display dashboard when authenticated', async ({ page }) => {
  //   await authenticate(page);
  //   await page.goto('/dashboard');
  //   await expect(page.locator('h1')).toContainText('Dashboard');
  // });
});
