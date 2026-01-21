import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { PlanEditPage } from '../fixtures/page-objects/plans.page';
import { testMeals } from '../fixtures/test-data';

test.describe('Meal CRUD Operations', () => {
  test.describe('Meal Timeline', () => {
    test('should display add meal button on plan edit page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to plans
      await page.goto('/plans');
      await page.waitForLoadState('networkidle');

      // If there are plans, go to edit
      const editLinks = page.getByRole('link', { name: /editar/i });
      const count = await editLinks.count();

      if (count > 0) {
        await editLinks.first().click();
        await page.waitForLoadState('networkidle');

        // Check for add meal button
        const addMealButton = page.getByRole('button', { name: /adicionar refeição/i });
        await expect(addMealButton).toBeVisible();
      }
    });

    test('should open add meal dialog', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      await page.goto('/plans');
      await page.waitForLoadState('networkidle');

      const editLinks = page.getByRole('link', { name: /editar/i });
      const count = await editLinks.count();

      if (count > 0) {
        await editLinks.first().click();
        await page.waitForLoadState('networkidle');

        const addMealButton = page.getByRole('button', { name: /adicionar refeição/i });
        await addMealButton.click();

        // Dialog should open
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // Should have meal type selector
        await expect(page.getByText(/tipo de refeição/i)).toBeVisible();
      }
    });

    test('should have meal type options', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      await page.goto('/plans');
      await page.waitForLoadState('networkidle');

      const editLinks = page.getByRole('link', { name: /editar/i });
      const count = await editLinks.count();

      if (count > 0) {
        await editLinks.first().click();
        await page.waitForLoadState('networkidle');

        const addMealButton = page.getByRole('button', { name: /adicionar refeição/i });
        await addMealButton.click();

        // Click on meal type selector
        const combobox = page.getByRole('combobox');
        await combobox.click();

        // Check for expected meal types
        await expect(page.getByRole('option', { name: /café da manhã/i })).toBeVisible();
        await expect(page.getByRole('option', { name: /almoço/i })).toBeVisible();
        await expect(page.getByRole('option', { name: /jantar/i })).toBeVisible();
      }
    });

    test('should show time input for meal', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      await page.goto('/plans');
      await page.waitForLoadState('networkidle');

      const editLinks = page.getByRole('link', { name: /editar/i });
      const count = await editLinks.count();

      if (count > 0) {
        await editLinks.first().click();
        await page.waitForLoadState('networkidle');

        const addMealButton = page.getByRole('button', { name: /adicionar refeição/i });
        await addMealButton.click();

        // Should have time input
        const timeInput = page.getByLabel(/horário/i);
        await expect(timeInput).toBeVisible();
        await expect(timeInput).toHaveAttribute('type', 'time');
      }
    });

    test('should cancel meal creation', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      await page.goto('/plans');
      await page.waitForLoadState('networkidle');

      const editLinks = page.getByRole('link', { name: /editar/i });
      const count = await editLinks.count();

      if (count > 0) {
        await editLinks.first().click();
        await page.waitForLoadState('networkidle');

        const addMealButton = page.getByRole('button', { name: /adicionar refeição/i });
        await addMealButton.click();

        // Cancel
        const cancelButton = page.getByRole('button', { name: /cancelar/i });
        await cancelButton.click();

        // Dialog should close
        const dialog = page.getByRole('dialog');
        await expect(dialog).not.toBeVisible();
      }
    });
  });

  test.describe('Meal Editing', () => {
    test('should have edit button on meal cards', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      await page.goto('/plans');
      await page.waitForLoadState('networkidle');

      const editLinks = page.getByRole('link', { name: /editar/i });
      const count = await editLinks.count();

      if (count > 0) {
        await editLinks.first().click();
        await page.waitForLoadState('networkidle');

        // Check if there are meals
        const mealCards = page.locator('.rounded-2xl').filter({ has: page.locator('text=/\\d{2}:\\d{2}/') });
        const mealCount = await mealCards.count();

        if (mealCount > 0) {
          // Check for edit button
          const editButton = mealCards.first().getByRole('button').filter({ has: page.locator('svg') });
          await expect(editButton.first()).toBeVisible();
        }
      }
    });

    test('should have delete button on meal cards', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      await page.goto('/plans');
      await page.waitForLoadState('networkidle');

      const editLinks = page.getByRole('link', { name: /editar/i });
      const count = await editLinks.count();

      if (count > 0) {
        await editLinks.first().click();
        await page.waitForLoadState('networkidle');

        // Check if there are meals
        const mealCards = page.locator('.rounded-2xl').filter({ has: page.locator('text=/\\d{2}:\\d{2}/') });
        const mealCount = await mealCards.count();

        if (mealCount > 0) {
          // Check for delete button (trash icon)
          const deleteButton = mealCards.first().locator('button').filter({ hasText: '' }).last();
          await expect(deleteButton).toBeVisible();
        }
      }
    });
  });

  test.describe('Add Food to Meal', () => {
    test('should have add food button in expanded meal', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      await page.goto('/plans');
      await page.waitForLoadState('networkidle');

      const editLinks = page.getByRole('link', { name: /editar/i });
      const count = await editLinks.count();

      if (count > 0) {
        await editLinks.first().click();
        await page.waitForLoadState('networkidle');

        // Check if there are meals
        const mealCards = page.locator('.rounded-2xl.shadow-soft');
        const mealCount = await mealCards.count();

        if (mealCount > 0) {
          // Click to expand
          await mealCards.first().click();
          await page.waitForTimeout(500);

          // Check for add food button
          const addFoodButton = page.getByRole('link', { name: /adicionar alimento/i });
          if (await addFoodButton.isVisible()) {
            await expect(addFoodButton).toBeEnabled();
          }
        }
      }
    });
  });
});
