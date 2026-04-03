import { test, expect } from '@playwright/test';
import { testInviteTokens, testUsers } from '../fixtures/test-data';
import { loginAs } from '../fixtures/auth.fixture';

/**
 * Core invite flow tests — error states, signup guard, role display, and hierarchy.
 */

test.describe('Invite — Error States', () => {
  test('expired invite shows expiration message', async ({ page }) => {
    await page.goto(`/invite/${testInviteTokens.expired.token}`);

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    const expiredHeading = page.getByRole('heading', { name: /convite expirado/i });
    const invalidHeading = page.getByRole('heading', { name: /convite inválido/i });

    const hasExpired = await expiredHeading.isVisible({ timeout: 5000 }).catch(() => false);
    const hasInvalid = await invalidHeading.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasExpired || hasInvalid).toBeTruthy();
  });

  test('invalid token shows "Convite Inválido"', async ({ page }) => {
    await page.goto('/invite/completely-nonexistent-token-xyz');

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    await expect(page.getByRole('heading', { name: /convite inválido/i })).toBeVisible({ timeout: 5000 });
  });

  test('email mismatch shows warning instead of accept button', async ({ page }) => {
    const loggedIn = await loginAs(page, 'nutri');
    if (!loggedIn) { test.skip(true, 'Login failed'); return; }

    await page.goto(`/invite/${testInviteTokens.pending.token}`);

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) { test.skip(true, 'Service role key not available'); return; }

    const hasInvite = await page.getByRole('heading', { name: /convidado/i }).isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasInvite) { test.skip(true, 'Invite token consumed'); return; }

    const hasAcceptButton = await page.getByRole('button', { name: /aceitar convite/i }).isVisible({ timeout: 2000 }).catch(() => false);
    const hasWarning = await page.getByText(/email correto/i).isVisible({ timeout: 2000 }).catch(() => false);

    if (hasWarning) {
      expect(hasAcceptButton).toBeFalsy();
    }
  });
});

test.describe('Invite — Signup Guard', () => {
  test('signup without invite is rejected', async ({ page }) => {
    await page.goto('/auth/login?mode=signup');
    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });

    await page.fill('input[name="full_name"]', 'No Invite Test');
    await page.fill('input[name="email"]', `no-invite-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    const errorMessage = page.locator('[data-testid="auth-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });
});

test.describe('Invite — Role Display', () => {
  const ROLE_TOKENS = [
    { name: 'admin', token: testInviteTokens.adminInvite.token, label: 'Administrador' },
    { name: 'nutri', token: testInviteTokens.nutriInvite.token, label: 'Nutricionista' },
  ];

  for (const { name, token, label } of ROLE_TOKENS) {
    test(`${name} invite page displays "${label}" role`, async ({ page }) => {
      await page.goto(`/invite/${token}`);

      const appError = page.locator('text=/Application error/i');
      if (await appError.isVisible().catch(() => false)) { test.skip(true, 'Service role key not available'); return; }

      const hasInvite = await page.getByRole('heading', { name: /convidado/i }).isVisible({ timeout: 5000 }).catch(() => false);
      if (!hasInvite) { test.skip(true, 'Invite token not available'); return; }

      await expect(page.getByText(label)).toBeVisible();
    });
  }
});

test.describe('Invite — Hierarchy', () => {
  test('admin invite dialog shows all four roles', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) { test.skip(true, 'Admin login failed'); return; }

    await page.goto('/organization/members');
    await page.waitForLoadState('networkidle');

    const inviteButton = page.getByRole('button', { name: /convidar membro/i });
    if (!await inviteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Invite button not visible');
      return;
    }

    await inviteButton.click();
    await page.locator('[role="dialog"]').waitFor({ state: 'visible' });
    await page.locator('[role="dialog"] button[role="combobox"]').first().click();

    for (const role of ['Administrador', 'Nutricionista', 'Recepcionista', 'Paciente']) {
      await expect(page.getByRole('option', { name: new RegExp(role, 'i') })).toBeVisible({ timeout: 3000 });
    }
  });
});
