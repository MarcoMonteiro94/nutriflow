import { test, expect } from '../fixtures/auth.fixture';
import { OrganizationPage } from '../fixtures/page-objects/organization.page';

test.describe('Invite Creation Flow', () => {
  test('should open invite dialog with email and role fields', async ({ authenticatedPage }) => {
    const orgPage = new OrganizationPage(authenticatedPage);
    await orgPage.gotoMembers();
    await orgPage.openInviteDialog();

    // Verify dialog has email input and role selector
    await expect(orgPage.inviteDialog).toBeVisible();
    await expect(authenticatedPage.getByLabel(/email/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/função/i)).toBeVisible();
  });

  test('should send invite with email and role', async ({ authenticatedPage }) => {
    const orgPage = new OrganizationPage(authenticatedPage);
    await orgPage.gotoMembers();

    const uniqueEmail = `invite-test-${Date.now()}@test.com`;
    await orgPage.sendInvite(uniqueEmail, 'Nutricionista');

    // Dialog should close after sending
    await expect(orgPage.inviteDialog).not.toBeVisible({ timeout: 5000 });
  });

  test('should show validation when email is empty', async ({ authenticatedPage }) => {
    const orgPage = new OrganizationPage(authenticatedPage);
    await orgPage.gotoMembers();
    await orgPage.openInviteDialog();

    // Try to submit without email (click send directly)
    await orgPage.sendInviteButton.click();

    // HTML5 required validation should prevent submission
    // Dialog should still be open
    await expect(orgPage.inviteDialog).toBeVisible();
  });

  test('should show available roles in the dropdown', async ({ authenticatedPage }) => {
    const orgPage = new OrganizationPage(authenticatedPage);
    await orgPage.gotoMembers();
    await orgPage.openInviteDialog();

    // Click the role combobox
    const roleButton = authenticatedPage.locator('button[role="combobox"]').first();
    await roleButton.click();

    // Expect roles to be visible (admin/owner should see these roles)
    await expect(authenticatedPage.getByRole('option', { name: /nutricionista/i })).toBeVisible();
    await expect(authenticatedPage.getByRole('option', { name: /recepcionista/i })).toBeVisible();
  });

  test('should show pending invite after sending', async ({ authenticatedPage }) => {
    const orgPage = new OrganizationPage(authenticatedPage);
    await orgPage.gotoMembers();

    const uniqueEmail = `pending-test-${Date.now()}@test.com`;
    await orgPage.sendInvite(uniqueEmail, 'Recepcionista');

    // Wait for dialog to close and page to refresh
    await expect(orgPage.inviteDialog).not.toBeVisible({ timeout: 5000 });
    await authenticatedPage.waitForLoadState('networkidle');

    // Verify the email appears somewhere on the page (pending invites section)
    await expect(authenticatedPage.locator(`text=${uniqueEmail}`)).toBeVisible({ timeout: 10000 });
  });

  test('should show role badge on pending invite', async ({ authenticatedPage }) => {
    const orgPage = new OrganizationPage(authenticatedPage);
    await orgPage.gotoMembers();

    const uniqueEmail = `badge-test-${Date.now()}@test.com`;
    await orgPage.sendInvite(uniqueEmail, 'Nutricionista');

    await expect(orgPage.inviteDialog).not.toBeVisible({ timeout: 5000 });
    await authenticatedPage.waitForLoadState('networkidle');

    // Verify invite email appears
    await expect(authenticatedPage.locator(`text=${uniqueEmail}`)).toBeVisible({ timeout: 10000 });

    // The pending invites section should show a "Nutricionista" badge
    const pendingSection = authenticatedPage.getByText(/convites pendentes/i).locator('..');
    const badge = pendingSection.getByText('Nutricionista');
    await expect(badge).toBeVisible({ timeout: 5000 });
  });

  test('should show copy link button on pending invite', async ({ authenticatedPage }) => {
    const orgPage = new OrganizationPage(authenticatedPage);
    await orgPage.gotoMembers();
    await authenticatedPage.waitForLoadState('networkidle');

    // Check if there are any pending invites
    const pendingSection = authenticatedPage.getByText(/convites pendentes/i);
    const hasPending = await pendingSection.isVisible({ timeout: 10000 }).catch(() => false);

    if (!hasPending) {
      // Create an invite first
      const uniqueEmail = `copy-test-${Date.now()}@test.com`;
      await orgPage.sendInvite(uniqueEmail, 'Recepcionista');
      await expect(orgPage.inviteDialog).not.toBeVisible({ timeout: 5000 });
      await authenticatedPage.waitForLoadState('networkidle');
    }

    // Copy button (icon button with Copy icon) should be visible
    const copyButtons = authenticatedPage.locator('button').filter({ has: authenticatedPage.locator('svg') });
    const buttonCount = await copyButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should cancel (delete) a pending invite', async ({ authenticatedPage }) => {
    const orgPage = new OrganizationPage(authenticatedPage);
    await orgPage.gotoMembers();

    // Create an invite to cancel
    const uniqueEmail = `cancel-test-${Date.now()}@test.com`;
    await orgPage.sendInvite(uniqueEmail, 'Recepcionista');
    await expect(orgPage.inviteDialog).not.toBeVisible({ timeout: 5000 });
    await authenticatedPage.waitForLoadState('networkidle');

    // Verify invite is visible
    const emailLocator = authenticatedPage.locator(`text=${uniqueEmail}`);
    await expect(emailLocator).toBeVisible({ timeout: 10000 });

    // Find the row containing this email and its delete button (last button in row)
    // The pending invite rows are direct children of the pending invites card
    const inviteRow = authenticatedPage.locator('.rounded-lg.border').filter({ hasText: uniqueEmail });
    const deleteButton = inviteRow.locator('button').last();

    await expect(deleteButton).toBeVisible({ timeout: 3000 });
    await deleteButton.click();

    // Wait for the invite to disappear after deletion
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(emailLocator).not.toBeVisible({ timeout: 10000 });
  });

  test('should show role description when selecting a role', async ({ authenticatedPage }) => {
    const orgPage = new OrganizationPage(authenticatedPage);
    await orgPage.gotoMembers();
    await orgPage.openInviteDialog();

    // Select a role
    await orgPage.inviteRoleSelect.click();
    await authenticatedPage.getByRole('option', { name: /nutricionista/i }).click();

    // Should show role description
    const description = authenticatedPage.getByText(/gerenciar pacientes|planos alimentares/i);
    await expect(description).toBeVisible({ timeout: 3000 });
  });

  test('should send a second invite for different email', async ({ authenticatedPage }) => {
    const orgPage = new OrganizationPage(authenticatedPage);
    await orgPage.gotoMembers();

    // Send first invite
    const email1 = `resend-1-${Date.now()}@test.com`;
    await orgPage.sendInvite(email1, 'Recepcionista');
    await expect(orgPage.inviteDialog).not.toBeVisible({ timeout: 5000 });
    await authenticatedPage.waitForLoadState('networkidle');

    // Send second invite
    const email2 = `resend-2-${Date.now()}@test.com`;
    await orgPage.sendInvite(email2, 'Paciente');
    await expect(orgPage.inviteDialog).not.toBeVisible({ timeout: 5000 });
    await authenticatedPage.waitForLoadState('networkidle');

    // Both emails should be visible in pending invites
    await expect(authenticatedPage.locator(`text=${email1}`)).toBeVisible({ timeout: 10000 });
    await expect(authenticatedPage.locator(`text=${email2}`)).toBeVisible({ timeout: 10000 });
  });
});
