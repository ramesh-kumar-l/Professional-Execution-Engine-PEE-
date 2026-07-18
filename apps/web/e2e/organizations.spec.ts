import { expect, test } from '@playwright/test';

test.describe('organizations flow (Phase 10)', () => {
  test('creates an organization, sees it listed as OWNER, and invites a second existing user', async ({ page }) => {
    const ownerEmail = `e2e-org-owner-${Date.now()}@test.com`;
    const memberEmail = `e2e-org-member-${Date.now()}@test.com`;

    // A second account must already exist — invite-by-email only links existing PEE users (no email-token flow yet).
    await page.goto('/register');
    await page.getByLabel(/name/i).fill('Org Member');
    await page.getByLabel(/email/i).fill(memberEmail);
    await page.getByLabel(/password/i).fill('super-secret-1');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/register');
    await page.getByLabel(/name/i).fill('Org Owner');
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill('super-secret-1');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill('super-secret-1');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('link', { name: /organizations/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/organizations$/);

    await page.getByLabel(/organization name/i).fill('Acme Inc');
    await page.getByRole('button', { name: /create organization/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/organizations$/);
    await expect(page.getByText('Acme Inc')).toBeVisible();
    await expect(page.getByText(/owner/i)).toBeVisible();

    await page.getByRole('link', { name: 'Acme Inc' }).click();
    await expect(page).toHaveURL(/\/dashboard\/organizations\/.+\/members$/);
    await expect(page.getByText(/org owner/i)).toBeVisible();

    await page.getByLabel(/email of an existing pee user/i).fill(memberEmail);
    await page.getByRole('button', { name: /^invite$/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/organizations\/.+\/members$/);
    await expect(page.getByText(/org member/i)).toBeVisible();
  });
});
