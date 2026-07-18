import { expect, test } from '@playwright/test';

test.describe('execution flow', () => {
  test('starts and completes a task, observable on the goal page and the active-work dashboard', async ({
    page,
  }) => {
    const email = `e2e-execution-${Date.now()}@test.com`;

    await page.goto('/register');
    await page.getByLabel(/name/i).fill('Execution Tester');
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
    await page.getByRole('link', { name: /new goal/i }).click();
    await page.getByLabel(/title/i).fill('Launch marketing site');
    await page.getByRole('button', { name: /create goal/i }).click();

    await page.getByRole('link', { name: 'Launch marketing site' }).click();
    await page.getByPlaceholder(/add a task/i).fill('Write copy');
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByText('Write copy')).toBeVisible();

    await page
      .locator('li', { hasText: 'Write copy' })
      .getByRole('button', { name: /^start$/i })
      .click();
    await expect(page.getByText(/IN_PROGRESS/)).toBeVisible();

    await page.getByRole('link', { name: /active work/i }).click();
    await expect(page.getByText('Write copy')).toBeVisible();
    await expect(page.getByText('Launch marketing site')).toBeVisible();

    await page
      .locator('li', { hasText: 'Write copy' })
      .getByRole('button', { name: /complete/i })
      .click();
    await expect(page.getByText(/nothing is currently active/i)).toBeVisible();

    await page.goto('/dashboard/projects');
    await page.getByRole('link', { name: 'Website Relaunch' }).click();
    await page.getByRole('link', { name: /goals/i }).click();
    await page.getByRole('link', { name: 'Launch marketing site' }).click();
    await expect(page.getByText(/COMPLETED/)).toBeVisible();
    await expect(page.getByText(/100%/)).toBeVisible();
    await expect(page.getByText(/TASK_STARTED/)).toBeVisible();
    await expect(page.getByText(/TASK_COMPLETED/)).toBeVisible();
  });
});
