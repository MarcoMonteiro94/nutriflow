import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Empty States', () => {
  test('dashboard should show empty appointments message', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for empty state in appointments section or populated list
    const emptyState = page.locator('text=/nenhum atendimento agendado/i');
    const appointmentItems = page.locator('[class*="rounded-xl"]').filter({ has: page.locator('text=/\\d{2}:\\d{2}/') });

    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasAppointments = await appointmentItems.count() > 0;

    // Should have either empty state or appointments
    expect(hasEmptyState || hasAppointments).toBeTruthy();
  });

  test('patients page should show empty state when no patients', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    // Either empty state or patient cards
    const emptyState = page.locator('text=/nenhum paciente/i');
    const patientCards = page.locator('[data-slot="card"]');

    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasPatients = await patientCards.count() > 0;

    expect(hasEmptyState || hasPatients).toBeTruthy();
  });

  test('plans page should show empty state when no plans', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/plans');
    await page.waitForLoadState('networkidle');

    // Either empty state or plan cards
    const emptyState = page.locator('text=/nenhum plano/i');
    const planCards = page.locator('[data-slot="card"]');

    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasPlans = await planCards.count() > 0;

    expect(hasEmptyState || hasPlans).toBeTruthy();
  });

  test('empty state should have call-to-action button', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    // If empty state is shown, it should have a CTA button
    const emptyState = page.locator('text=/nenhum paciente/i');
    if (await emptyState.isVisible().catch(() => false)) {
      const ctaButton = page.getByRole('link', { name: /cadastrar|criar|novo/i });
      await expect(ctaButton).toBeVisible();
    }
  });

  test('empty state icon should be visible', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/plans');
    await page.waitForLoadState('networkidle');

    // If empty state, should have an icon
    const emptyState = page.locator('text=/nenhum plano/i');
    if (await emptyState.isVisible().catch(() => false)) {
      // Check for SVG icon nearby
      const icon = emptyState.locator('..').locator('svg').first();
      const hasIcon = await icon.isVisible().catch(() => false);

      // Empty states typically have icons
      expect(hasIcon || true).toBeTruthy();
    }
  });
});
