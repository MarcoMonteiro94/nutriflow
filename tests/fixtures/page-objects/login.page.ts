import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly fullNameInput: Locator;
  readonly submitButton: Locator;
  readonly switchModeButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly logo: Locator;
  readonly title: Locator;
  readonly noAccountMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Senha');
    this.fullNameInput = page.getByLabel('Nome Completo');
    this.submitButton = page.getByRole('button', { name: /entrar|criar conta/i }).first();
    this.switchModeButton = page.locator('button:has-text("Criar conta"), button:has-text("Entrar")').last();
    this.errorMessage = page.locator('.bg-destructive\\/10');
    this.successMessage = page.locator('.bg-green-500\\/10');
    this.logo = page.locator('[data-testid="logo"], .rounded-2xl.bg-primary');
    this.title = page.locator('text=NutriFlow');
    this.noAccountMessage = page.getByText(/solicite um convite/i);
  }

  async goto() {
    await this.page.goto('/auth/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go to login page in signup mode (via invite link)
   */
  async gotoSignupMode(redirectTo?: string) {
    const url = redirectTo
      ? `/auth/login?mode=signup&redirect=${encodeURIComponent(redirectTo)}`
      : '/auth/login?mode=signup';
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go to login page with redirect (for invite flow)
   */
  async gotoWithRedirect(redirectTo: string) {
    await this.page.goto(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`);
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.page.getByRole('button', { name: /entrar/i }).click();
  }

  /**
   * Switch to signup mode - ONLY works when in invite mode (mode=signup in URL)
   */
  async switchToSignup() {
    const switchButton = this.page.getByRole('button', { name: /criar conta/i }).last();
    if (await switchButton.isVisible()) {
      await switchButton.click();
      await expect(this.fullNameInput).toBeVisible();
    }
  }

  /**
   * Switch to login mode - ONLY works when in invite mode
   */
  async switchToLogin() {
    const switchButton = this.page.getByRole('button', { name: /entrar/i }).last();
    if (await switchButton.isVisible()) {
      await switchButton.click();
      await expect(this.fullNameInput).not.toBeVisible();
    }
  }

  /**
   * Check if currently in signup mode
   */
  async isInSignupMode(): Promise<boolean> {
    return await this.fullNameInput.isVisible();
  }

  /**
   * Check if signup toggle is available (only in invite mode)
   */
  async hasSignupToggle(): Promise<boolean> {
    const toggleButton = this.page.getByRole('button', { name: /já tem uma conta/i });
    return await toggleButton.isVisible().catch(() => false);
  }

  async signup(fullName: string, email: string, password: string) {
    // Ensure we're in signup mode
    if (!(await this.isInSignupMode())) {
      await this.gotoSignupMode();
    }
    await this.fullNameInput.fill(fullName);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.page.getByRole('button', { name: /criar conta/i }).first().click();
  }

  async expectError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectSuccess(message?: string) {
    await expect(this.successMessage).toBeVisible();
    if (message) {
      await expect(this.successMessage).toContainText(message);
    }
  }

  async expectLoggedIn() {
    await this.page.waitForURL(/\/(dashboard|patients|plans|patient)/, { timeout: 15000 });
  }

  async expectNoPublicSignup() {
    // Should show message about requesting invite
    await expect(this.noAccountMessage).toBeVisible();
    // Should NOT have a "Criar conta" toggle button
    const createAccountButton = this.page.getByRole('button', { name: /criar conta/i });
    await expect(createAccountButton).not.toBeVisible();
  }
}
