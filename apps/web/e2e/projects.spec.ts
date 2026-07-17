import { expect, test } from '@playwright/test';

test.describe('projects flow', () => {
  test('creates, lists, edits, and archives a project', async ({ page }) => {
    const email = `e2e-projects-${Date.now()}@test.com`;

    await page.goto('/register');
    await page.getByLabel(/name/i).fill('Projects Tester');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('super-secret-1');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('super-secret-1');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('link', { name: /projects/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/projects/);
    await expect(page.getByText(/no projects yet/i)).toBeVisible();

    await page.getByRole('link', { name: /new project/i }).click();
    await page.getByLabel(/^name$/i).fill('Website Relaunch');
    await page.getByLabel(/description/i).fill('Rebuild the marketing site');
    await page.getByRole('button', { name: /create project/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/projects$/);
    await expect(page.getByText('Website Relaunch')).toBeVisible();

    await page.getByRole('link', { name: 'Website Relaunch' }).click();
    await page.getByLabel(/^name$/i).fill('Website Relaunch v2');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/projects$/);
    await expect(page.getByText('Website Relaunch v2')).toBeVisible();

    await page.getByRole('button', { name: /archive/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/projects$/);
    await expect(page.getByText(/no projects yet/i)).toBeVisible();
  });
});
