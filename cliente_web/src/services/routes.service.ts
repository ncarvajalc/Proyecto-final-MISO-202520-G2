/**
 * Routes Service
 *
 * Handles all API calls related to route management and optimization.
 * All requests go through the API Gateway.
 */

import { getApiBaseUrl } from "@/config/api";
const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

type FetchOptions = RequestInit & {
  parseErrorDetail?: boolean;
};

const buildRequestUrl = (
  path: string,
  params?: Record<string, string | number | undefined>
): string => {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

const fetchJson = async <T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> => {
  const { parseErrorDetail = false, headers, ...requestInit } = options;

  const response = await fetch(url, {
    headers: {
      ...JSON_HEADERS,
      ...(headers || {}),
    },
    ...requestInit,
  });

  if (!response.ok) {
    if (parseErrorDetail) {
      const errorData = (await response.json().catch(() => undefined)) as
        | { detail?: string }
        | undefined;

      if (errorData?.detail) {
        throw new Error(errorData.detail);
      }
    }

    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

/**
 * Route Stop type
 */
export interface RouteStop {
  id: string;
  routeId: string;
  clientId: string;
  sequence: number;
  estimatedArrival: string | null;
  delivered: boolean;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Route type
 */
export interface Route {
  id: string;
  vehicleId: string;
  date: string;
  totalDistanceKm: number;
  estimatedTimeH: number;
  priorityLevel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  stops?: RouteStop[];
}

/**
 * Get routes for a specific vehicle
 *
 * @param vehicleId - The vehicle ID
 * @returns List of routes for the vehicle
 *
 * Backend Contract:
 * GET /rutas?vehicle_id={vehicleId}
 */
export const getRoutesByVehicle = async (
  vehicleId: string
): Promise<Route[]> => {
  const url = buildRequestUrl("/rutas", {
    vehicle_id: vehicleId,
    limit: 100,
  });

  const response = await fetchJson<{ data?: Route[] } | Route[]>(url);

  if (Array.isArray(response)) {
    return response;
  }

  return response?.data ?? [];
};

/**
 * Get a specific route with all its stops
 *
 * @param routeId - The route ID
 * @returns Route with stops
 *
 * Backend Contract:
 * GET /rutas/{routeId}
 */
export const getRoute = async (routeId: string): Promise<Route> => {
  const url = buildRequestUrl(`/rutas/${routeId}`);
  return fetchJson<Route>(url);
};

/**
 * Optimize a route using the nearest-neighbor algorithm
 *
 * @param routeId - The route ID to optimize
 * @param startLat - Starting latitude (optional, default 0.0)
 * @param startLon - Starting longitude (optional, default 0.0)
 * @param avgSpeedKmh - Average speed in km/h (optional, default 40.0)
 * @returns Optimized route with updated stops
 *
 * Backend Contract:
 * POST /rutas/{routeId}/optimize?start_lat={lat}&start_lon={lon}&avg_speed_kmh={speed}
 */
export const optimizeRoute = async (
  routeId: string,
  startLat: number = 4.6097,
  startLon: number = -74.0817,
  avgSpeedKmh: number = 40.0
): Promise<Route> => {
  const url = buildRequestUrl(`/rutas/${routeId}/optimize`, {
    start_lat: startLat,
    start_lon: startLon,
    avg_speed_kmh: avgSpeedKmh,
  });

  return fetchJson<Route>(url, { method: "POST", parseErrorDetail: true });
};
