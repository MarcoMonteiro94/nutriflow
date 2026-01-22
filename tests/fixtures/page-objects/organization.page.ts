import { Page, Locator } from '@playwright/test';

export class OrganizationPage {
  readonly page: Page;

  // Create Organization Page
  readonly createOrgTitle: Locator;
  readonly nameInput: Locator;
  readonly slugInput: Locator;
  readonly createButton: Locator;

  // Organization Dashboard
  readonly dashboardTitle: Locator;
  readonly membersLink: Locator;
  readonly scheduleLink: Locator;
  readonly settingsLink: Locator;

  // Members Page
  readonly inviteButton: Locator;
  readonly membersList: Locator;
  readonly pendingInvitesList: Locator;

  // Invite Dialog
  readonly inviteDialog: Locator;
  readonly inviteEmailInput: Locator;
  readonly inviteRoleSelect: Locator;
  readonly sendInviteButton: Locator;
  readonly copyLinkButton: Locator;
  readonly whatsappButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Create Organization
    this.createOrgTitle = page.getByRole('heading', { name: /criar.*clínica|nova.*organização/i });
    this.nameInput = page.locator('input[name="name"]');
    this.slugInput = page.locator('input[name="slug"]');
    this.createButton = page.getByRole('button', { name: /criar|salvar/i });

    // Dashboard
    this.dashboardTitle = page.getByRole('heading', { name: /dashboard|painel/i });
    this.membersLink = page.getByRole('link', { name: /membros/i });
    this.scheduleLink = page.getByRole('link', { name: /agenda/i });
    this.settingsLink = page.getByRole('link', { name: /configurações/i });

    // Members
    this.inviteButton = page.getByRole('button', { name: /convidar/i });
    this.membersList = page.locator('[data-testid="members-list"]');
    this.pendingInvitesList = page.locator('[data-testid="pending-invites"]');

    // Invite Dialog
    this.inviteDialog = page.locator('[role="dialog"]');
    this.inviteEmailInput = page.locator('input[name="email"]');
    this.inviteRoleSelect = page.locator('[data-testid="role-select"]');
    this.sendInviteButton = page.getByRole('button', { name: /enviar.*convite/i });
    this.copyLinkButton = page.locator('[data-testid="copy-link"]');
    this.whatsappButton = page.locator('[data-testid="whatsapp-share"]');
  }

  async gotoCreate() {
    await this.page.goto('/organization/create');
  }

  async gotoDashboard() {
    await this.page.goto('/organization/dashboard');
  }

  async gotoMembers() {
    await this.page.goto('/organization/members');
  }

  async gotoSettings() {
    await this.page.goto('/organization/settings');
  }

  async createOrganization(name: string, slug: string) {
    await this.gotoCreate();
    await this.nameInput.fill(name);
    await this.slugInput.fill(slug);
    await this.createButton.click();
  }

  async openInviteDialog() {
    await this.inviteButton.click();
    await this.inviteDialog.waitFor({ state: 'visible' });
  }

  async sendInvite(email: string, role: string) {
    await this.openInviteDialog();
    await this.inviteEmailInput.fill(email);

    // Select role from dropdown
    const roleButton = this.page.locator('button[role="combobox"]').first();
    await roleButton.click();
    await this.page.getByRole('option', { name: new RegExp(role, 'i') }).click();

    await this.sendInviteButton.click();
  }

  async getMemberCount() {
    const members = this.page.locator('[data-testid="member-card"]');
    return await members.count();
  }

  async getPendingInviteCount() {
    const invites = this.page.locator('[data-testid="pending-invite"]');
    return await invites.count();
  }
}

export class InvitePage {
  readonly page: Page;

  readonly title: Locator;
  readonly organizationName: Locator;
  readonly roleText: Locator;
  readonly acceptButton: Locator;
  readonly loginButton: Locator;
  readonly signupButton: Locator;
  readonly invalidMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.title = page.getByRole('heading', { name: /convidado/i });
    this.organizationName = page.locator('[data-testid="org-name"]');
    this.roleText = page.getByText(/função:/i);
    this.acceptButton = page.getByRole('button', { name: /aceitar/i });
    this.loginButton = page.getByRole('button', { name: /fazer login/i });
    this.signupButton = page.getByRole('button', { name: /criar conta/i });
    this.invalidMessage = page.getByText(/inválido|expirado/i);
  }

  async goto(token: string) {
    await this.page.goto(`/invite/${token}`);
  }

  async acceptInvite() {
    await this.acceptButton.click();
  }

  async goToLogin() {
    await this.loginButton.click();
  }

  async goToSignup() {
    await this.signupButton.click();
  }
}
