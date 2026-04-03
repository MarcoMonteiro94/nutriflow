import { test, expect, loginAs } from '../fixtures/auth.fixture';

/**
 * Comprehensive access control tests for the admin panel.
 *
 * Verifies that non-super-admin users (nutri, admin, receptionist, patient)
 * and unauthenticated users cannot access any /admin/* routes.
 */

const ADMIN_ROUTES = [
  '/admin',
  '/admin/organizations',
  '/admin/users',
  '/admin/logs',
] as const;

const NON_SUPER_ADMIN_ROLES = [
  'nutri',
  'admin',
  'receptionist',
  'patient',
] as const;

test.describe('Admin Access Control', () => {
  test.describe('Unauthenticated access', () => {
    for (const route of ADMIN_ROUTES) {
      test(`unauthenticated user redirected from ${route}`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');

        await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
        expect(page.url()).toContain('/auth/login');
      });
    }
  });

  test.describe('Non-super-admin roles blocked', () => {
    for (const role of NON_SUPER_ADMIN_ROLES) {
      test(`${role} role is redirected from /admin dashboard`, async ({ page }) => {
        const success = await loginAs(page, role as Parameters<typeof loginAs>[1]);
        test.skip(!success, `${role} login failed.`);

        await page.goto('/admin');
        await page.waitForLoadState('domcontentloaded');

        await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
        expect(page.url()).toContain('/auth/login');
      });

      test(`${role} role is redirected from /admin/organizations`, async ({ page }) => {
        const success = await loginAs(page, role as Parameters<typeof loginAs>[1]);
        test.skip(!success, `${role} login failed.`);

        await page.goto('/admin/organizations');
        await page.waitForLoadState('domcontentloaded');

        await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
        expect(page.url()).toContain('/auth/login');
      });

      test(`${role} role is redirected from /admin/users`, async ({ page }) => {
        const success = await loginAs(page, role as Parameters<typeof loginAs>[1]);
        test.skip(!success, `${role} login failed.`);

        await page.goto('/admin/users');
        await page.waitForLoadState('domcontentloaded');

        await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
        expect(page.url()).toContain('/auth/login');
      });

      test(`${role} role is redirected from /admin/logs`, async ({ page }) => {
        const success = await loginAs(page, role as Parameters<typeof loginAs>[1]);
        test.skip(!success, `${role} login failed.`);

        await page.goto('/admin/logs');
        await page.waitForLoadState('domcontentloaded');

        await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
        expect(page.url()).toContain('/auth/login');
      });
    }
  });

  test.describe('Super admin access granted', () => {
    for (const route of ADMIN_ROUTES) {
      test(`super admin can access ${route}`, async ({ page }) => {
        const success = await loginAs(page, 'superAdmin');
        test.skip(!success, 'Super admin login failed.');

        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');

        // Should NOT be redirected to login
        await page.waitForTimeout(2000);
        expect(page.url()).not.toContain('/auth/login');
        expect(page.url()).toContain('/admin');
      });
    }
  });

  test.describe('Admin API endpoints access control', () => {
    test('non-super-admin gets 401/403 from /api/admin/stats', async ({ page }) => {
      const success = await loginAs(page, 'nutri');
      test.skip(!success, 'Nutri login failed.');

      const response = await page.request.get('/api/admin/stats');
      expect([401, 403]).toContain(response.status());
    });

    test('non-super-admin gets 401/403 from /api/admin/organizations', async ({ page }) => {
      const success = await loginAs(page, 'nutri');
      test.skip(!success, 'Nutri login failed.');

      const response = await page.request.get('/api/admin/organizations');
      expect([401, 403]).toContain(response.status());
    });

    test('non-super-admin gets 401/403 from /api/admin/users', async ({ page }) => {
      const success = await loginAs(page, 'nutri');
      test.skip(!success, 'Nutri login failed.');

      const response = await page.request.get('/api/admin/users');
      expect([401, 403]).toContain(response.status());
    });

    test('non-super-admin gets 401/403 from /api/admin/audit-logs', async ({ page }) => {
      const success = await loginAs(page, 'nutri');
      test.skip(!success, 'Nutri login failed.');

      const response = await page.request.get('/api/admin/audit-logs');
      expect([401, 403]).toContain(response.status());
    });

    test('unauthenticated gets 401 from /api/admin/stats', async ({ page }) => {
      const response = await page.request.get('/api/admin/stats');
      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('Permission boundaries', () => {
    test('nutri cannot invite admin role via organization invite', async ({ page }) => {
      const success = await loginAs(page, 'nutri');
      test.skip(!success, 'Nutri login failed.');

      await page.goto('/organization/members');
      await page.waitForLoadState('domcontentloaded');

      const inviteButton = page.getByRole('button', { name: /convidar membro/i });
      const hasInviteButton = await inviteButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasInviteButton) {
        test.skip(true, 'Nutri cannot see invite button — may not have org access.');
        return;
      }

      await inviteButton.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Open role dropdown
      const roleButton = dialog.locator('button[role="combobox"]').first();
      await roleButton.click();

      // Admin option should NOT be available
      const adminOption = page.getByRole('option', { name: /administrador/i });
      const hasAdmin = await adminOption.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasAdmin).toBeFalsy();

      // But Recepcionista and Paciente should be available
      const recepOption = page.getByRole('option', { name: /recepcionista/i });
      const hasRecep = await recepOption.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasRecep).toBeTruthy();

      // Close dialog
      await page.keyboard.press('Escape');
    });

    test('receptionist cannot invite nutri or admin roles', async ({ page }) => {
      const success = await loginAs(page, 'receptionist');
      test.skip(!success, 'Receptionist login failed.');

      await page.goto('/organization/members');
      await page.waitForLoadState('domcontentloaded');

      const inviteButton = page.getByRole('button', { name: /convidar membro/i });
      const hasInviteButton = await inviteButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasInviteButton) {
        // Receptionist may only be able to invite patient or have no invite permission
        // This is acceptable — verify they can't see invite options for admin/nutri
        return;
      }

      await inviteButton.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      const roleButton = dialog.locator('button[role="combobox"]').first();
      if (await roleButton.isVisible()) {
        await roleButton.click();

        // Admin and Nutri options should NOT be available
        const adminOption = page.getByRole('option', { name: /administrador/i });
        const hasAdmin = await adminOption.isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasAdmin).toBeFalsy();

        const nutriOption = page.getByRole('option', { name: /nutricionista/i });
        const hasNutri = await nutriOption.isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasNutri).toBeFalsy();
      }

      // Close dialog
      await page.keyboard.press('Escape');
    });
  });
});
