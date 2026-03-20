import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';
import { LoginPage } from '../fixtures/page-objects/login.page';
import { testUsers, invalidCredentials } from '../fixtures/test-data';

test.describe('Login Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    await loginPage.login(testUsers.nutritionist.email, testUsers.nutritionist.password);

    // Should redirect to an authenticated page
    await page.waitForURL(/\/(dashboard|patients|plans|organization)/, { timeout: 15000 });

    // Verify authenticated layout loaded (sidebar visible)
    await expect(page.locator('[data-slot="sidebar"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await loginPage.login(invalidCredentials.wrongEmail, invalidCredentials.wrongPassword);

    // Should show error message
    await loginPage.expectError();

    // Should stay on login page
    expect(page.url()).toContain('/auth/login');
  });

  test('should show error with wrong password for existing user', async ({ page }) => {
    await loginPage.login(testUsers.nutritionist.email, invalidCredentials.wrongPassword);

    await loginPage.expectError();
    expect(page.url()).toContain('/auth/login');
  });

  test('should show error with non-existent email', async ({ page }) => {
    await loginPage.login('nonexistent-user-e2e@example.com', 'SomePassword123!');

    await loginPage.expectError();
    expect(page.url()).toContain('/auth/login');
  });

  test('should validate empty email field via HTML5', async ({ page }) => {
    await loginPage.passwordInput.fill('password123');
    await page.getByRole('button', { name: /entrar/i }).click();

    const validationMessage = await loginPage.emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage,
    );
    expect(validationMessage).toBeTruthy();
  });

  test('should validate empty password field via HTML5', async ({ page }) => {
    await loginPage.emailInput.fill('test@email.com');
    await page.getByRole('button', { name: /entrar/i }).click();

    const validationMessage = await loginPage.passwordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage,
    );
    expect(validationMessage).toBeTruthy();
  });

  test('should have accessible form fields with correct types', async () => {
    await expect(loginPage.emailInput).toHaveAttribute('type', 'email');
    await expect(loginPage.emailInput).toHaveAttribute('required', '');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.passwordInput).toHaveAttribute('required', '');
  });

  test('should NOT show signup toggle on regular login page', async () => {
    await loginPage.expectNoPublicSignup();
    await expect(loginPage.fullNameInput).not.toBeVisible();
  });

  test('should show message about requesting invite', async () => {
    await expect(loginPage.noAccountMessage).toBeVisible();
  });
});

test.describe('Login - Authenticated Redirect', () => {
  authTest('authenticated user visiting /auth/login should redirect to dashboard', async ({ authenticatedPage }) => {
    // Already logged in via fixture — navigate to login page
    await authenticatedPage.goto('/auth/login');

    // Middleware redirects authenticated users away from auth routes
    await authenticatedPage.waitForURL(/\/(dashboard|patients|plans|organization)/, { timeout: 10000 });
  });
});
