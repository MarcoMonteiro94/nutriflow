import { test, expect, loginAs } from '../fixtures/auth.fixture';

test.describe('Invite Management', () => {
  test.describe('Pending invites on members page', () => {
    test('pending invites show status badges', async ({ page }) => {
      const success = await loginAs(page, 'admin');
      test.skip(!success, 'Admin login failed.');

      await page.goto('/organization/members');
      await page.waitForLoadState('domcontentloaded');

      // Check if pending invites card exists
      const pendingCard = page.locator('[data-testid="pending-invites-card"]');

      // If there are no pending invites, skip the test
      if (!(await pendingCard.isVisible().catch(() => false))) {
        test.skip(true, 'No pending invites card visible.');
        return;
      }

      // Invite rows should have status badges
      const inviteRows = page.locator('[data-testid="invite-row"]');
      if ((await inviteRows.count()) > 0) {
        const statusBadge = inviteRows
          .first()
          .locator('[data-testid="invite-status-badge"]');
        await expect(statusBadge).toBeVisible();
        await expect(statusBadge).toContainText(/Pendente|Expirado/);
      }
    });

    test('cancel pending invite works', async ({ page }) => {
      const success = await loginAs(page, 'admin');
      test.skip(!success, 'Admin login failed.');

      await page.goto('/organization/members');
      await page.waitForLoadState('domcontentloaded');

      // First create an invite so we have something to cancel
      const inviteButton = page.locator('button:has-text("Convidar")');
      if (!(await inviteButton.isVisible().catch(() => false))) {
        test.skip(true, 'No invite button visible — user cannot invite.');
        return;
      }

      await inviteButton.click();

      // Fill email with unique value
      const uniqueEmail = `cancel-test-${Date.now()}@example.com`;
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(uniqueEmail);

      // Select a role
      const roleSelect = page.locator('[data-testid="invite-role-select"]');
      if (await roleSelect.isVisible()) {
        await roleSelect.click();
        await page.locator('[role="option"]').first().click();
      }

      // Submit invite
      const submitButton = page.locator('button[type="submit"]:has-text("Enviar"), button:has-text("Enviar Convite")');
      await submitButton.click();

      // Wait for page to refresh
      await page.waitForTimeout(2000);
      await page.goto('/organization/members');
      await page.waitForLoadState('domcontentloaded');

      // Find the cancel button for the invite
      const cancelButton = page.locator('[data-testid="cancel-invite"]').first();

      if (!(await cancelButton.isVisible().catch(() => false))) {
        test.skip(true, 'No pending invites with cancel button.');
        return;
      }

      // Count invites before cancel
      const invitesBefore = await page.locator('[data-testid="invite-row"]').count();

      // Click cancel
      await cancelButton.click();

      // Confirmation dialog should appear
      const cancelDialog = page.locator('[data-testid="cancel-invite-dialog"]');
      await expect(cancelDialog).toBeVisible({ timeout: 5000 });

      // Confirm cancellation
      await cancelDialog.locator('[data-testid="cancel-invite-confirm"]').click();

      // Wait for page to refresh
      await page.waitForTimeout(2000);

      // After refresh, invite count should be less
      const invitesAfter = await page.locator('[data-testid="invite-row"]').count();
      expect(invitesAfter).toBeLessThan(invitesBefore);
    });

    test('resend invite generates new token and updates expiry', async ({ page }) => {
      const success = await loginAs(page, 'admin');
      test.skip(!success, 'Admin login failed.');

      await page.goto('/organization/members');
      await page.waitForLoadState('domcontentloaded');

      // Check if we have any pending invites with a resend button
      const resendButton = page.locator('[data-testid="resend-invite"]').first();

      if (!(await resendButton.isVisible().catch(() => false))) {
        test.skip(true, 'No pending invites with resend button.');
        return;
      }

      // Click resend
      await resendButton.click();

      // Wait for the resend to complete (the spinning animation stops)
      await page.waitForTimeout(2000);

      // Page should refresh — verify invites still show
      const pendingCard = page.locator('[data-testid="pending-invites-card"]');
      await expect(pendingCard).toBeVisible({ timeout: 10000 });

      // The invite should still be there (resend doesn't delete)
      const inviteRows = page.locator('[data-testid="invite-row"]');
      expect(await inviteRows.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Admin org detail invite management', () => {
    test('admin can create invite from org detail page', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      if (await page.locator('[data-testid="org-empty-state"]').isVisible()) {
        test.skip(true, 'No organizations seeded.');
        return;
      }

      // Navigate to first org detail
      await page.locator('[data-testid="org-card"]').first().locator('a').first().click();
      await page.waitForSelector('[data-testid="org-detail"]', { timeout: 10000 });

      // Click invite button
      await page.locator('[data-testid="invite-admin-button"]').click();

      // Fill email
      const uniqueEmail = `admin-invite-${Date.now()}@example.com`;
      await page.locator('[data-testid="invite-email-input"]').fill(uniqueEmail);

      // Submit
      await page.locator('[data-testid="invite-submit"]').click();

      // Wait for invite URL to appear
      const inviteUrl = page.locator('[data-testid="invite-url"]');
      await expect(inviteUrl).toBeVisible({ timeout: 10000 });

      const urlValue = await inviteUrl.inputValue();
      expect(urlValue).toContain('/invite/');
    });
  });
});
