import { test, expect } from '../fixtures/auth.fixture';
import { PlanFormPage, PlansPage } from '../fixtures/page-objects/plans.page';
import { testMealPlans } from '../fixtures/test-data';

test.describe('Plan Creation Flow', () => {
  test('should create plan with patient and fields then redirect', async ({ authenticatedPage }) => {
    const form = new PlanFormPage(authenticatedPage);
    await form.goto();

    const uniqueTitle = `${testMealPlans.plan1.title} ${Date.now()}`;
    await form.fillForm({
      title: uniqueTitle,
      description: testMealPlans.plan1.description,
      patientName: 'Paciente Seed Test', // seeded patient
    });
    await form.submit();
    await form.expectRedirectToPlan();
  });

  test('should show seeded patient in combobox', async ({ authenticatedPage }) => {
    const form = new PlanFormPage(authenticatedPage);
    await form.goto();

    // Click the combobox to open patient dropdown
    await authenticatedPage.getByRole('combobox').first().click();

    // Verify seeded patient is visible as an option
    await expect(
      authenticatedPage.getByRole('option', { name: /Paciente Seed Test/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show created plan in the plans list', async ({ authenticatedPage }) => {
    const form = new PlanFormPage(authenticatedPage);
    await form.goto();

    const uniqueTitle = `Plano Lista ${Date.now()}`;
    await form.fillForm({
      title: uniqueTitle,
      patientName: 'Paciente Seed Test',
    });
    await form.submit();
    await form.expectRedirectToPlan();

    // Navigate to plans list
    const list = new PlansPage(authenticatedPage);
    await list.goto();
    await list.expectLoaded();
    await list.expectPlanVisible(uniqueTitle);
  });
});
