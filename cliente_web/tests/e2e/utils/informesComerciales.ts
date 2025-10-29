import { faker } from "@faker-js/faker";
import {
  expect,
  type APIRequestContext,
  type Page,
  type Request,
  type Response,
} from "@playwright/test";

export {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_GATEWAY_URL,
  loginAsAdmin,
  createSalesforceApi,
} from "./planesVenta";

export interface InformeComercialPayload {
  nombre: string;
}

export interface InformeComercialResponse {
  id: string;
  nombre: string;
  fecha: string;
  ventasTotales: number;
  unidadesVendidas: number;
}

export const buildInformePayload = (
  overrides: Partial<InformeComercialPayload> = {}
): InformeComercialPayload => ({
  nombre:
    overrides.nombre ??
    `IC-${faker.date.month()}-${faker.number.int({ min: 1, max: 99 })}`,
});

const mapBackendInforme = (raw: unknown): InformeComercialResponse => {
  const record = raw as Record<string, unknown>;
  const id = record.id;
  const nombre = record.nombre;
  const fecha = record.fecha;
  const ventasTotales = Number(
    (record.ventasTotales as number | string | undefined) ??
      (record.ventas_totales as number | string | undefined) ??
      0
  );
  const unidadesVendidas = Number(
    (record.unidadesVendidas as number | string | undefined) ??
      (record.unidades_vendidas as number | string | undefined) ??
      0
  );

  if (!id || typeof id !== "string") {
    throw new Error("Informe response is missing an id");
  }

  if (!nombre || typeof nombre !== "string") {
    throw new Error("Informe response is missing a nombre");
  }

  if (!fecha || typeof fecha !== "string") {
    throw new Error("Informe response is missing a fecha");
  }

  return {
    id,
    nombre,
    fecha,
    ventasTotales: Number.isFinite(ventasTotales) ? ventasTotales : 0,
    unidadesVendidas: Number.isFinite(unidadesVendidas) ? unidadesVendidas : 0,
  };
};

export const createInformeViaApi = async (
  api: APIRequestContext,
  payload: InformeComercialPayload
): Promise<InformeComercialResponse> => {
  const response = await api.post("/informes-comerciales/", { data: payload });
  expect(response.ok()).toBeTruthy();

  const json = await response.json();
  return mapBackendInforme(json);
};

export const listInformes = async (
  api: APIRequestContext,
  params: { page: number; limit: number }
) => {
  return api.get("/informes-comerciales/", { params });
};

export type InformesPage = {
  data: InformeComercialResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const fetchInformesPage = async (
  api: APIRequestContext,
  params: { page: number; limit: number }
): Promise<InformesPage> => {
  const response = await listInformes(api, params);
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
    data: json.data.map(mapBackendInforme),
    total: json.total,
    page: json.page,
    limit: json.limit,
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
  };
};

export const seedInforme = async (
  api: APIRequestContext,
  prefix: string,
  overrides: Partial<InformeComercialPayload> = {}
): Promise<InformeComercialResponse> => {
  const payload = buildInformePayload({
    nombre: `${prefix}-${faker.string.alphanumeric({ length: 6 }).toUpperCase()}`,
    ...overrides,
  });

  return createInformeViaApi(api, payload);
};

export const gotoInformesComerciales = async (
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

  await page.goto("./comercial/informes-comerciales");
  await page.waitForLoadState("networkidle");
};

export const waitForInformesListResponse = (
  page: Page,
  predicate?: (response: Response) => boolean
) => {
  return page.waitForResponse((response) => {
    const isInformesUrl = response.url().includes("/informes-comerciales/");
    const isGet = response.request().method() === "GET";

    if (!isInformesUrl || !isGet) {
      return false;
    }

    return predicate ? predicate(response) : true;
  });
};

export const waitForCreateInformeResponse = (
  page: Page,
  predicate?: (response: Response) => boolean
) => {
  return page.waitForResponse((response) => {
    const isInformesUrl = response.url().includes("/informes-comerciales/");
    const isPost = response.request().method() === "POST";

    if (!isInformesUrl || !isPost) {
      return false;
    }

    return predicate ? predicate(response) : true;
  });
};

export type CreateInformeErrorOutcome =
  | { type: "response"; response: Response }
  | { type: "failure"; request: Request };

export const waitForCreateInformeError = (
  page: Page
): Promise<CreateInformeErrorOutcome> => {
  const responsePromise = waitForCreateInformeResponse(
    page,
    (response) => !response.ok()
  );

  const failurePromise = page.waitForEvent("requestfailed", (request) => {
    const isInformesUrl = request.url().includes("/informes-comerciales/");
    const isPost = request.method() === "POST";

    return isInformesUrl && isPost;
  });

  return Promise.race([
    responsePromise.then((response): CreateInformeErrorOutcome => ({
      type: "response",
      response,
    })),
    failurePromise.then((request): CreateInformeErrorOutcome => ({
      type: "failure",
      request,
    })),
  ]);
};

export const expectInformeRowVisible = async (page: Page, nombre: string) => {
  const row = page.getByRole("row").filter({ hasText: nombre });
  await row.waitFor({ state: "visible" });
};

export const trackInformesRequests = (page: Page) => {
  const requests: { method: string; url: string; authorized: boolean }[] = [];

  const handler = (request: Request) => {
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
  };

  page.on("request", handler);

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
      page.off("request", handler);
    },
  };
};

export const waitForToastWithText = async (page: Page, text: string) => {
  await page
    .locator("[data-sonner-toast]")
    .filter({ hasText: text })
    .waitFor({ state: "visible", timeout: 5000 });
};
