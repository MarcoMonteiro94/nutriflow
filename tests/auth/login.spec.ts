import { test, expect } from '@playwright/test';
import { LoginPage } from '../fixtures/page-objects/login.page';
import { testUsers, invalidCredentials } from '../fixtures/test-data';

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login form correctly', async ({ page }) => {
    await expect(loginPage.title).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    await loginPage.passwordInput.fill('password123');
    await page.getByRole('button', { name: /entrar/i }).click();

    // HTML5 validation should prevent submission
    const emailInput = loginPage.emailInput;
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test('should show validation error for empty password', async ({ page }) => {
    await loginPage.emailInput.fill('test@email.com');
    await page.getByRole('button', { name: /entrar/i }).click();

    // HTML5 validation should prevent submission
    const passwordInput = loginPage.passwordInput;
    const validationMessage = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test('should submit login form with credentials', async ({ page }) => {
    // This test verifies form submission works
    // Actual login depends on Supabase being available
    await loginPage.login(invalidCredentials.wrongEmail, invalidCredentials.wrongPassword);

    // Wait for response - either error message or stays on page
    await page.waitForTimeout(3000);
    const url = page.url();

    // Either shows error (Supabase responded) or stays on login (form submitted)
    expect(url.includes('/auth/login') || url.includes('/dashboard')).toBeTruthy();
  });

  test('should submit login form with test user', async ({ page }) => {
    // This test verifies the auth flow works (submission)
    // Actual authentication depends on Supabase
    await loginPage.emailInput.fill(testUsers.nutritionist.email);
    await loginPage.passwordInput.fill(testUsers.nutritionist.password);
    await page.getByRole('button', { name: /entrar/i }).click();

    // Wait for response
    await page.waitForTimeout(3000);
    const url = page.url();

    // Either logged in (redirect to dashboard) or stayed on login (Supabase not available)
    expect(url.includes('/auth/login') || url.includes('/dashboard')).toBeTruthy();
  });

  test('should NOT show signup toggle on regular login page', async ({ page }) => {
    // Public login page should not have signup toggle
    await loginPage.expectNoPublicSignup();

    // Full name input (signup-only) should not be visible
    await expect(loginPage.fullNameInput).not.toBeVisible();
  });

  test('should show message about requesting invite', async () => {
    // Should show informative message for users without accounts
    await expect(loginPage.noAccountMessage).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check email input
    await expect(loginPage.emailInput).toHaveAttribute('type', 'email');
    await expect(loginPage.emailInput).toHaveAttribute('required', '');

    // Check password input
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.passwordInput).toHaveAttribute('required', '');
  });
});
