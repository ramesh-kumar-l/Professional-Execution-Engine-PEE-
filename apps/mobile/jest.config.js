// transformIgnorePatterns is intentionally left to jest-expo's own preset default (which already
// covers expo-*/react-native-*/@react-navigation packages) rather than overridden here — jest
// config merging replaces the preset's array entirely if this key is set directly, which is what
// broke transforms for expo-modules-core the first time this was written.
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
};
