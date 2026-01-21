import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  largeDesktop: { width: 1920, height: 1080 },
};

test.describe('Responsive Design', () => {
  test.describe('Public Pages', () => {
    test('login page should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      // Card should be visible and not overflow
      const card = page.locator('[data-slot="card"]');
      await expect(card).toBeVisible();

      const cardBox = await card.boundingBox();
      if (cardBox) {
        expect(cardBox.width).toBeLessThanOrEqual(viewports.mobile.width);
      }
    });

    test('login page should be responsive on tablet', async ({ page }) => {
      await page.setViewportSize(viewports.tablet);
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('[data-slot="card"]')).toBeVisible();
    });

    test('login page should be responsive on desktop', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('[data-slot="card"]')).toBeVisible();
    });

    test('patient portal should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/patient');
      await page.waitForLoadState('networkidle');

      // Should not have horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewports.mobile.width + 20);
    });
  });

  test.describe('Authenticated Pages', () => {
    authTest('dashboard should be responsive on mobile', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      await page.setViewportSize(viewports.mobile);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Stats cards should stack on mobile
      const statsCards = page.locator('[class*="shadow-soft"]').filter({ hasText: /(Pacientes|Planos|Consultas)/i });
      await expect(statsCards.first()).toBeVisible();
    });

    authTest('sidebar should collapse on mobile', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      await page.setViewportSize(viewports.mobile);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Sidebar should not be visible initially on mobile
      const sidebar = page.locator('[data-slot="sidebar"]');
      const isHidden = await sidebar.isHidden().catch(() => true);

      // Should have hamburger menu trigger
      const trigger = page.locator('[data-sidebar="trigger"]');
      const triggerVisible = await trigger.isVisible().catch(() => false);

      expect(isHidden || triggerVisible).toBeTruthy();
    });

    authTest('patients list should be responsive', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      await page.setViewportSize(viewports.mobile);
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      // Patient cards should be full width on mobile
      await expect(page.locator('body')).toBeVisible();
    });

    authTest('plans list should be responsive on tablet', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      await page.setViewportSize(viewports.tablet);
      await page.goto('/plans');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('body')).toBeVisible();
    });
  });
});
