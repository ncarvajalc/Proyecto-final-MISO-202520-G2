import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

import {
  getRoutesByVehicle,
  getRoute,
  optimizeRoute,
} from "@/services/routes.service";

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("routes.service - unit", () => {
  let apiUrl: string;

  faker.seed(901);

  beforeEach(() => {
    fetchMock.mockReset();
    vi.unstubAllEnvs();
    apiUrl = faker.internet.url();
    vi.stubEnv("VITE_API_URL", apiUrl);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getRoutesByVehicle", () => {
    it("fetches routes for a specific vehicle", async () => {
      const vehicleId = faker.string.uuid();
      const routeId = faker.string.uuid();
      const mockRoutes = [
        {
          id: routeId,
          vehicleId,
          date: faker.date.future().toISOString().split("T")[0],
          totalDistanceKm: faker.number.float({ min: 0, max: 100 }),
          estimatedTimeH: faker.number.float({ min: 0, max: 5 }),
          priorityLevel: "normal",
          status: "pending",
          createdAt: faker.date.past().toISOString(),
          updatedAt: faker.date.past().toISOString(),
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockRoutes }),
      });

      const result = await getRoutesByVehicle(vehicleId);

      expect(fetchMock).toHaveBeenCalledWith(
        `${apiUrl}/rutas?vehicle_id=${vehicleId}&limit=100`,
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
      expect(result).toEqual(mockRoutes);
    });

    it("returns empty array when no routes found", async () => {
      const vehicleId = faker.string.uuid();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await getRoutesByVehicle(vehicleId);

      expect(result).toEqual([]);
    });

    it("throws error when request fails", async () => {
      const vehicleId = faker.string.uuid();

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getRoutesByVehicle(vehicleId)).rejects.toThrow(
        "HTTP error! status: 500"
      );
    });
  });

  describe("getRoute", () => {
    it("fetches a specific route with stops", async () => {
      const routeId = faker.string.uuid();
      const mockRoute = {
        id: routeId,
        vehicleId: faker.string.uuid(),
        date: faker.date.future().toISOString().split("T")[0],
        totalDistanceKm: 25.5,
        estimatedTimeH: 1.5,
        priorityLevel: "high",
        status: "pending",
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.past().toISOString(),
        stops: [
          {
            id: faker.string.uuid(),
            routeId,
            clientId: faker.string.uuid(),
            sequence: 1,
            estimatedArrival: null,
            delivered: false,
            latitude: 4.6097,
            longitude: -74.0817,
            address: "Calle 127 #15-20, Bogotá",
            createdAt: faker.date.past().toISOString(),
            updatedAt: faker.date.past().toISOString(),
          },
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoute,
      });

      const result = await getRoute(routeId);

      expect(fetchMock).toHaveBeenCalledWith(`${apiUrl}/rutas/${routeId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(result).toEqual(mockRoute);
      expect(result.stops).toHaveLength(1);
    });

    it("throws error when route not found", async () => {
      const routeId = faker.string.uuid();

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(getRoute(routeId)).rejects.toThrow("HTTP error! status: 404");
    });
  });

  describe("optimizeRoute", () => {
    it("optimizes a route with default parameters", async () => {
      const routeId = faker.string.uuid();
      const optimizedRoute = {
        id: routeId,
        vehicleId: faker.string.uuid(),
        date: faker.date.future().toISOString().split("T")[0],
        totalDistanceKm: 18.45,
        estimatedTimeH: 0.46,
        priorityLevel: "high",
        status: "pending",
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.past().toISOString(),
        stops: [
          {
            id: faker.string.uuid(),
            routeId,
            clientId: faker.string.uuid(),
            sequence: 1,
            estimatedArrival: null,
            delivered: false,
            latitude: 4.6097,
            longitude: -74.0817,
            address: "Calle 127 #15-20, Bogotá",
            createdAt: faker.date.past().toISOString(),
            updatedAt: faker.date.past().toISOString(),
          },
          {
            id: faker.string.uuid(),
            routeId,
            clientId: faker.string.uuid(),
            sequence: 2,
            estimatedArrival: null,
            delivered: false,
            latitude: 4.6534,
            longitude: -74.0548,
            address: "Autopista Norte #145-30, Bogotá",
            createdAt: faker.date.past().toISOString(),
            updatedAt: faker.date.past().toISOString(),
          },
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => optimizedRoute,
      });

      const result = await optimizeRoute(routeId);

      expect(fetchMock).toHaveBeenCalledWith(
        `${apiUrl}/rutas/${routeId}/optimize?start_lat=4.6097&start_lon=-74.0817&avg_speed_kmh=40`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(optimizedRoute);
      expect(result.totalDistanceKm).toBe(18.45);
      expect(result.stops).toHaveLength(2);
    });

    it("optimizes a route with custom parameters", async () => {
      const routeId = faker.string.uuid();
      const startLat = 4.71;
      const startLon = -74.07;
      const avgSpeed = 50;

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: routeId,
          totalDistanceKm: 15.2,
          estimatedTimeH: 0.3,
          stops: [],
        }),
      });

      await optimizeRoute(routeId, startLat, startLon, avgSpeed);

      expect(fetchMock).toHaveBeenCalledWith(
        `${apiUrl}/rutas/${routeId}/optimize?start_lat=${startLat}&start_lon=${startLon}&avg_speed_kmh=${avgSpeed}`,
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("throws error with detail message when optimization fails", async () => {
      const routeId = faker.string.uuid();
      const errorDetail = "Route has no stops to optimize";

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: errorDetail }),
      });

      await expect(optimizeRoute(routeId)).rejects.toThrow(errorDetail);
    });

    it("throws generic error when optimization fails without detail", async () => {
      const routeId = faker.string.uuid();

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(optimizeRoute(routeId)).rejects.toThrow(
        "HTTP error! status: 500"
      );
    });
  });
});
