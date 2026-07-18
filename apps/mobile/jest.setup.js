// jest-expo auto-mocks native modules it doesn't know how to run under Node, which turns
// expo-crypto's randomUUID() into a function returning undefined — every MobileStore create*
// call would then try to bind an undefined id to SQLite. Mocking it to Node's own crypto keeps
// the rest of the native-module auto-mocking behavior untouched.
jest.mock('expo-crypto', () => ({
  randomUUID: () => require('node:crypto').randomUUID(),
}));

// React 19's act() auto-detection needs this flag set explicitly under jest-expo's test
// environment, or state updates inside fireEvent handlers aren't flushed before assertions run.
global.IS_REACT_ACT_ENVIRONMENT = true;
