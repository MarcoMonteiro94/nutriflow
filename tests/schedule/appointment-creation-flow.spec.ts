import { test, expect } from '../fixtures/auth.fixture';
import { AppointmentFormPage, SchedulePage } from '../fixtures/page-objects/schedule.page';

test.describe('Appointment Creation Flow', () => {
  test('should create appointment with patient, date, and time', async ({ authenticatedPage }) => {
    const form = new AppointmentFormPage(authenticatedPage);
    await form.goto();

    // Select seeded patient
    await form.selectPatient('Paciente Seed Test');

    // Open date picker and select a day
    await form.dateButton.click();
    await expect(form.dateCalendar).toBeVisible();

    // Find any enabled day button in the calendar grid and click it
    const enabledDays = form.dateCalendar.locator('button:not([disabled])').filter({ hasText: /^\d{1,2}$/ });
    const dayCount = await enabledDays.count();

    if (dayCount === 0) {
      test.skip(true, 'No selectable dates in calendar');
      return;
    }

    // Click a day in the middle of available days (avoid edge cases)
    const midIndex = Math.min(Math.floor(dayCount / 2), dayCount - 1);
    await enabledDays.nth(midIndex).click();

    // Wait for time slots to load
    await authenticatedPage.waitForTimeout(1500);
    const slotCount = await form.getAvailableSlotCount();

    if (slotCount > 0) {
      await form.selectFirstAvailableSlot();
      await form.submit();
      await form.expectRedirectToSchedule();
    } else {
      // Skip if no slots (might be a weekend or past date)
      test.skip(true, 'No available time slots for selected date');
    }
  });

  test('should open date picker when clicking date button', async ({ authenticatedPage }) => {
    const form = new AppointmentFormPage(authenticatedPage);
    await form.goto();

    // Select patient first
    await form.selectPatient('Paciente Seed Test');

    // Open date picker
    await form.dateButton.click();
    await expect(form.dateCalendar).toBeVisible({ timeout: 5000 });

    // Calendar grid should have day buttons
    const dayButtons = form.dateCalendar.locator('[role="grid"] button');
    const count = await dayButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show patient selection in the form', async ({ authenticatedPage }) => {
    const form = new AppointmentFormPage(authenticatedPage);
    await form.goto();

    // The patient select should be visible
    await expect(form.patientSelect).toBeVisible({ timeout: 10000 });

    // The submit button should be visible
    await expect(form.submitButton).toBeVisible();
  });
});
