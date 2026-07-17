import { expect, test } from '@playwright/test';

test.describe('login flow', () => {
  test('registers, logs in, reaches the dashboard, and logs out', async ({ page }) => {
    const email = `e2e-${Date.now()}@test.com`;

    await page.goto('/register');
    await page.getByLabel(/name/i).fill('E2E Tester');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('super-secret-1');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('super-secret-1');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('E2E Tester')).toBeVisible();

    await page.getByRole('button', { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated visitors away from the dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
