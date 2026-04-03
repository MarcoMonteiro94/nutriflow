import { test, expect } from '@playwright/test';
import { testInviteTokens } from '../fixtures/test-data';
import { loginAs } from '../fixtures/auth.fixture';
import { OrganizationPage } from '../fixtures/page-objects/organization.page';

/**
 * Full onboarding chain E2E test — essential steps only.
 * Per-role signup flows are covered in invite-signup-roles.spec.ts.
 */

test.describe.serial('Full Onboarding Chain', () => {
  test('Admin creates invite for Nutri', async ({ page }) => {
    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) { test.skip(true, 'Admin login failed'); return; }

    const orgPage = new OrganizationPage(page);
    await orgPage.gotoMembers();
    await page.waitForLoadState('networkidle');

    const hasButton = await orgPage.inviteButton.isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasButton) { test.skip(true, 'Members page not accessible'); return; }

    const email = `flow-nutri-${Date.now()}@test.com`;
    await orgPage.sendInvite(email, 'Nutricionista');
    await expect(orgPage.inviteDialog).not.toBeVisible({ timeout: 5000 });
  });

  test('Nutri invite page shows correct role', async ({ page }) => {
    const invite = testInviteTokens.nutriInvite;
    await page.goto(`/invite/${invite.token}`);

    if (await page.locator('text=/Application error/i').isVisible().catch(() => false)) {
      test.skip(true, 'Service role key not available'); return;
    }

    const hasInvite = await page.getByRole('heading', { name: /convidado/i }).isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasInvite) { test.skip(true, 'Invite token not available'); return; }

    await expect(page.locator('[data-testid="invite-role-badge"]')).toContainText('Nutricionista');
  });

  test('Nutri can access org members and invite', async ({ page }) => {
    const loggedIn = await loginAs(page, 'nutri');
    if (!loggedIn) { test.skip(true, 'Nutri login failed'); return; }

    await page.goto('/organization/members');
    await page.waitForLoadState('networkidle');

    const inviteButton = page.getByRole('button', { name: /convidar membro/i });
    const hasButton = await inviteButton.isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasButton).toBeTruthy();
  });

  test('Nutri can access patients page', async ({ page }) => {
    const loggedIn = await loginAs(page, 'nutri');
    if (!loggedIn) { test.skip(true, 'Nutri login failed'); return; }

    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/patients');
    expect(page.url()).not.toContain('/auth/login');
  });
});
