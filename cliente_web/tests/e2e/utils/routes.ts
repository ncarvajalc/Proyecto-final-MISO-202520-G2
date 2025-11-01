import { faker } from "@faker-js/faker";
import {
  expect,
  request,
  type APIRequestContext,
  type Page,
  type Response,
} from "@playwright/test";

import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_GATEWAY_URL,
  loginAsAdmin,
} from "./proveedores";

export { ADMIN_EMAIL, ADMIN_PASSWORD, API_GATEWAY_URL, loginAsAdmin };

export const ITEMS_PER_PAGE = 5;

export interface VehiclePayload {
  placa: string;
  conductor: string;
  numeroEntregas: number;
}

export interface VehicleResponse extends VehiclePayload {
  id: string;
}

const mapBackendVehicle = (raw: unknown): VehicleResponse => {
  const record = raw as Record<string, unknown>;
  const id = record.id;
  const placa = record.placa;
  const conductor = record.conductor;
  const numeroEntregas =
    record.numeroEntregas ?? record.numero_entregas ?? record.numero_entrega ?? 0;

  if (!id || typeof id !== "string") {
    throw new Error("Vehicle response is missing an id");
  }

  if (!placa || typeof placa !== "string") {
    throw new Error("Vehicle response is missing placa");
  }

  if (!conductor || typeof conductor !== "string") {
    throw new Error("Vehicle response is missing conductor");
  }

  return {
    id,
    placa,
    conductor,
    numeroEntregas: Number(numeroEntregas) || 0,
  };
};

const clampLicensePlate = (value: string): string => {
  return value.slice(0, 20);
};

export const buildVehiclePayload = (
  prefix: string,
  overrides: Partial<VehiclePayload> = {}
): VehiclePayload => {
  const randomSuffix = faker.string.alphanumeric({ length: 3, casing: "upper" });
  const placa = clampLicensePlate(`${prefix}-${randomSuffix}`);

  const base: VehiclePayload = {
    placa,
    conductor: faker.person.fullName(),
    numeroEntregas: faker.number.int({ min: 0, max: 50 }),
  };

  const merged = { ...base, ...overrides };
  return { ...merged, placa: clampLicensePlate(merged.placa) };
};

export const createTrackingApi = async (
  token: string
): Promise<APIRequestContext> => {
  return request.newContext({
    baseURL: API_GATEWAY_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const createVehicleViaApi = async (
  api: APIRequestContext,
  payload: VehiclePayload
): Promise<VehicleResponse> => {
  const response = await api.post("/vehiculos", {
    data: {
      placa: payload.placa,
      conductor: payload.conductor,
      numero_entregas: payload.numeroEntregas,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to create vehicle (${response.status()}): ${body}`
    );
  }

  return mapBackendVehicle(await response.json());
};

export interface VehiclesPage {
  data: VehicleResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const fetchVehiclesPage = async (
  api: APIRequestContext,
  params: { page: number; limit: number }
): Promise<VehiclesPage> => {
  const response = await api.get("/vehiculos", { params });
  expect(response.ok()).toBeTruthy();

  const json = (await response.json()) as {
    data: unknown[];
    total: number;
    page: number;
    limit: number;
    total_pages?: number;
    totalPages?: number;
  };

  const totalPages = Number(
    json.total_pages ?? json.totalPages ?? Math.ceil(json.total / json.limit)
  );

  return {
    data: json.data.map(mapBackendVehicle),
    total: json.total,
    page: json.page,
    limit: json.limit,
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
  };
};

export const findVehiclePageViaApi = async (
  api: APIRequestContext,
  vehicleId: string,
  params: { limit: number }
): Promise<{ page: number; index: number | null }> => {
  let currentPage = 1;

  while (true) {
    const pageData = await fetchVehiclesPage(api, {
      page: currentPage,
      limit: params.limit,
    });

    const index = pageData.data.findIndex((vehicle) => vehicle.id === vehicleId);
    if (index >= 0) {
      return { page: currentPage, index };
    }

    if (currentPage >= pageData.totalPages) {
      break;
    }

    currentPage += 1;
  }

  return { page: 1, index: null };
};

export interface RouteStopResponse {
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

export interface RouteResponse {
  id: string;
  vehicleId: string;
  date: string;
  totalDistanceKm: number;
  estimatedTimeH: number;
  priorityLevel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  stops?: RouteStopResponse[];
}

const mapBackendRouteStop = (raw: unknown): RouteStopResponse => {
  const record = raw as Record<string, unknown>;
  const id = record.id;
  const routeId = record.routeId ?? record.route_id;
  const clientId = record.clientId ?? record.client_id;
  const sequence = record.sequence;

  if (!id || typeof id !== "string") {
    throw new Error("Route stop response is missing id");
  }

  if (!routeId || typeof routeId !== "string") {
    throw new Error("Route stop response is missing route id");
  }

  if (!clientId || typeof clientId !== "string") {
    throw new Error("Route stop response is missing client id");
  }

  return {
    id,
    routeId,
    clientId,
    sequence: Number(sequence) || 1,
    estimatedArrival:
      (record.estimatedArrival as string | null | undefined) ??
      (record.estimated_arrival as string | null | undefined) ??
      null,
    delivered: Boolean(record.delivered),
    latitude:
      record.latitude === null || record.latitude === undefined
        ? null
        : Number(record.latitude),
    longitude:
      record.longitude === null || record.longitude === undefined
        ? null
        : Number(record.longitude),
    address:
      (record.address as string | null | undefined) ?? null,
    createdAt:
      (record.createdAt as string | undefined) ??
      (record.created_at as string | undefined) ??
      new Date().toISOString(),
    updatedAt:
      (record.updatedAt as string | undefined) ??
      (record.updated_at as string | undefined) ??
      new Date().toISOString(),
  };
};

const mapBackendRoute = (raw: unknown): RouteResponse => {
  const record = raw as Record<string, unknown>;
  const id = record.id;
  const vehicleId = record.vehicleId ?? record.vehicle_id;

  if (!id || typeof id !== "string") {
    throw new Error("Route response is missing id");
  }

  if (!vehicleId || typeof vehicleId !== "string") {
    throw new Error("Route response is missing vehicle id");
  }

  const stopsRaw = Array.isArray(record.stops) ? record.stops : undefined;

  return {
    id,
    vehicleId,
    date: (record.date as string | undefined) ?? new Date().toISOString(),
    totalDistanceKm: Number(
      record.totalDistanceKm ?? record.total_distance_km ?? 0
    ),
    estimatedTimeH: Number(
      record.estimatedTimeH ?? record.estimated_time_h ?? 0
    ),
    priorityLevel: (record.priorityLevel ?? record.priority_level ?? "normal") as string,
    status: (record.status as string | undefined) ?? "pending",
    createdAt:
      (record.createdAt as string | undefined) ??
      (record.created_at as string | undefined) ??
      new Date().toISOString(),
    updatedAt:
      (record.updatedAt as string | undefined) ??
      (record.updated_at as string | undefined) ??
      new Date().toISOString(),
    stops: stopsRaw?.map(mapBackendRouteStop),
  };
};

export interface RoutePayload {
  vehicleId: string;
  date: string;
  totalDistanceKm: number;
  estimatedTimeH: number;
  priorityLevel: string;
  status: string;
}

export const buildRoutePayload = (
  overrides: Partial<RoutePayload> = {}
): RoutePayload => {
  const today = new Date().toISOString().split("T")[0];
  const base: RoutePayload = {
    vehicleId: faker.string.uuid(),
    date: today,
    totalDistanceKm: 0,
    estimatedTimeH: 0,
    priorityLevel: "normal",
    status: "pending",
  };

  return { ...base, ...overrides };
};

export const createRouteViaApi = async (
  api: APIRequestContext,
  payload: RoutePayload
): Promise<RouteResponse> => {
  const response = await api.post("/rutas", {
    data: {
      vehicle_id: payload.vehicleId,
      date: payload.date,
      total_distance_km: payload.totalDistanceKm,
      estimated_time_h: payload.estimatedTimeH,
      priority_level: payload.priorityLevel,
      status: payload.status,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to create route (${response.status()}): ${body}`);
  }

  return mapBackendRoute(await response.json());
};

export const deleteRouteViaApi = async (
  api: APIRequestContext,
  routeId: string
) => {
  const response = await api.delete(`/rutas/${routeId}`);
  if (!response.ok() && response.status() !== 404) {
    const body = await response.text();
    throw new Error(`Failed to delete route (${response.status()}): ${body}`);
  }
};

export interface RouteStopPayload {
  routeId: string;
  clientId: string;
  sequence: number;
  estimatedArrival?: string | null;
  delivered?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

export const buildRouteStopPayload = (
  routeId: string,
  overrides: Partial<RouteStopPayload> = {}
): RouteStopPayload => {
  const latitude =
    Object.prototype.hasOwnProperty.call(overrides, "latitude")
      ? overrides.latitude ?? null
      : faker.location.latitude({ min: 4.4, max: 4.8 });
  const longitude =
    Object.prototype.hasOwnProperty.call(overrides, "longitude")
      ? overrides.longitude ?? null
      : faker.location.longitude({ min: -74.2, max: -73.9 });

  return {
    routeId,
    clientId: faker.string.uuid(),
    sequence: overrides.sequence ?? 1,
    estimatedArrival: overrides.estimatedArrival ?? null,
    delivered: overrides.delivered ?? false,
    latitude,
    longitude,
    address:
      overrides.address ?? `${faker.location.streetAddress()}, Bogotá`,
  };
};

export const createRouteStopViaApi = async (
  api: APIRequestContext,
  payload: RouteStopPayload
): Promise<RouteStopResponse> => {
  const response = await api.post("/paradas", {
    data: {
      route_id: payload.routeId,
      client_id: payload.clientId,
      sequence: payload.sequence,
      estimated_arrival: payload.estimatedArrival,
      delivered: payload.delivered ?? false,
      latitude: payload.latitude,
      longitude: payload.longitude,
      address: payload.address,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to create route stop (${response.status()}): ${body}`
    );
  }

  return mapBackendRouteStop(await response.json());
};

export const gotoLogistica = async (
  page: Page,
  options: {
    token: string;
    storagePayload: { user: unknown; permissions: string[] };
  }
) => {
  await page.addInitScript(
    ([token, payload]) => {
      localStorage.setItem("auth_token", token as string);
      localStorage.setItem("user_data", JSON.stringify(payload));
    },
    [options.token, options.storagePayload]
  );

  await page.goto("./logistica");
  await page.waitForLoadState("networkidle");
};

export const waitForVehiclesListResponse = (
  page: Page,
  predicate?: (response: Response) => boolean
) => {
  return page.waitForResponse((response) => {
    const isVehiclesUrl = response
      .url()
      .includes(`${API_GATEWAY_URL}/vehiculos`);
    const isGet = response.request().method() === "GET";

    if (!isVehiclesUrl || !isGet) {
      return false;
    }

    if (predicate) {
      return predicate(response);
    }

    return true;
  });
};

export const waitForRoutesListResponse = (
  page: Page,
  predicate?: (response: Response) => boolean
) => {
  return page.waitForResponse((response) => {
    const isRoutesUrl = response
      .url()
      .includes(`${API_GATEWAY_URL}/rutas`);
    const isGet = response.request().method() === "GET";

    if (!isRoutesUrl || !isGet) {
      return false;
    }

    if (predicate) {
      return predicate(response);
    }

    return true;
  });
};

export const waitForOptimizeResponse = (
  page: Page,
  predicate?: (response: Response) => boolean
) => {
  return page.waitForResponse((response) => {
    const isOptimizeUrl =
      response.url().includes(`${API_GATEWAY_URL}/rutas`) &&
      response.url().includes("/optimize");
    const isPost = response.request().method() === "POST";

    if (!isOptimizeUrl || !isPost) {
      return false;
    }

    if (predicate) {
      return predicate(response);
    }

    return true;
  });
};

export const expectVehicleRowVisible = async (page: Page, placa: string) => {
  const row = page.getByRole("row").filter({ hasText: placa });
  await row.waitFor({ state: "visible" });
};

export const waitForToastWithText = async (page: Page, text: string) => {
  await page
    .locator("[data-sonner-toast]")
    .filter({ hasText: text })
    .waitFor({ state: "visible", timeout: 5000 });
};

export const openRouteGenerationModal = async (page: Page, placa: string) => {
  const row = page.getByRole("row").filter({ hasText: placa }).first();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: /ver ruta/i }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  return dialog;
};
