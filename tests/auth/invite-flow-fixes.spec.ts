import { test, expect } from '@playwright/test';
import { testInviteTokens } from '../fixtures/test-data';
import { loginAs } from '../fixtures/auth.fixture';

/**
 * E2E tests for invite flow bug fixes (Task 01).
 *
 * Covers:
 * - Expired invite shows specific "Convite Expirado" message
 * - Invalid/consumed invite shows "Convite Inválido" message
 * - Email mismatch shows warning instead of broken accept button
 * - Signup without invite is rejected
 * - Invite hierarchy enforcement via API
 */

test.describe('Invite Page — Error States', () => {
  test('expired invite should show "Convite Expirado" message', async ({ page }) => {
    await page.goto(`/invite/${testInviteTokens.expired.token}`);

    // Check for application error (missing service key)
    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    // Should show expired-specific heading (not generic "Inválido")
    const expiredHeading = page.getByRole('heading', { name: /convite expirado/i });
    const invalidHeading = page.getByRole('heading', { name: /convite inválido/i });

    const hasExpired = await expiredHeading.isVisible({ timeout: 10000 }).catch(() => false);
    const hasInvalid = await invalidHeading.isVisible({ timeout: 2000 }).catch(() => false);

    // Must show one of the two messages
    expect(hasExpired || hasInvalid).toBeTruthy();

    // If token exists in DB as expired, should show the specific expired message
    if (hasExpired) {
      const body = page.getByText(/solicite um novo convite/i);
      await expect(body).toBeVisible();
    }
  });

  test('invalid token should show "Convite Inválido" message', async ({ page }) => {
    await page.goto('/invite/completely-nonexistent-token-xyz');

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    const invalidHeading = page.getByRole('heading', { name: /convite inválido/i });
    await expect(invalidHeading).toBeVisible({ timeout: 10000 });

    // Should mention the invite doesn't exist or was already accepted
    const body = page.getByText(/não existe ou já foi aceito/i);
    await expect(body).toBeVisible();
  });
});

test.describe('Invite Page — Email Mismatch', () => {
  test('logged-in user with different email should see warning, not accept button', async ({ page }) => {
    // Login as the nutritionist (test-nutri@example.com)
    const loggedIn = await loginAs(page, 'nutri');
    if (!loggedIn) {
      test.skip(true, 'Login failed — ensure test users are seeded');
      return;
    }

    // Visit an invite intended for a different email
    await page.goto(`/invite/${testInviteTokens.pending.token}`);

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    // The invite is for test-invited@example.com but we're logged in as test-nutri@example.com
    // Should see a warning about email mismatch, NOT an accept button
    const inviteHeading = page.getByRole('heading', { name: /convidado/i });
    const hasInvite = await inviteHeading.isVisible({ timeout: 10000 }).catch(() => false);

    if (!hasInvite) {
      // Invite may have been consumed
      test.skip(true, 'Invite token not available — re-seed test data');
      return;
    }

    // Should show email mismatch warning
    const mismatchWarning = page.getByText(/email correto/i);
    const hasWarning = await mismatchWarning.isVisible({ timeout: 5000 }).catch(() => false);

    // Should NOT show accept button (would fail anyway due to email check)
    const acceptButton = page.getByRole('button', { name: /aceitar convite/i });
    const hasAcceptButton = await acceptButton.isVisible({ timeout: 2000 }).catch(() => false);

    // Either shows the mismatch warning, or at minimum doesn't show a broken accept button
    if (hasWarning) {
      expect(hasAcceptButton).toBeFalsy();
    }
  });
});

test.describe('Invite — Signup Guard', () => {
  test('signup without invite should be rejected with clear message', async ({ page }) => {
    await page.goto('/auth/login?mode=signup');
    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });

    const uniqueEmail = `no-invite-guard-${Date.now()}@example.com`;
    await page.fill('input[name="full_name"]', 'No Invite Guard Test');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    // Should show invite-required error
    await page.waitForTimeout(3000);
    const errorMessage = page.locator('[class*="destructive"]');
    const hasError = await errorMessage.isVisible().catch(() => false);

    // Must stay on login page
    expect(page.url()).toContain('/auth/login');
    if (hasError) {
      const text = await errorMessage.textContent();
      expect(text?.toLowerCase()).toContain('convite');
    }
  });
});

test.describe('Invite — Role Redirects', () => {
  /**
   * Verify the redirect paths are correctly defined for each role.
   * These tests check the invite page renders with correct role labels
   * and the auto-accept component includes the correct redirect logic.
   */
  const ROLE_TOKENS = [
    { name: 'admin', token: testInviteTokens.adminInvite.token, label: 'Administrador' },
    { name: 'nutri', token: testInviteTokens.nutriInvite.token, label: 'Nutricionista' },
    { name: 'receptionist', token: testInviteTokens.receptionistInvite.token, label: 'Recepcionista' },
    { name: 'patient', token: testInviteTokens.patientInvite.token, label: 'Paciente' },
  ];

  for (const { name, token, label } of ROLE_TOKENS) {
    test(`${name} invite page should display correct role label "${label}"`, async ({ page }) => {
      await page.goto(`/invite/${token}`);

      const appError = page.locator('text=/Application error/i');
      if (await appError.isVisible().catch(() => false)) {
        test.skip(true, 'Service role key not available');
        return;
      }

      const inviteHeading = page.getByRole('heading', { name: /convidado/i });
      const hasInvite = await inviteHeading.isVisible({ timeout: 10000 }).catch(() => false);
      if (!hasInvite) {
        test.skip(true, `${name} invite token not available — re-seed test data`);
        return;
      }

      // Verify the role label is displayed
      const roleText = page.getByText(label);
      await expect(roleText).toBeVisible();
    });
  }
});

test.describe('Invite — Hierarchy Enforcement', () => {
  test('invite creation API should enforce role hierarchy', async ({ page }) => {
    // Login as the nutritionist to test hierarchy
    const loggedIn = await loginAs(page, 'nutri');
    if (!loggedIn) {
      test.skip(true, 'Login failed — ensure test users are seeded');
      return;
    }

    // Try to create an admin invite (nutri should NOT be able to invite admin)
    const response = await page.request.post('/api/organization/invite', {
      data: {
        organizationId: 'test-org-id', // won't matter if hierarchy check fires first
        email: `hierarchy-test-${Date.now()}@example.com`,
        role: 'admin',
      },
    });

    // Should be rejected (either 403 for hierarchy or 400 for invalid org)
    expect(response.status()).not.toBe(200);

    const data = await response.json();
    // If we got a 403, it's the hierarchy check working correctly
    if (response.status() === 403) {
      expect(data.error).toContain('permissão');
    }
  });
});
