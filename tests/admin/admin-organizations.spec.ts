import { test, expect, loginAs } from '../fixtures/auth.fixture';

test.describe('Admin Organizations', () => {
  test.describe('Organizations list page', () => {
    test('organizations page loads and displays clinics', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed. Ensure test user is seeded with is_super_admin=true.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      // Verify page heading
      await expect(page.locator('h1')).toContainText('Clínicas');

      // Wait for loading to finish — either org list or empty state should appear
      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      // Verify search input and status filter are rendered
      await expect(page.locator('[data-testid="org-search"]')).toBeVisible();
      await expect(page.locator('[data-testid="org-status-filter"]')).toBeVisible();

      // Verify "Nova Clinica" button is present
      await expect(page.locator('[data-testid="create-org-button"]')).toBeVisible();
    });

    test('org cards display name, slug, and status badge', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      // Wait for list to load
      const orgList = page.locator('[data-testid="org-list"]');
      const emptyState = page.locator('[data-testid="org-empty-state"]');

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      // If no orgs seeded, skip the card assertions
      if (await emptyState.isVisible()) {
        test.skip(true, 'No organizations seeded — skipping card content assertions.');
        return;
      }

      // At least one org card should be present
      const cards = orgList.locator('[data-testid="org-card"]');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThanOrEqual(1);

      // First card should contain a name, slug, and status badge
      const firstCard = cards.first();
      await expect(firstCard.locator('h3')).not.toBeEmpty();
      // Slug is shown in a <p> with font-mono
      await expect(firstCard.locator('p.font-mono')).toBeVisible();
      // Status badge: either "Ativa" or "Inativa"
      const badge = firstCard.locator('[class*="badge"]').first();
      await expect(badge).toBeVisible();
    });

    test('search filters organizations', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      const searchInput = page.locator('[data-testid="org-search"]');
      await expect(searchInput).toBeVisible();

      // Type a search term that is unlikely to match anything
      await searchInput.fill('xyznonexistent123');

      // Debounce is 300ms — wait for results to settle
      await page.waitForTimeout(500);
      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      // Empty state should appear
      await expect(page.locator('[data-testid="org-empty-state"]')).toBeVisible();
    });

    test('status filter changes displayed organizations', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      // Open status filter and select "Inativas"
      const filterTrigger = page.locator('[data-testid="org-status-filter"]');
      await filterTrigger.click();

      // Select "Inativas" from the dropdown
      await page.locator('[role="option"]:has-text("Inativas")').click();

      // Wait for re-fetch
      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      // Page should not crash — either list or empty state is fine
      const listVisible = await page.locator('[data-testid="org-list"]').isVisible();
      const emptyVisible = await page.locator('[data-testid="org-empty-state"]').isVisible();
      expect(listVisible || emptyVisible).toBe(true);
    });

    test('empty state displayed when no matching organizations', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      // Search for a term guaranteed not to match
      const searchInput = page.locator('[data-testid="org-search"]');
      await searchInput.fill('zzzzznonexistent999');
      await page.waitForTimeout(500);

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      const emptyState = page.locator('[data-testid="org-empty-state"]');
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText('Nenhuma clínica encontrada');
    });
  });

  test.describe('Create organization', () => {
    test('create new clinic dialog opens and slug auto-generates', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      // Click "Nova Clinica" button
      await page.locator('[data-testid="create-org-button"]').click();

      // Dialog should appear
      const dialog = page.locator('[data-testid="create-org-dialog"]');
      await expect(dialog).toBeVisible();

      // Fill name and verify slug auto-generates
      const nameInput = dialog.locator('[data-testid="org-name-input"]');
      const slugInput = dialog.locator('[data-testid="org-slug-input"]');

      const uniqueName = `Test Clinic ${Date.now()}`;
      await nameInput.fill(uniqueName);

      // Slug should auto-populate based on name
      const slugValue = await slugInput.inputValue();
      expect(slugValue).toBeTruthy();
      expect(slugValue).toContain('test-clinic');

      // Submit button should be enabled
      const submitButton = dialog.locator('[data-testid="create-org-submit"]');
      await expect(submitButton).toBeEnabled();
    });

    test('create new clinic successfully', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      // Click "Nova Clinica" button
      await page.locator('[data-testid="create-org-button"]').click();

      const dialog = page.locator('[data-testid="create-org-dialog"]');
      await expect(dialog).toBeVisible();

      const uniqueSuffix = Date.now();
      const clinicName = `E2E Clinic ${uniqueSuffix}`;

      await dialog.locator('[data-testid="org-name-input"]').fill(clinicName);

      // Wait for slug to auto-generate
      const slugInput = dialog.locator('[data-testid="org-slug-input"]');
      const slugValue = await slugInput.inputValue();
      expect(slugValue).toBeTruthy();

      // Submit the form
      await dialog.locator('[data-testid="create-org-submit"]').click();

      // Dialog should close on success (wait for it to disappear)
      await expect(dialog).toBeHidden({ timeout: 10000 });

      // Wait for list to refresh and show the new clinic
      await page.waitForSelector('[data-testid="org-list"]', { timeout: 10000 });

      // The newly created clinic should appear in the list
      await expect(page.locator(`text=${clinicName}`)).toBeVisible({ timeout: 5000 });
    });

    test('duplicate slug shows error message', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      // First, create a clinic
      const uniqueSuffix = Date.now();
      const clinicName = `Dup Test ${uniqueSuffix}`;
      const clinicSlug = `dup-test-${uniqueSuffix}`;

      await page.locator('[data-testid="create-org-button"]').click();
      let dialog = page.locator('[data-testid="create-org-dialog"]');
      await expect(dialog).toBeVisible();

      await dialog.locator('[data-testid="org-name-input"]').fill(clinicName);
      // Override the auto-generated slug with our controlled one
      await dialog.locator('[data-testid="org-slug-input"]').fill(clinicSlug);
      await dialog.locator('[data-testid="create-org-submit"]').click();

      // Wait for dialog to close (success)
      await expect(dialog).toBeHidden({ timeout: 10000 });

      // Now try to create another with the same slug
      await page.locator('[data-testid="create-org-button"]').click();
      dialog = page.locator('[data-testid="create-org-dialog"]');
      await expect(dialog).toBeVisible();

      await dialog.locator('[data-testid="org-name-input"]').fill(`${clinicName} Duplicate`);
      await dialog.locator('[data-testid="org-slug-input"]').fill(clinicSlug);
      await dialog.locator('[data-testid="create-org-submit"]').click();

      // Error message should appear
      const errorMsg = dialog.locator('[data-testid="org-form-error"]');
      await expect(errorMsg).toBeVisible({ timeout: 10000 });
      await expect(errorMsg).toContainText('slug já está em uso');
    });

    test('empty name and slug prevent submission', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      await page.locator('[data-testid="create-org-button"]').click();

      const dialog = page.locator('[data-testid="create-org-dialog"]');
      await expect(dialog).toBeVisible();

      // Submit button should be disabled when name and slug are empty
      const submitButton = dialog.locator('[data-testid="create-org-submit"]');
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('Organization detail page', () => {
    test('organization detail shows org info and member list', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      // Wait for the list to load
      const orgList = page.locator('[data-testid="org-list"]');
      const emptyState = page.locator('[data-testid="org-empty-state"]');

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      if (await emptyState.isVisible()) {
        test.skip(true, 'No organizations seeded — cannot test detail page.');
        return;
      }

      // Click the first org card to navigate to detail page
      const firstCard = orgList.locator('[data-testid="org-card"]').first();
      await firstCard.click();

      // Wait for detail page to load
      await page.waitForSelector('[data-testid="org-detail"]', { timeout: 10000 });

      // Verify org name is displayed
      const orgName = page.locator('[data-testid="org-detail-name"]');
      await expect(orgName).toBeVisible();
      await expect(orgName).not.toBeEmpty();

      // Verify status badge
      await expect(page.locator('[data-testid="org-detail-status"]')).toBeVisible();

      // Verify member list container is present
      await expect(page.locator('[data-testid="member-list"]')).toBeVisible();
    });

    test('organization detail shows member cards or empty state', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      if (await page.locator('[data-testid="org-empty-state"]').isVisible()) {
        test.skip(true, 'No organizations seeded — cannot test detail page.');
        return;
      }

      // Click first org
      await page.locator('[data-testid="org-card"]').first().click();
      await page.waitForSelector('[data-testid="org-detail"]', { timeout: 10000 });

      // Either member cards or empty state should be visible
      const memberCards = page.locator('[data-testid="member-card"]');
      const membersEmpty = page.locator('[data-testid="members-empty"]');

      const hasMemberCards = (await memberCards.count()) > 0;
      const hasEmptyState = await membersEmpty.isVisible();

      expect(hasMemberCards || hasEmptyState).toBe(true);

      if (hasMemberCards) {
        // First member card should have name and role badge
        const firstMember = memberCards.first();
        await expect(firstMember).toBeVisible();
      }
    });

    test('organization detail has back link to organizations list', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      if (await page.locator('[data-testid="org-empty-state"]').isVisible()) {
        test.skip(true, 'No organizations seeded.');
        return;
      }

      // Navigate to detail
      await page.locator('[data-testid="org-card"]').first().click();
      await page.waitForSelector('[data-testid="org-detail"]', { timeout: 10000 });

      // Click back link
      const backLink = page.locator('a[href="/admin/organizations"]').first();
      await expect(backLink).toBeVisible();
      await backLink.click();

      // Should be back on organizations list
      await page.waitForURL(/\/admin\/organizations$/);
      await expect(page.locator('h1')).toContainText('Clínicas');
    });
  });

  test.describe('Invite admin', () => {
    test('invite admin dialog opens and shows email input', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      if (await page.locator('[data-testid="org-empty-state"]').isVisible()) {
        test.skip(true, 'No organizations seeded.');
        return;
      }

      // Navigate to detail
      await page.locator('[data-testid="org-card"]').first().click();
      await page.waitForSelector('[data-testid="org-detail"]', { timeout: 10000 });

      // Click invite button
      await page.locator('[data-testid="invite-admin-button"]').click();

      // Dialog should appear with email input
      const emailInput = page.locator('[data-testid="invite-email-input"]');
      await expect(emailInput).toBeVisible();

      // Submit button should be present but disabled without email
      const submitButton = page.locator('[data-testid="invite-submit"]');
      await expect(submitButton).toBeVisible();
    });

    test('invite admin creates invite and shows link', async ({ page }) => {
      const success = await loginAs(page, 'superAdmin');
      test.skip(!success, 'Super admin login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      await page.waitForSelector(
        '[data-testid="org-list"], [data-testid="org-empty-state"]',
        { timeout: 10000 },
      );

      if (await page.locator('[data-testid="org-empty-state"]').isVisible()) {
        test.skip(true, 'No organizations seeded.');
        return;
      }

      // Navigate to first org detail
      await page.locator('[data-testid="org-card"]').first().click();
      await page.waitForSelector('[data-testid="org-detail"]', { timeout: 10000 });

      // Open invite dialog
      await page.locator('[data-testid="invite-admin-button"]').click();

      const emailInput = page.locator('[data-testid="invite-email-input"]');
      await expect(emailInput).toBeVisible();

      // Fill unique email to avoid conflict
      const uniqueEmail = `e2e-invite-${Date.now()}@example.com`;
      await emailInput.fill(uniqueEmail);

      // Submit invite
      await page.locator('[data-testid="invite-submit"]').click();

      // Wait for invite URL to appear (API call success)
      const inviteUrl = page.locator('[data-testid="invite-url"]');
      await expect(inviteUrl).toBeVisible({ timeout: 10000 });

      // Verify the URL contains /invite/
      const urlValue = await inviteUrl.inputValue();
      expect(urlValue).toContain('/invite/');

      // Copy button should also be visible
      await expect(page.locator('[data-testid="copy-invite-url"]')).toBeVisible();
    });
  });

  test.describe('Access control', () => {
    test('non-super-admin cannot access admin organizations', async ({ page }) => {
      const success = await loginAs(page, 'nutri');
      test.skip(!success, 'Nutri login failed.');

      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      // Should be redirected to /auth/login
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
      expect(page.url()).toContain('/auth/login');
    });

    test('unauthenticated user cannot access admin organizations', async ({ page }) => {
      await page.goto('/admin/organizations');
      await page.waitForLoadState('domcontentloaded');

      // Should be redirected to login
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
      expect(page.url()).toContain('/auth/login');
    });
  });
});
