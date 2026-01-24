import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { PatientFormPage, PatientDetailPage } from '../fixtures/page-objects/patients.page';

test.describe('Anthropometry Assessment Operations', () => {
  test.describe('Create Assessment', () => {
    test('should navigate to new anthropometry assessment page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // First create a patient with gender and birth date (needed for calculations)
      const uniqueName = `Anthropometry Test Patient ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({
        fullName: uniqueName,
        gender: 'masculino',
        birthDate: '1990-05-15',
      });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Navigate to anthropometry section
      const anthropometryLink = page.getByRole('link', { name: /antropometria/i });
      await expect(anthropometryLink).toBeVisible();
      await anthropometryLink.click();

      // Wait for the anthropometry page to load
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);
      await expect(page.locator('h1')).toContainText(/antropometria/i);

      // Click on new assessment button
      const newAssessmentButton = page.getByRole('link', { name: /nova avaliação/i });
      await expect(newAssessmentButton).toBeVisible();
      await newAssessmentButton.click();

      // Should be on the new assessment page
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry\/new$/);
      await expect(page.locator('text=Registrar Avaliação')).toBeVisible();
    });

    test('should create anthropometry assessment with basic measurements', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // Create a patient
      const uniqueName = `Anthro Create Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({
        fullName: uniqueName,
        gender: 'masculino',
        birthDate: '1990-05-15',
      });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Navigate to anthropometry page
      const anthropometryLink = page.getByRole('link', { name: /antropometria/i });
      await anthropometryLink.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      // Click new assessment
      const newAssessmentButton = page.getByRole('link', { name: /nova avaliação/i });
      await newAssessmentButton.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry\/new$/);

      // Fill in basic measurements
      const weightInput = page.getByLabel('Peso (kg)');
      const heightInput = page.getByLabel('Altura (cm)');

      await weightInput.fill('75.5');
      await heightInput.fill('175');

      // Submit the form
      const submitButton = page.getByRole('button', { name: /registrar avaliação/i });
      await submitButton.click();

      // Should redirect back to anthropometry list
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      // Should show the new assessment
      await expect(page.locator('text=75.5 kg')).toBeVisible();
    });

    test('should show calculated BMI after entering weight and height', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // Create a patient
      const uniqueName = `BMI Calc Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({
        fullName: uniqueName,
        gender: 'masculino',
        birthDate: '1990-05-15',
      });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Navigate to new anthropometry assessment
      const anthropometryLink = page.getByRole('link', { name: /antropometria/i });
      await anthropometryLink.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      const newAssessmentButton = page.getByRole('link', { name: /nova avaliação/i });
      await newAssessmentButton.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry\/new$/);

      // Fill in weight and height
      const weightInput = page.getByLabel('Peso (kg)');
      const heightInput = page.getByLabel('Altura (cm)');

      await weightInput.fill('70');
      await heightInput.fill('175');

      // Wait for BMI calculation to appear
      // BMI = 70 / (1.75^2) = 22.86
      await expect(page.locator('text=IMC')).toBeVisible();
      await expect(page.locator('text=/22\\.\\d/')).toBeVisible();
    });

    test('should show validation error when no measurements are filled', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // Create a patient
      const uniqueName = `Validation Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({
        fullName: uniqueName,
        gender: 'masculino',
        birthDate: '1990-05-15',
      });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Navigate to new anthropometry assessment
      const anthropometryLink = page.getByRole('link', { name: /antropometria/i });
      await anthropometryLink.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      const newAssessmentButton = page.getByRole('link', { name: /nova avaliação/i });
      await newAssessmentButton.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry\/new$/);

      // Try to submit without filling any measurements
      const submitButton = page.getByRole('button', { name: /registrar avaliação/i });
      await submitButton.click();

      // Should show error message
      await expect(page.locator('.bg-destructive\\/10')).toBeVisible();
      await expect(page.locator('text=Preencha pelo menos uma medida')).toBeVisible();
    });
  });

  test.describe('View Assessment', () => {
    test('should display anthropometry page with sections', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // Create a patient
      const uniqueName = `View Sections Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({
        fullName: uniqueName,
        gender: 'masculino',
        birthDate: '1990-05-15',
      });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Navigate to anthropometry
      const anthropometryLink = page.getByRole('link', { name: /antropometria/i });
      await anthropometryLink.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      // Should display page title
      await expect(page.locator('h1')).toContainText(/antropometria/i);

      // Should display main sections
      await expect(page.locator('text=Composição Corporal')).toBeVisible();
      await expect(page.locator('text=Evolução')).toBeVisible();
      await expect(page.locator('text=Histórico de Avaliações')).toBeVisible();
    });

    test('should show empty state when no assessments', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // Create a new patient (no assessments yet)
      const uniqueName = `Empty State Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({
        fullName: uniqueName,
        gender: 'feminino',
        birthDate: '1985-08-20',
      });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Navigate to anthropometry
      const anthropometryLink = page.getByRole('link', { name: /antropometria/i });
      await anthropometryLink.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      // Should show empty state message
      await expect(page.locator('text=Nenhuma avaliação registrada')).toBeVisible();
    });

    test('should display assessment details after creation', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // Create a patient
      const uniqueName = `View Details Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({
        fullName: uniqueName,
        gender: 'feminino',
        birthDate: '1990-05-15',
      });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Navigate to anthropometry and create assessment
      const anthropometryLink = page.getByRole('link', { name: /antropometria/i });
      await anthropometryLink.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      const newAssessmentButton = page.getByRole('link', { name: /nova avaliação/i });
      await newAssessmentButton.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry\/new$/);

      // Fill measurements
      await page.getByLabel('Peso (kg)').fill('62.5');
      await page.getByLabel('Altura (cm)').fill('165');
      await page.getByLabel('Cintura').fill('70');
      await page.getByLabel('Quadril').fill('95');

      // Submit
      await page.getByRole('button', { name: /registrar avaliação/i }).click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      // Verify assessment is displayed
      await expect(page.locator('text=62.5 kg')).toBeVisible();
      await expect(page.locator('text=70 cm')).toBeVisible();
      await expect(page.locator('text=95 cm')).toBeVisible();
    });
  });

  test.describe('List Assessments', () => {
    test('should list multiple assessments chronologically', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // Create a patient
      const uniqueName = `List Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({
        fullName: uniqueName,
        gender: 'masculino',
        birthDate: '1985-03-10',
      });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Navigate to anthropometry
      const anthropometryLink = page.getByRole('link', { name: /antropometria/i });
      await anthropometryLink.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      // Create first assessment
      let newButton = page.getByRole('link', { name: /nova avaliação/i });
      await newButton.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry\/new$/);

      await page.getByLabel('Peso (kg)').fill('80');
      await page.getByLabel('Altura (cm)').fill('180');
      await page.getByRole('button', { name: /registrar avaliação/i }).click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      // Create second assessment
      newButton = page.getByRole('link', { name: /nova avaliação/i });
      await newButton.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry\/new$/);

      await page.getByLabel('Peso (kg)').fill('78');
      await page.getByLabel('Altura (cm)').fill('180');
      await page.getByRole('button', { name: /registrar avaliação/i }).click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      // Should show both assessments
      await expect(page.locator('text=80 kg')).toBeVisible();
      await expect(page.locator('text=78 kg')).toBeVisible();

      // History count should update
      await expect(page.locator('text=2 avaliações registradas')).toBeVisible();
    });

    test('should have action dropdown menu for assessments', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // Create a patient
      const uniqueName = `Actions Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({
        fullName: uniqueName,
        gender: 'masculino',
        birthDate: '1990-01-01',
      });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Navigate to anthropometry and create assessment
      const anthropometryLink = page.getByRole('link', { name: /antropometria/i });
      await anthropometryLink.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      const newButton = page.getByRole('link', { name: /nova avaliação/i });
      await newButton.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry\/new$/);

      await page.getByLabel('Peso (kg)').fill('75');
      await page.getByRole('button', { name: /registrar avaliação/i }).click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      // Look for dropdown trigger (three dots icon)
      const dropdownTrigger = page.locator('button').filter({ has: page.locator('svg.lucide-more-horizontal') });
      await expect(dropdownTrigger.first()).toBeVisible();

      // Click to open dropdown
      await dropdownTrigger.first().click();

      // Should show edit and delete options
      await expect(page.locator('text=Editar')).toBeVisible();
      await expect(page.locator('text=Excluir')).toBeVisible();
    });

    test('should navigate back to patient detail page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // Create a patient
      const uniqueName = `Back Nav Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({
        fullName: uniqueName,
        gender: 'feminino',
        birthDate: '1995-07-22',
      });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Navigate to anthropometry
      const anthropometryLink = page.getByRole('link', { name: /antropometria/i });
      await anthropometryLink.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      // Click back button
      const backButton = page.locator('a').filter({ has: page.locator('svg.lucide-arrow-left') });
      await backButton.click();

      // Should be back to patient detail page
      await page.waitForURL(/\/patients\/[a-f0-9-]+$/);
      await expect(page.locator('h1')).toContainText(uniqueName);
    });
  });

  test.describe('Circumferences and Skinfolds', () => {
    test('should save circumference measurements', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // Create a patient
      const uniqueName = `Circumferences Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({
        fullName: uniqueName,
        gender: 'masculino',
        birthDate: '1988-12-05',
      });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Navigate to new anthropometry assessment
      const anthropometryLink = page.getByRole('link', { name: /antropometria/i });
      await anthropometryLink.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      const newButton = page.getByRole('link', { name: /nova avaliação/i });
      await newButton.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry\/new$/);

      // Fill circumference measurements
      await page.getByLabel('Cintura').fill('85');
      await page.getByLabel('Quadril').fill('100');
      await page.getByLabel('Braço Direito').fill('35');
      await page.getByLabel('Tórax').fill('102');

      // Submit
      await page.getByRole('button', { name: /registrar avaliação/i }).click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      // Verify measurements are displayed
      await expect(page.locator('text=85 cm')).toBeVisible();
      await expect(page.locator('text=100 cm')).toBeVisible();
      await expect(page.locator('text=35 cm')).toBeVisible();
      await expect(page.locator('text=102 cm')).toBeVisible();
    });

    test('should calculate waist-hip ratio', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // Create a patient
      const uniqueName = `WHR Calc Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({
        fullName: uniqueName,
        gender: 'feminino',
        birthDate: '1992-06-18',
      });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Navigate to new anthropometry assessment
      const anthropometryLink = page.getByRole('link', { name: /antropometria/i });
      await anthropometryLink.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      const newButton = page.getByRole('link', { name: /nova avaliação/i });
      await newButton.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry\/new$/);

      // Fill waist and hip for WHR calculation
      await page.getByLabel('Cintura').fill('70');
      await page.getByLabel('Quadril').fill('98');

      // WHR = 70/98 = 0.714
      await expect(page.locator('text=/Relação Cintura-Quadril/i')).toBeVisible();
      await expect(page.locator('text=/0\\.71\\d/')).toBeVisible();
    });
  });

  test.describe('Cancel Operation', () => {
    test('should cancel assessment creation and return to list', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const patientForm = new PatientFormPage(page);

      // Create a patient
      const uniqueName = `Cancel Test ${Date.now()}`;
      await patientForm.goto();
      await patientForm.fillForm({
        fullName: uniqueName,
        gender: 'masculino',
        birthDate: '1993-09-14',
      });
      await patientForm.submit();
      await patientForm.expectRedirectToPatient();

      // Navigate to new anthropometry assessment
      const anthropometryLink = page.getByRole('link', { name: /antropometria/i });
      await anthropometryLink.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      const newButton = page.getByRole('link', { name: /nova avaliação/i });
      await newButton.click();
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry\/new$/);

      // Fill some data
      await page.getByLabel('Peso (kg)').fill('70');

      // Click cancel
      const cancelButton = page.getByRole('button', { name: /cancelar/i });
      await cancelButton.click();

      // Should return to anthropometry list
      await page.waitForURL(/\/patients\/[a-f0-9-]+\/anthropometry$/);

      // Data should not be saved (empty state should still show if no assessments)
      await expect(page.locator('text=Nenhuma avaliação registrada')).toBeVisible();
    });
  });
});
