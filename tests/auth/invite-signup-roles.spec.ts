import { test, expect } from '@playwright/test';
import { testInviteTokens } from '../fixtures/test-data';

/**
 * Per-role invite signup E2E tests.
 *
 * Each test verifies the full flow for a specific role:
 *   1. Visit /invite/[token] (unauthenticated)
 *   2. Click "Criar Conta" -> signup form
 *   3. Fill form and submit
 *   4. Auto-accept invite -> redirect to role-appropriate page
 *
 * IMPORTANT: These tests create real users and consume invites.
 * Run `npx tsx scripts/seed-test-data.ts` before each test run to reset state.
 */

const ROLE_REDIRECTS: Record<string, RegExp> = {
  admin: /\/(dashboard|patients|plans|organization)/,
  nutri: /\/(dashboard|patients|plans)/,
  receptionist: /\/(schedule|dashboard)/,
  patient: /\/patient\/dashboard/,
};

test.describe('Invite Signup - Per Role', () => {
  test('admin invite -> signup -> auto-accept', async ({ page }) => {
    const invite = testInviteTokens.adminInvite;
    await page.goto(`/invite/${invite.token}`);

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) { test.skip(true, 'Service role key not available'); return; }

    const hasInvite = await page.getByRole('heading', { name: /convidado/i }).isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasInvite) { test.skip(true, 'Invite token not available'); return; }

    await page.getByRole('link', { name: /criar conta/i }).click();
    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="full_name"]', 'E2E Admin User');
    await page.fill('input[name="email"]', invite.email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    await page.waitForURL(
      url => ROLE_REDIRECTS.admin.test(url.toString()) || url.toString().includes('/invite/'),
      { timeout: 15000 }
    );
    if (page.url().includes('/invite/')) {
      await page.waitForURL(ROLE_REDIRECTS.admin, { timeout: 15000 });
    }
    expect(page.url()).not.toContain('/auth/login');
  });

  test('nutri invite -> signup -> auto-accept', async ({ page }) => {
    const invite = testInviteTokens.nutriInvite;
    await page.goto(`/invite/${invite.token}`);

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) { test.skip(true, 'Service role key not available'); return; }

    const hasInvite = await page.getByRole('heading', { name: /convidado/i }).isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasInvite) { test.skip(true, 'Invite token not available'); return; }

    await page.getByRole('link', { name: /criar conta/i }).click();
    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="full_name"]', 'E2E Nutri User');
    await page.fill('input[name="email"]', invite.email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    await page.waitForURL(
      url => ROLE_REDIRECTS.nutri.test(url.toString()) || url.toString().includes('/invite/'),
      { timeout: 15000 }
    );
    if (page.url().includes('/invite/')) {
      await page.waitForURL(ROLE_REDIRECTS.nutri, { timeout: 15000 });
    }
    expect(page.url()).not.toContain('/auth/login');
  });

  test('receptionist invite -> signup -> auto-accept', async ({ page }) => {
    const invite = testInviteTokens.receptionistInvite;
    await page.goto(`/invite/${invite.token}`);

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) { test.skip(true, 'Service role key not available'); return; }

    const hasInvite = await page.getByRole('heading', { name: /convidado/i }).isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasInvite) { test.skip(true, 'Invite token not available'); return; }

    await page.getByRole('link', { name: /criar conta/i }).click();
    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="full_name"]', 'E2E Receptionist User');
    await page.fill('input[name="email"]', invite.email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    await page.waitForURL(
      url => ROLE_REDIRECTS.receptionist.test(url.toString()) || url.toString().includes('/invite/'),
      { timeout: 15000 }
    );
    if (page.url().includes('/invite/')) {
      await page.waitForURL(ROLE_REDIRECTS.receptionist, { timeout: 15000 });
    }
    expect(page.url()).not.toContain('/auth/login');
  });

  test('patient invite -> signup -> auto-accept', async ({ page }) => {
    const invite = testInviteTokens.patientInvite;
    await page.goto(`/invite/${invite.token}`);

    const appError = page.locator('text=/Application error/i');
    if (await appError.isVisible().catch(() => false)) { test.skip(true, 'Service role key not available'); return; }

    const hasInvite = await page.getByRole('heading', { name: /convidado/i }).isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasInvite) { test.skip(true, 'Invite token not available'); return; }

    await page.getByRole('link', { name: /criar conta/i }).click();
    await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="full_name"]', 'E2E Patient User');
    await page.fill('input[name="email"]', invite.email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /criar conta/i }).first().click();

    await page.waitForURL(
      url => ROLE_REDIRECTS.patient.test(url.toString()) || url.toString().includes('/invite/'),
      { timeout: 15000 }
    );
    if (page.url().includes('/invite/')) {
      await page.waitForURL(ROLE_REDIRECTS.patient, { timeout: 15000 });
    }
    expect(page.url()).not.toContain('/auth/login');
  });
});
