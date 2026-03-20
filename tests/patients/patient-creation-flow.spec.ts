import { test, expect } from '../fixtures/auth.fixture';
import { PatientFormPage, PatientsPage } from '../fixtures/page-objects/patients.page';
import { testPatients } from '../fixtures/test-data';

test.describe('Patient Creation Flow', () => {
  test('should create patient with all fields and advance to wizard step 2', async ({ authenticatedPage }) => {
    const form = new PatientFormPage(authenticatedPage);
    await form.goto();

    const uniqueName = `${testPatients.patient1.fullName} ${Date.now()}`;
    await form.fillForm({
      ...testPatients.patient1,
      fullName: uniqueName,
    });
    await form.submit();

    // Wizard advances to step 2 with patientId in URL
    await form.expectRedirectToPatient();
  });

  test('should create patient with minimal data (name only)', async ({ authenticatedPage }) => {
    const form = new PatientFormPage(authenticatedPage);
    await form.goto();

    const uniqueName = `Paciente Minimal ${Date.now()}`;
    await form.fillForm({ fullName: uniqueName });
    await form.submit();

    // Wizard advances after creation
    await form.expectRedirectToPatient();
  });

  test('should show validation when name is empty', async ({ authenticatedPage }) => {
    const form = new PatientFormPage(authenticatedPage);
    await form.goto();

    // Try to submit without filling the name
    await form.submit();

    // Should stay on the same page (HTML5 validation prevents submit)
    await expect(authenticatedPage).toHaveURL(/\/patients\/new/);
  });

  test('should show created patient in the patients list', async ({ authenticatedPage }) => {
    const form = new PatientFormPage(authenticatedPage);
    await form.goto();

    const uniqueName = `Paciente Lista ${Date.now()}`;
    await form.fillForm({ fullName: uniqueName });
    await form.submit();
    await form.expectRedirectToPatient();

    // Navigate to patients list and verify patient appears
    const list = new PatientsPage(authenticatedPage);
    await list.goto();
    await list.expectLoaded();
    await list.expectPatientVisible(uniqueName);
  });
});
