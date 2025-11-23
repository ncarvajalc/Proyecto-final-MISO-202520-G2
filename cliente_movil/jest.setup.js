jest.mock('expo/src/winter/runtime.native', () => ({}), { virtual: true });

const { expoNativeModulesProxy, exponentConstants, expoModules } = require('./jest.expo-environment');
const { NativeModules } = require('react-native');

NativeModules.NativeUnimoduleProxy = expoNativeModulesProxy;
NativeModules.ExponentConstants = exponentConstants;
NativeModules.EXReactNativeEventEmitter = {
  addProxiedListener: () => {},
  removeProxiedListeners: () => {},
};

global.expo = {
  ...(global.expo || {}),
  modules: {
    ...(global.expo?.modules || {}),
    ...expoModules,
  },
};
