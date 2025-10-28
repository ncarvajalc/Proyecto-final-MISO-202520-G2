const appConfig = require('./app.json');

const exponentConstants = {
  appOwnership: 'standalone',
  deviceName: 'Jest Device',
  deviceYearClass: 2024,
  expoRuntimeVersion: appConfig.expo.version,
  expoVersion: appConfig.expo.version,
  installationId: '00000000-0000-0000-0000-000000000000',
  linkingUri: 'exp://127.0.0.1:19000/--/',
  manifest: appConfig.expo,
  platform: {
    android: {
      model: 'Pixel 8',
      systemVersion: '14',
      versionCode: '1',
    },
    ios: {
      model: 'iPhone 15',
      systemVersion: '17.0',
      userInterfaceIdiom: 'phone',
    },
    web: {
      userAgent: 'jest',
    },
  },
  sessionId: '00000000-0000-0000-0000-000000000000',
  statusBarHeight: 20,
  systemFonts: [],
};

const expoModulesCoreLogger = {
  addListener: () => ({ remove: () => {} }),
  removeListeners: () => {},
  log: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

const expoNativeModulesProxy = {
  viewManagersMetadata: {},
  modulesConstants: {
    ExponentConstants: exponentConstants,
  },
  exportedMethods: {
    ExponentConstants: [],
  },
  callMethod: () => Promise.resolve(null),
};

const expoModules = {
  NativeModulesProxy: expoNativeModulesProxy,
  ExponentConstants: exponentConstants,
  ExpoModulesCoreJSLogger: expoModulesCoreLogger,
};

module.exports = {
  exponentConstants,
  expoNativeModulesProxy,
  expoModules,
};
