import { Page, Locator, expect } from '@playwright/test';

export class FoodsPage {
  readonly page: Page;
  readonly title: Locator;
  readonly newFoodButton: Locator;
  readonly searchInput: Locator;
  readonly foodCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1:has-text("Alimentos")');
    this.newFoodButton = page.getByRole('link', { name: /cadastrar alimento|novo alimento/i });
    this.searchInput = page.getByPlaceholder(/buscar|pesquisar/i);
    this.foodCards = page.locator('[data-slot="card"]');
  }

  async goto() {
    await this.page.goto('/foods');
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible({ timeout: 10000 });
  }

  async expectFoodVisible(name: string) {
    await expect(this.page.locator(`text=${name}`)).toBeVisible({ timeout: 10000 });
  }
}

export class FoodFormPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly categoryTrigger: Locator;
  readonly portionSizeInput: Locator;
  readonly portionUnitTrigger: Locator;
  readonly caloriesInput: Locator;
  readonly proteinInput: Locator;
  readonly carbsInput: Locator;
  readonly fatInput: Locator;
  readonly fiberInput: Locator;
  readonly sodiumInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByRole('textbox', { name: /nome do alimento/i });
    this.categoryTrigger = page.getByRole('combobox', { name: /categoria/i }).first();
    this.portionSizeInput = page.getByRole('spinbutton', { name: /porção/i });
    this.portionUnitTrigger = page.getByRole('combobox', { name: /unidade/i }).first();
    this.caloriesInput = page.getByRole('spinbutton', { name: /calorias/i });
    this.proteinInput = page.getByRole('spinbutton', { name: /proteínas/i });
    this.carbsInput = page.getByRole('spinbutton', { name: /carboidratos/i });
    this.fatInput = page.getByRole('spinbutton', { name: /gorduras/i });
    this.fiberInput = page.getByRole('spinbutton', { name: /fibras/i });
    this.sodiumInput = page.getByRole('spinbutton', { name: /sódio/i });
    this.submitButton = page.getByRole('button', { name: /cadastrar alimento/i });
    this.cancelButton = page.getByRole('button', { name: /cancelar/i });
    this.errorMessage = page.locator('.bg-destructive\\/10');
  }

  async goto() {
    await this.page.goto('/foods/new');
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: {
    name?: string;
    category?: string;
    portionSize?: string;
    portionUnit?: string;
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    fiber?: string;
    sodium?: string;
  }) {
    if (data.name) await this.nameInput.fill(data.name);

    if (data.category) {
      await this.categoryTrigger.click();
      await this.page.getByRole('option', { name: data.category }).click();
    }

    if (data.portionSize) await this.portionSizeInput.fill(data.portionSize);

    if (data.portionUnit) {
      await this.portionUnitTrigger.click();
      await this.page.getByRole('option', { name: new RegExp(data.portionUnit, 'i') }).click();
    }

    if (data.calories) await this.caloriesInput.fill(data.calories);
    if (data.protein) await this.proteinInput.fill(data.protein);
    if (data.carbs) await this.carbsInput.fill(data.carbs);
    if (data.fat) await this.fatInput.fill(data.fat);
    if (data.fiber) await this.fiberInput.fill(data.fiber);
    if (data.sodium) await this.sodiumInput.fill(data.sodium);
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectRedirectToFoods() {
    await this.page.waitForURL(/\/foods$/, { timeout: 10000 });
  }
}
