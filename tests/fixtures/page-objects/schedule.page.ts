import { Page, Locator, expect } from '@playwright/test';

export class SchedulePage {
  readonly page: Page;
  readonly title: Locator;
  readonly newAppointmentButton: Locator;
  readonly calendar: Locator;
  readonly appointmentsList: Locator;
  readonly appointmentItems: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1:has-text("Agenda")');
    this.newAppointmentButton = page.getByRole('link', { name: /agendar|nova consulta/i });
    this.calendar = page.locator('[data-slot="card"]').filter({ hasText: /calendário|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i });
    this.appointmentsList = page.locator('[data-slot="card"]').filter({ hasText: /consultas|atendimentos/i });
    this.appointmentItems = page.locator('.rounded-xl').filter({ has: page.locator('text=/\\d{2}:\\d{2}/') });
    this.emptyState = page.locator('text=Nenhum atendimento');
  }

  async goto() {
    await this.page.goto('/agenda');
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible({ timeout: 10000 });
  }

  async clickNewAppointment() {
    await this.newAppointmentButton.click();
  }

  async selectDate(day: number) {
    await this.calendar.getByRole('button', { name: String(day), exact: true }).click();
  }

  async getAppointmentItem(patientName: string): Promise<Locator> {
    return this.appointmentItems.filter({ hasText: patientName }).first();
  }

  async expectAppointmentVisible(patientName: string) {
    const item = await this.getAppointmentItem(patientName);
    await expect(item).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async getAppointmentCount(): Promise<number> {
    return await this.appointmentItems.count();
  }
}

export class AppointmentFormPage {
  readonly page: Page;
  readonly patientSelect: Locator;
  readonly dateInput: Locator;
  readonly timeInput: Locator;
  readonly durationSelect: Locator;
  readonly notesTextarea: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.patientSelect = page.locator('[data-slot="select"], select').filter({ hasText: /paciente/i });
    this.dateInput = page.getByLabel(/data/i);
    this.timeInput = page.getByLabel(/horário|hora/i);
    this.durationSelect = page.locator('[data-slot="select"], select').filter({ hasText: /duração/i });
    this.notesTextarea = page.getByLabel(/observações|notas/i);
    this.submitButton = page.getByRole('button', { name: /agendar|salvar/i });
    this.cancelButton = page.getByRole('button', { name: /cancelar/i });
    this.errorMessage = page.locator('.bg-destructive\\/10');
  }

  async fillForm(data: {
    patientName?: string;
    date: string;
    time: string;
    duration?: number;
    notes?: string;
  }) {
    if (data.patientName) {
      await this.page.getByRole('combobox').first().click();
      await this.page.getByRole('option', { name: new RegExp(data.patientName, 'i') }).click();
    }
    await this.dateInput.fill(data.date);
    await this.timeInput.fill(data.time);
    if (data.duration) {
      await this.page.getByRole('combobox').last().click();
      await this.page.getByRole('option', { name: new RegExp(`${data.duration}`, 'i') }).click();
    }
    if (data.notes) await this.notesTextarea.fill(data.notes);
  }

  async submit() {
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async expectError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectRedirectToSchedule() {
    await this.page.waitForURL(/\/agenda|\/schedule/, { timeout: 10000 });
  }
}
