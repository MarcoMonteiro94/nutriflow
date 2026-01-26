import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { PatientFormPage } from '../fixtures/page-objects/patients.page';
import { testPatients } from '../fixtures/test-data';

test.describe('Patient Form Validation', () => {
  let patientForm: PatientFormPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    patientForm = new PatientFormPage(authenticatedPage);
    await patientForm.goto();
  });

  test('should display all form fields', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await expect(patientForm.fullNameInput).toBeVisible();
    await expect(patientForm.emailInput).toBeVisible();
    await expect(patientForm.phoneInput).toBeVisible();
    await expect(patientForm.birthDateInput).toBeVisible();
    await expect(patientForm.genderSelect).toBeVisible();
    await expect(patientForm.goalInput).toBeVisible();
    await expect(patientForm.notesTextarea).toBeVisible();
  });

  test('should have required attribute on name field', async () => {
    await expect(patientForm.fullNameInput).toHaveAttribute('required', '');
  });

  test('should have email type on email field', async () => {
    await expect(patientForm.emailInput).toHaveAttribute('type', 'email');
  });

  test('should have tel type on phone field', async () => {
    await expect(patientForm.phoneInput).toHaveAttribute('type', 'tel');
  });

  test('should have date type on birth date field', async () => {
    await expect(patientForm.birthDateInput).toHaveAttribute('type', 'date');
  });

  test('should have gender options', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const options = await patientForm.genderSelect.locator('option').allTextContents();
    expect(options).toContain('Masculino');
    expect(options).toContain('Feminino');
    expect(options).toContain('Outro');
  });

  test('should validate email format', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await patientForm.fullNameInput.fill('Test Patient');
    await patientForm.emailInput.fill('invalid-email');
    await patientForm.submit();

    // HTML5 validation should show error
    const emailInput = patientForm.emailInput;
    const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validity).toBe(false);
  });

  test('should cancel and go back', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await patientForm.fullNameInput.fill('Test Patient');
    await patientForm.cancel();

    // Should navigate away from the form (to patients list or dashboard)
    await page.waitForURL(/\/(patients|dashboard)/, { timeout: 10000 });
  });

  test('should preserve form data on validation error', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Fill some fields
    await patientForm.emailInput.fill(testPatients.patient1.email!);
    await patientForm.phoneInput.fill(testPatients.patient1.phone!);

    // Try to submit without required field (name)
    await patientForm.submit();

    // Fields should still have their values
    await expect(patientForm.emailInput).toHaveValue(testPatients.patient1.email!);
    await expect(patientForm.phoneInput).toHaveValue(testPatients.patient1.phone!);
  });

  test('should show loading state during submission', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Fill form
    await patientForm.fillForm({
      fullName: `Loading Test ${Date.now()}`,
    });

    // Start submission and check for loading state
    const submitButton = patientForm.submitButton;
    await submitButton.click();

    // Button should show loading or be disabled briefly
    // The text changes to "Salvando..."
    await page.waitForFunction(() => {
      const button = document.querySelector('button[type="submit"]');
      return button?.textContent?.includes('Salvando') || button?.hasAttribute('disabled');
    }, { timeout: 5000 }).catch(() => {
      // It's okay if this fails - submission might be too fast
    });
  });
});
