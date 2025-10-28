const { expoNativeModulesProxy, exponentConstants } = require('./jest.expo-environment');

module.exports = {
  __esModule: true,
  default: {
    NativeUnimoduleProxy: expoNativeModulesProxy,
    ExponentConstants: exponentConstants,
    EXReactNativeEventEmitter: {
      addProxiedListener: () => {},
      removeProxiedListeners: () => {},
    },
    UIManager: {},
  },
};
