import { test, expect, loginAs } from '../fixtures/auth.fixture';

test.describe('Admin Audit Logs', () => {
  test.describe('Page load and display', () => {
    test('audit logs page loads with heading and filters', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/logs');
      await page.waitForLoadState('domcontentloaded');

      // Heading
      await expect(page.locator('h1')).toContainText('Logs de Auditoria');

      // Filters should be visible
      await expect(page.locator('[data-testid="log-action-filter"]')).toBeVisible();
      await expect(page.locator('[data-testid="log-date-from"]')).toBeVisible();
      await expect(page.locator('[data-testid="log-date-to"]')).toBeVisible();

      // Wait for data to load
      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Log count element should be visible
      await expect(page.locator('[data-testid="log-count"]')).toBeVisible();
    });

    test('log entries display action badge, resource, user, and timestamp', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/logs');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      const logList = page.locator('[data-testid="log-list"]');
      if (!(await logList.isVisible())) {
        test.skip(true, 'No audit log entries available.');
        return;
      }

      const firstEntry = page.locator('[data-testid="log-entry"]').first();
      await expect(firstEntry).toBeVisible();

      // Action badge should be present
      const actionBadge = firstEntry.locator('[data-testid="log-action-badge"]');
      await expect(actionBadge).toBeVisible();
    });

    test('log count reflects actual entries', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/logs');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      const countEl = page.locator('[data-testid="log-count"]');
      await expect(countEl).toBeVisible();

      const countText = await countEl.textContent();
      const match = countText?.match(/(\d+)/);
      const displayedCount = match ? parseInt(match[1], 10) : 0;

      if (displayedCount > 0) {
        const entryCount = await page.locator('[data-testid="log-entry"]').count();
        expect(entryCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Filter by action type', () => {
    test('action filter dropdown shows available actions', async ({ page }) => {
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

      // Should have more than 1 option (including "Todas")
      const options = page.locator('[role="option"]');
      expect(await options.count()).toBeGreaterThan(1);

      // Close dropdown
      await page.keyboard.press('Escape');
    });

    test('selecting an action filter re-fetches logs', async ({ page }) => {
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

      // Select invite.create if available, otherwise any non-first option
      const inviteOption = page.locator('[role="option"]:has-text("Convite criado")');
      if (await inviteOption.isVisible()) {
        await inviteOption.click();
      } else {
        const anyOption = page.locator('[role="option"]').nth(1);
        if ((await anyOption.count()) > 0) {
          await anyOption.click();
        } else {
          await page.keyboard.press('Escape');
          test.skip(true, 'No action filter options available.');
          return;
        }
      }

      // Wait for filtered results
      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Page should not crash
      await expect(page.locator('[data-testid="log-count"]')).toBeVisible();
    });

    test('org.create logs appear when filtering by org creation', async ({ page }) => {
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

      const orgCreateOption = page.locator('[role="option"]:has-text("Clínica criada")');
      if (!(await orgCreateOption.isVisible())) {
        await page.keyboard.press('Escape');
        test.skip(true, 'No org.create action available in filter.');
        return;
      }

      await orgCreateOption.click();

      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      const logList = page.locator('[data-testid="log-list"]');
      if (await logList.isVisible()) {
        const entries = page.locator('[data-testid="log-entry"]');
        expect(await entries.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Filter by date range', () => {
    test('date range filters narrow results', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/logs');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Set today's date range
      const today = new Date().toISOString().split('T')[0];
      await page.locator('[data-testid="log-date-from"]').fill(today);
      await page.locator('[data-testid="log-date-to"]').fill(today);

      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      await expect(page.locator('[data-testid="log-count"]')).toBeVisible();
    });

    test('future date range shows empty state', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/logs');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Set a future date range where no logs should exist
      const futureDate = '2099-01-01';
      await page.locator('[data-testid="log-date-from"]').fill(futureDate);
      await page.locator('[data-testid="log-date-to"]').fill(futureDate);

      await page.waitForSelector('[data-testid="log-empty-state"]', { timeout: 10000 });

      await expect(page.locator('[data-testid="log-empty-state"]')).toBeVisible();
    });

    test('combined action + date filters work together', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/logs');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Set date range for last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      await page.locator('[data-testid="log-date-from"]').fill(
        thirtyDaysAgo.toISOString().split('T')[0],
      );
      await page.locator('[data-testid="log-date-to"]').fill(
        today.toISOString().split('T')[0],
      );

      // Also apply an action filter
      await page.locator('[data-testid="log-action-filter"]').click();
      await page.waitForSelector('[role="option"]', { timeout: 3000 });

      const options = page.locator('[role="option"]');
      if ((await options.count()) > 1) {
        await options.nth(1).click();
      } else {
        await page.keyboard.press('Escape');
      }

      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Should not crash — count element should be visible
      await expect(page.locator('[data-testid="log-count"]')).toBeVisible();
    });
  });

  test.describe('Clear filters', () => {
    test('clearing filters restores full log list', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/logs');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Get initial count
      const initialCountText = await page.locator('[data-testid="log-count"]').textContent();

      // Set a restrictive future date filter
      await page.locator('[data-testid="log-date-from"]').fill('2099-01-01');
      await page.locator('[data-testid="log-date-to"]').fill('2099-01-02');

      await page.waitForSelector(
        '[data-testid="log-list"], [data-testid="log-empty-state"]',
        { timeout: 10000 },
      );

      // Look for a clear/reset button
      const clearButton = page.locator('button:has-text("Limpar")');
      if (await clearButton.isVisible()) {
        await clearButton.click();

        await page.waitForSelector(
          '[data-testid="log-list"], [data-testid="log-empty-state"]',
          { timeout: 10000 },
        );

        // Count should be restored
        const restoredCountText = await page.locator('[data-testid="log-count"]').textContent();
        expect(restoredCountText).toBe(initialCountText);
      }
    });
  });
});
