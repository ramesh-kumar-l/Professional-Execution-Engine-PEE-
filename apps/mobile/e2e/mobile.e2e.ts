import { by, device, element, expect as detoxExpect } from 'detox';

/**
 * Requires a built Android debug APK running on a real emulator (see ../.detoxrc.js) — cannot
 * run in this authoring sandbox (no Android SDK/emulator available). Written and CI-wired for
 * whenever a real device/CI runner is available; see project-memory-bank/20-known-issues.md.
 * The apps/desktop equivalent (Playwright + Electron) could run headlessly in this sandbox —
 * Detox has no such fallback, so this is documented as unrun rather than claimed as verified.
 */
describe('Mobile app launch', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('shows the sign-in screen on first launch', async () => {
    await detoxExpect(element(by.id('login-submit'))).toBeVisible();
  });
});
