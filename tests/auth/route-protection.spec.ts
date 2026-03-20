import { test, expect } from '@playwright/test';

/**
 * Route protection tests — verify middleware behavior for unauthenticated users.
 *
 * Protected routes should redirect to /auth/login.
 * Public routes (/invite/*, /auth/*, /patient/*) should be accessible.
 */
test.describe('Route Protection - Unauthenticated Access', () => {
  test('should redirect /dashboard to /auth/login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('should redirect /patients to /auth/login', async ({ page }) => {
    await page.goto('/patients');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('should redirect /plans to /auth/login', async ({ page }) => {
    await page.goto('/plans');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('should redirect /schedule to /auth/login', async ({ page }) => {
    await page.goto('/schedule');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('should redirect /settings to /auth/login', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('should redirect /patients/new to /auth/login', async ({ page }) => {
    await page.goto('/patients/new');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('should redirect /plans/new to /auth/login', async ({ page }) => {
    await page.goto('/plans/new');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('should redirect /organization/create to /auth/login', async ({ page }) => {
    await page.goto('/organization/create');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('should redirect /organization/members to /auth/login', async ({ page }) => {
    await page.goto('/organization/members');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});

test.describe('Route Protection - Public Routes', () => {
  test('should allow access to /invite/[token] without auth', async ({ page }) => {
    await page.goto('/invite/some-public-token');

    // Should NOT redirect to login — invite pages are public
    const url = page.url();
    expect(url).toContain('/invite/');
    expect(url).not.toContain('/auth/login');
  });

  test('should allow access to /auth/login without auth', async ({ page }) => {
    await page.goto('/auth/login');

    // Should stay on login page
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 5000 });
  });
});
