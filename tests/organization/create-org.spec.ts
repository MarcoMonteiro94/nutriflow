import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth.fixture';
import { cleanupNoOrgUser } from '../fixtures/cleanup';

/**
 * Organization creation tests — verify the create org form behavior
 * when accessed by a user without an organization.
 *
 * Requires seed data: npx tsx scripts/seed-test-data.ts
 *
 * Tests run serially because they share the noOrg user state,
 * and the last test creates an organization that must be cleaned up.
 */
test.describe.serial('Organization Creation', () => {
  test.afterAll(async () => {
    await cleanupNoOrgUser();
  });

  test('form should display required fields (name, slug)', async ({ page }) => {
    await loginAs(page, 'noOrg');
    await page.waitForURL(/\/organization\/create/, { timeout: 15000 });

    // Verify heading
    await expect(
      page.getByRole('heading', { name: /criar clínica/i }),
    ).toBeVisible({ timeout: 10000 });

    // Verify form fields are present
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="slug"]')).toBeVisible();

    // Verify submit button
    await expect(
      page.getByRole('button', { name: /criar|salvar/i }),
    ).toBeVisible();
  });

  test('should validate required fields on submit', async ({ page }) => {
    await loginAs(page, 'noOrg');
    await page.waitForURL(/\/organization\/create/, { timeout: 15000 });

    // Try to submit without filling fields
    await page.getByRole('button', { name: /criar|salvar/i }).click();

    // HTML5 validation should prevent submission
    const nameInput = page.locator('input[name="name"]');
    const validationMessage = await nameInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage,
    );
    expect(validationMessage).toBeTruthy();
  });

  test('should auto-generate slug from organization name', async ({ page }) => {
    await loginAs(page, 'noOrg');
    await page.waitForURL(/\/organization\/create/, { timeout: 15000 });

    // Fill in the name
    await page.fill('input[name="name"]', 'Clínica São Paulo');

    // Wait for auto-slug generation
    await page.waitForTimeout(500);
    const slugValue = await page.locator('input[name="slug"]').inputValue();

    // Slug should be auto-generated from the name
    expect(slugValue).toBeTruthy();
  });

  test('should create organization with valid data and redirect', async ({ page }) => {
    await loginAs(page, 'noOrg');
    await page.waitForURL(/\/organization\/create/, { timeout: 15000 });

    // Use a unique slug to avoid conflicts
    const uniqueSlug = `test-e2e-${Date.now()}`;
    await page.fill('input[name="name"]', 'Clínica E2E Test');
    await page.fill('input[name="slug"]', uniqueSlug);

    // Submit the form
    await page.getByRole('button', { name: /criar|salvar/i }).click();

    // Wait for navigation away from the create page
    await page.waitForFunction(
      () => !window.location.pathname.includes('/organization/create'),
      { timeout: 15000 },
    ).catch(() => {
      // If redirect didn't happen, check for success toast instead
    });

    // Either we redirected away or a success message appeared
    const redirected = !page.url().includes('/organization/create');
    const hasSuccessToast = await page.locator('text=/sucesso|criada/i').isVisible().catch(() => false);
    expect(redirected || hasSuccessToast).toBeTruthy();
  });
});
