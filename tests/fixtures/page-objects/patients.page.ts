import { Page, Locator, expect } from '@playwright/test';

export class PatientsPage {
  readonly page: Page;
  readonly title: Locator;
  readonly newPatientButton: Locator;
  readonly searchInput: Locator;
  readonly patientCards: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1:has-text("Pacientes")');
    this.newPatientButton = page.getByRole('link', { name: /novo paciente|cadastrar/i });
    this.searchInput = page.getByPlaceholder(/buscar|pesquisar/i);
    this.patientCards = page.locator('[data-slot="card"]');
    this.emptyState = page.locator('text=Nenhum paciente');
  }

  async goto() {
    await this.page.goto('/patients');
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible({ timeout: 10000 });
  }

  async clickNewPatient() {
    await this.newPatientButton.click();
    await this.page.waitForURL(/\/patients\/new/);
  }

  async searchPatient(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async getPatientCard(patientName: string): Promise<Locator> {
    return this.patientCards.filter({ hasText: patientName }).first();
  }

  async clickPatientProfile(patientName: string) {
    const card = await this.getPatientCard(patientName);
    await card.getByRole('link', { name: /ver perfil/i }).click();
  }

  async clickPatientPlan(patientName: string) {
    const card = await this.getPatientCard(patientName);
    await card.getByRole('link', { name: /ver plano/i }).click();
  }

  async expectPatientVisible(patientName: string) {
    const card = await this.getPatientCard(patientName);
    await expect(card).toBeVisible();
  }

  async expectPatientNotVisible(patientName: string) {
    const card = this.patientCards.filter({ hasText: patientName });
    await expect(card).not.toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async getPatientCount(): Promise<number> {
    return await this.patientCards.count();
  }
}

export class PatientFormPage {
  readonly page: Page;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly birthDateInput: Locator;
  readonly genderSelect: Locator;
  readonly goalInput: Locator;
  readonly notesTextarea: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fullNameInput = page.getByLabel('Nome Completo');
    this.emailInput = page.getByLabel('Email');
    this.phoneInput = page.getByLabel('Telefone');
    this.birthDateInput = page.getByLabel('Data de Nascimento');
    this.genderSelect = page.locator('select[name="gender"]');
    this.goalInput = page.getByLabel('Objetivo');
    this.notesTextarea = page.getByLabel('Observações');
    this.submitButton = page.getByRole('button', { name: /cadastrar|salvar/i });
    this.cancelButton = page.getByRole('button', { name: /cancelar/i });
    this.errorMessage = page.locator('.bg-destructive\\/10');
  }

  async goto() {
    await this.page.goto('/patients/new');
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: {
    fullName: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    gender?: string;
    goal?: string;
    notes?: string;
  }) {
    await this.fullNameInput.fill(data.fullName);
    if (data.email) await this.emailInput.fill(data.email);
    if (data.phone) await this.phoneInput.fill(data.phone);
    if (data.birthDate) await this.birthDateInput.fill(data.birthDate);
    if (data.gender) await this.genderSelect.selectOption(data.gender);
    if (data.goal) await this.goalInput.fill(data.goal);
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

  async expectRedirectToPatient() {
    await this.page.waitForURL(/\/patients\/[a-f0-9-]+$/, { timeout: 10000 });
  }
}

export class PatientDetailPage {
  readonly page: Page;
  readonly patientName: Locator;
  readonly pageTitle: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly createPlanButton: Locator;
  readonly backButton: Locator;
  readonly patientInfo: Locator;

  constructor(page: Page) {
    this.page = page;
    // The page title is "Perfil do Paciente", patient name is in a separate element
    this.pageTitle = page.locator('h1');
    this.patientName = page.locator('main').locator('text=/^[A-Z].*[a-z]+/').first();
    this.editButton = page.getByRole('link', { name: /editar/i });
    this.deleteButton = page.locator('button').filter({ has: page.locator('img') }).last(); // The dropdown trigger
    this.createPlanButton = page.getByRole('link', { name: /criar.*plano|novo plano/i });
    this.backButton = page.locator('a[href="/patients"]');
    this.patientInfo = page.locator('[data-slot="card"]').first();
  }

  async goto(patientId: string) {
    await this.page.goto(`/patients/${patientId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded(patientName?: string) {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    if (patientName) {
      // Patient name is displayed separately from the page title
      await expect(this.page.locator(`text=${patientName}`)).toBeVisible({ timeout: 10000 });
    }
  }

  async clickEdit() {
    await this.editButton.click();
    await this.page.waitForURL(/\/patients\/[a-f0-9-]+\/edit/);
  }

  async clickDelete() {
    await this.deleteButton.click();
  }

  async confirmDelete() {
    await this.page.getByRole('button', { name: /confirmar|sim/i }).click();
  }
}
