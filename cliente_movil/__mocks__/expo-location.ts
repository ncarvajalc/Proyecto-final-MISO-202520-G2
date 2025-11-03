export const requestForegroundPermissionsAsync = jest.fn(async () => ({
  status: 'granted',
  granted: true,
  canAskAgain: true,
  expires: 'never',
}));

export const getCurrentPositionAsync = jest.fn(async () => ({
  coords: {
    latitude: 4.60971,
    longitude: -74.08175,
    altitude: 2640,
    accuracy: 5,
    altitudeAccuracy: 5,
    heading: 0,
    speed: 0,
  },
  timestamp: Date.now(),
}));

export const watchPositionAsync = jest.fn((options, callback) => {
  return {
    remove: jest.fn(),
  };
});

export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export default {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  watchPositionAsync,
  Accuracy,
};
