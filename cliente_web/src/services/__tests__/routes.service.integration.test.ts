import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { faker } from "@faker-js/faker";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

import {
  getRoutesByVehicle,
  getRoute,
  optimizeRoute,
} from "@/services/routes.service";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});

describe("routes.service - Integration", () => {
  faker.seed(902);

  describe("getRoutesByVehicle", () => {
    it("fetches and returns routes for a vehicle from the API", async () => {
      const apiUrl = "http://localhost:4021";
      vi.stubEnv("VITE_API_URL", apiUrl);

      const vehicleId = faker.string.uuid();
      const mockRoutes = [
        {
          id: faker.string.uuid(),
          vehicleId,
          date: "2025-10-23",
          totalDistanceKm: 25.5,
          estimatedTimeH: 1.5,
          priorityLevel: "high",
          status: "pending",
          createdAt: faker.date.past().toISOString(),
          updatedAt: faker.date.past().toISOString(),
        },
        {
          id: faker.string.uuid(),
          vehicleId,
          date: "2025-10-24",
          totalDistanceKm: 15.2,
          estimatedTimeH: 0.8,
          priorityLevel: "normal",
          status: "completed",
          createdAt: faker.date.past().toISOString(),
          updatedAt: faker.date.past().toISOString(),
        },
      ];

      server.use(
        http.get(`${apiUrl}/rutas`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("vehicle_id")).toBe(vehicleId);
          expect(url.searchParams.get("limit")).toBe("100");
          return HttpResponse.json({ data: mockRoutes });
        })
      );

      const result = await getRoutesByVehicle(vehicleId);

      expect(result).toEqual(mockRoutes);
      expect(result).toHaveLength(2);
      expect(result[0].vehicleId).toBe(vehicleId);
    });

    it("handles empty routes response", async () => {
      const apiUrl = "http://localhost:4021";
      vi.stubEnv("VITE_API_URL", apiUrl);

      const vehicleId = faker.string.uuid();

      server.use(
        http.get(`${apiUrl}/rutas`, () => {
          return HttpResponse.json({ data: [] });
        })
      );

      const result = await getRoutesByVehicle(vehicleId);

      expect(result).toEqual([]);
    });

    it("propagates API errors correctly", async () => {
      const apiUrl = "http://localhost:4021";
      vi.stubEnv("VITE_API_URL", apiUrl);

      const vehicleId = faker.string.uuid();

      server.use(
        http.get(`${apiUrl}/rutas`, () => {
          return HttpResponse.json(
            { detail: "Internal server error" },
            { status: 500 }
          );
        })
      );

      await expect(getRoutesByVehicle(vehicleId)).rejects.toThrow(
        "HTTP error! status: 500"
      );
    });
  });

  describe("getRoute", () => {
    it("fetches a specific route with all stops", async () => {
      const apiUrl = "http://localhost:4021";
      vi.stubEnv("VITE_API_URL", apiUrl);

      const routeId = faker.string.uuid();
      const mockRoute = {
        id: routeId,
        vehicleId: faker.string.uuid(),
        date: "2025-10-23",
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

      server.use(
        http.get(`${apiUrl}/rutas/${routeId}`, () => {
          return HttpResponse.json(mockRoute);
        })
      );

      const result = await getRoute(routeId);

      expect(result).toEqual(mockRoute);
      expect(result.stops).toHaveLength(2);
      expect(result.stops![0].sequence).toBe(1);
      expect(result.stops![1].sequence).toBe(2);
    });

    it("handles 404 when route not found", async () => {
      const apiUrl = "http://localhost:4021";
      vi.stubEnv("VITE_API_URL", apiUrl);

      const routeId = faker.string.uuid();

      server.use(
        http.get(`${apiUrl}/rutas/${routeId}`, () => {
          return HttpResponse.json(
            { detail: "Route not found" },
            { status: 404 }
          );
        })
      );

      await expect(getRoute(routeId)).rejects.toThrow(
        "HTTP error! status: 404"
      );
    });
  });

  describe("optimizeRoute", () => {
    it("sends optimization request with correct parameters", async () => {
      const apiUrl = "http://localhost:4021";
      vi.stubEnv("VITE_API_URL", apiUrl);

      const routeId = faker.string.uuid();
      const startLat = 4.6097;
      const startLon = -74.0817;
      const avgSpeed = 40;

      const optimizedRoute = {
        id: routeId,
        vehicleId: faker.string.uuid(),
        date: "2025-10-23",
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
        ],
      };

      server.use(
        http.post(`${apiUrl}/rutas/${routeId}/optimize`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("start_lat")).toBe(String(startLat));
          expect(url.searchParams.get("start_lon")).toBe(String(startLon));
          expect(url.searchParams.get("avg_speed_kmh")).toBe(String(avgSpeed));
          return HttpResponse.json(optimizedRoute);
        })
      );

      const result = await optimizeRoute(routeId, startLat, startLon, avgSpeed);

      expect(result).toEqual(optimizedRoute);
      expect(result.totalDistanceKm).toBe(18.45);
      expect(result.estimatedTimeH).toBe(0.46);
    });

    it("handles optimization errors with detail message", async () => {
      const apiUrl = "http://localhost:4021";
      vi.stubEnv("VITE_API_URL", apiUrl);

      const routeId = faker.string.uuid();
      const errorDetail = "Route has no stops to optimize";

      server.use(
        http.post(`${apiUrl}/rutas/${routeId}/optimize`, () => {
          return HttpResponse.json({ detail: errorDetail }, { status: 400 });
        })
      );

      await expect(optimizeRoute(routeId)).rejects.toThrow(errorDetail);
    });

    it("recalculates metrics after optimization", async () => {
      const apiUrl = "http://localhost:4021";
      vi.stubEnv("VITE_API_URL", apiUrl);

      const routeId = faker.string.uuid();

      const beforeOptimization = {
        id: routeId,
        totalDistanceKm: 0,
        estimatedTimeH: 0,
        stops: [],
      };

      const afterOptimization = {
        id: routeId,
        vehicleId: faker.string.uuid(),
        date: "2025-10-23",
        totalDistanceKm: 25.8,
        estimatedTimeH: 0.65,
        priorityLevel: "normal",
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
            address: "Stop 1",
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
            address: "Stop 2",
            createdAt: faker.date.past().toISOString(),
            updatedAt: faker.date.past().toISOString(),
          },
        ],
      };

      server.use(
        http.post(`${apiUrl}/rutas/${routeId}/optimize`, () => {
          return HttpResponse.json(afterOptimization);
        })
      );

      const result = await optimizeRoute(routeId);

      expect(result.totalDistanceKm).toBeGreaterThan(
        beforeOptimization.totalDistanceKm
      );
      expect(result.estimatedTimeH).toBeGreaterThan(
        beforeOptimization.estimatedTimeH
      );
      expect(result.stops).toHaveLength(2);
    });
  });
});
