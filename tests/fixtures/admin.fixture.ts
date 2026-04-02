import { test as base, expect, Page } from '@playwright/test';
import { loginAs } from './auth.fixture';
import { testUsers } from './test-data';

/**
 * Extended test fixture providing an authenticated super admin context.
 *
 * Usage:
 *   import { adminTest, expect } from '../fixtures/admin.fixture';
 *   adminTest('my test', async ({ superAdminPage }) => { ... });
 *
 * The fixture logs in as the super admin user and navigates to /admin
 * before each test. If login fails or Supabase is unavailable the test
 * is automatically skipped.
 */

export type AdminFixtures = {
  superAdminPage: Page;
};

export const adminTest = base.extend<AdminFixtures>({
  superAdminPage: async ({ page }, use, testInfo) => {
    const success = await loginAs(page, 'superAdmin');

    if (!success) {
      testInfo.skip(
        true,
        'Super admin login failed. Ensure test-superadmin@example.com is seeded with is_super_admin=true.',
      );
      return;
    }

    // Navigate to admin panel
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    await use(page);
  },
});

export { expect };

/**
 * Helper: navigate to an admin sub-page after login.
 * Useful when you don't need the full fixture but want a quick login + goto.
 */
export async function loginAsSuperAdmin(page: Page): Promise<boolean> {
  return loginAs(page, 'superAdmin');
}

/**
 * Helper: verify the page redirected away from an admin route
 * (used by access-control tests).
 */
export async function expectAdminRedirect(page: Page): Promise<void> {
  await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
  expect(page.url()).toContain('/auth/login');
}
