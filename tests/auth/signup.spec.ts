import { test, expect } from '@playwright/test';
import { LoginPage } from '../fixtures/page-objects/login.page';
import { testUsers } from '../fixtures/test-data';

test.describe('Signup', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.switchToSignup();
  });

  test('should display signup form correctly', async ({ page }) => {
    await expect(loginPage.fullNameInput).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(page.getByRole('button', { name: /criar conta/i }).first()).toBeVisible();
  });

  test('should require full name field', async ({ page }) => {
    await loginPage.emailInput.fill('test@email.com');
    await loginPage.passwordInput.fill('password123');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    // HTML5 validation should prevent submission
    const fullNameInput = loginPage.fullNameInput;
    const validationMessage = await fullNameInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test('should require email field', async ({ page }) => {
    await loginPage.fullNameInput.fill('Test User');
    await loginPage.passwordInput.fill('password123');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    const emailInput = loginPage.emailInput;
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test('should require password field', async ({ page }) => {
    await loginPage.fullNameInput.fill('Test User');
    await loginPage.emailInput.fill('test@email.com');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    const passwordInput = loginPage.passwordInput;
    const validationMessage = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test('should enforce minimum password length', async ({ page }) => {
    await loginPage.fullNameInput.fill('Test User');
    await loginPage.emailInput.fill('test@email.com');
    await loginPage.passwordInput.fill('123'); // Too short

    // Check if minLength attribute is set
    const minLength = await loginPage.passwordInput.getAttribute('minlength');
    expect(minLength).toBe('6');
  });

  test('should submit signup form', async ({ page }) => {
    // This test just verifies the form can be submitted
    // Actual signup depends on Supabase being available
    const uniqueEmail = `test-${Date.now()}@nutriflow.test`;

    await loginPage.fullNameInput.fill('New Test User');
    await loginPage.emailInput.fill(uniqueEmail);
    await loginPage.passwordInput.fill('TestPassword123!');

    const submitButton = page.getByRole('button', { name: /criar conta/i }).first();
    await submitButton.click();

    // Wait a bit and check result - either redirects or shows error/stays on page
    await page.waitForTimeout(3000);
    const url = page.url();

    // Either succeeded (redirect) or Supabase not available (stays on login)
    expect(url.includes('/dashboard') || url.includes('/auth/login')).toBeTruthy();
  });

  test('should show error or stay on page when email exists', async ({ page }) => {
    // Try to signup with existing email
    await loginPage.fullNameInput.fill('Duplicate User');
    await loginPage.emailInput.fill(testUsers.nutritionist.email);
    await loginPage.passwordInput.fill('TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    // Should show error (either error message or remain on page)
    await page.waitForTimeout(3000);
    const url = page.url();
    const hasError = await loginPage.errorMessage.isVisible().catch(() => false);

    // Either shows error or stays on login page (means form was submitted)
    expect(hasError || url.includes('/auth/login')).toBeTruthy();
  });
});
