import { faker } from "@faker-js/faker";
import {
  expect,
  request,
  type APIRequestContext,
  type APIResponse,
  type Page,
  type Request,
  type Response,
  type Route,
} from "@playwright/test";

export {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  SECURITY_API_URL,
  loginAsAdmin,
} from "./proveedores";

export const SALESFORCE_API_URL =
  process.env.SALESFORCE_API_URL ?? "http://localhost:8002";

export type VendedorPayload = {
  nombre: string;
  correo: string;
};

export type VendedorResponse = VendedorPayload & {
  id: string;
  fechaContratacion: string;
};

export type PlanVentaPayload = {
  identificador: string;
  nombre: string;
  descripcion: string;
  periodo: string;
  meta: number;
  vendedorId: string;
};

export type PlanVentaResponse = PlanVentaPayload & {
  id: string;
  vendedorNombre?: string | null;
  unidadesVendidas: number;
};

export type PlanVentaListResponse = {
  data: PlanVentaResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const buildVendedorPayload = (
  prefix: string,
  overrides: Partial<VendedorPayload> = {}
): VendedorPayload => {
  const base: VendedorPayload = {
    nombre: `${prefix} ${faker.person.fullName()}`,
    correo: faker.internet
      .email({ firstName: prefix, lastName: faker.string.alpha(5) })
      .toLowerCase(),
  };

  return { ...base, ...overrides };
};

export const buildPlanVentaPayload = (
  overrides: Partial<PlanVentaPayload> = {}
): PlanVentaPayload => {
  const periodoYear = faker.date.future({ years: 1 }).getFullYear();
  const base: PlanVentaPayload = {
    identificador: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
    nombre: faker.company.catchPhrase(),
    descripcion: faker.lorem.sentence(),
    periodo: `${periodoYear}-Q${faker.number.int({ min: 1, max: 4 })}`,
    meta: faker.number.int({ min: 100, max: 1000 }),
    vendedorId: faker.string.uuid(),
  };

  return { ...base, ...overrides };
};

export const buildPlanVentaResponse = (
  overrides: Partial<PlanVentaResponse> = {}
): PlanVentaResponse => {
  const payload = buildPlanVentaPayload(overrides);
  return {
    id: overrides.id ?? faker.string.uuid(),
    ...payload,
    vendedorNombre:
      overrides.vendedorNombre ??
      ("vendedorNombre" in overrides ? overrides.vendedorNombre : null),
    unidadesVendidas: overrides.unidadesVendidas ?? 0,
  };
};

export const createSalesforceApi = async (
  token: string
): Promise<APIRequestContext> => {
  return request.newContext({
    baseURL: SALESFORCE_API_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const createVendedorViaApi = async (
  api: APIRequestContext,
  payload: VendedorPayload
): Promise<VendedorResponse> => {
  const body = {
    full_name: payload.nombre,
    email: payload.correo,
    hire_date: new Date().toISOString().split("T")[0],
    status: "active",
  };

  const response = await api.post("/vendedores/", { data: body });
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  return {
    id: json.id as string,
    nombre: (json.full_name as string) ?? payload.nombre,
    correo: (json.email as string) ?? payload.correo,
    fechaContratacion: (json.hire_date as string) ?? body.hire_date,
  };
};

export const createPlanVentaViaApi = async (
  api: APIRequestContext,
  payload: PlanVentaPayload
): Promise<PlanVentaResponse> => {
  const response = await api.post("/planes-venta/", { data: payload });
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  return {
    id: (json.id as string) ?? faker.string.uuid(),
    identificador: (json.identificador as string) ?? payload.identificador,
    nombre: (json.nombre as string) ?? payload.nombre,
    descripcion: (json.descripcion as string) ?? payload.descripcion,
    periodo: (json.periodo as string) ?? payload.periodo,
    meta: Number(json.meta ?? payload.meta),
    vendedorId:
      (json.vendedorId as string) ??
      (json.vendedor_id as string) ??
      payload.vendedorId,
    vendedorNombre:
      (json.vendedorNombre as string | null | undefined) ??
      (json.vendedor_nombre as string | null | undefined) ??
      undefined,
    unidadesVendidas: Number(
      json.unidadesVendidas ?? json.unidades_vendidas ?? 0
    ),
  };
};

export const listPlanesVenta = async (
  api: APIRequestContext,
  params: { page: number; limit: number }
): Promise<APIResponse> => {
  return api.get("/planes-venta/", { params });
};

export const seedVendedor = async (
  api: APIRequestContext,
  prefix: string,
  overrides: Partial<VendedorPayload> = {}
): Promise<VendedorResponse> => {
  const payload = buildVendedorPayload(prefix, overrides);
  return createVendedorViaApi(api, payload);
};

export const seedPlanVenta = async (
  api: APIRequestContext,
  overrides: Partial<PlanVentaPayload> & { vendedorId: string }
): Promise<PlanVentaResponse> => {
  const payload = buildPlanVentaPayload(overrides);
  payload.vendedorId = overrides.vendedorId;
  return createPlanVentaViaApi(api, payload);
};

export const seedPlanesVenta = async (
  api: APIRequestContext,
  payloads: (Partial<PlanVentaPayload> & { vendedorId: string })[]
): Promise<PlanVentaResponse[]> => {
  const created: PlanVentaResponse[] = [];
  for (const payload of payloads) {
    const plan = await seedPlanVenta(api, payload);
    created.push(plan);
  }
  return created;
};

export const interceptVendedoresList = async (
  page: Page,
  response: VendedorResponse[],
  options: { delayMs?: number; once?: boolean } = {}
) => {
  let used = 0;
  const handler = async (route: Route) => {
    const requestObj = route.request();
    if (requestObj.method() !== "GET") {
      await route.fallback();
      return;
    }

    if (options.once && used > 0) {
      await route.fallback();
      return;
    }

    used += 1;
    if (options.delayMs && options.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }

    const backendData = response.map((vendedor) => ({
      id: vendedor.id,
      full_name: vendedor.nombre,
      email: vendedor.correo,
      hire_date: vendedor.fechaContratacion ?? new Date().toISOString(),
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: backendData,
        total: backendData.length,
        page: 1,
        limit: backendData.length,
        totalPages: 1,
      }),
    });
  };

  await page.route("**/vendedores/**", handler);

  return {
    dispose: async () => {
      await page.unroute("**/vendedores/**", handler);
    },
  };
};

type PlanesListMockEntry = {
  status?: number;
  body: unknown;
  once?: boolean;
  delayMs?: number;
  predicate?: (info: { page: number; limit: number; request: Request }) => boolean;
};

type InternalListEntry = PlanesListMockEntry & { used: number };

export const interceptPlanesList = async (
  page: Page,
  entries: PlanesListMockEntry[]
) => {
  const listEntries: InternalListEntry[] = entries.map((entry) => ({
    ...entry,
    used: 0,
  }));

  const handler = async (route: Route) => {
    const requestObj = route.request();
    if (requestObj.method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(requestObj.url());
    const pageParam = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
    const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "5", 10);

    const match = listEntries.find((entry) => {
      if (entry.once && entry.used > 0) {
        return false;
      }
      if (entry.predicate) {
        return entry.predicate({ page: pageParam, limit: limitParam, request: requestObj });
      }
      return true;
    });

    if (!match) {
      await route.fallback();
      return;
    }

    match.used += 1;
    if (match.delayMs && match.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, match.delayMs));
    }

    const body = match.body ?? {};
    await route.fulfill({
      status: match.status ?? 200,
      contentType: "application/json",
      body: typeof body === "string" ? (body as string) : JSON.stringify(body),
    });
  };

  await page.route("**/planes-venta/**", handler);

  return {
    getUsage: () => listEntries.map((entry) => entry.used),
    dispose: async () => {
      await page.unroute("**/planes-venta/**", handler);
    },
  };
};

type CreatePlanMockEntry = {
  status: number;
  body?: unknown;
  delayMs?: number;
};

type InternalCreateEntry = CreatePlanMockEntry & { used: number };

export const interceptCreatePlanVenta = async (
  page: Page,
  entries: CreatePlanMockEntry[]
) => {
  const queue: InternalCreateEntry[] = entries.map((entry) => ({
    ...entry,
    used: 0,
  }));

  const handler = async (route: Route) => {
    const requestObj = route.request();
    if (requestObj.method() !== "POST") {
      await route.fallback();
      return;
    }

    const next = queue.find((entry) => entry.used === 0);
    if (!next) {
      await route.fallback();
      return;
    }

    next.used += 1;
    if (next.delayMs && next.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, next.delayMs));
    }

    const body = next.body ?? {};
    await route.fulfill({
      status: next.status,
      contentType: "application/json",
      body: typeof body === "string" ? (body as string) : JSON.stringify(body),
    });
  };

  await page.route("**/planes-venta/**", handler);

  return {
    dispose: async () => {
      await page.unroute("**/planes-venta/**", handler);
    },
  };
};

export const waitForPlanesListRequest = (
  page: Page,
  predicate?: (request: Request) => boolean
) =>
  page.waitForRequest((requestObj) => {
    if (!requestObj.url().includes("/planes-venta")) {
      return false;
    }
    if (requestObj.method() !== "GET") {
      return false;
    }
    return predicate ? predicate(requestObj) : true;
  });

export const waitForPlanesListResponse = (
  page: Page,
  predicate?: (response: Response) => boolean
) =>
  page.waitForResponse((responseObj) => {
    if (!responseObj.url().includes("/planes-venta")) {
      return false;
    }
    if (responseObj.request().method() !== "GET") {
      return false;
    }
    return predicate ? predicate(responseObj) : true;
  });

export const waitForVendorListResponse = (
  page: Page,
  predicate?: (response: Response) => boolean
) =>
  page.waitForResponse((responseObj) => {
    if (!responseObj.url().includes("/vendedores")) {
      return false;
    }
    if (responseObj.request().method() !== "GET") {
      return false;
    }
    return predicate ? predicate(responseObj) : true;
  });

export const waitForVendorListRequest = (
  page: Page,
  predicate?: (request: Request) => boolean
) =>
  page.waitForRequest((requestObj) => {
    if (!requestObj.url().includes("/vendedores")) {
      return false;
    }
    if (requestObj.method() !== "GET") {
      return false;
    }
    return predicate ? predicate(requestObj) : true;
  });

export const waitForCreatePlanRequest = (page: Page) =>
  page.waitForRequest(
    (requestObj) =>
      requestObj.url().includes("/planes-venta") &&
      requestObj.method() === "POST"
  );

export const waitForCreatePlanResponse = (
  page: Page,
  predicate?: (response: Response) => boolean
) =>
  page.waitForResponse((responseObj) => {
    if (!responseObj.url().includes("/planes-venta")) {
      return false;
    }
    if (responseObj.request().method() !== "POST") {
      return false;
    }
    return predicate ? predicate(responseObj) : true;
  });

export const expectPlanRowVisible = async (
  page: Page,
  identificador: string
) => {
  await expect(
    page.getByRole("row", { name: new RegExp(identificador, "i") })
  ).toBeVisible();
};

export const ensureComboboxSelection = async (
  page: Page,
  optionLabel: string
) => {
  const combobox = page.getByRole("combobox", { name: /vendedor/i });
  await combobox.click();
  const option = page
    .getByRole("option")
    .filter({ hasText: new RegExp(optionLabel, "i") })
    .first();
  await expect(option).toBeVisible();
  await expect(option).toHaveAttribute("aria-selected", "true");
  await combobox.press("Escape");
};

export const gotoPlanesVenta = async (
  page: Page,
  params: {
    token: string;
    storagePayload: { user: unknown; permissions: string[] };
    forceReload?: boolean;
  }
) => {
  await page.addInitScript(
    ([token, payload]) => {
      localStorage.setItem("auth_token", token as string);
      localStorage.setItem("user_data", JSON.stringify(payload));
    },
    [params.token, params.storagePayload]
  );

  await page.goto("./comercial/planes-venta");
  if (params.forceReload) {
    await page.reload();
  }
  await page.waitForURL(/\/comercial\/planes-venta$/);
};

type RequestEntry = {
  request: Request;
  url: URL;
};

export type PlanesRequestTracker = {
  getRequests: (method?: string) => RequestEntry[];
  getCount: (method?: string) => number;
  assertAllAuthorized: () => void;
  stop: () => void;
};

export const trackPlanesRequests = (page: Page): PlanesRequestTracker => {
  const tracked: RequestEntry[] = [];

  const listener = (requestObj: Request) => {
    const url = requestObj.url();
    if (!url.includes("/planes-venta")) {
      return;
    }

    const resourceType = requestObj.resourceType();
    if (resourceType !== "fetch" && resourceType !== "xhr") {
      return;
    }

    const method = requestObj.method();
    if (method !== "GET" && method !== "POST") {
      return;
    }

    tracked.push({ request: requestObj, url: new URL(url) });
  };

  page.on("request", listener);

  return {
    getRequests: (method) =>
      tracked.filter((entry) =>
        method ? entry.request.method() === method : true
      ),
    getCount: (method) =>
      tracked.filter((entry) =>
        method ? entry.request.method() === method : true
      ).length,
    assertAllAuthorized: () => {
      expect(tracked.length).toBeGreaterThan(0);
      for (const entry of tracked) {
        const headers = entry.request.headers();
        expect(headers["authorization"]).toMatch(/^Bearer\s.+/);
      }
    },
    stop: () => {
      page.off("request", listener);
    },
  };
};

export const waitForToastWithText = async (page: Page, text: string) => {
  await expect(page.getByText(text, { exact: false })).toBeVisible();
};

