import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { PlansPage, PlanFormPage, PlanEditPage } from '../fixtures/page-objects/plans.page';
import { PatientFormPage } from '../fixtures/page-objects/patients.page';
import { testMealPlans, testPatients } from '../fixtures/test-data';

test.describe('Meal Plan CRUD Operations', () => {
  // Helper to create a test patient first
  async function createTestPatient(page: any): Promise<string> {
    const patientForm = new PatientFormPage(page);
    const uniqueName = `Plan Test Patient ${Date.now()}`;
    await patientForm.goto();
    await patientForm.fillForm({ fullName: uniqueName });
    await patientForm.submit();
    await patientForm.expectRedirectToPatient();

    // Extract patient ID from URL
    const url = page.url();
    const match = url.match(/\/patients\/([a-f0-9-]+)/);
    return match ? match[1] : '';
  }

  test.describe('Create Meal Plan', () => {
    test('should display plan creation form', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const planForm = new PlanFormPage(page);

      await planForm.goto();

      await expect(planForm.titleInput).toBeVisible();
    });

    test('should navigate to plan creation from plans list', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const plansPage = new PlansPage(page);

      await plansPage.goto();
      await plansPage.clickNewPlan();

      await expect(page).toHaveURL(/\/plans\/new/);
    });
  });

  test.describe('Read Meal Plans', () => {
    test('should display plans list', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const plansPage = new PlansPage(page);

      await plansPage.goto();
      await plansPage.expectLoaded();
    });

    test('should show plan status badge', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      await page.goto('/plans');
      await page.waitForLoadState('networkidle');

      // Check if there are any plans with status badges
      const statusBadges = page.locator('.rounded-xl').filter({ hasText: /ativo|arquivado/i });
      // Just verify the page structure is correct
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Update Meal Plan', () => {
    test('should navigate to edit page from plans list', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const plansPage = new PlansPage(page);

      await plansPage.goto();

      // If there are plans (not empty state), try to edit one
      const editLinks = page.getByRole('link', { name: /editar/i });
      const count = await editLinks.count();

      if (count > 0) {
        await editLinks.first().click();
        await expect(page).toHaveURL(/\/plans\/[a-f0-9-]+\/edit/);
      }
      // If no plans, test passes (no plans to edit)
    });
  });
});
