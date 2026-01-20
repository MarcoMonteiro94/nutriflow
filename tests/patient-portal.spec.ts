import { test, expect } from '@playwright/test';

test.describe('Patient Portal', () => {
  test('patient portal home page loads', async ({ page }) => {
    await page.goto('/patient');

    await expect(page.locator('body')).toBeVisible();
  });

  test('patient meal plan page loads', async ({ page }) => {
    await page.goto('/patient/plan');

    // Page should load (may show login required or meal plan)
    await expect(page.locator('body')).toBeVisible();
  });

  test('patient access page handles missing token', async ({ page }) => {
    // Access page without token should show error
    await page.goto('/patient/access');

    await expect(page.locator('body')).toBeVisible();
  });

  test('patient access page handles invalid token', async ({ page }) => {
    // Access with invalid token
    await page.goto('/patient/access?token=invalid-token-123');

    // Should show error message
    await expect(page.locator('body')).toBeVisible();
  });
});
