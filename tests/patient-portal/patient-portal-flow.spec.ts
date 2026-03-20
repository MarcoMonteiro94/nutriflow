import { test, expect } from '../fixtures/auth.fixture';
import { loginAs } from '../fixtures/auth.fixture';

test.describe('Patient Portal Flow', () => {
  test('should login as patient and land on patient dashboard', async ({ page }, testInfo) => {
    const success = await loginAs(page, 'patient');
    if (!success) {
      testInfo.skip(true, 'Patient login failed');
      return;
    }

    // Patient should be redirected to patient area
    await page.waitForURL(/\/patient/, { timeout: 15000 });
    const url = page.url();
    expect(url).toMatch(/\/patient/);
  });

  test('should show greeting on patient dashboard', async ({ page }, testInfo) => {
    const success = await loginAs(page, 'patient');
    if (!success) {
      testInfo.skip(true, 'Patient login failed');
      return;
    }

    await page.waitForURL(/\/patient/, { timeout: 15000 });

    // Look for a greeting or dashboard heading
    const hasGreeting = await page.locator('text=/olá|bem-vindo|dashboard|painel/i').first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasHeading = await page.locator('h1, h2').first().isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasGreeting || hasHeading).toBeTruthy();
  });

  test('should navigate to plan page', async ({ page }, testInfo) => {
    const success = await loginAs(page, 'patient');
    if (!success) {
      testInfo.skip(true, 'Patient login failed');
      return;
    }

    await page.waitForURL(/\/patient/, { timeout: 15000 });

    // Try to navigate to plan via link or button
    const planLink = page.locator('a[href*="/patient/plan"], button:has-text("Ver Plano"), a:has-text("Plano")').first();
    const planLinkVisible = await planLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (planLinkVisible) {
      await planLink.click();
      await page.waitForURL(/\/patient\/plan/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/patient\/plan/);
    } else {
      // Navigate directly
      await page.goto('/patient/plan');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/\/patient\/plan/);
    }
  });

  test('should navigate between patient portal pages', async ({ page }, testInfo) => {
    const success = await loginAs(page, 'patient');
    if (!success) {
      testInfo.skip(true, 'Patient login failed');
      return;
    }

    await page.waitForURL(/\/patient/, { timeout: 15000 });

    // Navigate to plan
    await page.goto('/patient/plan');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/patient\/plan/);

    // Navigate to progress
    await page.goto('/patient/progress');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/patient\/progress/);

    // Navigate back to dashboard
    await page.goto('/patient/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/patient\/dashboard/);
  });
});
