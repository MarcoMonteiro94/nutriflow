import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Sidebar Navigation', () => {
  test('should display sidebar with navigation items', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for main navigation items
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /pacientes/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /planos/i })).toBeVisible();
  });

  test('should navigate to dashboard', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate to patients', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /pacientes/i }).click();
    await expect(page).toHaveURL(/\/patients/);
  });

  test('should navigate to plans', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /planos/i }).click();
    await expect(page).toHaveURL(/\/plans/);
  });

  test('should navigate to schedule', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /agenda/i }).click();
    await expect(page).toHaveURL(/\/agenda/);
  });

  test('should highlight active navigation item', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    // The active link should have data-active="true"
    const patientsLink = page.getByRole('link', { name: /pacientes/i });
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

    // Check for NutriFlow logo/text
    await expect(page.locator('text=NutriFlow')).toBeVisible();
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
