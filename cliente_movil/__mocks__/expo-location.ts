export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export const requestForegroundPermissionsAsync = jest.fn(async () => ({
  status: "granted" as const,
}));

export const getCurrentPositionAsync = jest.fn(async () => ({
  coords: {
    latitude: 4.6097,
    longitude: -74.0817,
    altitude: null,
    accuracy: 20,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
}));

// Default export for namespace import (import * as Location)
export default {
  Accuracy,
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
};
