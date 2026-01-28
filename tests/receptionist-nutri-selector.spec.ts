import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/test-data';

/**
 * Tests for the nutritionist selector in receptionist forms
 */
test.describe('Receptionist Nutri Selector', () => {
  test.beforeEach(async ({ page }) => {
    // Login as receptionist
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('input[name="email"]', testUsers.receptionist.email);
    await page.fill('input[name="password"]', testUsers.receptionist.password);
    await page.click('button[type="submit"]');

    // Wait for redirect - receptionists go to /schedule
    await page.waitForURL(/\/(schedule|dashboard)/, { timeout: 10000 });
  });

  test('should show nutri selector label on new patient page', async ({ page }) => {
    await page.goto('/patients/new');
    await page.waitForLoadState('networkidle');

    // Should see the nutri selector label
    const nutriLabel = page.locator('text=Nutricionista Responsável');
    await expect(nutriLabel).toBeVisible({ timeout: 5000 });

    // Should see a combobox with a nutri selected (or placeholder)
    const nutriSelector = page.locator('button[role="combobox"]').first();
    await expect(nutriSelector).toBeVisible({ timeout: 5000 });

    // Click to open the selector and verify options exist
    await nutriSelector.click();
    const nutriOption = page.locator('[role="option"]').first();
    await expect(nutriOption).toBeVisible({ timeout: 3000 });
  });

  test('should show nutri selector on new appointment page', async ({ page }) => {
    await page.goto('/schedule/new');
    await page.waitForLoadState('networkidle');

    // Should see the nutri selector label
    const nutriLabel = page.locator('label:has-text("Nutricionista")').first();
    await expect(nutriLabel).toBeVisible({ timeout: 5000 });

    // Should see a combobox (nutri selector)
    const nutriSelector = page.locator('button[role="combobox"]').first();
    await expect(nutriSelector).toBeVisible({ timeout: 5000 });
  });

  test('should show availability message for selected nutri', async ({ page }) => {
    await page.goto('/schedule/new');
    await page.waitForLoadState('networkidle');

    // Should see either time slots or a message about availability
    // (depending on whether the nutri has configured availability)
    const availabilityMessage = page.locator('text=/disponibilidade/i');
    const timeSlotButtons = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ });

    // Either time slots or availability message should be visible
    const hasTimeSlots = await timeSlotButtons.count() > 0;
    const hasMessage = await availabilityMessage.isVisible().catch(() => false);

    expect(hasTimeSlots || hasMessage).toBeTruthy();
  });

  test('receptionist can access patients list', async ({ page }) => {
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    // Should see patients page
    const heading = page.getByRole('heading', { name: /pacientes/i });
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Should see new patient button
    const newPatientButton = page.getByRole('link', { name: /novo paciente/i });
    await expect(newPatientButton).toBeVisible();
  });

  test('receptionist can access schedule', async ({ page }) => {
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');

    // Should see schedule page
    const heading = page.getByRole('heading', { name: /agenda/i });
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Should see new appointment button (use first() to handle multiple matches)
    const newAppointmentButton = page.getByRole('link', { name: /agendar consulta/i }).first();
    await expect(newAppointmentButton).toBeVisible();
  });

  test('receptionist sidebar shows correct menu items', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should see receptionist menu items in sidebar (left side of page)
    // Using text content to find menu items
    const menuSection = page.locator('text=Menu').locator('..');

    // Check visible items
    await expect(page.locator('a:has-text("Dashboard")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('a:has-text("Pacientes")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Agenda")').first()).toBeVisible();

    // Should NOT see clinical-only items (Plans, Foods) in the sidebar menu
    // Note: "Criar Plano Alimentar" may appear in quick actions, but not in sidebar
    const sidebarPlansLink = page.locator('a[href="/plans"]');
    const sidebarFoodsLink = page.locator('a[href="/foods"]');

    await expect(sidebarPlansLink).not.toBeVisible();
    await expect(sidebarFoodsLink).not.toBeVisible();
  });
});
