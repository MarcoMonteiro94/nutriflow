import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly fullNameInput: Locator;
  readonly submitButton: Locator;
  readonly switchModeButton: Locator;
  readonly errorMessage: Locator;
  readonly logo: Locator;
  readonly title: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Senha');
    this.fullNameInput = page.getByLabel('Nome Completo');
    this.submitButton = page.getByRole('button', { name: /entrar|criar conta/i }).first();
    this.switchModeButton = page.locator('button:has-text("Criar conta"), button:has-text("Entrar")').last();
    this.errorMessage = page.locator('.bg-destructive\\/10');
    this.logo = page.locator('[data-testid="logo"], .rounded-2xl.bg-primary');
    this.title = page.locator('text=NutriFlow');
  }

  async goto() {
    await this.page.goto('/auth/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.page.getByRole('button', { name: /entrar/i }).click();
  }

  async switchToSignup() {
    await this.page.getByRole('button', { name: /criar conta/i }).last().click();
    await expect(this.fullNameInput).toBeVisible();
  }

  async switchToLogin() {
    await this.page.getByRole('button', { name: /entrar/i }).last().click();
    await expect(this.fullNameInput).not.toBeVisible();
  }

  async signup(fullName: string, email: string, password: string) {
    await this.switchToSignup();
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

  async expectLoggedIn() {
    await this.page.waitForURL(/\/(dashboard|patients|plans)/, { timeout: 15000 });
  }
}
