/**
 * Detox needs a real Android emulator or iOS Simulator, neither of which is available in this
 * authoring sandbox (no Android SDK / no macOS+Xcode) — unlike apps/desktop's Playwright/Electron
 * e2e, there is no headless-launch equivalent here. This config and e2e/mobile.e2e.ts are written
 * for a real device/CI runner; see 20-known-issues.md for the unrun status.
 */
module.exports = {
  testRunner: {
    args: { $0: 'jest', config: 'e2e/jest.config.js' },
    jest: { setupTimeout: 120000 },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_6_API_34' },
    },
  },
  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
