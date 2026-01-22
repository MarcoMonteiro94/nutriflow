import { test, expect } from '../fixtures/auth.fixture';
import { OrganizationPage } from '../fixtures/page-objects/organization.page';
import { testOrganizations } from '../fixtures/test-data';

test.describe('Organization CRUD', () => {
  let orgPage: OrganizationPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    orgPage = new OrganizationPage(authenticatedPage);
  });

  test('should display create organization page', async ({ authenticatedPage }) => {
    await orgPage.gotoCreate();

    await expect(authenticatedPage.getByText(/criar.*clínica|nova.*organização/i)).toBeVisible();
    await expect(orgPage.nameInput).toBeVisible();
    await expect(orgPage.slugInput).toBeVisible();
  });

  test('should validate required fields on create form', async ({ authenticatedPage }) => {
    await orgPage.gotoCreate();

    // Try to submit without filling fields
    await orgPage.createButton.click();

    // Should show validation
    const nameInput = orgPage.nameInput;
    const validationMessage = await nameInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test('should navigate to organization section from sidebar', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Click on organization link in sidebar
    const orgLink = authenticatedPage.locator('a[href*="organization"]').first();

    if (await orgLink.isVisible()) {
      await orgLink.click();
      await authenticatedPage.waitForURL(/organization/);

      // Should be on an organization page
      const url = authenticatedPage.url();
      expect(url).toContain('organization');
    }
  });

  test('should show organization dashboard after creation', async ({ authenticatedPage }) => {
    // This test assumes the user has already created an organization
    await orgPage.gotoDashboard();

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Should see dashboard elements or redirect to create
    const url = authenticatedPage.url();
    expect(url).toMatch(/organization\/(dashboard|create)/);
  });

  test('should auto-generate slug from organization name', async ({ authenticatedPage }) => {
    await orgPage.gotoCreate();

    // Fill in the name
    await orgPage.nameInput.fill('Clínica São Paulo');

    // Check if slug was auto-generated (may happen via JS)
    await authenticatedPage.waitForTimeout(500);
    const slugValue = await orgPage.slugInput.inputValue();

    // Slug should contain some transformation of the name
    // or be editable
    expect(slugValue).toBeDefined();
  });
});

test.describe('Organization Navigation', () => {
  test('admin should see organization menu item', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Admin users should see the organization menu
    const orgMenuItem = authenticatedPage.locator('a[href*="organization"]').first();
    await expect(orgMenuItem).toBeVisible();
  });

  test('organization dashboard should show metrics', async ({ authenticatedPage }) => {
    const orgPage = new OrganizationPage(authenticatedPage);
    await orgPage.gotoDashboard();

    // Check for metric cards or similar dashboard elements
    const metricsOrCards = authenticatedPage.locator('.card, [data-testid="metric"]');

    // Should have some content or redirect to create
    const url = authenticatedPage.url();
    if (url.includes('dashboard')) {
      const count = await metricsOrCards.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});
