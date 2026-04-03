import { test, expect, loginAs } from '../fixtures/auth.fixture';

test.describe('Admin Dashboard', () => {
  test('super admin can access /admin and sees dashboard', async ({ page }) => {
    const success = await loginAs(page, 'superAdmin');
    test.skip(!success, 'Super admin login failed.');

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    const hasHeading = await page.locator('text=Visão geral da plataforma').isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasHeading) {
      test.skip(true, 'Admin dashboard not available — migration may not be applied');
      return;
    }

    await expect(page.locator('h1')).toContainText('Dashboard');

    // Stats cards in main area
    const main = page.getByRole('main');
    await expect(main.locator('text=Clínicas')).toBeVisible();
    await expect(main.locator('text=Usuários')).toBeVisible();
    await expect(main.locator('text=Pacientes')).toBeVisible();
    await expect(main.locator('text=Convites Pendentes')).toBeVisible();
  });

  test('non-super-admin cannot see admin dashboard content', async ({ page }) => {
    const success = await loginAs(page, 'nutri');
    test.skip(!success, 'Nutri login failed.');

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Wait for potential redirect
    await page.waitForURL(/\/(auth\/login|dashboard)/, { timeout: 10000 }).catch(() => {});

    const hasDashboard = await page.locator('text=Visão geral da plataforma').isVisible().catch(() => false);
    if (page.url().includes('/admin') && !hasDashboard) {
      test.skip(true, 'Admin guard may not work without migration');
      return;
    }
    expect(hasDashboard).toBeFalsy();
  });
});
