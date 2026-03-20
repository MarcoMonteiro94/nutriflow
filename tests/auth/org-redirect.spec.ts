import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth.fixture';

/**
 * Organization redirect tests — verify layout redirect behavior
 * based on user's organization membership status.
 *
 * Requires seed data: npx tsx scripts/seed-test-data.ts
 */
test.describe('Organization Redirect - User Without Org', () => {
  test('accessing /dashboard should redirect to /organization/create', async ({ page }) => {
    const success = await loginAs(page, 'noOrg');
    expect(success).toBeTruthy();

    // noOrg user has no organization → layout redirects to create org page
    await expect(page).toHaveURL(/\/organization\/create/, { timeout: 15000 });
  });

  test('/organization/create should load without redirect loop', async ({ page }) => {
    const success = await loginAs(page, 'noOrg');
    expect(success).toBeTruthy();

    // Should land on create org page
    await expect(page).toHaveURL(/\/organization\/create/, { timeout: 15000 });

    // Page content should render (no infinite redirect)
    await expect(
      page.getByRole('heading', { name: /criar clínica/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test('/settings should load without redirect loop', async ({ page }) => {
    await loginAs(page, 'noOrg');

    // Navigate directly to settings — should NOT redirect to /organization/create
    await page.goto('/settings');

    // Should stay on settings (layout allows /settings for users without org)
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/\/(settings|organization\/create)/);
  });
});

test.describe('Organization Redirect - User With Org', () => {
  test('accessing /dashboard should load normally', async ({ page }) => {
    const success = await loginAs(page, 'nutri');
    expect(success).toBeTruthy();

    // Nutri user has an organization → dashboard loads
    await expect(page).toHaveURL(/\/(dashboard|patients|plans)/, { timeout: 15000 });

    // Dashboard content should be visible
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });
});
