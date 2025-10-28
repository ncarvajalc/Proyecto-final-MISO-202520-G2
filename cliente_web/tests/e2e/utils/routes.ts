import type { Page, Response } from "@playwright/test";
import { faker } from "@faker-js/faker";

export const ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ?? "admin@example.com";
export const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? "admin123";
export const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL ?? "http://localhost:8080";

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

export interface VehicleResponse {
  id: string;
  placa: string;
  conductor: string;
  numeroEntregas: number;
}

export const buildRouteStopResponse = (
  overrides: Partial<RouteStopResponse> = {}
): RouteStopResponse => ({
  id: faker.string.uuid(),
  routeId: faker.string.uuid(),
  clientId: faker.string.uuid(),
  sequence: faker.number.int({ min: 1, max: 10 }),
  estimatedArrival: null,
  delivered: false,
  latitude: faker.location.latitude({ min: 4.5, max: 4.8 }),
  longitude: faker.location.longitude({ min: -74.2, max: -73.9 }),
  address: `${faker.location.streetAddress()}, Bogotá`,
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.past().toISOString(),
  ...overrides,
});

export const buildRouteResponse = (
  overrides: Partial<RouteResponse> = {}
): RouteResponse => ({
  id: faker.string.uuid(),
  vehicleId: faker.string.uuid(),
  date: faker.date.future().toISOString().split("T")[0],
  totalDistanceKm: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
  estimatedTimeH: faker.number.float({ min: 0, max: 5, fractionDigits: 2 }),
  priorityLevel: "normal",
  status: "pending",
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.past().toISOString(),
  ...overrides,
});

export const buildVehicleResponse = (
  overrides: Partial<VehicleResponse> = {}
): VehicleResponse => ({
  id: faker.string.uuid(),
  placa: `${faker.string.alpha({ length: 3, casing: "upper" })}-${faker.number.int({ min: 100, max: 999 })}`,
  conductor: faker.person.fullName(),
  numeroEntregas: faker.number.int({ min: 0, max: 50 }),
  ...overrides,
});

export const loginAsAdmin = async () => {
  const response = await fetch(`${API_GATEWAY_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const { token, permissions } = await response.json();
  const storagePayload = {
    user: { email: ADMIN_EMAIL },
    permissions: permissions ?? [],
  };

  return { token, storagePayload };
};

export const interceptAuthBootstrap = async (
  page: Page,
  authData: {
    token: string;
    permissions: string[];
    profile: { id: string; username: string; email: string };
  }
) => {
  return await page.route(`${API_GATEWAY_URL}/auth/bootstrap`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        profile: authData.profile,
        permissions: authData.permissions,
      }),
    });
  });
};

export const interceptLogin = async (
  page: Page,
  loginData: {
    token: string;
    user: unknown;
    permissions: string[];
  }
) => {
  await page.route(`${API_GATEWAY_URL}/auth/login`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: loginData.token,
        user: loginData.user,
        permissions: loginData.permissions,
      }),
    });
  });

  return {
    dispose: async () => {
      await page.unroute(`${API_GATEWAY_URL}/auth/login`);
    },
  };
};

export const gotoLogistica = async (
  page: Page,
  options: {
    token: string;
    storagePayload: { user: unknown; permissions: string[] };
    forceReload?: boolean;
  }
) => {
  if (!options.forceReload) {
    await page.addInitScript(
      ([token, payload]) => {
        localStorage.setItem("auth_token", token as string);
        localStorage.setItem("user_data", JSON.stringify(payload));
      },
      [options.token, options.storagePayload]
    );
  }

  await page.goto("./logistica");
  await page.waitForLoadState("networkidle");
};

interface InterceptConfig {
  status?: number;
  body: unknown;
  delayMs?: number;
  once?: boolean;
  predicate?: (params: Record<string, unknown>) => boolean;
}

export const interceptVehiclesList = async (
  page: Page,
  configs: InterceptConfig[]
) => {
  let currentIndex = 0;

  return await page.route(
    (url) => url.href.includes(`${API_GATEWAY_URL}/vehiculos`),
    (route) => {
      const url = new URL(route.request().url());

      if (route.request().method() !== "GET") {
        return route.continue();
      }

      const searchParams = Object.fromEntries(url.searchParams.entries());
      const params = {
        page: parseInt(searchParams.page ?? "1", 10),
        limit: parseInt(searchParams.limit ?? "10", 10),
      };

      let config = configs[currentIndex];
      if (!config) {
        return route.continue();
      }

      if (config.predicate && !config.predicate(params)) {
        for (let i = currentIndex + 1; i < configs.length; i++) {
          const candidate = configs[i];
          if (!candidate.predicate || candidate.predicate(params)) {
            config = candidate;
            currentIndex = i;
            break;
          }
        }
      }

      if (config.once && currentIndex < configs.length - 1) {
        currentIndex++;
      }

      setTimeout(() => {
        route.fulfill({
          status: config.status ?? 200,
          contentType: "application/json",
          body: JSON.stringify(config.body),
        });
      }, config.delayMs ?? 0);
    }
  );
};

export const interceptRoutesList = async (
  page: Page,
  configs: InterceptConfig[]
) => {
  let currentIndex = 0;

  return await page.route(
    (url) => url.href.includes(`${API_GATEWAY_URL}/rutas`) && !url.href.includes("optimize"),
    (route) => {
      const url = new URL(route.request().url());

      // Skip POST requests (optimization)
      if (route.request().method() !== "GET") {
        return route.continue();
      }

      const searchParams = Object.fromEntries(url.searchParams.entries());
      const params = {
        vehicle_id: searchParams.vehicle_id,
        limit: parseInt(searchParams.limit ?? "100", 10),
      };

      let config = configs[currentIndex];
      if (!config) {
        return route.continue();
      }

      if (config.predicate && !config.predicate(params)) {
        for (let i = currentIndex + 1; i < configs.length; i++) {
          const candidate = configs[i];
          if (!candidate.predicate || candidate.predicate(params)) {
            config = candidate;
            currentIndex = i;
            break;
          }
        }
      }

      if (config.once && currentIndex < configs.length - 1) {
        currentIndex++;
      }

      setTimeout(() => {
        route.fulfill({
          status: config.status ?? 200,
          contentType: "application/json",
          body: JSON.stringify(config.body),
        });
      }, config.delayMs ?? 0);
    }
  );
};

export const interceptOptimizeRoute = async (
  page: Page,
  configs: InterceptConfig[]
) => {
  let currentIndex = 0;

  return await page.route(
    (url) => url.href.includes(`${API_GATEWAY_URL}/rutas`) && url.href.includes("optimize"),
    (route) => {
      if (route.request().method() !== "POST") {
        return route.continue();
      }

      const config = configs[currentIndex];
      if (!config) {
        return route.continue();
      }

      if (config.once && currentIndex < configs.length - 1) {
        currentIndex++;
      }

      setTimeout(() => {
        route.fulfill({
          status: config.status ?? 200,
          contentType: "application/json",
          body: JSON.stringify(config.body),
        });
      }, config.delayMs ?? 0);
    }
  );
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
    const isOptimizeUrl = response
      .url()
      .includes(`${API_GATEWAY_URL}/rutas`) && response.url().includes("optimize");
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

export const trackRoutesRequests = (page: Page) => {
  const requests: { method: string; url: string; authorized: boolean }[] = [];

  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/rutas") || url.includes("/vehiculos")) {
      const headers = request.headers();
      const hasToken = Boolean(headers.authorization);
      requests.push({
        method: request.method(),
        url,
        authorized: hasToken,
      });
    }
  });

  return {
    getCount(method: string) {
      return requests.filter((r) => r.method === method).length;
    },
    assertAllAuthorized() {
      const unauthorized = requests.filter((r) => !r.authorized);
      if (unauthorized.length > 0) {
        throw new Error(
          `Found ${unauthorized.length} unauthorized requests: ${JSON.stringify(
            unauthorized
          )}`
        );
      }
    },
    stop() {
      page.removeAllListeners("request");
    },
  };
};

export const waitForToastWithText = async (page: Page, text: string) => {
  await page
    .locator("[data-sonner-toast]")
    .filter({ hasText: text })
    .waitFor({ state: "visible", timeout: 5000 });
};

export const openRouteGenerationModal = async (page: Page, placa: string) => {
  const row = page.getByRole("row").filter({ hasText: placa });
  await row.getByRole("button", { name: /ver ruta/i }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  return dialog;
};
