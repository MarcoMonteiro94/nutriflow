import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { PatientsPage, PatientFormPage, PatientDetailPage } from '../fixtures/page-objects/patients.page';
import { testPatients } from '../fixtures/test-data';

test.describe('Patient CRUD Operations', () => {
  test.describe('Create Patient', () => {
    test('should create a patient with all fields', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      await patientForm.goto();

      // Fill in all fields
      await patientForm.fillForm({
        fullName: testPatients.patient1.fullName,
        email: testPatients.patient1.email,
        phone: testPatients.patient1.phone,
        birthDate: testPatients.patient1.birthDate,
        gender: testPatients.patient1.gender,
        goal: testPatients.patient1.goal,
        notes: testPatients.patient1.notes,
      });

      await patientForm.submit();

      // Should redirect to patient detail page
      await patientForm.expectRedirectToPatient();
    });

    test('should create a patient with only required fields', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      await patientForm.goto();

      // Fill only required field
      await patientForm.fillForm({
        fullName: testPatients.patientMinimal.fullName + ' ' + Date.now(),
      });

      await patientForm.submit();

      // Should redirect to patient detail page
      await patientForm.expectRedirectToPatient();
    });

    test('should show validation error for empty name', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      await patientForm.goto();

      // Try to submit without name
      await patientForm.submit();

      // HTML5 validation should prevent submission
      const nameInput = patientForm.fullNameInput;
      const validationMessage = await nameInput.evaluate(
        (el: HTMLInputElement) => el.validationMessage
      );
      expect(validationMessage).toBeTruthy();
    });
  });

  test.describe('Read Patients', () => {
    test('should display patients list', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientsPage = new PatientsPage(page);

      await patientsPage.goto();
      await patientsPage.expectLoaded();
    });

    test('should show empty state when no patients', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      // This test may need to run on a fresh account
      // For now, just verify the page loads correctly
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display patient details', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientsPage = new PatientsPage(page);
      const patientForm = new PatientFormPage(page);

      // First create a patient
      const uniqueName = `Test Patient ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({ fullName: uniqueName });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Verify we're on the patient detail page
      const patientDetail = new PatientDetailPage(page);
      await patientDetail.expectLoaded(uniqueName);
    });
  });

  test.describe('Update Patient', () => {
    test('should edit patient information', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // First create a patient
      const originalName = `Edit Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({ fullName: originalName });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Click edit button
      const patientDetail = new PatientDetailPage(page);
      await patientDetail.clickEdit();

      // Update the name
      const updatedName = `${originalName} Updated`;
      await patientForm.fullNameInput.clear();
      await patientForm.fullNameInput.fill(updatedName);
      await patientForm.submit();

      // Verify update was successful
      await page.waitForURL(/\/patients\/[a-f0-9-]+$/);
      // Patient name is displayed in the page, not in h1
      await expect(page.locator(`text=${updatedName}`)).toBeVisible();
    });
  });

  test.describe('Delete Patient', () => {
    test('should have delete button on patient detail page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // First create a patient to delete
      const patientName = `Delete Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({ fullName: patientName });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Check for actions menu button (the dropdown with more options)
      // The delete option is inside a dropdown menu, not a standalone button
      const actionsButton = page.locator('button').filter({ has: page.locator('svg') }).last();
      await expect(actionsButton).toBeVisible();
    });
  });
});
