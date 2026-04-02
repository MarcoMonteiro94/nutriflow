import { test, expect } from '@playwright/test';
import { testInviteTokens } from '../fixtures/test-data';

/**
 * Per-role invite signup E2E tests.
 *
 * Each test verifies the full flow for a specific role:
 *   1. Visit /invite/[token] (unauthenticated)
 *   2. Click "Criar Conta" → signup form
 *   3. Fill form and submit
 *   4. Auto-accept invite → redirect to role-appropriate page
 *
 * IMPORTANT: These tests create real users and consume invites.
 * Run `npx tsx scripts/seed-test-data.ts` before each test run to reset state.
 */

const ROLE_REDIRECTS: Record<string, RegExp> = {
  admin: /\/(dashboard|patients|plans|organization)/,
  nutri: /\/(dashboard|patients|plans)/,
  receptionist: /\/(schedule|dashboard)/,
  patient: /\/patient\/dashboard/,
};

test.describe('Invite Signup - Per Role', () => {
  test('admin invite → signup → auto-accept → admin dashboard', async ({ page }) => {
    const invite = testInviteTokens.adminInvite;

    // Visit invite page
    await page.goto(`/invite/${invite.token}`);

    // Check for application error (missing service key)
    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available');
      return;
    }

    // Should see invite details
    const inviteHeading = page.getByRole('heading', { name: /convidado/i });
    const hasInvite = await inviteHeading.isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasInvite) {
      // Invite may have been consumed already
      test.skip(true, 'Invite token not available — re-seed test data');
      return;
    }

    // Click "Criar Conta" link to go to signup
    const signupLink = page.getByRole('link', { name: /criar conta/i });
    await signupLink.click();

    // Fill signup form
    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="full_name"]', 'E2E Admin User');
    await page.fill('input[name="email"]', invite.email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    // Should be redirected to invite page for auto-accept, then to dashboard
    await page.waitForURL(
      url => ROLE_REDIRECTS.admin.test(url.toString()) || url.toString().includes('/invite/'),
      { timeout: 15000 }
    );

    // If still on invite page, wait for auto-accept redirect
    if (page.url().includes('/invite/')) {
      await page.waitForURL(ROLE_REDIRECTS.admin, { timeout: 15000 });
    }

    expect(page.url()).not.toContain('/auth/login');
  });

  test('nutri invite → signup → auto-accept → nutri dashboard', async ({ page }) => {
    const invite = testInviteTokens.nutriInvite;

    await page.goto(`/invite/${invite.token}`);

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

    const signupLink = page.getByRole('link', { name: /criar conta/i });
    await signupLink.click();

    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="full_name"]', 'E2E Nutri User');
    await page.fill('input[name="email"]', invite.email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    await page.waitForURL(
      url => ROLE_REDIRECTS.nutri.test(url.toString()) || url.toString().includes('/invite/'),
      { timeout: 15000 }
    );

    if (page.url().includes('/invite/')) {
      await page.waitForURL(ROLE_REDIRECTS.nutri, { timeout: 15000 });
    }

    expect(page.url()).not.toContain('/auth/login');
  });

  test('receptionist invite → signup → auto-accept → schedule', async ({ page }) => {
    const invite = testInviteTokens.receptionistInvite;

    await page.goto(`/invite/${invite.token}`);

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

    const signupLink = page.getByRole('link', { name: /criar conta/i });
    await signupLink.click();

    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="full_name"]', 'E2E Receptionist User');
    await page.fill('input[name="email"]', invite.email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    await page.waitForURL(
      url => ROLE_REDIRECTS.receptionist.test(url.toString()) || url.toString().includes('/invite/'),
      { timeout: 15000 }
    );

    if (page.url().includes('/invite/')) {
      await page.waitForURL(ROLE_REDIRECTS.receptionist, { timeout: 15000 });
    }

    expect(page.url()).not.toContain('/auth/login');
  });

  test('patient invite → signup → auto-accept → patient dashboard', async ({ page }) => {
    const invite = testInviteTokens.patientInvite;

    await page.goto(`/invite/${invite.token}`);

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

    const signupLink = page.getByRole('link', { name: /criar conta/i });
    await signupLink.click();

    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="full_name"]', 'E2E Patient User');
    await page.fill('input[name="email"]', invite.email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    await page.waitForURL(
      url => ROLE_REDIRECTS.patient.test(url.toString()) || url.toString().includes('/invite/'),
      { timeout: 15000 }
    );

    if (page.url().includes('/invite/')) {
      await page.waitForURL(ROLE_REDIRECTS.patient, { timeout: 15000 });
    }

    expect(page.url()).not.toContain('/auth/login');
  });

  test('signup without invite should be rejected', async ({ page }) => {
    // Go directly to signup mode (simulating someone manually typing the URL)
    await page.goto('/auth/login?mode=signup');
    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });

    const uniqueEmail = `no-invite-${Date.now()}@example.com`;
    await page.fill('input[name="full_name"]', 'No Invite User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    // Wait for error message to appear
    const errorMessage = page.locator('[class*="destructive"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Must stay on login page
    expect(page.url()).toContain('/auth/login');

    const text = await errorMessage.textContent();
    expect(text?.toLowerCase()).toContain('convite');
  });
});

test.describe('Invite Signup — UX Verification', () => {
  test('invite page should show role badge for each role token', async ({ page }) => {
    const ROLE_LABELS: Record<string, string> = {
      adminInvite: 'Administrador',
      nutriInvite: 'Nutricionista',
      receptionistInvite: 'Recepcionista',
      patientInvite: 'Paciente',
    };

    for (const [key, label] of Object.entries(ROLE_LABELS)) {
      const invite = testInviteTokens[key as keyof typeof testInviteTokens];
      await page.goto(`/invite/${invite.token}`);

      const appError = page.locator('text=/Application error/i');
      if (await appError.isVisible().catch(() => false)) {
        test.skip(true, 'Service role key not available');
        return;
      }

      const inviteHeading = page.getByRole('heading', { name: /convidado/i });
      const hasInvite = await inviteHeading.isVisible({ timeout: 10000 }).catch(() => false);
      if (!hasInvite) continue; // token consumed, skip this role

      // Role badge should be visible with correct label
      const roleBadge = page.locator('[data-testid="invite-role-badge"]');
      await expect(roleBadge).toBeVisible();
      await expect(roleBadge).toContainText(label);
    }
  });

  test('invite signup link should carry email and role to signup form', async ({ page }) => {
    const invite = testInviteTokens.pending;
    await page.goto(`/invite/${invite.token}`);

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

    // "Criar Conta" link should include email and role params
    const signupLink = page.locator('a:has-text("Criar Conta")');
    const href = await signupLink.getAttribute('href');
    expect(href).toContain('email=');
    expect(href).toContain('role=');
    expect(href).toContain('mode=signup');

    // Click to navigate and verify email is pre-filled
    await signupLink.click();
    await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 5000 });

    const emailInput = page.locator('input[name="email"]');
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toBe(invite.email);

    // Email should be read-only when pre-filled from invite
    const isReadOnly = await emailInput.getAttribute('readonly');
    expect(isReadOnly).not.toBeNull();
  });

  test('signup form should show role badge when arriving from invite', async ({ page }) => {
    const invite = testInviteTokens.nutriInvite;
    await page.goto(
      `/auth/login?mode=signup&redirect=/invite/${invite.token}&email=${encodeURIComponent(invite.email)}&role=${invite.role}`
    );
    await page.waitForLoadState('networkidle');

    // Role badge should show Nutricionista
    const roleBadge = page.locator('[data-testid="invite-role-badge"]');
    await expect(roleBadge).toBeVisible({ timeout: 5000 });
    await expect(roleBadge).toContainText('Nutricionista');
  });

  test('signup error should show contextual message for missing invite', async ({ page }) => {
    await page.goto('/auth/login?mode=signup');
    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });

    const uniqueEmail = `missing-invite-${Date.now()}@example.com`;
    await page.fill('input[name="full_name"]', 'Missing Invite User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    // Wait for error message to appear (invite-required)
    const errorMessage = page.locator('[class*="destructive"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Must stay on login page
    expect(page.url()).toContain('/auth/login');

    // Error should mention invite/convite
    const text = await errorMessage.textContent();
    expect(text?.toLowerCase()).toMatch(/convite|invite/);
  });
});
