import { Page, Locator, expect } from '@playwright/test';

export class ChallengeFormPage {
  readonly page: Page;

  // Template step
  readonly templateCards: Locator;
  readonly skipTemplateButton: Locator;
  readonly useTemplateButton: Locator;

  // Form step
  readonly titleInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly usePhasesSwitch: Locator;

  // Direct goals (when usePhases = false)
  readonly goalTitleInput: Locator;
  readonly addGoalButton: Locator;

  // Actions
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Template selector
    this.templateCards = page.locator('[data-slot="card"]').filter({ has: page.locator('h3') });
    this.skipTemplateButton = page.getByRole('button', { name: /criar do zero/i });
    this.useTemplateButton = page.getByRole('button', { name: /usar template/i });

    // Form fields
    this.titleInput = page.locator('#title');
    this.descriptionTextarea = page.locator('#description');
    this.usePhasesSwitch = page.locator('#use-phases');

    // Goals
    this.goalTitleInput = page.locator('#goal-title-0');
    this.addGoalButton = page.getByRole('button', { name: /adicionar meta/i });

    // Actions
    this.submitButton = page.getByRole('button', { name: /criar desafio/i });
    this.cancelButton = page.getByRole('button', { name: /cancelar/i });
  }

  async goto() {
    await this.page.goto('/challenges/new');
    await this.page.waitForLoadState('networkidle');
  }

  async skipTemplate() {
    await this.skipTemplateButton.click();
  }

  async selectFirstTemplate() {
    await this.templateCards.first().click();
    await this.useTemplateButton.click();
  }

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async fillDescription(description: string) {
    await this.descriptionTextarea.fill(description);
  }

  async fillGoalTitle(title: string) {
    await this.goalTitleInput.fill(title);
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectRedirectToChallenge() {
    await this.page.waitForURL(/\/challenges\/[a-f0-9-]+$/, { timeout: 10000 });
  }

  async expectTemplateSelectorVisible() {
    await expect(this.page.getByText(/escolha um template/i)).toBeVisible({ timeout: 10000 });
  }

  async expectFormVisible() {
    await expect(this.titleInput).toBeVisible({ timeout: 10000 });
  }

  async expectToastError(message: string) {
    await expect(this.page.locator('[data-sonner-toast]').filter({ hasText: message })).toBeVisible({ timeout: 5000 });
  }
}
