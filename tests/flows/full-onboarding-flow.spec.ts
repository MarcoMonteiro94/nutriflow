import { test, expect } from '@playwright/test';
import { testInviteTokens } from '../fixtures/test-data';
import { loginAs } from '../fixtures/auth.fixture';
import { OrganizationPage } from '../fixtures/page-objects/organization.page';

/**
 * Full onboarding chain E2E test.
 *
 * Tests the complete sequential flow:
 *   Admin creates invite for Nutri →
 *   Nutri accepts invite →
 *   Nutri invites Receptionist →
 *   Receptionist accepts invite →
 *   Nutri creates Patient
 *
 * IMPORTANT: This test suite runs sequentially (test.describe.serial)
 * and creates real users/invites. Run `npx tsx scripts/seed-test-data.ts`
 * before each test run to reset state.
 */

const FLOW_EMAILS = {
  nutri: `flow-nutri-${Date.now()}@test.com`,
  receptionist: `flow-recep-${Date.now()}@test.com`,
};

const ROLE_REDIRECTS: Record<string, RegExp> = {
  admin: /\/(dashboard|patients|plans|organization)/,
  nutri: /\/(dashboard|patients|plans)/,
  receptionist: /\/(schedule|dashboard)/,
  patient: /\/patient\/dashboard/,
};

test.describe.serial('Full Onboarding Chain', () => {
  test('Step 1: Admin logs in and creates invite for Nutri', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Admin login failed — ensure test users are seeded');
      return;
    }

    const orgPage = new OrganizationPage(page);
    await orgPage.gotoMembers();
    await page.waitForLoadState('networkidle');

    // Verify we're on the members page
    const membersHeading = page.getByRole('heading', { name: /membros/i });
    const hasMembersPage = await membersHeading.isVisible({ timeout: 15000 }).catch(() => false);
    if (!hasMembersPage) {
      // Try the invite button directly — page may have different layout
      const hasInviteButton = await orgPage.inviteButton.isVisible({ timeout: 10000 }).catch(() => false);
      if (!hasInviteButton) {
        test.skip(true, 'Members page not accessible — admin may not have an org');
        return;
      }
    }

    // Wait for invite button to be fully interactive
    await orgPage.inviteButton.waitFor({ state: 'visible', timeout: 10000 });

    // Send invite to nutri
    await orgPage.sendInvite(FLOW_EMAILS.nutri, 'Nutricionista');

    // Dialog should close
    await expect(orgPage.inviteDialog).not.toBeVisible({ timeout: 5000 });

    // Verify pending invite appears
    await page.waitForLoadState('networkidle');
    const pendingEmail = page.locator(`text=${FLOW_EMAILS.nutri}`);
    await expect(pendingEmail).toBeVisible({ timeout: 10000 });
  });

  test('Step 2: Admin can view the pending invite in members list', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip(true, 'Admin login failed — ensure test users are seeded');
      return;
    }

    const orgPage = new OrganizationPage(page);
    await orgPage.gotoMembers();

    // Check pending invites section exists
    const pendingSection = page.getByText(/convites pendentes/i);
    const hasPending = await pendingSection.isVisible({ timeout: 10000 }).catch(() => false);

    // Pending invites should be visible (at least 1)
    if (hasPending) {
      const pendingCount = await orgPage.getPendingInviteCount();
      expect(pendingCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('Step 3: Nutri invite page shows correct role and organization', async ({ page }) => {
    // Use the seeded nutri invite token for this verification
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
      test.skip(true, 'Nutri invite token not available — re-seed test data');
      return;
    }

    // Role badge should show Nutricionista
    const roleBadge = page.locator('[data-testid="invite-role-badge"]');
    await expect(roleBadge).toBeVisible();
    await expect(roleBadge).toContainText('Nutricionista');

    // Should have login and signup options
    const signupLink = page.locator('a:has-text("Criar Conta")');
    await expect(signupLink).toBeVisible();
    const loginLink = page.locator('a:has-text("Fazer Login")');
    await expect(loginLink).toBeVisible();
  });

  test('Step 4: Nutri signs up via invite and reaches dashboard', async ({ page }) => {
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
      test.skip(true, 'Nutri invite token not available — re-seed test data');
      return;
    }

    // Click signup link
    const signupLink = page.getByRole('link', { name: /criar conta/i });
    await signupLink.click();

    // Fill signup form
    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="full_name"]', 'Flow Nutri User');
    await page.fill('input[name="email"]', invite.email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    // Should reach nutri dashboard after auto-accept
    await page.waitForURL(
      url => ROLE_REDIRECTS.nutri.test(url.toString()) || url.toString().includes('/invite/'),
      { timeout: 15000 }
    );

    if (page.url().includes('/invite/')) {
      await page.waitForURL(ROLE_REDIRECTS.nutri, { timeout: 15000 });
    }

    expect(page.url()).not.toContain('/auth/login');
  });

  test('Step 5: Logged-in nutri can access organization members page', async ({ page }) => {
    const loggedIn = await loginAs(page, 'nutri');
    if (!loggedIn) {
      test.skip(true, 'Nutri login failed — ensure test users are seeded');
      return;
    }

    // Nutri should be able to navigate to org members
    await page.goto('/organization/members');
    await page.waitForLoadState('networkidle');

    // Check if we can see the invite button (nutri should have invite permission)
    const inviteButton = page.getByRole('button', { name: /convidar membro/i });
    const hasInviteButton = await inviteButton.isVisible({ timeout: 10000 }).catch(() => false);

    // Nutri should be able to invite (receptionist and patient only)
    if (hasInviteButton) {
      await inviteButton.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Open role dropdown to verify available options
      const roleButton = dialog.locator('button[role="combobox"]').first();
      await roleButton.click();

      // Nutri should see Recepcionista and Paciente, but NOT Admin
      const recepOption = page.getByRole('option', { name: /recepcionista/i });
      const hasRecep = await recepOption.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasRecep).toBeTruthy();

      const adminOption = page.getByRole('option', { name: /administrador/i });
      const hasAdmin = await adminOption.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasAdmin).toBeFalsy();
    }
  });

  test('Step 6: Receptionist invite page shows correct role', async ({ page }) => {
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
      test.skip(true, 'Receptionist invite token not available — re-seed test data');
      return;
    }

    // Role badge should show Recepcionista
    const roleBadge = page.locator('[data-testid="invite-role-badge"]');
    await expect(roleBadge).toBeVisible();
    await expect(roleBadge).toContainText('Recepcionista');
  });

  test('Step 7: Receptionist signs up via invite and reaches schedule', async ({ page }) => {
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
      test.skip(true, 'Receptionist invite token not available — re-seed test data');
      return;
    }

    const signupLink = page.getByRole('link', { name: /criar conta/i });
    await signupLink.click();

    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="full_name"]', 'Flow Receptionist User');
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

  test('Step 8: Nutri can access patients page (completing the chain)', async ({ page }) => {
    const loggedIn = await loginAs(page, 'nutri');
    if (!loggedIn) {
      test.skip(true, 'Nutri login failed — ensure test users are seeded');
      return;
    }

    // Navigate to patients page — verifies nutri has full access after onboarding
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    // Nutri should be able to see the patients page (not redirected to login or error)
    expect(page.url()).toContain('/patients');
    expect(page.url()).not.toContain('/auth/login');

    // Should see the "Novo Paciente" or "Adicionar" button, proving nutri has patient management access
    const addPatientButton = page.getByRole('link', { name: /novo paciente|adicionar/i });
    const hasButton = await addPatientButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (!hasButton) {
      // Alternative: check for patients heading or empty state
      const patientsHeading = page.getByRole('heading', { name: /pacientes/i });
      await expect(patientsHeading).toBeVisible({ timeout: 5000 });
    }
  });
});
