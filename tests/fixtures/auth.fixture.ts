import { test as base, expect, Page } from '@playwright/test';
import { testUsers } from './test-data';

/**
 * Extended test fixture that provides authenticated user context
 *
 * This fixture handles authentication gracefully:
 * - Checks if auth is possible before trying
 * - Skips quickly when Supabase is not available
 */

export type AuthFixtures = {
  authenticatedPage: Page;
  loginAsNutritionist: (page: Page) => Promise<void>;
};

// Cache auth check result to avoid repeating slow checks
let authAvailable: boolean | null = null;

async function checkAuthAvailable(page: Page): Promise<boolean> {
  if (authAvailable !== null) return authAvailable;

  try {
    await page.goto('/auth/login', { timeout: 5000 });
    await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 3000 });

    // Try a quick login to see if Supabase responds
    await page.fill('input[name="email"]', testUsers.nutritionist.email);
    await page.fill('input[name="password"]', testUsers.nutritionist.password);
    await page.click('button[type="submit"]');

    // Wait briefly for response
    await page.waitForTimeout(2000);

    // Check if we got redirected or got an error message
    const url = page.url();
    if (url.includes('/dashboard') || url.includes('/patients') || url.includes('/plans')) {
      authAvailable = true;
      return true;
    }

    // Check if there's an error message (means Supabase responded)
    const errorMsg = await page.locator('[data-testid="auth-error"], [class*="error"]').isVisible().catch(() => false);
    if (errorMsg) {
      // Supabase is working but credentials are wrong - auth is available
      authAvailable = true;
      return true;
    }

    // No response likely means Supabase is not running
    authAvailable = false;
    return false;
  } catch {
    authAvailable = false;
    return false;
  }
}

async function waitForAuth(page: Page, timeout = 5000): Promise<boolean> {
  try {
    await page.waitForURL(/\/(dashboard|patients|plans|settings)/, { timeout });
    return true;
  } catch {
    return false;
  }
}

export async function login(page: Page, email: string, password: string): Promise<boolean> {
  await page.goto('/auth/login', { timeout: 5000 });
  await page.waitForLoadState('domcontentloaded');

  await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 3000 });

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  return await waitForAuth(page);
}

async function signup(page: Page, fullName: string, email: string, password: string): Promise<boolean> {
  // Signup is only available via invite mode (mode=signup in URL)
  await page.goto('/auth/login?mode=signup', { timeout: 5000 });
  await page.waitForLoadState('domcontentloaded');

  // Wait for the full name input which is only visible in signup mode
  await page.waitForSelector('input[name="full_name"]', { state: 'visible', timeout: 3000 });

  await page.fill('input[name="full_name"]', fullName);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  return await waitForAuth(page);
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use, testInfo) => {
    // Quick check if auth is available
    const canAuth = await checkAuthAvailable(page);

    if (!canAuth) {
      testInfo.skip(true, 'Authentication not available. Ensure Supabase is running.');
      return;
    }

    // Auth seems available, try login (signup is invite-only, not a fallback)
    let authSuccess = false;

    try {
      authSuccess = await login(page, testUsers.nutritionist.email, testUsers.nutritionist.password);
    } catch {
      // Login failed
    }

    if (!authSuccess) {
      testInfo.skip(true, 'Authentication failed. Ensure test users are seeded via seed-test-data.ts.');
      return;
    }

    await use(page);
  },

  loginAsNutritionist: async ({}, use) => {
    const loginFn = async (page: Page) => {
      const success = await login(page, testUsers.nutritionist.email, testUsers.nutritionist.password);
      if (!success) {
        throw new Error('Login failed');
      }
    };
    await use(loginFn);
  },
});

export { expect };

/**
 * Helper to check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    const url = page.url();
    return url.includes('/dashboard') || url.includes('/patients') || url.includes('/plans');
  } catch {
    return false;
  }
}

/**
 * Helper to logout
 */
export async function logout(page: Page): Promise<void> {
  const logoutButton = page.locator('button:has-text("Sair")');
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    await page.goto('/auth/logout');
  }
  await page.waitForURL(/\/auth\/login|\/$/, { timeout: 5000 });
}

/**
 * Login as any test role.
 * Unlike login(), this waits for any redirect away from /auth/login,
 * supporting noOrg → /organization/create and invited → /invite/[token].
 */
export async function loginAs(
  page: Page,
  role: 'nutri' | 'admin' | 'receptionist' | 'patient' | 'noOrg' | 'invited' | 'superAdmin',
): Promise<boolean> {
  const userMap: Record<string, { email: string; password: string }> = {
    nutri: testUsers.nutritionist,
    admin: testUsers.admin,
    receptionist: testUsers.receptionist,
    patient: testUsers.patient,
    noOrg: testUsers.noOrg,
    invited: testUsers.invitedUser,
    superAdmin: testUsers.superAdmin,
  };
  const user = userMap[role];
  if (!user) throw new Error(`Unknown role: ${role}`);

  await page.goto('/auth/login', { timeout: 5000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 3000 });
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL(url => !url.toString().includes('/auth/login'), { timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}
