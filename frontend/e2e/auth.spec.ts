import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to signin when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/signin/);
  });

  test('should sign up new user', async ({ page }) => {
    await page.goto('/signup');
    
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirm-password"]', password);
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });
  });

  test('should sign in existing user', async ({ page }) => {
    // This test requires a test user to exist
    // In a real scenario, you'd seed test data
    await page.goto('/signin');
    
    // Fill in credentials (would use test user)
    // await page.fill('input[name="email"]', 'test@example.com');
    // await page.fill('input[name="password"]', 'password');
    // await page.click('button[type="submit"]');
    
    // For now, just verify the form exists
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/signin');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/error|invalid|failed/i')).toBeVisible({ timeout: 5000 });
  });
});
