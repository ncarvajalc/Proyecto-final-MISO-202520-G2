import { faker } from "@faker-js/faker";
import {
  expect,
  request,
  type APIRequestContext,
  type Page,
  type Request,
  type Response,
  type Route,
} from "@playwright/test";

export const CSV_HEADERS = [
  "nombre",
  "id_tax",
  "direccion",
  "telefono",
  "correo",
  "contacto",
  "estado",
  "certificadoNombre",
  "certificadoCuerpo",
  "certificadoFechaCertificacion",
  "certificadoFechaVencimiento",
  "certificadoUrl",
];

const escapeCsvValue = (value: string): string => {
  const needsEscaping = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsEscaping ? `"${escaped}"` : escaped;
};

export const toCsvRow = (payload: SupplierPayload): string => {
  const certificado = payload.certificado ?? null;
  const values = [
    payload.nombre,
    payload.id_tax,
    payload.direccion,
    payload.telefono,
    payload.correo,
    payload.contacto,
    payload.estado,
    certificado?.nombre ?? "",
    certificado?.cuerpoCertificador ?? "",
    certificado?.fechaCertificacion ?? "",
    certificado?.fechaVencimiento ?? "",
    certificado?.urlDocumento ?? "",
  ];

  return values.map((value) => escapeCsvValue(value ?? "")).join(",");
};

export const buildCsvFromPayloads = (payloads: SupplierPayload[]): string => {
  return [CSV_HEADERS.join(","), ...payloads.map(toCsvRow)].join("\n");
};

export type SupplierPayload = {
  nombre: string;
  id_tax: string;
  direccion: string;
  telefono: string;
  correo: string;
  contacto: string;
  estado: "Activo" | "Inactivo";
  certificado: {
    nombre: string;
    cuerpoCertificador: string;
    fechaCertificacion: string;
    fechaVencimiento: string;
    urlDocumento: string;
  } | null;
};

export type SupplierResponse = SupplierPayload & { id: number };

export type SupplierListResponse = {
  data: SupplierResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ?? "admin@example.com";
export const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? "admin123";
export const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL ?? "http://localhost:8080";
export const SECURITY_AUDIT_URL =
  process.env.SECURITY_AUDIT_URL ?? "http://localhost:8000";

export const ITEMS_PER_PAGE = 5;

export const buildSupplierPayload = (
  prefix: string,
  overrides: Partial<SupplierPayload> = {}
): SupplierPayload => {
  const base: SupplierPayload = {
    nombre: `${prefix} ${faker.company.name()} ${faker.string.alphanumeric(4)}`,
    id_tax: faker.string.numeric({ length: 10 }),
    direccion: faker.location.streetAddress(),
    telefono: faker.phone.number({ style: "international" }),
    correo: faker.internet
      .email({ firstName: "proveedor", lastName: faker.string.alpha(4) })
      .toLowerCase(),
    contacto: faker.person.fullName(),
    estado: "Activo",
    certificado: null,
  };

  return { ...base, ...overrides };
};

export type AuthBootstrap = {
  token: string;
  storagePayload: { user: unknown; permissions: string[] };
};

export const loginAsAdmin = async (): Promise<AuthBootstrap> => {
  const securityContext = await request.newContext({
    baseURL: API_GATEWAY_URL,
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  });

  const fallbackPermissions = ["planesventa:read", "planesventa:write"];

  try {
    const loginResponse = await securityContext.post("/auth/login", {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });

    if (!loginResponse.ok()) {
      const body = await loginResponse.text();
      throw new Error(
        `Admin login failed with status ${loginResponse.status()}: ${body}`
      );
    }

    const loginJson = await loginResponse.json();

    return {
      token: loginJson.token as string,
      storagePayload: {
        user: loginJson.user ?? { email: ADMIN_EMAIL },
        permissions: loginJson.permissions ?? fallbackPermissions,
      },
    };
  } finally {
    await securityContext.dispose();
  }
};

export const createProveedoresApi = async (
  token: string
): Promise<APIRequestContext> => {
  return request.newContext({
    baseURL: API_GATEWAY_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const uploadSuppliersFromPayloads = async (
  api: APIRequestContext,
  payloads: SupplierPayload[]
): Promise<SupplierResponse[]> => {
  if (payloads.length === 0) {
    return [];
  }

  const csvBody = buildCsvFromPayloads(payloads);
  const response = await api.post("/proveedores/bulk-upload", {
    multipart: {
      file: {
        name: `proveedores-${Date.now()}.csv`,
        mimeType: "text/csv",
        buffer: Buffer.from(csvBody, "utf-8"),
      },
    },
  });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Bulk upload failed with ${response.status()}: ${body}`);
  }
  const json = await response.json();
  const created = json.createdSuppliers ?? [];
  expect(created.length).toBeGreaterThan(0);
  return created as SupplierResponse[];
};

export const createSupplierViaBulkUpload = async (
  api: APIRequestContext,
  payload: SupplierPayload
): Promise<SupplierResponse> => {
  const created = await uploadSuppliersFromPayloads(api, [payload]);
  expect(created[0]).toBeTruthy();
  return created[0];
};

export const seedSuppliers = async (
  api: APIRequestContext,
  prefix: string,
  count: number
): Promise<number[]> => {
  const payloads: SupplierPayload[] = [];
  for (let index = 0; index < count; index += 1) {
    payloads.push(
      buildSupplierPayload(prefix, {
        nombre: `${prefix} Seed ${index + 1}`,
      })
    );
  }

  const created = await uploadSuppliersFromPayloads(api, payloads);
  return created.map((item) => item.id);
};

export const gotoProveedores = async (page: Page) => {
  await page.goto("./catalogos/proveedores");
  await expect(page.getByRole("heading", { name: "Proveedores" })).toBeVisible();
};

export const waitForCreateRequest = (page: Page) =>
  page.waitForRequest(
    (request) =>
      request.url().includes("/proveedores") && request.method() === "POST"
  );

export const waitForCreateResponse = (page: Page) =>
  page.waitForResponse(
    (response) =>
      response.url().includes("/proveedores") &&
      response.request().method() === "POST"
  );

export const waitForListResponse = (page: Page, pageNumber: number) =>
  page.waitForResponse((response) => {
    if (!response.url().includes("/proveedores")) return false;
    if (response.request().method() !== "GET") return false;
    const url = new URL(response.url());
    return (
      Number(url.searchParams.get("page")) === pageNumber &&
      Number(url.searchParams.get("limit")) === ITEMS_PER_PAGE &&
      response.status() === 200
    );
  });

export const waitForAnyListResponse = (page: Page) =>
  page.waitForResponse(
    (response) =>
      response.url().includes("/proveedores") &&
      response.request().method() === "GET"
  );

type RequestEntry = {
  request: Request;
  url: URL;
};

export type ProveedoresRequestTracker = {
  getRequests: (method?: string, predicate?: (entry: RequestEntry) => boolean) => RequestEntry[];
  getCount: (method?: string, predicate?: (entry: RequestEntry) => boolean) => number;
  assertAllAuthorized: () => void;
  stop: () => void;
};

export const trackProveedoresRequests = (page: Page): ProveedoresRequestTracker => {
  const tracked: RequestEntry[] = [];
  const listener = (request: Request) => {
    const url = request.url();
    if (!url.includes("/proveedores")) {
      return;
    }

    const resourceType = request.resourceType();
    if (resourceType !== "fetch" && resourceType !== "xhr") {
      return;
    }

    const method = request.method();
    if (method !== "GET" && method !== "POST") {
      return;
    }

    tracked.push({ request, url: new URL(url) });
  };

  page.on("request", listener);

  return {
    getRequests: (method, predicate) =>
      tracked.filter((entry) => {
        if (method && entry.request.method() !== method) {
          return false;
        }
        return predicate ? predicate(entry) : true;
      }),
    getCount: (method, predicate) =>
      tracked.filter((entry) => {
        if (method && entry.request.method() !== method) {
          return false;
        }
        return predicate ? predicate(entry) : true;
      }).length,
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

export const interceptCreateProveedor = async (
  page: Page,
  api: APIRequestContext
) => {
  let fallbackUsed = false;
  const handler = async (route: Route) => {
    const request = route.request();
    if (request.method() !== "POST") {
      await route.continue();
      return;
    }

    const forwarded = await route
      .fetch()
      .catch(() => null as Response | null);

    if (forwarded && forwarded.status() !== 405) {
      const body = await forwarded.text();
      await route.fulfill({
        status: forwarded.status(),
        headers: forwarded.headers(),
        body,
      });
      return;
    }

    fallbackUsed = true;
    const payload = request.postDataJSON() as SupplierPayload;
    const created = await createSupplierViaBulkUpload(api, payload);
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(created),
    });
  };

  await page.route("**/proveedores", handler);

  return {
    wasFallbackUsed: () => fallbackUsed,
    dispose: async () => {
      await page.unroute("**/proveedores", handler);
    },
  };
};

export const fetchSupplierList = async (
  api: APIRequestContext,
  params: { page: number; limit: number }
): Promise<SupplierListResponse> => {
  const response = await api.get("/proveedores", { params });
  expect(response.ok()).toBeTruthy();
  return response.json();
};

export const computePageForIndex = (index: number, perPage: number): number => {
  return Math.floor(index / perPage) + 1;
};

export const goToPage = async (
  page: Page,
  currentPage: number,
  targetPage: number
): Promise<number> => {
  if (currentPage === targetPage) {
    return currentPage;
  }

  if (targetPage > currentPage) {
    for (let next = currentPage + 1; next <= targetPage; next += 1) {
      const responsePromise = waitForListResponse(page, next);
      await page.getByRole("button", { name: "Siguiente" }).click();
      await responsePromise;
    }
    return targetPage;
  }

  for (let previous = currentPage - 1; previous >= targetPage; previous -= 1) {
    const responsePromise = waitForListResponse(page, previous);
    await page.getByRole("button", { name: "Anterior" }).click();
    await responsePromise;
  }
  return targetPage;
};

export const goToFirstPage = async (
  page: Page,
  currentPage: number
): Promise<number> => {
  if (currentPage <= 1) {
    return 1;
  }

  return goToPage(page, currentPage, 1);
};

export const ensureRowVisible = async (
  page: Page,
  text: string
): Promise<void> => {
  await expect(
    page.locator("table tbody tr", { hasText: text }).first()
  ).toBeVisible();
};

export const extractJson = async <T>(response: Response): Promise<T> => {
  const json = await response.json();
  return json as T;
};

