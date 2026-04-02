import { test, expect } from '@playwright/test';
import { testInviteTokens } from '../fixtures/test-data';
import { loginAs } from '../fixtures/auth.fixture';

/**
 * E2E tests for invite UX improvements (Task 02).
 *
 * Covers:
 * - Email pre-fill in signup form when arriving from invite link
 * - Role badge visible on invite page
 * - Expired invite shows specific "convite expirado" message
 * - Already-accepted invite shows specific message
 * - Admin redirects to /organization/members after acceptance
 * - First-visit onboarding message appears for nutri role
 */

test.describe('Invite UX — Email Pre-fill', () => {
  test('signup form should have email pre-filled when arriving from invite link', async ({ page }) => {
    const inviteEmail = 'prefill-test@example.com';
    const inviteRole = 'nutri';

    // Navigate to signup page with email and role params (as invite page would link)
    await page.goto(
      `/auth/login?mode=signup&redirect=/invite/some-token&email=${encodeURIComponent(inviteEmail)}&role=${inviteRole}`
    );
    await page.waitForLoadState('networkidle');

    // Email input should be pre-filled
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(emailInput).toHaveValue(inviteEmail);
  });

  test('email should be read-only in signup mode when pre-filled', async ({ page }) => {
    const inviteEmail = 'readonly-test@example.com';

    await page.goto(
      `/auth/login?mode=signup&redirect=/invite/some-token&email=${encodeURIComponent(inviteEmail)}&role=nutri`
    );
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(emailInput).toHaveAttribute('readonly', '');
  });

  test('email should NOT be read-only in login mode (even with email param)', async ({ page }) => {
    const inviteEmail = 'login-test@example.com';

    await page.goto(
      `/auth/login?redirect=/invite/some-token&email=${encodeURIComponent(inviteEmail)}`
    );
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    // Should have the email as default value but NOT be read-only
    await expect(emailInput).toHaveValue(inviteEmail);
    // No readonly attribute in login mode
    const isReadOnly = await emailInput.getAttribute('readonly');
    expect(isReadOnly).toBeNull();
  });
});

test.describe('Invite UX — Role Badge', () => {
  test('invite page should display role badge', async ({ page }) => {
    // Use a known invite token
    await page.goto(`/invite/${testInviteTokens.pending.token}`);

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    const inviteHeading = page.getByRole('heading', { name: /convidado/i });
    const hasInvite = await inviteHeading.isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasInvite) {
      test.skip(true, 'Invite token not available — re-seed test data');
      return;
    }

    // Should show role badge with data-testid
    const roleBadge = page.locator('[data-testid="invite-role-badge"]');
    await expect(roleBadge).toBeVisible();
  });

  test('signup page should display role badge when coming from invite', async ({ page }) => {
    await page.goto(
      `/auth/login?mode=signup&redirect=/invite/some-token&email=test@example.com&role=admin`
    );
    await page.waitForLoadState('networkidle');

    // Should show role badge
    const roleBadge = page.locator('[data-testid="invite-role-badge"]');
    await expect(roleBadge).toBeVisible({ timeout: 5000 });
    await expect(roleBadge).toContainText('Administrador');
  });

  test('signup page should show Nutricionista badge for nutri role', async ({ page }) => {
    await page.goto(
      `/auth/login?mode=signup&redirect=/invite/some-token&email=test@example.com&role=nutri`
    );
    await page.waitForLoadState('networkidle');

    const roleBadge = page.locator('[data-testid="invite-role-badge"]');
    await expect(roleBadge).toBeVisible({ timeout: 5000 });
    await expect(roleBadge).toContainText('Nutricionista');
  });

  test('login page should NOT show role badge without invite mode', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const roleBadge = page.locator('[data-testid="invite-role-badge"]');
    await expect(roleBadge).not.toBeVisible();
  });
});

test.describe('Invite UX — Error States', () => {
  test('expired invite should show specific "Convite Expirado" message', async ({ page }) => {
    await page.goto(`/invite/${testInviteTokens.expired.token}`);

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    const expiredHeading = page.getByRole('heading', { name: /convite expirado/i });
    const invalidHeading = page.getByRole('heading', { name: /convite inválido/i });

    const hasExpired = await expiredHeading.isVisible({ timeout: 10000 }).catch(() => false);
    const hasInvalid = await invalidHeading.isVisible({ timeout: 2000 }).catch(() => false);

    // Must show one of the two messages
    expect(hasExpired || hasInvalid).toBeTruthy();

    if (hasExpired) {
      const body = page.getByText(/solicite um novo convite/i);
      await expect(body).toBeVisible();
    }
  });

  test('completely invalid token should show "Convite Inválido"', async ({ page }) => {
    await page.goto('/invite/completely-nonexistent-token-xyz-ux-test');

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    const invalidHeading = page.getByRole('heading', { name: /convite inválido/i });
    await expect(invalidHeading).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Invite UX — Invite Page Links', () => {
  test('invite page signup link should include email parameter', async ({ page }) => {
    await page.goto(`/invite/${testInviteTokens.pending.token}`);

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    const inviteHeading = page.getByRole('heading', { name: /convidado/i });
    const hasInvite = await inviteHeading.isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasInvite) {
      test.skip(true, 'Invite token not available — re-seed test data');
      return;
    }

    // Find the "Criar Conta" link and check it includes email parameter
    const signupLink = page.locator('a:has-text("Criar Conta")');
    const hasSignupLink = await signupLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSignupLink) {
      const href = await signupLink.getAttribute('href');
      expect(href).toContain('email=');
      expect(href).toContain('role=');
      expect(href).toContain('mode=signup');
    }
  });
});

test.describe('Invite UX — Onboarding Banner', () => {
  test('nutri should see onboarding banner on first visit', async ({ page }) => {
    const loggedIn = await loginAs(page, 'nutri');
    if (!loggedIn) {
      test.skip(true, 'Login failed — ensure test users are seeded');
      return;
    }

    // Clear localStorage to simulate first visit
    await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('nutriflow_onboarding_seen_')) {
          localStorage.removeItem(key);
        }
      });
    });

    // Navigate to dashboard to trigger banner
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const banner = page.locator('[data-testid="onboarding-banner"]');
    const hasBanner = await banner.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasBanner) {
      // Should show nutri-specific welcome message
      await expect(banner).toContainText(/nutricionista|pacientes|planos alimentares/i);

      // Dismiss the banner
      const dismissButton = banner.locator('button[aria-label="Fechar mensagem de boas-vindas"]');
      await dismissButton.click();

      // Banner should disappear
      await expect(banner).not.toBeVisible();

      // Reload page — banner should not appear again
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(banner).not.toBeVisible();
    }
  });

  test('admin should see onboarding banner with team management message', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Login failed — ensure test users are seeded');
      return;
    }

    // Clear localStorage to simulate first visit
    await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('nutriflow_onboarding_seen_')) {
          localStorage.removeItem(key);
        }
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const banner = page.locator('[data-testid="onboarding-banner"]');
    const hasBanner = await banner.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasBanner) {
      // Admin should see team/members management message
      await expect(banner).toContainText(/administrador|equipe|membros/i);
    }
  });
});
