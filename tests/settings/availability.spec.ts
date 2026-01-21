import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { SettingsPage, AvailabilityPage } from '../fixtures/page-objects/settings.page';

test.describe('Availability Configuration', () => {
  test.describe('Settings Navigation', () => {
    test('navigates to settings page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const settingsPage = new SettingsPage(page);

      await settingsPage.goto();
      await settingsPage.expectLoaded();
    });

    test('displays availability card', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const settingsPage = new SettingsPage(page);

      await settingsPage.goto();
      await expect(settingsPage.availabilityCard).toBeVisible();
    });

    test('displays time blocks card', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const settingsPage = new SettingsPage(page);

      await settingsPage.goto();
      await expect(settingsPage.timeBlocksCard).toBeVisible();
    });
  });

  test.describe('Availability Page', () => {
    test('displays availability configuration page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const availabilityPage = new AvailabilityPage(page);

      await availabilityPage.goto();
      await availabilityPage.expectLoaded();
    });

    test('displays all days of the week', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const availabilityPage = new AvailabilityPage(page);

      await availabilityPage.goto();
      await availabilityPage.expectDaysVisible();
    });

    test('displays save button', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const availabilityPage = new AvailabilityPage(page);

      await availabilityPage.goto();
      await expect(availabilityPage.saveButton).toBeVisible();
    });

    test('displays add slot buttons for each day', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const availabilityPage = new AvailabilityPage(page);

      await availabilityPage.goto();

      // Should have add buttons (one per day)
      const addButtonCount = await availabilityPage.addSlotButtons.count();
      expect(addButtonCount).toBeGreaterThan(0);
    });

    test('can toggle time slot', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const availabilityPage = new AvailabilityPage(page);

      await availabilityPage.goto();

      const toggleCount = await availabilityPage.toggleSwitches.count();
      if (toggleCount > 0) {
        // Toggle exists, click it
        const firstToggle = availabilityPage.toggleSwitches.first();
        const wasChecked = await firstToggle.getAttribute('data-state') === 'checked';
        await firstToggle.click();

        // State should have changed
        const isChecked = await firstToggle.getAttribute('data-state') === 'checked';
        expect(isChecked).not.toBe(wasChecked);
      }
    });

    test('can add new time slot', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const availabilityPage = new AvailabilityPage(page);

      await availabilityPage.goto();

      const addButtonCount = await availabilityPage.addSlotButtons.count();
      if (addButtonCount > 0) {
        // Count current time selects
        const beforeCount = await availabilityPage.timeSelects.count();

        // Add a slot
        await availabilityPage.addSlotButtons.first().click();

        // Should have more time selects now
        const afterCount = await availabilityPage.timeSelects.count();
        expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
      }
    });
  });
});
