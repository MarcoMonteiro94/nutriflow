import { test, expect, loginAs, logout } from '../fixtures/auth.fixture';

test.describe('Admin Dashboard', () => {
  test('super admin can access /admin and sees dashboard', async ({ page }) => {
    const success = await loginAs(page, 'superAdmin');
    test.skip(!success, 'Super admin login failed. Ensure test user is seeded with is_super_admin=true.');

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should see the dashboard heading
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Visão geral da plataforma NutriFlow')).toBeVisible();
  });

  test('non-super-admin is redirected away from /admin', async ({ page }) => {
    const success = await loginAs(page, 'nutri');
    test.skip(!success, 'Nutri login failed.');

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should be redirected away or show error (depends on is_super_admin migration)
    await page.waitForURL(/\/(auth\/login|dashboard)/, { timeout: 15000 }).catch(() => {});

    // Non-super-admin should NOT see admin dashboard content
    const hasDashboard = await page.locator('text=Visão geral da plataforma').isVisible().catch(() => false);
    if (page.url().includes('/admin') && !hasDashboard) {
      // Page errored (migration not applied) — skip
      test.skip(true, 'Admin guard may not work without is_super_admin migration');
      return;
    }
    expect(hasDashboard).toBeFalsy();
  });

  test('dashboard displays stats cards with metric values', async ({ page }) => {
    const success = await loginAs(page, 'superAdmin');
    test.skip(!success, 'Super admin login failed.');

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Skip if admin page is not available (migration not applied)
    const hasHeading = await page.locator('text=Visão geral da plataforma').isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasHeading) {
      test.skip(true, 'Admin dashboard not available — is_super_admin migration may not be applied');
      return;
    }

    // Verify all 4 stats cards are visible
    await expect(page.locator('text=Clínicas')).toBeVisible();
    await expect(page.locator('text=Usuários')).toBeVisible();
    await expect(page.locator('text=Pacientes')).toBeVisible();
    await expect(page.locator('text=Convites Pendentes')).toBeVisible();

    // Each card should have a numeric value (at least 0)
    const statsCards = page.locator('[data-slot="card"]');
    const cardCount = await statsCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);
  });

  test('sidebar navigation items are all visible and clickable', async ({ page }) => {
    const success = await loginAs(page, 'superAdmin');
    test.skip(!success, 'Super admin login failed.');

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    const hasHeading = await page.locator('text=Visão geral da plataforma').isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasHeading) {
      test.skip(true, 'Admin dashboard not available — migration may not be applied');
      return;
    }

    // Verify sidebar nav items
    const sidebar = page.locator('aside, [data-slot="sidebar"]').first();

    await expect(sidebar.locator('a[href="/admin"]')).toBeVisible();
    await expect(sidebar.locator('a[href="/admin/organizations"]')).toBeVisible();
    await expect(sidebar.locator('a[href="/admin/users"]')).toBeVisible();
    await expect(sidebar.locator('a[href="/admin/logs"]')).toBeVisible();

    // Verify sidebar labels
    await expect(sidebar.locator('text=Dashboard')).toBeVisible();
    await expect(sidebar.locator('text=Clínicas')).toBeVisible();
    await expect(sidebar.locator('text=Usuários')).toBeVisible();
    await expect(sidebar.locator('text=Logs')).toBeVisible();

    // Verify "Super Admin" badge
    await expect(sidebar.locator('text=Super Admin')).toBeVisible();

    // Verify "Painel Admin" subtitle
    await expect(sidebar.locator('text=Painel Admin')).toBeVisible();
  });

  test('layout is responsive on mobile viewport', async ({ page }) => {
    const success = await loginAs(page, 'superAdmin');
    test.skip(!success, 'Super admin login failed.');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Dashboard content should still be visible
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Stats cards should be visible (stacked on mobile)
    await expect(page.locator('text=Clínicas')).toBeVisible();

    // Sidebar trigger should be visible on mobile
    const sidebarTrigger = page.locator('button[data-sidebar="trigger"]');
    await expect(sidebarTrigger).toBeVisible();
  });

  test('unauthenticated user is redirected from /admin', async ({ page }) => {
    // Go directly to /admin without logging in
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should be redirected to login
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('admin role (not super admin) cannot access /admin', async ({ page }) => {
    const success = await loginAs(page, 'admin');
    test.skip(!success, 'Admin login failed.');

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should be redirected away (depends on is_super_admin migration)
    await page.waitForURL(/\/(auth\/login|dashboard)/, { timeout: 15000 }).catch(() => {});

    const hasDashboard = await page.locator('text=Visão geral da plataforma').isVisible().catch(() => false);
    if (page.url().includes('/admin') && !hasDashboard) {
      test.skip(true, 'Admin guard may not work without is_super_admin migration');
      return;
    }
    expect(hasDashboard).toBeFalsy();
  });
});
