import { faker } from "@faker-js/faker";
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_GATEWAY_URL,
  loginAsAdmin,
  createSalesforceApi,
  gotoVendedores,
  listVendedores,
  seedVendedor,
  trackVendedoresRequests,
  waitForVendorListResponse,
  waitForCreateVendorRequest,
  waitForCreateVendorResponse,
  waitForToastWithText,
  expectVendorRowVisible,
  deleteVendedorViaApi,
  type VendedorResponse,
} from "./utils/vendedores";

const ITEMS_PER_PAGE = 5;
const SEED_PREFIX = `HUP005-${Date.now()}`;

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

// TODO: Re-enable vendor registration e2e once backend authentication is accessible.
test.skip(true, "TODO: Restore vendor e2e when backend login is available.");
test.describe.serial("HUP-005 Registro de vendedor", () => {
  let adminToken: string;
  let storagePayload: { user: unknown; permissions: string[] };
  let salesforceApi: APIRequestContext;
  const vendorIdsToCleanup: string[] = [];

  const mapBackendVendedor = (raw: unknown): VendedorResponse => {
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

  const ensureFirstPageVendors = async (minCount: number) => {
    if (!salesforceApi) {
      throw new Error("Salesforce API context is not available");
    }

    // Limit the number of attempts to avoid infinite loops if pagination changes.
    for (let attempts = 0; attempts < minCount + 3; attempts += 1) {
      const response = await listVendedores(salesforceApi, {
        page: 1,
        limit: ITEMS_PER_PAGE,
      });
      expect(response.ok()).toBeTruthy();

      const json = (await response.json()) as {
        data: unknown[];
      };

      if (json.data.length >= minCount) {
        return json.data;
      }

      const seeded = await seedVendedor(salesforceApi, `${SEED_PREFIX}-SEED-${attempts}`);
      vendorIdsToCleanup.push(seeded.id);
    }

    const finalResponse = await listVendedores(salesforceApi, {
      page: 1,
      limit: ITEMS_PER_PAGE,
    });
    expect(finalResponse.ok()).toBeTruthy();
    const finalJson = (await finalResponse.json()) as { data: unknown[] };
    expect(finalJson.data.length).toBeGreaterThanOrEqual(minCount);
    return finalJson.data;
  };

  test.beforeAll(async () => {
    const auth = await loginAsAdmin();
    adminToken = auth.token;
    storagePayload = auth.storagePayload;

    salesforceApi = await createSalesforceApi(adminToken);
  });

  test.afterAll(async () => {
    if (salesforceApi) {
      for (const vendorId of vendorIdsToCleanup) {
        await deleteVendedorViaApi(salesforceApi, vendorId);
      }
      await salesforceApi.dispose();
    }
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
    const vendors = await ensureFirstPageVendors(1);
    const tracker = trackVendedoresRequests(page);

    await performLogin(page);

    await page
      .getByRole("link", { name: "Gestión comercial", exact: true })
      .click();
    await expect(page).toHaveURL(/\/comercial$/);

    const listResponsePromise = waitForVendorListResponse(
      page,
      (response) =>
        (response.headers()["content-type"] ?? "").includes("application/json")
    );
    await page
      .getByRole("link", { name: "Vendedores", exact: true })
      .click();
    const listResponse = await listResponsePromise;
    expect(listResponse.ok()).toBeTruthy();

    await expect(page).toHaveURL(/\/comercial\/vendedores$/);
    await expect(page.getByRole("heading", { name: /vendedores/i })).toBeVisible();

    const vendor = mapBackendVendedor(vendors[0]);
    await expectVendorRowVisible(page, vendor);

    tracker.assertAllAuthorized();
    tracker.stop();
  });

  test("Lista vendedores existentes mostrando los campos mínimos", async ({ page }) => {
    await ensureFirstPageVendors(2);

    const listResponsePromise = waitForVendorListResponse(
      page,
      (response) =>
        (response.headers()["content-type"] ?? "").includes("application/json")
    );
    await gotoVendedores(page);
    const listResponse = await listResponsePromise;
    expect(listResponse.ok()).toBeTruthy();

    const listJson = (await listResponse.json()) as {
      data: unknown[];
    };
    expect(listJson.data.length).toBeGreaterThan(0);

    for (const rawVendor of listJson.data) {
      const vendor = mapBackendVendedor(rawVendor);
      await expectVendorRowVisible(page, vendor);
    }
  });

  test("Permite registrar un vendedor asignando fecha de contratación por defecto", async ({ page }) => {
    const listResponsePromise = waitForVendorListResponse(page);
    await gotoVendedores(page);
    await listResponsePromise;

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
    const createResponsePromise = waitForCreateVendorResponse(page, (response) =>
      response.ok()
    );
    const listRefreshPromise = waitForVendorListResponse(
      page,
      (response) =>
        (response.headers()["content-type"] ?? "").includes("application/json")
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
    const createdId = (created.id as string) ?? "";
    expect(createdId).not.toHaveLength(0);
    vendorIdsToCleanup.push(createdId);
    expect(created.full_name ?? created.nombre).toBe(payload.nombre);
    expect(created.email).toBe(payload.correo);
    expect(created.hire_date ?? created.fechaContratacion).toBe(today);

    await listRefreshPromise;
    await waitForToastWithText(page, "Vendedor creado exitosamente");

    await expectVendorRowVisible(page, {
      id: createdId,
      nombre: payload.nombre,
      correo: payload.correo,
    });
  });
});
