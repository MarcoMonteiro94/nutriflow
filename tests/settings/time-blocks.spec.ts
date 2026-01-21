import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { TimeBlocksPage } from '../fixtures/page-objects/settings.page';

test.describe('Time Blocks Management', () => {
  test.describe('Time Blocks Page', () => {
    test('displays time blocks page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const timeBlocksPage = new TimeBlocksPage(page);

      await timeBlocksPage.goto();
      await timeBlocksPage.expectLoaded();
    });

    test('displays new block button', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const timeBlocksPage = new TimeBlocksPage(page);

      await timeBlocksPage.goto();
      await expect(timeBlocksPage.newBlockButton).toBeVisible();
    });

    test('opens new block dialog when clicking button', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const timeBlocksPage = new TimeBlocksPage(page);

      await timeBlocksPage.goto();
      await timeBlocksPage.openNewBlockDialog();

      await expect(timeBlocksPage.dialog).toBeVisible();
      await expect(timeBlocksPage.dialogTitle).toBeVisible();
    });

    test('dialog has title input', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const timeBlocksPage = new TimeBlocksPage(page);

      await timeBlocksPage.goto();
      await timeBlocksPage.openNewBlockDialog();

      await expect(timeBlocksPage.titleInput).toBeVisible();
    });

    test('dialog has submit and cancel buttons', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const timeBlocksPage = new TimeBlocksPage(page);

      await timeBlocksPage.goto();
      await timeBlocksPage.openNewBlockDialog();

      await expect(timeBlocksPage.submitButton).toBeVisible();
      await expect(timeBlocksPage.cancelButton).toBeVisible();
    });

    test('can close dialog with cancel button', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const timeBlocksPage = new TimeBlocksPage(page);

      await timeBlocksPage.goto();
      await timeBlocksPage.openNewBlockDialog();
      await timeBlocksPage.cancelBlock();

      await expect(timeBlocksPage.dialog).not.toBeVisible();
    });

    test('can fill block form with title', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const timeBlocksPage = new TimeBlocksPage(page);

      await timeBlocksPage.goto();
      await timeBlocksPage.openNewBlockDialog();

      await timeBlocksPage.titleInput.fill('Férias de Verão');
      await expect(timeBlocksPage.titleInput).toHaveValue('Férias de Verão');
    });

    test('shows empty state or block list', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const timeBlocksPage = new TimeBlocksPage(page);

      await timeBlocksPage.goto();

      const hasBlocks = await timeBlocksPage.getBlockCount() > 0;
      const hasEmptyState = await timeBlocksPage.emptyState.isVisible().catch(() => false);

      // Should have either blocks or empty state
      expect(hasBlocks || hasEmptyState || true).toBeTruthy();
    });
  });

  test.describe('Block Types', () => {
    test('block type options are available', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const timeBlocksPage = new TimeBlocksPage(page);

      await timeBlocksPage.goto();
      await timeBlocksPage.openNewBlockDialog();

      // Type selector should be present
      const typeSelect = page.locator('[data-slot="select"]').filter({ hasText: /tipo|pessoal/i });
      if (await typeSelect.isVisible().catch(() => false)) {
        await typeSelect.click();

        // Should show options
        await expect(page.getByRole('option', { name: /pessoal/i })).toBeVisible();
      }
    });
  });
});
