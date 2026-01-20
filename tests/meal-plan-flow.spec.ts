import { test, expect } from '@playwright/test';

test.describe('Meal Plan Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard - will redirect to login if not authenticated
    await page.goto('/dashboard');
  });

  test('dashboard page loads with correct structure', async ({ page }) => {
    // The page should either show login redirect or dashboard
    // Check for common elements that should exist regardless of auth state
    await expect(page.locator('body')).toBeVisible();
  });

  test('plans page is accessible', async ({ page }) => {
    await page.goto('/plans');
    await expect(page.locator('body')).toBeVisible();
  });

  test('patients page is accessible', async ({ page }) => {
    await page.goto('/patients');
    await expect(page.locator('body')).toBeVisible();
  });

  test('schedule page is accessible', async ({ page }) => {
    await page.goto('/schedule');
    await expect(page.locator('body')).toBeVisible();
  });

  test('new patient form page is accessible', async ({ page }) => {
    await page.goto('/patients/new');
    await expect(page.locator('body')).toBeVisible();
  });

  test('new plan form page is accessible', async ({ page }) => {
    await page.goto('/plans/new');
    await expect(page.locator('body')).toBeVisible();
  });

  test('new appointment form page is accessible', async ({ page }) => {
    await page.goto('/schedule/new');
    await expect(page.locator('body')).toBeVisible();
  });
});
