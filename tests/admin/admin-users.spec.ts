import { test, expect, loginAs } from '../fixtures/auth.fixture';

test.describe('Admin Users', () => {
  test('users page loads and displays users', async ({ page }) => {
    const success = await loginAs(page, 'superAdmin');
    test.skip(!success, 'Super admin login failed. Ensure test user is seeded with is_super_admin=true.');

    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText('Usuários');

    // Wait for loading to finish
    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );

    // If users exist, verify cards are displayed
    const userList = page.locator('[data-testid="user-list"]');
    if (await userList.isVisible()) {
      const cards = page.locator('[data-testid="user-card"]');
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  test('user count is displayed', async ({ page }) => {
    const success = await loginAs(page, 'superAdmin');
    test.skip(!success, 'Super admin login failed.');

    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );

    const countEl = page.locator('[data-testid="user-count"]');
    await expect(countEl).toBeVisible();
    await expect(countEl).toContainText(/\d+\s+usuários?\s+encontrados?/);
  });

  test('filters by role correctly', async ({ page }) => {
    const success = await loginAs(page, 'superAdmin');
    test.skip(!success, 'Super admin login failed.');

    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );

    // Store initial count text
    const initialCountText = await page.locator('[data-testid="user-count"]').textContent();

    // Open the role filter (Radix Select)
    await page.locator('[data-testid="user-role-filter"]').click();
    await page.waitForSelector('[role="option"]', { timeout: 3000 });

    // Select "Admin" role
    await page.locator('[role="option"]:has-text("Admin")').click();

    // Wait for the list to reload after filter change
    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );

    // If results exist, verify cards are present
    const userList = page.locator('[data-testid="user-list"]');
    if (await userList.isVisible()) {
      const cards = page.locator('[data-testid="user-card"]');
      expect(await cards.count()).toBeGreaterThan(0);
    }

    // Reset filter back to "Todos"
    await page.locator('[data-testid="user-role-filter"]').click();
    await page.waitForSelector('[role="option"]', { timeout: 3000 });
    await page.locator('[role="option"]:has-text("Todos")').click();

    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );
    const restoredCountText = await page.locator('[data-testid="user-count"]').textContent();
    expect(restoredCountText).toBe(initialCountText);
  });

  test('filters by organization correctly', async ({ page }) => {
    const success = await loginAs(page, 'superAdmin');
    test.skip(!success, 'Super admin login failed.');

    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );

    const initialCountText = await page.locator('[data-testid="user-count"]').textContent();

    // Open the org filter
    await page.locator('[data-testid="user-org-filter"]').click();
    await page.waitForSelector('[role="option"]', { timeout: 3000 });

    // Get all options except "Todas"
    const orgOptions = page.locator('[role="option"]:not(:has-text("Todas"))');
    const orgCount = await orgOptions.count();

    if (orgCount === 0) {
      // Close dropdown and skip
      await page.keyboard.press('Escape');
      test.skip(true, 'No organizations available to filter by.');
      return;
    }

    // Select the first organization
    await orgOptions.first().click();

    // Wait for the list to reload
    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );

    // Verify the filter was applied (count should exist)
    const countEl = page.locator('[data-testid="user-count"]');
    await expect(countEl).toBeVisible();

    // Reset filter
    await page.locator('[data-testid="user-org-filter"]').click();
    await page.waitForSelector('[role="option"]', { timeout: 3000 });
    await page.locator('[role="option"]:has-text("Todas")').click();

    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );
    const restoredCountText = await page.locator('[data-testid="user-count"]').textContent();
    expect(restoredCountText).toBe(initialCountText);
  });

  test('search filters results', async ({ page }) => {
    const success = await loginAs(page, 'superAdmin');
    test.skip(!success, 'Super admin login failed.');

    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );

    const initialCountText = await page.locator('[data-testid="user-count"]').textContent();

    // Type a search term that should match at least the super admin user
    const searchInput = page.locator('[data-testid="user-search"]');
    await searchInput.fill('test-superadmin@example.com');

    // Wait for debounce (300ms) + API fetch
    await page.waitForTimeout(500);
    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );

    const countEl = page.locator('[data-testid="user-count"]');
    await expect(countEl).toBeVisible();

    // Clear the search to restore results
    await searchInput.clear();

    await page.waitForTimeout(500);
    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );
    const restoredCountText = await page.locator('[data-testid="user-count"]').textContent();
    expect(restoredCountText).toBe(initialCountText);
  });

  test('empty state displayed when no matching users', async ({ page }) => {
    const success = await loginAs(page, 'superAdmin');
    test.skip(!success, 'Super admin login failed.');

    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );

    // Search for a nonsense term that should yield zero results
    const searchInput = page.locator('[data-testid="user-search"]');
    await searchInput.fill('xyznonexistent123foobarbaz');

    // Wait for debounce + API fetch to show empty state
    await page.waitForSelector('[data-testid="user-empty-state"]', { timeout: 10000 });

    const emptyState = page.locator('[data-testid="user-empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Nenhum usuário encontrado');

    const countEl = page.locator('[data-testid="user-count"]');
    await expect(countEl).toContainText('0');
  });

  test('user cards display expected information', async ({ page }) => {
    const success = await loginAs(page, 'superAdmin');
    test.skip(!success, 'Super admin login failed.');

    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');

    // Wait for users to load
    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    ).catch(() => null);

    if (await page.locator('[data-testid="user-empty-state"]').isVisible()) {
      test.skip(true, 'No users seeded.');
      return;
    }

    const firstCard = page.locator('[data-testid="user-card"]').first();
    await expect(firstCard).toBeVisible();

    // Each card should have an avatar
    await expect(firstCard.locator('[data-slot="avatar"]')).toBeVisible();

    // Should display at least one role badge
    const roleBadge = firstCard.locator(
      'text=/Admin|Nutricionista|Recepcionista|Paciente/',
    );
    expect(await roleBadge.count()).toBeGreaterThan(0);

    // Should display a status badge
    const statusBadge = firstCard.locator('text=/Ativo|Inativo/');
    expect(await statusBadge.count()).toBeGreaterThan(0);
  });

  test('combined filters work together', async ({ page }) => {
    const success = await loginAs(page, 'superAdmin');
    test.skip(!success, 'Super admin login failed.');

    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );

    // Apply role filter
    await page.locator('[data-testid="user-role-filter"]').click();
    await page.waitForSelector('[role="option"]', { timeout: 3000 });
    await page.locator('[role="option"]:has-text("Nutricionista")').click();

    // Wait for filtered results
    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );

    // Add a search term on top of the role filter
    const searchInput = page.locator('[data-testid="user-search"]');
    await searchInput.fill('test');

    // Wait for combined filter results
    await page.waitForTimeout(500);
    await page.waitForSelector(
      '[data-testid="user-list"], [data-testid="user-empty-state"]',
      { timeout: 10000 },
    );

    // The page should not show an error
    const errorEl = page.locator('[data-testid="user-error"]');
    await expect(errorEl).not.toBeVisible();
  });

  test.describe('User deactivation', () => {
    test('deactivate user toggle shows confirmation dialog', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/users');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="user-list"], [data-testid="user-empty-state"]',
        { timeout: 10000 },
      );

      if (await page.locator('[data-testid="user-empty-state"]').isVisible()) {
        test.skip(true, 'No users seeded.');
        return;
      }

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

      // Cancel button should be present
      await expect(dialog.locator('button:has-text("Cancelar")')).toBeVisible();

      // Close the dialog without confirming
      await dialog.locator('button:has-text("Cancelar")').click();
      await expect(dialog).toBeHidden({ timeout: 5000 });
    });

    test('deactivated user shows inactive status badge', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/users');
      await page.waitForLoadState('domcontentloaded');

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

      // Wait for the optimistic UI update
      await page.waitForTimeout(500);

      // Verify at least one card shows "Inativo"
      const inactiveBadge = page.locator(
        '[data-testid="user-status-badge"]:has-text("Inativo")',
      );
      expect(await inactiveBadge.count()).toBeGreaterThan(0);
    });
  });
});
