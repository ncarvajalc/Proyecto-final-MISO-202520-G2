import { expect, type APIRequestContext, type Page, type Request, type Response } from "@playwright/test";

export {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_GATEWAY_URL,
  loginAsAdmin,
  createSalesforceApi,
  createVendedorViaApi,
  seedVendedor,
  buildVendedorPayload,
  waitForVendorListRequest,
  waitForVendorListResponse,
  waitForToastWithText,
} from "./planesVenta";

export type { VendedorPayload, VendedorResponse } from "./planesVenta";

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
