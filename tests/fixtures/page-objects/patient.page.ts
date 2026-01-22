import { Page, Locator } from '@playwright/test';

export class PatientDashboardPage {
  readonly page: Page;

  // Stats section
  readonly statsSection: Locator;
  readonly nextAppointmentCard: Locator;
  readonly daysOnPlanCard: Locator;

  // Appointments section
  readonly appointmentsSection: Locator;
  readonly appointmentsList: Locator;
  readonly noAppointmentsMessage: Locator;

  // Meal plan section
  readonly mealPlanSection: Locator;
  readonly currentPlanCard: Locator;
  readonly noPlanMessage: Locator;

  // Quick actions
  readonly viewPlanButton: Locator;
  readonly scheduleAppointmentButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Stats
    this.statsSection = page.locator('[data-testid="patient-stats"]');
    this.nextAppointmentCard = page.locator('[data-testid="next-appointment-stat"]');
    this.daysOnPlanCard = page.locator('[data-testid="days-on-plan-stat"]');

    // Appointments
    this.appointmentsSection = page.locator('[data-testid="upcoming-appointments"]');
    this.appointmentsList = page.locator('[data-testid="appointments-list"]');
    this.noAppointmentsMessage = page.getByText(/nenhuma consulta/i);

    // Meal plan
    this.mealPlanSection = page.locator('[data-testid="current-meal-plan"]');
    this.currentPlanCard = page.locator('[data-testid="plan-card"]');
    this.noPlanMessage = page.getByText(/nenhum plano/i);

    // Actions
    this.viewPlanButton = page.getByRole('button', { name: /ver plano/i });
    this.scheduleAppointmentButton = page.getByRole('button', { name: /agendar/i });
  }

  async goto() {
    await this.page.goto('/patient/dashboard');
  }

  async getNextAppointmentText() {
    return await this.nextAppointmentCard.textContent();
  }

  async getDaysOnPlanText() {
    return await this.daysOnPlanCard.textContent();
  }

  async hasUpcomingAppointments() {
    return await this.appointmentsList.isVisible();
  }

  async hasActivePlan() {
    return await this.currentPlanCard.isVisible();
  }

  async clickViewPlan() {
    await this.viewPlanButton.click();
  }

  async clickScheduleAppointment() {
    await this.scheduleAppointmentButton.click();
  }
}

export class PatientPlanPage {
  readonly page: Page;

  // Plan header
  readonly planTitle: Locator;
  readonly planDescription: Locator;
  readonly planDates: Locator;

  // Meals
  readonly mealsList: Locator;
  readonly mealCards: Locator;

  // Nutrition summary
  readonly nutritionSummary: Locator;
  readonly caloriesTotal: Locator;
  readonly proteinTotal: Locator;
  readonly carbsTotal: Locator;
  readonly fatTotal: Locator;

  // Error states
  readonly invalidTokenMessage: Locator;
  readonly expiredTokenMessage: Locator;
  readonly noPlanMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.planTitle = page.locator('[data-testid="plan-title"]');
    this.planDescription = page.locator('[data-testid="plan-description"]');
    this.planDates = page.locator('[data-testid="plan-dates"]');

    // Meals
    this.mealsList = page.locator('[data-testid="meals-list"]');
    this.mealCards = page.locator('[data-testid="meal-card"]');

    // Nutrition
    this.nutritionSummary = page.locator('[data-testid="nutrition-summary"]');
    this.caloriesTotal = page.locator('[data-testid="calories-total"]');
    this.proteinTotal = page.locator('[data-testid="protein-total"]');
    this.carbsTotal = page.locator('[data-testid="carbs-total"]');
    this.fatTotal = page.locator('[data-testid="fat-total"]');

    // Errors
    this.invalidTokenMessage = page.getByText(/token inválido|convite inválido/i);
    this.expiredTokenMessage = page.getByText(/expirado/i);
    this.noPlanMessage = page.getByText(/nenhum plano|sem plano/i);
  }

  async gotoWithToken(token: string) {
    await this.page.goto(`/patient/plan?token=${token}`);
  }

  async getMealCount() {
    return await this.mealCards.count();
  }

  async getMealByIndex(index: number) {
    return this.mealCards.nth(index);
  }

  async getTotalCalories() {
    const text = await this.caloriesTotal.textContent();
    return text ? parseInt(text.replace(/\D/g, ''), 10) : 0;
  }

  async isTokenValid() {
    const hasInvalid = await this.invalidTokenMessage.isVisible().catch(() => false);
    const hasExpired = await this.expiredTokenMessage.isVisible().catch(() => false);
    return !hasInvalid && !hasExpired;
  }
}

export class PatientBottomNavPage {
  readonly page: Page;

  readonly bottomNav: Locator;
  readonly homeLink: Locator;
  readonly planLink: Locator;
  readonly appointmentsLink: Locator;
  readonly profileLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.bottomNav = page.locator('nav[data-testid="bottom-nav"]');
    this.homeLink = page.locator('a[href="/patient/dashboard"]');
    this.planLink = page.locator('a[href="/patient/plan"]');
    this.appointmentsLink = page.locator('a[href="/patient/appointments"]');
    this.profileLink = page.locator('a[href="/patient/profile"]');
  }

  async isVisible() {
    return await this.bottomNav.isVisible();
  }

  async navigateToHome() {
    await this.homeLink.click();
  }

  async navigateToPlan() {
    await this.planLink.click();
  }

  async navigateToAppointments() {
    await this.appointmentsLink.click();
  }

  async navigateToProfile() {
    await this.profileLink.click();
  }
}
