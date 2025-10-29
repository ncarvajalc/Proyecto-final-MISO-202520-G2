import {
  expect,
  type APIRequestContext,
  type Page,
  type Request,
  type Response,
  type Route,
} from "@playwright/test";

import type { VendedorResponse } from "./planesVenta";

export {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_GATEWAY_URL,
  loginAsAdmin,
  createSalesforceApi,
  createVendedorViaApi,
  seedVendedor,
  seedPlanVenta,
  buildVendedorPayload,
  interceptVendedoresList,
  waitForVendorListRequest,
  waitForVendorListResponse,
  waitForToastWithText,
  interceptAuthBootstrap,
} from "./planesVenta";

export type { VendedorPayload, VendedorResponse } from "./planesVenta";

export type VendedorPlanDetalle = {
  identificador: string;
  nombre: string;
  descripcion: string;
  periodo: string;
  meta: number;
  unidadesVendidas: number;
};

export type VendedorDetalle = VendedorResponse & {
  planDeVenta: VendedorPlanDetalle | null;
};

export type VendedorDetalleMock = VendedorResponse & {
  planDeVenta?: VendedorPlanDetalle | null;
};

type InterceptVendedorDetalleParams = {
  id: string;
  detail?: VendedorDetalleMock;
  status?: number;
  body?: unknown;
  once?: boolean;
  delayMs?: number;
};

const toBackendVendedorDetalle = (
  detail: VendedorDetalleMock | undefined
) => {
  if (!detail) {
    return {};
  }

  const plan = detail.planDeVenta ?? null;

  return {
    id: detail.id,
    full_name: detail.nombre,
    email: detail.correo,
    hire_date:
      detail.fechaContratacion ?? new Date().toISOString().split("T")[0],
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sales_plans: plan
      ? [
          {
            identificador: plan.identificador,
            nombre: plan.nombre,
            descripcion: plan.descripcion,
            periodo: plan.periodo,
            meta: plan.meta,
            unidades_vendidas: plan.unidadesVendidas,
          },
        ]
      : [],
  };
};

export const interceptVendedorDetalle = async (
  page: Page,
  params: InterceptVendedorDetalleParams
) => {
  let used = 0;

  const handler = async (route: Route) => {
    const requestObj = route.request();

    if (requestObj.method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(requestObj.url());
    const segments = url.pathname
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean);

    if (segments.length !== 2 || segments[0] !== "vendedores") {
      await route.fallback();
      return;
    }

    const requestedId = segments[1];
    if (requestedId !== params.id) {
      await route.fallback();
      return;
    }

    if (params.once && used > 0) {
      await route.fallback();
      return;
    }

    used += 1;

    if (params.delayMs && params.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, params.delayMs));
    }

    const payload =
      params.body !== undefined
        ? params.body
        : toBackendVendedorDetalle(params.detail);

    await route.fulfill({
      status: params.status ?? 200,
      contentType: "application/json",
      body:
        typeof payload === "string" ? payload : JSON.stringify(payload ?? {}),
    });
  };

  await page.route("**/vendedores/*", handler);

  return {
    dispose: async () => {
      await page.unroute("**/vendedores/*", handler);
    },
  };
};

export const mapBackendVendedor = (raw: unknown): VendedorResponse => {
  const record = raw as Record<string, unknown>;
  const id = record.id;
  const nombre =
    (record.full_name as string | undefined) ??
    (record.nombre as string | undefined);
  const correo =
    (record.email as string | undefined) ??
    (record.correo as string | undefined);
  const fechaContratacion =
    (record.hire_date as string | undefined) ??
    (record.fechaContratacion as string | undefined) ??
    new Date().toISOString().split("T")[0];

  if (!id || typeof id !== "string") {
    throw new Error("Backend vendor response is missing an id");
  }
  if (!nombre || typeof nombre !== "string") {
    throw new Error("Backend vendor response is missing a name");
  }
  if (!correo || typeof correo !== "string") {
    throw new Error("Backend vendor response is missing an email");
  }

  return {
    id,
    nombre,
    correo,
    fechaContratacion,
  };
};

const mapBackendPlan = (raw: unknown): VendedorPlanDetalle | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;

  const identificador = record.identificador ?? record.identifier;
  const nombre = record.nombre ?? record.name;
  const descripcion = record.descripcion ?? record.description ?? "";
  const periodo = record.periodo ?? record.period ?? "";
  const metaValue = record.meta ?? record.goal;
  const unidadesValue =
    record.unidades_vendidas ?? record.unidadesVendidas ?? record.units;

  if (
    typeof identificador !== "string" ||
    typeof nombre !== "string" ||
    typeof periodo !== "string"
  ) {
    return null;
  }

  return {
    identificador,
    nombre,
    descripcion: typeof descripcion === "string" ? descripcion : "",
    periodo,
    meta: typeof metaValue === "number" ? metaValue : Number(metaValue ?? 0),
    unidadesVendidas:
      typeof unidadesValue === "number"
        ? unidadesValue
        : Number(unidadesValue ?? 0),
  };
};

export const mapBackendVendedorDetalle = (raw: unknown): VendedorDetalle => {
  const record = raw as Record<string, unknown>;
  const base = mapBackendVendedor(record);

  const plans = Array.isArray(record.sales_plans)
    ? record.sales_plans
    : Array.isArray(record.salesPlans)
      ? record.salesPlans
      : [];

  const plan = plans.length > 0 ? mapBackendPlan(plans[0]) : null;

  return {
    ...base,
    planDeVenta: plan,
  };
};

export const waitForVendedorDetalleResponse = (
  page: Page,
  vendedorId: string,
  predicate?: (response: Response) => boolean
) =>
  page.waitForResponse((responseObj) => {
    const url = new URL(responseObj.url());
    const segments = url.pathname
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean);

    if (segments.length !== 2 || segments[0] !== "vendedores") {
      return false;
    }

    if (segments[1] !== vendedorId) {
      return false;
    }

    if (responseObj.request().method() !== "GET") {
      return false;
    }

    return predicate ? predicate(responseObj) : true;
  });

export const deleteVendedorViaApi = async (
  api: APIRequestContext,
  id: string
): Promise<void> => {
  const response = await api.delete(`/vendedores/${id}`);
  if (!response.ok() && response.status() !== 404) {
    const body = await response.text();
    throw new Error(`Failed to delete vendedor ${id}: ${response.status()} ${body}`);
  }
};

export const listVendedores = async (
  api: APIRequestContext,
  params: { page: number; limit: number }
) => {
  return api.get("/vendedores/", { params });
};

export type VendedoresPage = {
  data: VendedorResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const fetchVendedoresPage = async (
  api: APIRequestContext,
  params: { page: number; limit: number }
): Promise<VendedoresPage> => {
  const response = await listVendedores(api, params);
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
    data: json.data.map(mapBackendVendedor),
    total: json.total,
    page: json.page,
    limit: json.limit,
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
  };
};

export const findVendorPageViaApi = async (
  api: APIRequestContext,
  vendorId: string,
  params: { limit: number }
): Promise<{ page: number; totalPages: number }> => {
  const limit = params.limit;
  let currentPage = 1;
  let totalPages = 1;

  do {
    const pageData = await fetchVendedoresPage(api, {
      page: currentPage,
      limit,
    });

    if (pageData.data.some((entry) => entry.id === vendorId)) {
      return { page: currentPage, totalPages: pageData.totalPages };
    }

    totalPages = pageData.totalPages;
    currentPage += 1;
  } while (currentPage <= totalPages);

  throw new Error(`Vendor ${vendorId} not found within ${totalPages} pages`);
};

export const getVendedorDetalleViaApi = async (
  api: APIRequestContext,
  id: string
): Promise<VendedorDetalle> => {
  const response = await api.get(`/vendedores/${id}`);
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  return mapBackendVendedorDetalle(json);
};

export const gotoVendedores = async (page: Page) => {
  await page.goto("./comercial/vendedores");
  await page.waitForURL(/\/comercial\/vendedores$/);
  await expect(page.getByRole("heading", { name: /vendedores/i })).toBeVisible();
};

type RequestEntry = {
  request: Request;
  url: URL;
};

export type VendedoresRequestTracker = {
  getRequests: (method?: string) => RequestEntry[];
  getCount: (method?: string) => number;
  assertAllAuthorized: () => void;
  stop: () => void;
};

export const trackVendedoresRequests = (page: Page): VendedoresRequestTracker => {
  const tracked: RequestEntry[] = [];

  const listener = (requestObj: Request) => {
    const url = requestObj.url();
    if (!url.includes("/vendedores")) {
      return;
    }

    const resourceType = requestObj.resourceType();
    if (resourceType !== "fetch" && resourceType !== "xhr") {
      return;
    }

    const method = requestObj.method();
    if (method !== "GET" && method !== "POST" && method !== "DELETE" && method !== "PUT") {
      return;
    }

    tracked.push({ request: requestObj, url: new URL(url) });
  };

  page.on("request", listener);

  return {
    getRequests: (method) =>
      tracked.filter((entry) => (method ? entry.request.method() === method : true)),
    getCount: (method) =>
      tracked.filter((entry) => (method ? entry.request.method() === method : true)).length,
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

export const waitForCreateVendorRequest = (page: Page) =>
  page.waitForRequest(
    (requestObj) =>
      requestObj.url().includes("/vendedores") && requestObj.method() === "POST"
  );

export const waitForCreateVendorResponse = (
  page: Page,
  predicate?: (response: Response) => boolean
) =>
  page.waitForResponse((responseObj) => {
    if (!responseObj.url().includes("/vendedores")) {
      return false;
    }
    if (responseObj.request().method() !== "POST") {
      return false;
    }
    return predicate ? predicate(responseObj) : true;
  });

export const expectVendorRowVisible = async (
  page: Page,
  vendedor: { id: string; nombre: string; correo: string }
) => {
  const row = page
    .getByRole("row")
    .filter({ hasText: new RegExp(vendedor.correo.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i") })
    .first();
  await expect(row).toBeVisible();
  await expect(row).toContainText(vendedor.id);
  await expect(row).toContainText(vendedor.nombre);
  await expect(row).toContainText(vendedor.correo);
};
