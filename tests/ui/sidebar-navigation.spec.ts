import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Sidebar Navigation', () => {
  test('should display sidebar with navigation items', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for main navigation items in sidebar (use first() to avoid ambiguity)
    await expect(page.locator('a[href="/dashboard"]').first()).toBeVisible();
    await expect(page.locator('a[href="/patients"]').first()).toBeVisible();
    await expect(page.locator('a[href="/plans"]').first()).toBeVisible();
  });

  test('should navigate to dashboard', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.locator('a[href="/dashboard"]').first().click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate to patients', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.locator('a[href="/patients"]').first().click();
    await expect(page).toHaveURL(/\/patients/);
  });

  test('should navigate to plans', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.locator('a[href="/plans"]').first().click();
    await expect(page).toHaveURL(/\/plans/);
  });

  test('should navigate to schedule', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Use specific sidebar link to avoid ambiguity with other "Agenda" links on page
    await page.locator('a[href="/schedule"]').first().click();
    await expect(page).toHaveURL(/\/schedule/);
  });

  test('should highlight active navigation item', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    // The active link should have data-active="true"
    const patientsLink = page.locator('a[href="/patients"]').first();
    const isActive = await patientsLink.getAttribute('data-active');

    // Or check for active styling
    const hasActiveClass = await patientsLink.evaluate(el =>
      el.classList.toString().includes('active') ||
      el.getAttribute('data-active') === 'true'
    );

    expect(isActive === 'true' || hasActiveClass).toBeTruthy();
  });

  test('should display logo in sidebar', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for NutriFlow logo/text - use first() to avoid strict mode violation
    await expect(page.locator('text=NutriFlow').first()).toBeVisible();
  });

  test('should display user info in sidebar footer', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show user avatar or initials
    const avatar = page.locator('[data-slot="sidebar-footer"]').locator('span, img').first();
    await expect(avatar).toBeVisible();
  });

  test('should have logout button', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for logout button
    const logoutButton = page.getByRole('button', { name: /sair/i });
    await expect(logoutButton).toBeVisible();
  });
});
