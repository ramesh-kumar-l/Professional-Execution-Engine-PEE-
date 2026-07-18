import path from 'path';
import { _electron as electron, expect, test } from '@playwright/test';

// Requires a built app (`npm run build -w @pee/desktop`) — launches out/main/index.js directly.
// Login + sync needs a live services/api + Postgres, so this only exercises what's testable
// without that here: the app launching and the login screen rendering — the same posture as
// every other phase's Docker-dependent e2e spec, written and CI-wired but not run in this sandbox.
test.describe('desktop app launch', () => {
  test('launches and shows the sign-in screen', async () => {
    const electronApp = await electron.launch({ args: [path.join(__dirname, '..', 'out', 'main', 'index.js')] });
    const window = await electronApp.firstWindow();

    await expect(window.getByRole('heading', { name: /sign in/i })).toBeVisible();

    await electronApp.close();
  });
});
