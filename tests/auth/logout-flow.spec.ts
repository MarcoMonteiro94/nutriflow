import { test, expect } from '../fixtures/auth.fixture';
import { logout } from '../fixtures/auth.fixture';

test.describe('Logout Flow', () => {
  test('should logout via sidebar button and redirect to login', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Verify we're on an authenticated page
    await expect(page).toHaveURL(/\/(dashboard|patients|plans)/);

    // Logout
    await logout(page);

    // Should redirect to login page
    await expect(page).toHaveURL(/\/auth\/login|\/$/, { timeout: 10000 });
  });

  test('should not access /dashboard after logout', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Logout
    await logout(page);
    await expect(page).toHaveURL(/\/auth\/login|\/$/, { timeout: 10000 });

    // Try accessing dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('should not access /patients after logout', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await logout(page);
    await expect(page).toHaveURL(/\/auth\/login|\/$/, { timeout: 10000 });

    // Try accessing patients
    await page.goto('/patients');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});
