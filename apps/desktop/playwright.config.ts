import { defineConfig } from '@playwright/test';

// Uses Playwright's Electron runner (test._electron), not a browser — see e2e/desktop.spec.ts.
// Needs the app built first (`npm run build -w @pee/desktop`) since it launches out/main/index.js.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
});
