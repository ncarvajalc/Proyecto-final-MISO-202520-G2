const path = require('path');

const createProject = (displayName, pattern) => ({
  displayName,
  preset: 'jest-expo',
  testMatch: [pattern],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|react-clone-referenced-element|react-navigation|@react-navigation/.*))'
  ],
  moduleNameMapper: {
    '^react-native/Libraries/BatchedBridge/NativeModules$': path.resolve(__dirname, 'jest.native-modules.mock.js'),
  },
});

module.exports = {
  projects: [
    createProject('unit', '<rootDir>/__tests__/**/*.unit.test.ts?(x)'),
    createProject('integration', '<rootDir>/__tests__/**/*.integration.test.ts?(x)'),
    createProject('functional', '<rootDir>/__tests__/**/*.functional.test.ts?(x)')
  ],
};
