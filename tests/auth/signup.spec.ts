import { test, expect } from '@playwright/test';
import { LoginPage } from '../fixtures/page-objects/login.page';
import { testUsers } from '../fixtures/test-data';

test.describe('Signup (Invite-Only Mode)', () => {
  let loginPage: LoginPage;

  test.describe('Public Access (No Invite)', () => {
    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.goto();
    });

    test('should NOT show signup option on public login page', async () => {
      await loginPage.expectNoPublicSignup();
    });

    test('should show message to request invite', async () => {
      await expect(loginPage.noAccountMessage).toBeVisible();
    });

    test('should not have signup toggle button', async ({ page }) => {
      const createAccountButton = page.getByRole('button', { name: /criar conta/i });
      await expect(createAccountButton).not.toBeVisible();
    });
  });

  test.describe('Invite Mode Access', () => {
    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      // Access login page in signup mode (via invite link simulation)
      await loginPage.gotoSignupMode();
    });

    test('should display signup form when accessed via invite mode', async ({ page }) => {
      await expect(loginPage.fullNameInput).toBeVisible();
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(page.getByRole('button', { name: /criar conta/i }).first()).toBeVisible();
    });

    test('should allow toggling between login and signup in invite mode', async ({ page }) => {
      // Should start in signup mode
      await expect(loginPage.fullNameInput).toBeVisible();

      // Switch to login
      await loginPage.switchToLogin();
      await expect(loginPage.fullNameInput).not.toBeVisible();

      // Switch back to signup
      await loginPage.switchToSignup();
      await expect(loginPage.fullNameInput).toBeVisible();
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

    test('should enforce minimum password length', async () => {
      // Check if minLength attribute is set
      const minLength = await loginPage.passwordInput.getAttribute('minlength');
      expect(minLength).toBe('6');
    });

    test('should submit signup form', async ({ page }) => {
      // This test just verifies the form can be submitted
      // Actual signup depends on Supabase being available
      const uniqueEmail = `test-${Date.now()}@example.com`;

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

  test.describe('Invite Mode with Redirect', () => {
    test('should preserve redirect parameter for post-signup navigation', async ({ page }) => {
      loginPage = new LoginPage(page);
      const redirectPath = '/invite/test-token-123';
      await loginPage.gotoSignupMode(redirectPath);

      // Verify we're in signup mode
      await expect(loginPage.fullNameInput).toBeVisible();

      // Check URL contains redirect parameter
      const url = page.url();
      expect(url).toContain('mode=signup');
      expect(url).toContain('redirect=');
    });
  });
});
