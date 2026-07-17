import { expect, test } from '@playwright/test';

test.describe('planning flow', () => {
  test('creates a goal, adds tasks, and watches it complete as tasks are marked done', async ({ page }) => {
    const email = `e2e-planning-${Date.now()}@test.com`;

    await page.goto('/register');
    await page.getByLabel(/name/i).fill('Planning Tester');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('super-secret-1');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('super-secret-1');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('link', { name: /projects/i }).click();
    await page.getByRole('link', { name: /new project/i }).click();
    await page.getByLabel(/^name$/i).fill('Website Relaunch');
    await page.getByRole('button', { name: /create project/i }).click();
    await page.getByRole('link', { name: 'Website Relaunch' }).click();

    await page.getByRole('link', { name: /goals/i }).click();
    await expect(page.getByText(/no goals yet/i)).toBeVisible();

    await page.getByRole('link', { name: /new goal/i }).click();
    await page.getByLabel(/title/i).fill('Launch marketing site');
    await page.getByRole('button', { name: /create goal/i }).click();
    await expect(page.getByText('Launch marketing site')).toBeVisible();
    await expect(page.getByText(/NOT_STARTED/)).toBeVisible();

    await page.getByRole('link', { name: 'Launch marketing site' }).click();
    await page.getByPlaceholder(/add a task/i).fill('Write copy');
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByText('Write copy')).toBeVisible();

    await page.getByPlaceholder(/add a task/i).fill('Build page');
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByText('Build page')).toBeVisible();

    await page
      .locator('li', { hasText: 'Write copy' })
      .getByRole('button', { name: /mark done/i })
      .click();
    await expect(page.getByText(/IN_PROGRESS/)).toBeVisible();

    await page
      .locator('li', { hasText: 'Build page' })
      .getByRole('button', { name: /mark done/i })
      .click();
    await expect(page.getByText(/COMPLETED/)).toBeVisible();
    await expect(page.getByText(/100%/)).toBeVisible();
  });
});
