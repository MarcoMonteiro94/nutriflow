import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly title: Locator;
  readonly newPatientButton: Locator;
  readonly newPlanButton: Locator;
  readonly statsCards: Locator;
  readonly totalPatientsCard: Locator;
  readonly activePlansCard: Locator;
  readonly todayAppointmentsCard: Locator;
  readonly adherenceRateCard: Locator;
  readonly upcomingAppointments: Locator;
  readonly quickActions: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1:has-text("Dashboard")');
    this.newPatientButton = page.getByRole('link', { name: /novo paciente/i });
    this.newPlanButton = page.getByRole('link', { name: /novo plano/i });
    this.statsCards = page.locator('[class*="shadow-soft"]').filter({ hasText: /(Pacientes|Planos|Consultas|Adesão)/i });
    this.totalPatientsCard = page.locator('text=Total Pacientes').locator('..');
    this.activePlansCard = page.locator('text=Planos Ativos').locator('..');
    this.todayAppointmentsCard = page.locator('text=Consultas Hoje').locator('..');
    this.adherenceRateCard = page.locator('text=Taxa de Adesão').locator('..');
    this.upcomingAppointments = page.locator('text=Próximos Atendimentos').locator('..').locator('..');
    this.quickActions = page.locator('text=Ações Rápidas').locator('..').locator('..');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible({ timeout: 10000 });
  }

  async getStatValue(statName: 'patients' | 'plans' | 'appointments' | 'adherence'): Promise<string> {
    const cardMap = {
      patients: this.totalPatientsCard,
      plans: this.activePlansCard,
      appointments: this.todayAppointmentsCard,
      adherence: this.adherenceRateCard,
    };
    const card = cardMap[statName];
    const value = await card.locator('.text-3xl').textContent();
    return value || '';
  }

  async clickNewPatient() {
    await this.newPatientButton.click();
    await this.page.waitForURL(/\/patients\/new/);
  }

  async clickNewPlan() {
    await this.newPlanButton.click();
    await this.page.waitForURL(/\/plans\/new/);
  }

  async expectEmptyState() {
    await expect(this.page.locator('text=Nenhum atendimento agendado')).toBeVisible();
  }
}
