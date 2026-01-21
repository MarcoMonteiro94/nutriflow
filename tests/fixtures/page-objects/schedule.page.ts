import { Page, Locator, expect } from '@playwright/test';

export class SchedulePage {
  readonly page: Page;
  readonly title: Locator;
  readonly newAppointmentButton: Locator;
  readonly calendar: Locator;
  readonly appointmentsList: Locator;
  readonly appointmentItems: Locator;
  readonly emptyState: Locator;
  readonly blockedDayIndicator: Locator;
  readonly timeBlockAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1:has-text("Agenda")');
    this.newAppointmentButton = page.getByRole('link', { name: /agendar|nova consulta/i });
    this.calendar = page.locator('[data-slot="card"]').filter({ hasText: /calendário|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i });
    this.appointmentsList = page.locator('[data-slot="card"]').filter({ hasText: /consultas|atendimentos/i });
    this.appointmentItems = page.locator('.rounded-lg').filter({ has: page.locator('text=/\\d{2}:\\d{2}/') });
    this.emptyState = page.locator('text=Nenhum atendimento');
    this.blockedDayIndicator = page.locator('[style*="destructive"]');
    this.timeBlockAlert = page.locator('[class*="border-yellow"]').filter({ hasText: /bloqueio/i });
  }

  async goto() {
    await this.page.goto('/schedule');
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible({ timeout: 10000 });
  }

  async clickNewAppointment() {
    await this.newAppointmentButton.click();
    await this.page.waitForURL(/\/schedule\/new/);
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

  async expectTimeBlockAlertVisible() {
    await expect(this.timeBlockAlert).toBeVisible();
  }

  async openAppointmentActions(patientName: string) {
    const item = await this.getAppointmentItem(patientName);
    const actionsButton = item.locator('button').filter({ has: this.page.locator('[class*="MoreHorizontal"]') });
    await actionsButton.click();
  }

  async openRescheduleDialog(patientName: string) {
    const item = await this.getAppointmentItem(patientName);
    const rescheduleButton = item.locator('button[title*="Reagendar"]');
    await rescheduleButton.click();
  }
}

export class AppointmentFormPage {
  readonly page: Page;
  readonly patientSelect: Locator;
  readonly dateButton: Locator;
  readonly dateCalendar: Locator;
  readonly durationSelect: Locator;
  readonly notesTextarea: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;
  readonly validationError: Locator;
  readonly timeSlotPicker: Locator;
  readonly timeSlotButtons: Locator;
  readonly availableSlots: Locator;
  readonly unavailableSlots: Locator;
  readonly noAvailabilityWarning: Locator;

  constructor(page: Page) {
    this.page = page;
    this.patientSelect = page.getByLabel(/paciente/i);
    this.dateButton = page.getByRole('button', { name: /selecione uma data|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i });
    this.dateCalendar = page.locator('[role="dialog"]').filter({ has: page.locator('[role="grid"]') });
    this.durationSelect = page.getByLabel(/duração/i);
    this.notesTextarea = page.getByLabel(/observações|notas/i);
    this.submitButton = page.getByRole('button', { name: /agendar consulta|salvar/i });
    this.cancelButton = page.getByRole('button', { name: /cancelar/i });
    this.errorMessage = page.locator('.bg-destructive\\/10');
    this.validationError = page.locator('[class*="border-yellow"]').filter({ hasText: /bloqueado|conflito|passado|disponibilidade/i });
    this.timeSlotPicker = page.locator('text=/horário disponível/i').locator('..');
    this.timeSlotButtons = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ });
    this.availableSlots = this.timeSlotButtons.filter({ has: page.locator(':not([disabled])') });
    this.unavailableSlots = this.timeSlotButtons.locator('[disabled]');
    this.noAvailabilityWarning = page.locator('text=/não configurou disponibilidade/i');
  }

  async goto() {
    await this.page.goto('/schedule/new');
    await this.page.waitForLoadState('networkidle');
  }

  async selectPatient(name: string) {
    await this.patientSelect.click();
    await this.page.getByRole('option', { name: new RegExp(name, 'i') }).click();
  }

  async selectDate(day: number) {
    await this.dateButton.click();
    await expect(this.dateCalendar).toBeVisible();
    await this.dateCalendar.getByRole('button', { name: String(day), exact: true }).click();
  }

  async selectTime(time: string) {
    const timeButton = this.page.getByRole('button', { name: time, exact: true });
    await timeButton.click();
  }

  async selectDuration(duration: string) {
    await this.durationSelect.click();
    await this.page.getByRole('option', { name: new RegExp(duration, 'i') }).click();
  }

  async fillNotes(notes: string) {
    await this.notesTextarea.fill(notes);
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

  async expectValidationError(message?: string) {
    await expect(this.validationError).toBeVisible();
    if (message) {
      await expect(this.validationError).toContainText(message);
    }
  }

  async expectRedirectToSchedule() {
    await this.page.waitForURL(/\/schedule/, { timeout: 10000 });
  }

  async expectTimeSlotPickerVisible() {
    await expect(this.timeSlotPicker).toBeVisible();
  }

  async expectNoAvailabilityWarning() {
    await expect(this.noAvailabilityWarning).toBeVisible();
  }

  async getAvailableSlotCount(): Promise<number> {
    return await this.availableSlots.count();
  }

  async selectFirstAvailableSlot() {
    const firstSlot = this.availableSlots.first();
    await firstSlot.click();
  }
}

export class RescheduleDialogPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly title: Locator;
  readonly dateButton: Locator;
  readonly dateCalendar: Locator;
  readonly timeSlotButtons: Locator;
  readonly reasonTextarea: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('[role="dialog"]');
    this.title = this.dialog.locator('h2:has-text("Reagendar")');
    this.dateButton = this.dialog.getByRole('button', { name: /selecione|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i });
    this.dateCalendar = page.locator('[role="dialog"]').filter({ has: page.locator('[role="grid"]') });
    this.timeSlotButtons = this.dialog.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ });
    this.reasonTextarea = this.dialog.getByLabel(/motivo/i);
    this.submitButton = this.dialog.getByRole('button', { name: /confirmar|reagendar/i });
    this.cancelButton = this.dialog.getByRole('button', { name: /cancelar/i });
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
    await expect(this.title).toBeVisible();
  }

  async selectDate(day: number) {
    await this.dateButton.click();
    await this.dateCalendar.getByRole('button', { name: String(day), exact: true }).click();
  }

  async selectTime(time: string) {
    const timeButton = this.timeSlotButtons.filter({ hasText: time }).first();
    await timeButton.click();
  }

  async fillReason(reason: string) {
    await this.reasonTextarea.fill(reason);
  }

  async submit() {
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}

export class AppointmentActionsDialogPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly title: Locator;
  readonly completeButton: Locator;
  readonly noShowButton: Locator;
  readonly cancelAppointmentButton: Locator;
  readonly reasonTextarea: Locator;
  readonly confirmButton: Locator;
  readonly historySection: Locator;
  readonly historyItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('[role="dialog"]');
    this.title = this.dialog.locator('h2:has-text("Gerenciar")');
    this.completeButton = this.dialog.getByRole('button', { name: /realizada/i });
    this.noShowButton = this.dialog.getByRole('button', { name: /não veio/i });
    this.cancelAppointmentButton = this.dialog.getByRole('button', { name: /cancelar/i }).first();
    this.reasonTextarea = this.dialog.getByLabel(/motivo/i);
    this.confirmButton = this.dialog.getByRole('button', { name: /confirmar/i });
    this.historySection = this.dialog.locator('text=/histórico/i').locator('..');
    this.historyItems = this.dialog.locator('[class*="relative flex gap-4"]');
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
    await expect(this.title).toBeVisible();
  }

  async markAsCompleted() {
    await this.completeButton.click();
    await this.confirmButton.click();
  }

  async markAsNoShow() {
    await this.noShowButton.click();
    await this.confirmButton.click();
  }

  async cancelWithReason(reason: string) {
    await this.cancelAppointmentButton.click();
    await this.reasonTextarea.fill(reason);
    await this.confirmButton.click();
  }

  async expectHistoryVisible() {
    await expect(this.historySection).toBeVisible();
  }

  async getHistoryCount(): Promise<number> {
    return await this.historyItems.count();
  }

  async close() {
    await this.page.keyboard.press('Escape');
  }
}
