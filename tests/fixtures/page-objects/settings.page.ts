import { Page, Locator, expect } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly title: Locator;
  readonly availabilityCard: Locator;
  readonly timeBlocksCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1:has-text("Configurações")');
    this.availabilityCard = page.locator('[data-slot="card"]').filter({ hasText: /disponibilidade/i });
    this.timeBlocksCard = page.locator('[data-slot="card"]').filter({ hasText: /bloqueio|bloqueios/i });
  }

  async goto() {
    await this.page.goto('/settings');
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible({ timeout: 10000 });
  }

  async goToAvailability() {
    await this.availabilityCard.click();
    await this.page.waitForURL(/\/settings\/availability/);
  }

  async goToTimeBlocks() {
    await this.timeBlocksCard.click();
    await this.page.waitForURL(/\/settings\/time-blocks/);
  }
}

export class AvailabilityPage {
  readonly page: Page;
  readonly title: Locator;
  readonly saveButton: Locator;
  readonly dayRows: Locator;
  readonly addSlotButtons: Locator;
  readonly timeSelects: Locator;
  readonly toggleSwitches: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1:has-text("Disponibilidade")');
    this.saveButton = page.getByRole('button', { name: /salvar/i });
    this.dayRows = page.locator('[class*="border-b"]').filter({ hasText: /-feira|domingo|sábado/i });
    this.addSlotButtons = page.getByRole('button', { name: /adicionar/i });
    this.timeSelects = page.locator('[data-slot="select"]');
    this.toggleSwitches = page.locator('button[role="switch"]');
  }

  async goto() {
    await this.page.goto('/settings/availability');
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible({ timeout: 10000 });
  }

  async addTimeSlot(dayIndex: number) {
    const addButton = this.addSlotButtons.nth(dayIndex);
    await addButton.click();
  }

  async save() {
    await this.saveButton.click();
  }

  async expectDaysVisible() {
    // Should show all 7 days of the week
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    for (const day of days) {
      await expect(this.page.locator(`text=${day}`).first()).toBeVisible();
    }
  }

  async toggleSlot(slotIndex: number) {
    const toggle = this.toggleSwitches.nth(slotIndex);
    await toggle.click();
  }

  async getDaySlotCount(dayIndex: number): Promise<number> {
    const dayRow = this.dayRows.nth(dayIndex);
    const slots = dayRow.locator('[data-slot="select"]');
    return Math.floor((await slots.count()) / 2); // Each slot has 2 selects (start/end)
  }
}

export class TimeBlocksPage {
  readonly page: Page;
  readonly title: Locator;
  readonly newBlockButton: Locator;
  readonly blockList: Locator;
  readonly blockItems: Locator;
  readonly emptyState: Locator;
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly titleInput: Locator;
  readonly typeSelect: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1:has-text("Bloqueio")');
    this.newBlockButton = page.getByRole('button', { name: /novo bloqueio|adicionar/i });
    this.blockList = page.locator('[class*="space-y"]').filter({ has: page.locator('[class*="rounded-lg border"]') });
    this.blockItems = page.locator('[class*="rounded-lg border p-4"]');
    this.emptyState = page.locator('text=/nenhum bloqueio/i');
    this.dialog = page.locator('[role="dialog"]');
    this.dialogTitle = page.locator('[role="dialog"] h2');
    this.titleInput = page.getByLabel(/título/i);
    this.typeSelect = page.locator('[data-slot="select"]').filter({ hasText: /tipo|pessoal|feriado/i });
    this.startDateInput = page.getByLabel(/início/i);
    this.endDateInput = page.getByLabel(/fim/i);
    this.submitButton = this.dialog.getByRole('button', { name: /criar|salvar/i });
    this.cancelButton = this.dialog.getByRole('button', { name: /cancelar/i });
  }

  async goto() {
    await this.page.goto('/settings/time-blocks');
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible({ timeout: 10000 });
  }

  async openNewBlockDialog() {
    await this.newBlockButton.click();
    await expect(this.dialog).toBeVisible();
  }

  async fillBlockForm(data: {
    title: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    await this.titleInput.fill(data.title);
    if (data.type) {
      await this.typeSelect.click();
      await this.page.getByRole('option', { name: new RegExp(data.type, 'i') }).click();
    }
    // Note: Date inputs may need specific handling based on implementation
  }

  async submitBlock() {
    await this.submitButton.click();
    await expect(this.dialog).not.toBeVisible({ timeout: 5000 });
  }

  async cancelBlock() {
    await this.cancelButton.click();
    await expect(this.dialog).not.toBeVisible();
  }

  async deleteBlock(index: number) {
    const blockItem = this.blockItems.nth(index);
    const deleteButton = blockItem.getByRole('button', { name: /excluir|deletar|remover/i });
    await deleteButton.click();
    // May need to confirm deletion
    const confirmButton = this.page.getByRole('button', { name: /confirmar|sim/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }
  }

  async getBlockCount(): Promise<number> {
    return await this.blockItems.count();
  }

  async expectBlockVisible(title: string) {
    await expect(this.page.locator(`text=${title}`)).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }
}
