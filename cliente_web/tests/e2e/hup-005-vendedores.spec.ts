import { faker } from "@faker-js/faker";
import { test, expect, type Page, type Route } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_GATEWAY_URL,
  waitForCreateVendorRequest,
  waitForCreateVendorResponse,
  waitForToastWithText,
  expectVendorRowVisible,
  type VendedorResponse,
} from "./utils/vendedores";

const ITEMS_PER_PAGE = 5;
const SEED_PREFIX = `HUP005-${Date.now()}`;
const MOCK_ADMIN_TOKEN = "mock-admin-token";
const MOCK_ADMIN_USER = {
  id: "admin-user-id",
  email: ADMIN_EMAIL,
  name: "Administrador Mock",
  profileName: "Administrador Mock",
};
const MOCK_ADMIN_PERMISSIONS = [
  "comercial:vendedores:read",
  "comercial:vendedores:write",
  "comercial:planes-venta:read",
  "comercial:planes-venta:write",
];

const buildMockVendedor = (
  overrides: Partial<VendedorResponse> = {}
): VendedorResponse => ({
  id: overrides.id ?? faker.string.uuid(),
  nombre: overrides.nombre ?? faker.person.fullName(),
  correo:
    overrides.correo ??
    faker.internet
      .email({ firstName: "vendedor", lastName: faker.string.alpha(5) })
      .toLowerCase(),
  fechaContratacion:
    overrides.fechaContratacion ?? new Date().toISOString().split("T")[0],
});

const setupMockVendedoresApi = async (
  page: Page,
  initialVendors: VendedorResponse[] = []
) => {
  const state = {
    vendors: [...initialVendors],
  };

  const handler = async (route: Route) => {
    const request = route.request();
    const requestUrl = request.url();
    const url = new URL(requestUrl);
    if (!url.pathname.startsWith("/vendedores")) {
      await route.fallback();
      return;
    }
    if (request.method() === "GET") {
      const pageParam = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
      const limitParam = Number.parseInt(
        url.searchParams.get("limit") ?? `${ITEMS_PER_PAGE}`,
        10
      );
      const responseData = state.vendors.map((vendor) => ({
        id: vendor.id,
        full_name: vendor.nombre,
        email: vendor.correo,
        hire_date:
          vendor.fechaContratacion ?? new Date().toISOString().split("T")[0],
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: responseData,
          total: responseData.length,
          page: pageParam,
          limit: limitParam,
          totalPages: 1,
        }),
      });
      return;
    }

    if (request.method() === "POST") {
      const body = (request.postDataJSON() ?? {}) as {
        full_name?: string;
        email?: string;
        hire_date?: string;
        status?: string;
      };

      const newVendor = buildMockVendedor({
        nombre: body.full_name,
        correo: body.email,
        fechaContratacion: body.hire_date,
      });

      state.vendors.push(newVendor);

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: newVendor.id,
          full_name: newVendor.nombre,
          email: newVendor.correo,
          hire_date: newVendor.fechaContratacion,
          status: body.status ?? "active",
        }),
      });
      return;
    }

    await route.fallback();
  };

  await page.route("**/vendedores**", handler);

  return {
    getVendors: () => [...state.vendors],
    setVendors: (vendors: VendedorResponse[]) => {
      state.vendors = [...vendors];
    },
    dispose: async () => {
      await page.unroute("**/vendedores**", handler);
    },
  };
};

const setupMockLoginApi = async (page: Page) => {
  const handler = async (route: Route) => {
    const request = route.request();
    if (request.method() !== "POST") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: MOCK_ADMIN_TOKEN,
        user: MOCK_ADMIN_USER,
        permissions: MOCK_ADMIN_PERMISSIONS,
      }),
    });
  };

  await page.route("**/auth/login", handler);

  return {
    dispose: async () => {
      await page.unroute("**/auth/login", handler);
    },
  };
};

const performLogin = async (page: Page) => {
  await page.goto("./login");

  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);

  const loginRequestPromise = page.waitForRequest(
    (request) =>
      request.url().startsWith(`${API_GATEWAY_URL}/auth/login`) &&
      request.method() === "POST"
  );

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().startsWith(`${API_GATEWAY_URL}/auth/login`) &&
      response.request().method() === "POST"
  );

  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await loginRequestPromise;
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBeTruthy();

  await page.waitForURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
};

test.describe.serial("HUP-005 Registro de vendedor", () => {
  let adminToken: string;
  let storagePayload: { user: unknown; permissions: string[] };

  test.beforeAll(() => {
    adminToken = MOCK_ADMIN_TOKEN;
    storagePayload = {
      user: MOCK_ADMIN_USER,
      permissions: MOCK_ADMIN_PERMISSIONS,
    };
  });

  test.afterAll(async () => {
    // No cleanup required when mocking the vendedores API.
  });

  test.beforeEach(async ({ page }, testInfo) => {
    if (!adminToken || !storagePayload) {
      throw new Error("Authentication bootstrap failed");
    }

    if (testInfo.title.includes("Autenticación")) {
      return;
    }

    await page.addInitScript(
      ([token, payload]) => {
        localStorage.setItem("auth_token", token as string);
        localStorage.setItem("user_data", JSON.stringify(payload));
      },
      [adminToken, storagePayload]
    );
  });

  test("Autenticación y navegación hasta la lista de vendedores", async ({ page }) => {
    const loginMock = await setupMockLoginApi(page);
    const mockApi = await setupMockVendedoresApi(page, [buildMockVendedor()]);
    try {
      await performLogin(page);

      await page
        .getByRole("link", { name: "Gestión comercial", exact: true })
        .click();
      await expect(page).toHaveURL(/\/comercial$/);

      await page
        .getByRole("link", { name: "Vendedores", exact: true })
        .click();

      await expect(page).toHaveURL(/\/comercial\/vendedores$/);
      await expect(page.getByRole("heading", { name: /vendedores/i })).toBeVisible();

      const seededVendor = mockApi.getVendors()[0];
      await expectVendorRowVisible(page, seededVendor);
    } finally {
      await loginMock.dispose();
      await mockApi.dispose();
    }
  });

  test("Lista vendedores existentes mostrando los campos mínimos", async ({ page }) => {
    const seeded: VendedorResponse[] = [];
    for (let index = 0; index < 2; index += 1) {
      seeded.push(
        buildMockVendedor({
          nombre: `${SEED_PREFIX} ${index}`,
        })
      );
    }

    const loginMock = await setupMockLoginApi(page);
    const mockApi = await setupMockVendedoresApi(page, seeded);
    try {
      await performLogin(page);

      await page
        .getByRole("link", { name: "Gestión comercial", exact: true })
        .click();
      await expect(page).toHaveURL(/\/comercial$/);

      await page
        .getByRole("link", { name: "Vendedores", exact: true })
        .click();

      await expect(page).toHaveURL(/\/comercial\/vendedores$/);
      await expect(page.getByRole("heading", { name: /vendedores/i })).toBeVisible();

      for (const vendedor of seeded) {
        await expectVendorRowVisible(page, vendedor);
      }
    } finally {
      await loginMock.dispose();
      await mockApi.dispose();
    }
  });

  test("Permite registrar un vendedor asignando fecha de contratación por defecto", async ({ page }) => {
    const loginMock = await setupMockLoginApi(page);
    const mockApi = await setupMockVendedoresApi(page);
    try {
      await performLogin(page);

      await page
        .getByRole("link", { name: "Gestión comercial", exact: true })
        .click();
      await expect(page).toHaveURL(/\/comercial$/);

      await page
        .getByRole("link", { name: "Vendedores", exact: true })
        .click();
      await expect(page).toHaveURL(/\/comercial\/vendedores$/);
      await expect(page.getByRole("heading", { name: /vendedores/i })).toBeVisible();

      await page.getByRole("button", { name: "Nuevo vendedor" }).click();
      const dialog = page.getByRole("dialog", { name: /crear vendedor/i });
      await expect(dialog).toBeVisible();

      const payload = {
        nombre: `HUP005 ${faker.person.fullName()}`,
        correo: faker.internet
          .email({ firstName: "hup", lastName: faker.string.alpha(5) })
          .toLowerCase(),
      };

      await dialog.getByLabel("Nombre").fill(payload.nombre);
      await dialog.getByLabel("Email").fill(payload.correo);

      const createRequestPromise = waitForCreateVendorRequest(page);
      const createResponsePromise = waitForCreateVendorResponse(
        page,
        (response) => response.ok()
      );

      await dialog.getByRole("button", { name: "Crear" }).click();

      const createRequest = await createRequestPromise;
      const requestBody = createRequest.postDataJSON() as {
        full_name: string;
        email: string;
        hire_date: string;
        status: string;
      };

      const today = new Date().toISOString().split("T")[0];
      expect(requestBody.full_name).toBe(payload.nombre);
      expect(requestBody.email).toBe(payload.correo);
      expect(requestBody.hire_date).toBe(today);
      expect(requestBody.status).toBe("active");

      const createResponse = await createResponsePromise;
      expect(createResponse.ok()).toBeTruthy();
      const created = await createResponse.json();
      expect(created.full_name ?? created.nombre).toBe(payload.nombre);
      expect(created.email).toBe(payload.correo);
      expect(created.hire_date ?? created.fechaContratacion).toBe(today);

      await waitForToastWithText(page, "Vendedor creado exitosamente");

      await expectVendorRowVisible(page, {
        id: (created.id as string) ?? "",
        nombre: payload.nombre,
        correo: payload.correo,
      });
    } finally {
      await loginMock.dispose();
      await mockApi.dispose();
    }
  });
});
