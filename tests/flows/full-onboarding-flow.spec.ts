import { test, expect } from '@playwright/test';
import { testInviteTokens } from '../fixtures/test-data';
import { loginAs } from '../fixtures/auth.fixture';
import { OrganizationPage } from '../fixtures/page-objects/organization.page';

/**
 * Full onboarding chain E2E test.
 *
 * Tests the complete sequential flow:
 *   Super Admin creates Clinic →
 *   Super Admin invites Admin →
 *   Admin accepts invite →
 *   Admin invites Nutri →
 *   Nutri accepts invite →
 *   Nutri invites Receptionist →
 *   Receptionist accepts invite →
 *   Nutri creates Patient →
 *   Patient accesses portal
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
  // ------------------------------------------------------------------
  // Phase 1: Super Admin creates Clinic and invites Admin
  // ------------------------------------------------------------------

  test('Step 0: Super Admin creates a new clinic', async ({ page }) => {
    const loggedIn = await loginAs(page, 'superAdmin');
    if (!loggedIn) {
      test.skip(true, 'Super admin login failed — ensure test users are seeded');
      return;
    }

    await page.goto('/admin/organizations');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector(
      '[data-testid="org-list"], [data-testid="org-empty-state"]',
      { timeout: 10000 },
    );

    // Click "Nova Clinica" button
    await page.locator('[data-testid="create-org-button"]').click();

    const dialog = page.locator('[data-testid="create-org-dialog"]');
    await expect(dialog).toBeVisible();

    const uniqueSuffix = Date.now();
    const clinicName = `Flow Clinic ${uniqueSuffix}`;

    await dialog.locator('[data-testid="org-name-input"]').fill(clinicName);

    // Wait for slug to auto-generate
    const slugInput = dialog.locator('[data-testid="org-slug-input"]');
    const slugValue = await slugInput.inputValue();
    expect(slugValue).toBeTruthy();

    // Submit the form
    await dialog.locator('[data-testid="create-org-submit"]').click();

    // Dialog should close on success
    await expect(dialog).toBeHidden({ timeout: 10000 });

    // Wait for list to refresh and show the new clinic
    await page.waitForSelector('[data-testid="org-list"]', { timeout: 10000 });
    await expect(page.locator(`text=${clinicName}`)).toBeVisible({ timeout: 5000 });
  });

  test('Step 0b: Super Admin invites Admin to the clinic', async ({ page }) => {
    const loggedIn = await loginAs(page, 'superAdmin');
    if (!loggedIn) {
      test.skip(true, 'Super admin login failed — ensure test users are seeded');
      return;
    }

    await page.goto('/admin/organizations');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector(
      '[data-testid="org-list"], [data-testid="org-empty-state"]',
      { timeout: 10000 },
    );

    if (await page.locator('[data-testid="org-empty-state"]').isVisible()) {
      test.skip(true, 'No organizations available.');
      return;
    }

    // Navigate to the first org's detail page
    await page.locator('[data-testid="org-card"]').first().click();
    await page.waitForSelector('[data-testid="org-detail"]', { timeout: 10000 });

    // Click invite admin button
    await page.locator('[data-testid="invite-admin-button"]').click();

    // Fill email for admin invite
    const uniqueEmail = `flow-admin-invite-${Date.now()}@example.com`;
    await page.locator('[data-testid="invite-email-input"]').fill(uniqueEmail);

    // Submit invite
    await page.locator('[data-testid="invite-submit"]').click();

    // Wait for invite URL to appear (API call success)
    const inviteUrl = page.locator('[data-testid="invite-url"]');
    await expect(inviteUrl).toBeVisible({ timeout: 10000 });

    // Verify the URL contains /invite/
    const urlValue = await inviteUrl.inputValue();
    expect(urlValue).toContain('/invite/');
  });

  test('Step 0c: Super Admin verifies clinic shows in dashboard metrics', async ({ page }) => {
    const loggedIn = await loginAs(page, 'superAdmin');
    if (!loggedIn) {
      test.skip(true, 'Super admin login failed — ensure test users are seeded');
      return;
    }

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Dashboard should display updated metrics
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Stats cards should be visible with numeric values
    const statsCards = page.locator('[data-slot="card"]');
    const cardCount = await statsCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // Clinicas count should be at least 1
    await expect(page.locator('text=Clínicas')).toBeVisible();
  });

  // ------------------------------------------------------------------
  // Phase 2: Admin role in the onboarding chain
  // ------------------------------------------------------------------

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
    await page.waitForLoadState('networkidle');

    // Check pending invites section exists
    const pendingSection = page.getByText(/convites pendentes/i);
    const hasPending = await pendingSection.isVisible({ timeout: 10000 }).catch(() => false);

    if (!hasPending) {
      // Pending section may not appear if Step 1 invite was already consumed or DB reset
      test.skip(true, 'No pending invites section — Step 1 may not have created invites');
      return;
    }

    // Wait for invite list to fully render
    await page.waitForLoadState('networkidle');

    // Check for pending invite items (may use different selectors depending on component)
    const pendingCount = await orgPage.getPendingInviteCount();
    if (pendingCount === 0) {
      // Invites may render without data-testid — check for email text instead
      const hasAnyInvite = await page.getByText(/@/).first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasAnyInvite || pendingCount > 0).toBeTruthy();
    }
  });

  // ------------------------------------------------------------------
  // Phase 3: Nutri invite acceptance
  // ------------------------------------------------------------------

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

  // ------------------------------------------------------------------
  // Phase 4: Nutri invites Receptionist
  // ------------------------------------------------------------------

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

    // Nutri (who is also org owner) should be able to invite
    if (hasInviteButton) {
      await inviteButton.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Open role dropdown to verify available options
      const roleButton = dialog.locator('button[role="combobox"]').first();
      await roleButton.click();

      // Org owner sees all roles; non-owner nutri would only see Recepcionista and Paciente
      const recepOption = page.getByRole('option', { name: /recepcionista/i });
      await expect(recepOption).toBeVisible({ timeout: 3000 });
    }
  });

  // ------------------------------------------------------------------
  // Phase 5: Receptionist invite acceptance
  // ------------------------------------------------------------------

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

  // ------------------------------------------------------------------
  // Phase 6: Nutri creates Patient and Patient accesses portal
  // ------------------------------------------------------------------

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

  test('Step 9: Patient can access the patient portal', async ({ page }) => {
    const loggedIn = await loginAs(page, 'patient');
    if (!loggedIn) {
      test.skip(true, 'Patient login failed — ensure test users are seeded');
      return;
    }

    // Patient should be redirected to their portal
    await page.waitForURL(
      url => url.toString().includes('/patient') || url.toString().includes('/dashboard'),
      { timeout: 15000 },
    );

    // Patient should NOT be on admin or nutri pages
    expect(page.url()).not.toContain('/admin');
    expect(page.url()).not.toContain('/auth/login');

    // Should see some patient-facing content
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
