import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';
import { logout } from '../fixtures/auth.fixture';

test.describe('Logout', () => {
  authTest('should logout successfully when clicking logout button', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Verify we're logged in first
    await expect(page).toHaveURL(/\/(dashboard|patients|plans)/);

    // Find and click logout button
    await logout(page);

    // Should redirect to login page
    await expect(page).toHaveURL(/\/auth\/login|\/$/);
  });

  authTest('should not be able to access protected routes after logout', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Logout
    await logout(page);

    // Try to access dashboard directly
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Protected Routes', () => {
  test('dashboard should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('patients page should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/patients');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('plans page should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/plans');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('schedule page should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/agenda');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('new patient page should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/patients/new');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('new plan page should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/plans/new');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
