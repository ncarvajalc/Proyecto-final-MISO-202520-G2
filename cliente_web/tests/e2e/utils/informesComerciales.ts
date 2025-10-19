import type { Page, Response } from "@playwright/test";
import { faker } from "@faker-js/faker";

export const ADMIN_EMAIL = "admin@example.com";
export const ADMIN_PASSWORD = "admin123";
export const API_GATEWAY_URL = "http://localhost:8080";

export interface InformeComercialPayload {
  nombre: string;
}

export interface InformeComercialResponse {
  id: string;
  nombre: string;
  fecha: string;
  ventasTotales: number;
  ventas_totales?: number;
  unidadesVendidas: number;
  unidades_vendidas?: number;
}

export const buildInformePayload = (): InformeComercialPayload => ({
  nombre: `IC-${faker.date.month()}-${faker.number.int({ min: 1, max: 12 })}`,
});

export const buildInformeResponse = (
  overrides: Partial<InformeComercialResponse> = {}
): InformeComercialResponse => ({
  id: faker.string.uuid(),
  nombre: `IC-${faker.date.month()}-${faker.number.int({ min: 1, max: 12 })}`,
  fecha: faker.date.recent().toISOString(),
  ventasTotales: faker.number.float({
    min: 10000,
    max: 100000,
    fractionDigits: 2,
  }),
  unidadesVendidas: faker.number.float({
    min: 100,
    max: 1000,
    fractionDigits: 2,
  }),
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

export const gotoInformesComerciales = async (
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

  await page.goto("./comercial/informes-comerciales");
  await page.waitForLoadState("networkidle");
};

interface InterceptConfig {
  status?: number;
  body: unknown;
  delayMs?: number;
  once?: boolean;
  predicate?: (params: Record<string, unknown>) => boolean;
}

export const interceptInformesList = async (
  page: Page,
  configs: InterceptConfig[]
) => {
  let currentIndex = 0;

  return await page.route(
    `${API_GATEWAY_URL}/informes-comerciales/**`,
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

export const interceptCreateInforme = async (
  page: Page,
  configs: InterceptConfig[]
) => {
  let currentIndex = 0;

  return await page.route(
    `${API_GATEWAY_URL}/informes-comerciales/`,
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
          status: config.status ?? 201,
          contentType: "application/json",
          body: JSON.stringify(config.body),
        });
      }, config.delayMs ?? 0);
    }
  );
};

export const waitForInformesListResponse = (
  page: Page,
  predicate?: (response: Response) => boolean
) => {
  return page.waitForResponse((response) => {
    const isInformesUrl = response
      .url()
      .includes(`${API_GATEWAY_URL}/informes-comerciales/`);
    const isGet = response.request().method() === "GET";

    if (!isInformesUrl || !isGet) {
      return false;
    }

    if (predicate) {
      return predicate(response);
    }

    return true;
  });
};

export const waitForCreateInformeResponse = (
  page: Page,
  predicate?: (response: Response) => boolean
) => {
  return page.waitForResponse((response) => {
    const isInformesUrl = response
      .url()
      .includes(`${API_GATEWAY_URL}/informes-comerciales/`);
    const isPost = response.request().method() === "POST";

    if (!isInformesUrl || !isPost) {
      return false;
    }

    if (predicate) {
      return predicate(response);
    }

    return true;
  });
};

export const expectInformeRowVisible = async (page: Page, nombre: string) => {
  const row = page.getByRole("row").filter({ hasText: nombre });
  await row.waitFor({ state: "visible" });
};

export const trackInformesRequests = (page: Page) => {
  const requests: { method: string; url: string; authorized: boolean }[] = [];

  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/informes-comerciales")) {
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
