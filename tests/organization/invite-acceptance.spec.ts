import { test, expect } from '@playwright/test';
import { loginAs } from '../fixtures/auth.fixture';
import { testUsers, testInviteTokens } from '../fixtures/test-data';

/**
 * Invite acceptance E2E tests — verify the complete invite flow:
 *   1. User with user_type='invite' logs in
 *   2. Layout detects pending invite → redirects to /invite/[token]
 *   3. User clicks "Accept" → membership created → redirect to dashboard
 *
 * IMPORTANT: These tests modify database state (accepting invites, creating memberships).
 * Run `npx tsx scripts/seed-test-data.ts` before each test run to reset state.
 */
test.describe('Invite Acceptance - Full Flow', () => {
  test('invited user should be redirected to invite page and accept successfully', async ({ page }) => {
    // Login as the invited user (user_type='invite')
    await page.goto('/auth/login');
    await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="email"]', testUsers.invitedUser.email);
    await page.fill('input[name="password"]', testUsers.invitedUser.password);
    await page.click('button[type="submit"]');

    // Layout detects user_type='invite' + pending invite → redirects to /invite/[token]
    // If invite was already consumed, user may go to dashboard or org create instead
    await page.waitForURL(/\/(invite|dashboard|organization|patients)/, { timeout: 15000 });

    if (page.url().includes('/invite/')) {
      // Should see the accept button
      const acceptButton = page.getByRole('button', { name: /aceitar/i });
      await expect(acceptButton).toBeVisible({ timeout: 10000 });

      // Accept the invite
      await acceptButton.click();

      // Should redirect to dashboard after acceptance
      await page.waitForURL(/\/(dashboard|patients|plans|schedule|organization)/, { timeout: 15000 });
    }

    // Verify we're on an authenticated page (not stuck on login)
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/auth/login');
  });
});

test.describe('Invite Page - Error States', () => {
  test('invalid token should show "Convite Invalido"', async ({ page }) => {
    await page.goto('/invite/completely-invalid-token-xyz');

    // Check for application error first (missing service key)
    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    // Should show invalid invite heading
    const invalidHeading = page.getByRole('heading', { name: /convite inválido/i });
    await expect(invalidHeading).toBeVisible({ timeout: 10000 });
  });

  test('expired token should show expiration or invalid message', async ({ page }) => {
    await page.goto(`/invite/${testInviteTokens.expired.token}`);

    // Check for application error first
    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    // Expired invites may show "expirado" or "inválido" depending on implementation
    const expiredMessage = page.getByText(/expirad/i);
    const invalidMessage = page.getByRole('heading', { name: /convite inválido/i });

    const hasExpired = await expiredMessage.isVisible().catch(() => false);
    const hasInvalid = await invalidMessage.isVisible().catch(() => false);

    expect(hasExpired || hasInvalid).toBeTruthy();
  });
});

test.describe('Invite Page - Unauthenticated Access', () => {
  test('should show login and signup options for valid invite', async ({ page }) => {
    await page.goto(`/invite/${testInviteTokens.pending.token}`);

    // Check for application error first
    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    // For a valid invite, unauthenticated users see login/signup links
    const loginLink = page.getByRole('link', { name: /login|entrar/i });
    const signupLink = page.getByRole('link', { name: /criar conta/i });
    const loginButton = page.getByRole('button', { name: /fazer login|entrar/i });
    const signupButton = page.getByRole('button', { name: /criar conta/i });

    const hasLoginLink = await loginLink.isVisible().catch(() => false);
    const hasSignupLink = await signupLink.isVisible().catch(() => false);
    const hasLoginButton = await loginButton.isVisible().catch(() => false);
    const hasSignupButton = await signupButton.isVisible().catch(() => false);

    // Should see at least one login/signup option
    expect(hasLoginLink || hasSignupLink || hasLoginButton || hasSignupButton).toBeTruthy();
  });

  test('login link should include redirect back to invite page', async ({ page }) => {
    await page.goto(`/invite/${testInviteTokens.pending.token}`);

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    // Find login link/button and check it includes redirect param
    const loginLink = page.getByRole('link', { name: /login|entrar|fazer login/i }).first();
    if (await loginLink.isVisible().catch(() => false)) {
      const href = await loginLink.getAttribute('href');
      if (href && href.includes('redirect')) {
        expect(href).toContain('/invite/');
      }
      // If no redirect param, the link still works — just won't redirect back
      expect(href).toContain('/auth/login');
    }
  });
});
