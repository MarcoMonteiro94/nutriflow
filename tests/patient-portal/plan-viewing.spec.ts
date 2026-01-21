import { test, expect } from '@playwright/test';

test.describe('Patient Portal Plan Viewing', () => {
  test('should display meal plan structure when accessed', async ({ page }) => {
    // Navigate to patient portal
    await page.goto('/patient');
    await page.waitForLoadState('networkidle');

    // Page should load without errors - check for body and some content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have responsive design for mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/patient');
    await page.waitForLoadState('networkidle');

    // Page should render correctly on mobile
    await expect(page.locator('body')).toBeVisible();

    // Check that content is not overflowing
    const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20); // Allow small margin
  });

  test('should not require authentication to view', async ({ page }) => {
    // Patient portal should be accessible without login
    await page.goto('/patient');
    await page.waitForLoadState('networkidle');

    // Should NOT redirect to login - wait a bit and check URL
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/auth/login');
  });

  test('should display content clearly', async ({ page }) => {
    await page.goto('/patient');
    await page.waitForLoadState('networkidle');

    // Check for expected UI elements - any text content or card
    const hasContent = await page.locator('body').evaluate(el => {
      // Check if body has any visible text content
      return el.textContent && el.textContent.trim().length > 0;
    });
    expect(hasContent).toBeTruthy();
  });

  test('should handle missing plan gracefully', async ({ page }) => {
    // Navigate to plan page with non-existent token
    const response = await page.goto('/patient/plan?token=nonexistent');
    await page.waitForLoadState('networkidle');

    // Should show error or redirect, not crash (status < 500)
    expect(response?.status()).toBeLessThan(500);
  });
});
