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
    await authenticatedPage.waitForTimeout(1000);

    // Verify the email appears somewhere on the page (pending invites section)
    await expect(authenticatedPage.locator(`text=${uniqueEmail}`)).toBeVisible({ timeout: 10000 });
  });
});
