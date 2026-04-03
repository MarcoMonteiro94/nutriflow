import { test, expect } from '@playwright/test';

/**
 * Invite UX improvements — email pre-fill behavior.
 * Role badges, error states, and onboarding banner are covered
 * in invite-flow-fixes.spec.ts and invite-signup-roles.spec.ts.
 */

test.describe('Invite UX — Email Pre-fill', () => {
  test('signup form should have email pre-filled and read-only from invite link', async ({ page }) => {
    const inviteEmail = 'prefill-test@example.com';

    await page.goto(
      `/auth/login?mode=signup&redirect=/invite/some-token&email=${encodeURIComponent(inviteEmail)}&role=nutri`
    );
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveValue(inviteEmail);
    await expect(emailInput).toHaveAttribute('readonly', '');
  });

  test('login mode should not make email read-only', async ({ page }) => {
    const inviteEmail = 'login-test@example.com';

    await page.goto(
      `/auth/login?redirect=/invite/some-token&email=${encodeURIComponent(inviteEmail)}`
    );
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveValue(inviteEmail);
    const isReadOnly = await emailInput.getAttribute('readonly');
    expect(isReadOnly).toBeNull();
  });

  test('signup page should display role badge from invite params', async ({ page }) => {
    await page.goto(
      `/auth/login?mode=signup&redirect=/invite/some-token&email=test@example.com&role=admin`
    );
    await page.waitForLoadState('domcontentloaded');

    const roleBadge = page.locator('[data-testid="invite-role-badge"]');
    await expect(roleBadge).toContainText('Administrador');
  });
});
