import { Page, Locator, expect } from '@playwright/test';

export class PlansPage {
  readonly page: Page;
  readonly title: Locator;
  readonly newPlanButton: Locator;
  readonly planCards: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1:has-text("Planos")');
    this.newPlanButton = page.getByRole('link', { name: /criar plano|novo plano/i });
    this.planCards = page.locator('[data-slot="card"]');
    this.emptyState = page.locator('text=Nenhum plano');
  }

  async goto() {
    await this.page.goto('/plans');
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible({ timeout: 10000 });
  }

  async clickNewPlan() {
    await this.newPlanButton.click();
    await this.page.waitForURL(/\/plans\/new/);
  }

  async getPlanCard(planTitle: string): Promise<Locator> {
    return this.planCards.filter({ hasText: planTitle }).first();
  }

  async clickViewPlan(planTitle: string) {
    const card = await this.getPlanCard(planTitle);
    await card.getByRole('link', { name: /ver plano/i }).click();
  }

  async clickEditPlan(planTitle: string) {
    const card = await this.getPlanCard(planTitle);
    await card.getByRole('link', { name: /editar/i }).click();
  }

  async expectPlanVisible(planTitle: string) {
    const card = await this.getPlanCard(planTitle);
    await expect(card).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async getPlanCount(): Promise<number> {
    return await this.planCards.count();
  }
}

export class PlanFormPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly patientSelect: Locator;
  readonly startsAtInput: Locator;
  readonly endsAtInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.getByLabel(/título/i);
    this.descriptionInput = page.getByLabel(/descrição/i);
    this.patientSelect = page.locator('[data-slot="select"], select').filter({ hasText: /paciente/i });
    this.startsAtInput = page.getByLabel(/início|começa/i);
    this.endsAtInput = page.getByLabel(/término|fim/i);
    this.submitButton = page.getByRole('button', { name: /criar|salvar/i });
    this.cancelButton = page.getByRole('button', { name: /cancelar/i });
    this.errorMessage = page.locator('.bg-destructive\\/10');
  }

  async goto() {
    await this.page.goto('/plans/new');
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: {
    title: string;
    description?: string;
    patientName?: string;
    startsAt?: string;
    endsAt?: string;
  }) {
    await this.titleInput.fill(data.title);
    if (data.description) await this.descriptionInput.fill(data.description);
    if (data.patientName) {
      await this.page.getByRole('combobox').first().click();
      await this.page.getByRole('option', { name: new RegExp(data.patientName, 'i') }).click();
    }
    if (data.startsAt) await this.startsAtInput.fill(data.startsAt);
    if (data.endsAt) await this.endsAtInput.fill(data.endsAt);
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectRedirectToPlan() {
    await this.page.waitForURL(/\/plans\/[a-f0-9-]+/, { timeout: 10000 });
  }
}

export class PlanEditPage {
  readonly page: Page;
  readonly title: Locator;
  readonly addMealButton: Locator;
  readonly mealCards: Locator;
  readonly saveStatusIndicator: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1');
    this.addMealButton = page.getByRole('button', { name: /adicionar refeição/i });
    this.mealCards = page.locator('.rounded-2xl.shadow-soft').filter({ has: page.locator('text=/\\d{2}:\\d{2}/') });
    this.saveStatusIndicator = page.locator('[data-testid="save-status"], text=/salvando|salvo/i');
    this.emptyState = page.locator('text=Nenhuma refeição');
  }

  async goto(planId: string) {
    await this.page.goto(`/plans/${planId}/edit`);
    await this.page.waitForLoadState('networkidle');
  }

  async addMeal(mealType: string, title?: string, time?: string) {
    await this.addMealButton.click();

    // Select meal type
    await this.page.getByRole('combobox').click();
    await this.page.getByRole('option', { name: new RegExp(mealType, 'i') }).click();

    // Set custom title if provided and type is custom
    if (title && mealType.toLowerCase() === 'personalizado') {
      await this.page.getByLabel(/nome da refeição/i).fill(title);
    }

    // Set time if provided
    if (time) {
      await this.page.getByLabel(/horário/i).fill(time);
    }

    // Confirm
    await this.page.getByRole('button', { name: /adicionar$/i }).click();
    await this.page.waitForTimeout(1000); // Wait for optimistic update
  }

  async getMealCard(mealTitle: string): Promise<Locator> {
    return this.page.locator('.rounded-2xl').filter({ hasText: mealTitle }).first();
  }

  async expandMeal(mealTitle: string) {
    const card = await this.getMealCard(mealTitle);
    await card.click();
  }

  async deleteMeal(mealTitle: string) {
    const card = await this.getMealCard(mealTitle);
    await card.getByRole('button', { name: /excluir|deletar/i }).click();
  }

  async clickAddFood(mealTitle: string) {
    const card = await this.getMealCard(mealTitle);
    await card.getByRole('link', { name: /adicionar alimento/i }).click();
  }

  async expectMealVisible(mealTitle: string) {
    const card = await this.getMealCard(mealTitle);
    await expect(card).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async getMealCount(): Promise<number> {
    return await this.mealCards.count();
  }
}
