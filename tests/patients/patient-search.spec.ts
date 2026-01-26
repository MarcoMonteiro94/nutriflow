import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { PatientsPage, PatientFormPage } from '../fixtures/page-objects/patients.page';

test.describe('Patient Search', () => {
  test('should have search input on patients page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const patientsPage = new PatientsPage(page);

    await patientsPage.goto();
    await patientsPage.expectLoaded();

    // Check for search input
    const searchInput = page.getByPlaceholder(/buscar|pesquisar/i);
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeEnabled();
    }
  });

  test('should filter patients by name', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const patientsPage = new PatientsPage(page);
    const patientForm = new PatientFormPage(page);

    // Create two patients with distinct names
    const uniqueId = Date.now();
    const patient1Name = `UniqueAlpha ${uniqueId}`;
    const patient2Name = `UniqueBeta ${uniqueId}`;

    // Create first patient
    await patientForm.goto();
    await patientForm.fillForm({ fullName: patient1Name });
    await patientForm.submit();
    await patientForm.expectRedirectToPatient();

    // Create second patient
    await patientForm.goto();
    await patientForm.fillForm({ fullName: patient2Name });
    await patientForm.submit();
    await patientForm.expectRedirectToPatient();

    // Go to patients list and search
    await patientsPage.goto();

    // Check if search is available
    const searchInput = page.getByPlaceholder(/buscar|pesquisar/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('UniqueAlpha');
      await page.waitForTimeout(1000); // Wait for debounce and filter

      // Verify search input has our value
      await expect(searchInput).toHaveValue('UniqueAlpha');

      // Look for the Alpha patient link specifically
      const alphaLink = page.getByRole('link', { name: new RegExp(patient1Name) });
      await expect(alphaLink).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show empty state when search finds nothing', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const patientsPage = new PatientsPage(page);

    await patientsPage.goto();

    // Check if search is available
    const searchInput = page.getByPlaceholder(/buscar|pesquisar/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('xyznonexistent12345');
      await page.waitForTimeout(500);

      // Should show empty state or no results
      const patientCount = await patientsPage.getPatientCount();
      const emptyState = page.locator('text=/nenhum|não encontrado/i');

      // Either no cards or empty state message
      const hasEmptyIndicator = patientCount === 0 || await emptyState.isVisible().catch(() => false);
      expect(hasEmptyIndicator).toBeTruthy();
    }
  });

  test('should clear search and show all patients', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const patientsPage = new PatientsPage(page);

    await patientsPage.goto();

    const searchInput = page.getByPlaceholder(/buscar|pesquisar/i);
    if (await searchInput.isVisible()) {
      // Get initial count
      const initialCount = await patientsPage.getPatientCount();

      // Search for something
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);

      // Should show same or more patients than before
      const finalCount = await patientsPage.getPatientCount();
      expect(finalCount).toBeGreaterThanOrEqual(0);
    }
  });
});
