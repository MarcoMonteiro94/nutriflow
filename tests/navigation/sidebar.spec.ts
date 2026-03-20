import { test, expect } from '../fixtures/auth.fixture';

/**
 * Sidebar navigation tests — verify that all sidebar routes are accessible
 * and lead to the correct pages with proper content.
 */
test.describe('Sidebar Navigation', () => {
  test('all main sidebar routes should be accessible', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Verify sidebar is rendered
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-slot="sidebar"]').first()).toBeVisible({ timeout: 10000 });

    // Test each main route
    const routes = [
      { href: '/dashboard', name: /dashboard|painel/i },
      { href: '/patients', name: /pacientes/i },
      { href: '/plans', name: /planos/i },
      { href: '/schedule', name: /agenda/i },
    ];

    for (const route of routes) {
      await page.locator(`a[href="${route.href}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(route.href), { timeout: 10000 });

      // Each page should render a heading or main content
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('dashboard should display stats cards', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should show statistics cards
    const dashboardTitle = page.locator('h1:has-text("Dashboard")');
    await expect(dashboardTitle).toBeVisible({ timeout: 10000 });

    // Should have stat cards visible (patients, plans, appointments)
    const statsArea = page.locator('[class*="shadow"], .card').first();
    await expect(statsArea).toBeVisible({ timeout: 10000 });
  });

  test('sidebar should display user info', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show user info in sidebar footer
    const sidebarFooter = page.locator('[data-slot="sidebar-footer"]');
    await expect(sidebarFooter).toBeVisible({ timeout: 10000 });

    // Should contain user avatar or initials
    const avatar = sidebarFooter.locator('span, img').first();
    await expect(avatar).toBeVisible();
  });

  test('sidebar should show NutriFlow branding', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for NutriFlow logo/text
    await expect(page.locator('text=NutriFlow').first()).toBeVisible();
  });

  test('sidebar should have logout button', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const logoutButton = page.getByRole('button', { name: /sair/i });
    await expect(logoutButton).toBeVisible();
  });

  test('organization link should be visible for admin/owner', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Admin/owner should see organization link in sidebar
    const orgLink = page.locator('a[href*="organization"]').first();
    await expect(orgLink).toBeVisible();

    // Click and verify it works
    await orgLink.click();
    await expect(page).toHaveURL(/\/organization/, { timeout: 10000 });
  });

  test('active navigation item should be highlighted', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    // The active link should have visual distinction
    const patientsLink = page.locator('a[href="/patients"]').first();

    const hasActiveIndicator = await patientsLink.evaluate(el =>
      el.classList.toString().includes('active') ||
      el.getAttribute('data-active') === 'true' ||
      el.getAttribute('aria-current') === 'page',
    );

    expect(hasActiveIndicator).toBeTruthy();
  });
});
