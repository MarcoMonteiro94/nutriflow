import { test, expect, loginAs } from '../fixtures/auth.fixture';

test.describe('Admin Deactivation & Audit Logs', () => {
  // ---------------------------------------------------------------
  // Organization deactivation
  // ---------------------------------------------------------------
  test.describe('Organization deactivation', () => {
    test('deactivate clinic shows confirmation dialog', async ({ page }) => {
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

      // Find an active org and click its toggle button
      const firstToggle = page.locator('[data-testid="org-toggle-active"]').first();
      await firstToggle.click();

      // Confirmation dialog should appear
      const dialog = page.locator('[data-testid="org-toggle-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog).toContainText(/Desativar clínica|Reativar clínica/);

      // Cancel button should be present
      await expect(dialog.locator('button:has-text("Cancelar")')).toBeVisible();
    });

    test('deactivated clinic shows inactive status badge', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      // First, create a new clinic so we can safely deactivate it
      await page.goto('/admin/organizations');
      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      const uniqueSuffix = Date.now();
      const clinicName = `Deactivation Test ${uniqueSuffix}`;

      // Create the clinic
      await page.locator('[data-testid="create-org-button"]').click();
      const createDialog = page.locator('[data-testid="create-org-dialog"]');
      await expect(createDialog).toBeVisible();

      await createDialog.locator('[data-testid="org-name-input"]').fill(clinicName);
      await createDialog.locator('[data-testid="create-org-submit"]').click();
      await expect(createDialog).toBeHidden({ timeout: 10000 });

      // Wait for list to refresh
      await page.waitForSelector('[data-testid="org-list"]', { timeout: 10000 });
      await expect(page.locator(`text=${clinicName}`)).toBeVisible({ timeout: 5000 });

      // Navigate to the created clinic's detail page
      const clinicCard = page.locator(`[data-testid="org-card"]:has-text("${clinicName}")`);
      await clinicCard.locator('a').first().click();
      await page.waitForSelector('[data-testid="org-detail"]', { timeout: 10000 });

      // Verify it's active
      await expect(page.locator('[data-testid="org-detail-status"]')).toContainText('Ativa');

      // Click deactivate button
      await page.locator('[data-testid="org-detail-toggle-active"]').click();

      // Confirm deactivation
      const dialog = page.locator('[data-testid="org-detail-toggle-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await dialog.locator('[data-testid="org-detail-toggle-confirm"]').click();

      // Wait for dialog to close
      await expect(dialog).toBeHidden({ timeout: 10000 });

      // Badge should now show "Inativa"
      await expect(page.locator('[data-testid="org-detail-status"]')).toContainText('Inativa');
    });

    test('reactivate clinic works correctly', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      // Filter to inactive clinics
      await page.locator('[data-testid="org-status-filter"]').click();
      await page.locator('[role="option"]:has-text("Inativas")').click();

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      if (await page.locator('[data-testid="org-empty-state"]').isVisible()) {
        test.skip(true, 'No inactive organizations available to reactivate.');
        return;
      }

      // Click first inactive org detail
      const firstOrgLink = page.locator('[data-testid="org-card"]').first().locator('a').first();
      await firstOrgLink.click();
      await page.waitForSelector('[data-testid="org-detail"]', { timeout: 10000 });

      // Should show "Inativa" badge
      await expect(page.locator('[data-testid="org-detail-status"]')).toContainText('Inativa');

      // Click reactivate
      await page.locator('[data-testid="org-detail-toggle-active"]').click();

      const dialog = page.locator('[data-testid="org-detail-toggle-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog).toContainText('Reativar clínica');

      await dialog.locator('[data-testid="org-detail-toggle-confirm"]').click();
      await expect(dialog).toBeHidden({ timeout: 10000 });

      // Badge should now show "Ativa"
      await expect(page.locator('[data-testid="org-detail-status"]')).toContainText('Ativa');
    });
  });

  // ---------------------------------------------------------------
  // User deactivation
  // ---------------------------------------------------------------
  test.describe('User deactivation', () => {
    test('deactivate user shows confirmation dialog', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/users');
      await page.waitForSelector(
        '[data-testid="user-list"], [data-testid="user-empty-state"]',
        { timeout: 10000 },
      );

      if (await page.locator('[data-testid="user-empty-state"]').isVisible()) {
        test.skip(true, 'No users seeded.');
        return;
      }

      // Find a toggle button (non-super-admin users)
      const toggleButton = page.locator('[data-testid="user-toggle-active"]').first();

      if ((await toggleButton.count()) === 0) {
        test.skip(true, 'No non-super-admin users available for deactivation.');
        return;
      }

      await toggleButton.click();

      // Confirmation dialog should appear
      const dialog = page.locator('[data-testid="user-toggle-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog).toContainText(/Desativar usuário|Reativar usuário/);
    });

    test('deactivated user shows inactive status badge', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/users');
      await page.waitForSelector(
        '[data-testid="user-list"], [data-testid="user-empty-state"]',
        { timeout: 10000 },
      );

      if (await page.locator('[data-testid="user-empty-state"]').isVisible()) {
        test.skip(true, 'No users seeded.');
        return;
      }

      // Find an active user's toggle button
      const activeUserCard = page.locator(
        '[data-testid="user-card"]:has([data-testid="user-status-badge"]:has-text("Ativo"))',
      );

      const toggleButton = activeUserCard
        .first()
        .locator('[data-testid="user-toggle-active"]');

      if ((await toggleButton.count()) === 0) {
        test.skip(true, 'No active non-super-admin users available.');
        return;
      }

      await toggleButton.click();

      // Confirm deactivation
      const dialog = page.locator('[data-testid="user-toggle-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await dialog.locator('[data-testid="user-toggle-confirm"]').click();
      await expect(dialog).toBeHidden({ timeout: 10000 });

      // The user's status badge in the card should now show "Inativo"
      // We need to wait for the optimistic UI update
      await page.waitForTimeout(500);

      // Verify at least one card shows "Inativo"
      const inactiveBadge = page.locator(
        '[data-testid="user-status-badge"]:has-text("Inativo")',
      );
      expect(await inactiveBadge.count()).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------
  // Audit logs
  // ---------------------------------------------------------------
  test.describe('Audit logs page', () => {
    test('audit logs page loads and displays events', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/logs');
      await page.waitForLoadState('domcontentloaded');

      // Verify page heading
      await expect(page.locator('h1')).toContainText('Logs de Auditoria');

      // Wait for loading to finish
      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Log count should be visible
      const countEl = page.locator('[data-testid="log-count"]');
      await expect(countEl).toBeVisible();
    });

    test('audit logs filterable by action type', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/logs');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Open action filter
      await page.locator('[data-testid="log-action-filter"]').click();
      await page.waitForSelector('[role="option"]', { timeout: 3000 });

      // Select a specific action
      const inviteOption = page.locator('[role="option"]:has-text("Convite criado")');
      if (await inviteOption.isVisible()) {
        await inviteOption.click();
      } else {
        // Select any available action option
        const anyOption = page.locator('[role="option"]').nth(1);
        await anyOption.click();
      }

      // Wait for filtered results
      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Page should not error
      const countEl = page.locator('[data-testid="log-count"]');
      await expect(countEl).toBeVisible();
    });

    test('audit logs filterable by date range', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/logs');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Set date range to last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
      const dateTo = today.toISOString().split('T')[0];

      await page.locator('[data-testid="log-date-from"]').fill(dateFrom);
      await page.locator('[data-testid="log-date-to"]').fill(dateTo);

      // Wait for filtered results
      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Count should be visible
      const countEl = page.locator('[data-testid="log-count"]');
      await expect(countEl).toBeVisible();
    });

    test('deactivation actions appear in audit logs', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/logs');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Filter by org.deactivate action
      await page.locator('[data-testid="log-action-filter"]').click();
      await page.waitForSelector('[role="option"]', { timeout: 3000 });

      const deactivateOption = page.locator(
        '[role="option"]:has-text("Clínica desativada")',
      );

      if (await deactivateOption.isVisible()) {
        await deactivateOption.click();

        await page.waitForSelector(
          '[data-testid="log-list"], [data-testid="log-empty-state"]',
          { timeout: 10000 },
        );

        // If we previously deactivated a clinic, there should be log entries
        const logList = page.locator('[data-testid="log-list"]');
        if (await logList.isVisible()) {
          const entries = page.locator('[data-testid="log-entry"]');
          expect(await entries.count()).toBeGreaterThan(0);

          // Each entry should have the deactivation action badge
          const firstBadge = entries
            .first()
            .locator('[data-testid="log-action-badge"]');
          await expect(firstBadge).toContainText('Clínica desativada');
        }
      } else {
        // Close dropdown and skip
        await page.keyboard.press('Escape');
        test.skip(true, 'No deactivation logs available.');
      }
    });
  });

  // ---------------------------------------------------------------
  // Access control
  // ---------------------------------------------------------------
  test.describe('Logs access control', () => {
    test('non-super-admin cannot access audit logs', async ({ page }) => {
      const success = await loginAs(page, 'nutri');
      test.skip(!success, 'Nutri login failed.');

      await page.goto('/admin/logs');
      await page.waitForLoadState('domcontentloaded');

      // Should be redirected to login
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
      expect(page.url()).toContain('/auth/login');
    });
  });
});
